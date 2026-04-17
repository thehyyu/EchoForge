import os
import json
import time
import logging
import requests
import psycopg
from dotenv import load_dotenv
from json_repair import repair_json

load_dotenv()

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S',
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler(os.path.join(os.path.dirname(__file__), 'poll.log'), encoding='utf-8'),
    ]
)
log = logging.getLogger(__name__)

DATABASE_URL = os.environ.get('DATABASE_URL', '')
BLOB_TOKEN = os.environ.get('BLOB_READ_WRITE_TOKEN', '')
OLLAMA_URL = 'http://localhost:11434/api/generate'


def get_pending_job(conn):
    with conn.cursor() as cur:
        cur.execute("""
            UPDATE jobs SET status = 'processing'
            WHERE id = (
                SELECT id FROM jobs WHERE status = 'pending'
                LIMIT 1 FOR UPDATE SKIP LOCKED
            )
            RETURNING id, type, source_url, transcript, prompt_template, post_id
        """)
        conn.commit()
        return cur.fetchone()


def download_audio(url, job_id):
    response = requests.get(url)
    response.raise_for_status()
    path = f'/tmp/job_{job_id}.m4a'
    with open(path, 'wb') as f:
        f.write(response.content)
    return path


def transcribe(audio_path):
    import mlx_whisper
    result = mlx_whisper.transcribe(
        audio_path,
        path_or_hf_repo='mlx-community/whisper-large-v3-mlx'
    )
    return result['text'].strip()


def delete_blob(url):
    """Whisper 轉逐字稿成功後，刪除 Vercel Blob 上的原始音檔以釋放空間。"""
    if not BLOB_TOKEN:
        log.warning('BLOB_READ_WRITE_TOKEN 未設定，略過音檔清理')
        return
    resp = requests.delete(
        'https://blob.vercel-storage.com',
        headers={
            'Authorization': f'Bearer {BLOB_TOKEN}',
            'x-api-version': '7',
            'Content-Type': 'application/json',
        },
        json={'urls': [url]},
        timeout=30,
    )
    resp.raise_for_status()
    log.info(f'[Blob] 音檔已刪除：{url}')


def scrape_gemini(url):
    from playwright.sync_api import sync_playwright
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.goto(url, wait_until='load', timeout=60000)
        page.wait_for_timeout(5000)
        page.evaluate("document.querySelectorAll('script,style,nav,header,footer').forEach(e=>e.remove())")
        text = page.inner_text('body') or ''
        browser.close()
    lines = [l for l in text.splitlines() if l.strip()]
    return '\n'.join(lines)


def call_ollama(prompt):
    res = requests.post(
        OLLAMA_URL,
        json={'model': 'qwen2.5:32b', 'prompt': prompt, 'stream': False},
        timeout=600,
    )
    res.raise_for_status()
    text = res.json()['response']
    start = text.index('{')
    end = text.rindex('}') + 1
    return json.loads(repair_json(text[start:end]))


META_PROMPT = """你是一個 prompt 工程師。根據以下描述，為部落格文章生成一個 prompt 模板。
prompt 必須：
1. 要求只回傳 JSON，格式包含 title_zh、content_zh（Markdown）、category（work/technology/life/sadhaka 之一）、tags（陣列）
2. 包含 {{transcript}} 作為逐字稿的佔位符
3. 語氣專業，指示清晰

只回傳 prompt 文字本身，不要有其他說明。

描述：{description}"""


PROOFREAD_PROMPT = """以下是語音轉文字的逐字稿，請進行校正：
1. 修正錯別字與文法錯誤
2. 補充適當標點符號
3. 保持原始說話風格與口吻，不要改寫或摘要內容
4. 僅回傳校正後的逐字稿文字，不要有任何其他說明或標題

逐字稿：
{transcript}"""


def handle_proofread(job_id, transcript):
    with psycopg.connect(DATABASE_URL) as conn:
        with conn.cursor() as cur:
            cur.execute('SELECT wrong, correct FROM dictionary')
            dictionary = cur.fetchall()

    for wrong, correct in dictionary:
        transcript = transcript.replace(wrong, correct)

    res = requests.post(
        OLLAMA_URL,
        json={'model': 'qwen2.5:32b', 'prompt': PROOFREAD_PROMPT.format(transcript=transcript), 'stream': False},
        timeout=600,
    )
    res.raise_for_status()
    corrected = res.json()['response'].strip()

    with psycopg.connect(DATABASE_URL) as conn:
        with conn.cursor() as cur:
            cur.execute(
                "UPDATE jobs SET status = 'done', result = %s WHERE id = %s",
                (json.dumps({'transcript': corrected}), job_id)
            )
            conn.commit()


def handle_generate_prompt(job_id, description):
    prompt = META_PROMPT.format(description=description)
    res = requests.post(
        OLLAMA_URL,
        json={'model': 'qwen2.5:32b', 'prompt': prompt, 'stream': False},
        timeout=300,
    )
    res.raise_for_status()
    generated = res.json()['response'].strip()
    with psycopg.connect(DATABASE_URL) as conn:
        with conn.cursor() as cur:
            cur.execute(
                "UPDATE jobs SET status = 'done', result = %s WHERE id = %s",
                (json.dumps({'prompt': generated}), job_id)
            )
            conn.commit()


def handle_generate(job_id, transcript, prompt_template):
    prompt = prompt_template.replace('{{transcript}}', transcript)
    result = call_ollama(prompt)
    with psycopg.connect(DATABASE_URL) as conn:
        with conn.cursor() as cur:
            cur.execute(
                "UPDATE jobs SET status = 'done', result = %s WHERE id = %s",
                (json.dumps(result), job_id)
            )
            conn.commit()


def handle_translate(job_id, post_id):
    with psycopg.connect(DATABASE_URL) as conn:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT title_zh, content_zh FROM posts WHERE id = %s",
                (post_id,)
            )
            row = cur.fetchone()

    if not row:
        raise ValueError(f'Post {post_id} not found')

    title_zh, content_zh = row
    prompt = f"""Translate the following Chinese blog post to English. Also extract 3–5 English keyword tags from the translated content.
Return only JSON with "title_en", "content_en", and "tags_en" fields, no other text.
content_en must use Markdown formatting (headings with #, bold with **, lists with -), NOT HTML tags.
tags_en should be an array of short English keywords.

title_zh: {title_zh}
content_zh: {content_zh}"""

    result = call_ollama(prompt)

    with psycopg.connect(DATABASE_URL) as conn:
        with conn.cursor() as cur:
            cur.execute(
                """UPDATE posts SET title_en = %s, content_en = %s, tags_en = %s, updated_at = NOW()
                   WHERE id = %s""",
                (result.get('title_en', ''), result.get('content_en', ''), result.get('tags_en', []), post_id)
            )
            conn.commit()
        with conn.cursor() as cur:
            cur.execute("UPDATE jobs SET status = 'done' WHERE id = %s", (job_id,))
            conn.commit()


def set_job_transcribed(job_id, transcript):
    with psycopg.connect(DATABASE_URL) as conn:
        with conn.cursor() as cur:
            cur.execute(
                "UPDATE jobs SET status = 'transcribed', transcript = %s WHERE id = %s",
                (transcript, job_id)
            )
            conn.commit()


def set_job_error(job_id, error_message):
    with psycopg.connect(DATABASE_URL) as conn:
        with conn.cursor() as cur:
            cur.execute(
                "UPDATE jobs SET status = 'error', error_message = %s WHERE id = %s",
                (error_message, job_id)
            )
            conn.commit()


def process_job(job):
    job_id, job_type, source_url, transcript, prompt_template, post_id = job
    log.info(f'[Job {job_id}] 開始處理，type={job_type}')

    try:
        if job_type == 'voice':
            log.info(f'[Job {job_id}] 下載音檔...')
            audio_path = download_audio(source_url, job_id)
            log.info(f'[Job {job_id}] Whisper 轉文字...')
            transcript = transcribe(audio_path)
            log.info(f'[Job {job_id}] 內容前80字：{transcript[:80]}...')
            set_job_transcribed(job_id, transcript)
            try:
                delete_blob(source_url)
            except Exception as e:
                log.warning(f'[Job {job_id}] Blob 刪除失敗（不影響逐字稿）：{e}')
            log.info(f'[Job {job_id}] 完成，等待人工確認。')

        elif job_type == 'gemini':
            log.info(f'[Job {job_id}] 爬取 Gemini 對話...')
            transcript = scrape_gemini(source_url)
            log.info(f'[Job {job_id}] 內容前80字：{transcript[:80]}...')
            set_job_transcribed(job_id, transcript)
            log.info(f'[Job {job_id}] 完成，等待人工確認。')

        elif job_type == 'generate':
            log.info(f'[Job {job_id}] Qwen2.5 產生草稿...')
            handle_generate(job_id, transcript, prompt_template)
            log.info(f'[Job {job_id}] 草稿產生完成。')

        elif job_type == 'proofread':
            log.info(f'[Job {job_id}] 校正逐字稿...')
            handle_proofread(job_id, transcript)
            log.info(f'[Job {job_id}] 校正完成。')

        elif job_type == 'generate_prompt':
            log.info(f'[Job {job_id}] 自動生成 Prompt...')
            handle_generate_prompt(job_id, transcript)
            log.info(f'[Job {job_id}] Prompt 生成完成。')

        elif job_type == 'translate':
            log.info(f'[Job {job_id}] Qwen2.5 翻譯文章 post_id={post_id}...')
            handle_translate(job_id, post_id)
            log.info(f'[Job {job_id}] 翻譯完成。')

        else:
            raise ValueError(f'未知的 job type: {job_type}')

    except Exception as e:
        log.error(f'[Job {job_id}] 錯誤：{e}', exc_info=True)
        set_job_error(job_id, str(e))


def main():
    log.info('Poll script 啟動')

    while True:
        with psycopg.connect(DATABASE_URL) as conn:
            job = get_pending_job(conn)
        if job:
            process_job(job)
        else:
            log.info('沒有待處理任務，等待 30 秒...')
        time.sleep(30)


if __name__ == '__main__':
    main()
