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


def scrape_gemini(url):
    import time
    from selenium import webdriver
    from selenium.webdriver.safari.options import Options

    options = Options()
    driver = webdriver.Safari(options=options)
    try:
        driver.get(url)
        time.sleep(10)  # 等待 SPA 完整渲染

        text = driver.execute_script("""
            var scripts = document.querySelectorAll('script, style, nav, header, footer');
            scripts.forEach(function(el){ el.remove(); });
            return document.body.innerText;
        """) or ''
    finally:
        driver.quit()

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
