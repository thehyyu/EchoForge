import os
import time
import json
import hashlib
import requests
import psycopg
import mlx_whisper
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.environ['DATABASE_URL']
OLLAMA_URL = 'http://localhost:11434/api/generate'


def get_pending_job(conn):
    with conn.cursor() as cur:
        cur.execute("""
            UPDATE jobs SET status = 'processing'
            WHERE id = (
                SELECT id FROM jobs WHERE status = 'pending'
                LIMIT 1 FOR UPDATE SKIP LOCKED
            )
            RETURNING id, type, source_url
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
    result = mlx_whisper.transcribe(
        audio_path,
        path_or_hf_repo='mlx-community/whisper-large-v3-mlx'
    )
    return result['text'].strip()


def polish_with_qwen(transcript):
    prompt = f"""你是一個部落格文章編輯。以下是語音轉文字的逐字稿，請整理成完整的中文部落格文章。

只回傳 JSON，格式如下，不要有其他文字：
{{
  "title_zh": "文章標題",
  "content_zh": "文章內文（Markdown 格式）",
  "category": "work 或 technology 或 life 或 sadhaka 其中之一",
  "tags": ["關鍵字1", "關鍵字2", "關鍵字3"]
}}

逐字稿：
{transcript}"""

    response = requests.post(OLLAMA_URL, json={
        'model': 'qwen2.5:14b',
        'prompt': prompt,
        'stream': False
    })
    response.raise_for_status()

    text = response.json()['response']
    start = text.find('{')
    end = text.rfind('}') + 1
    return json.loads(text[start:end])


def make_slug(title):
    return hashlib.md5(title.encode()).hexdigest()[:8]


def create_post_and_finish(conn, job_id, transcript, data):
    slug = make_slug(data['title_zh'])
    with conn.cursor() as cur:
        cur.execute("""
            INSERT INTO posts (title_zh, content_zh, category, tags, status, slug)
            VALUES (%s, %s, %s, %s, 'draft', %s)
            RETURNING id
        """, (
            data['title_zh'],
            data['content_zh'],
            data['category'],
            data['tags'],
            slug
        ))
        post_id = cur.fetchone()[0]

        cur.execute("""
            UPDATE jobs SET status = 'done', transcript = %s, post_id = %s
            WHERE id = %s
        """, (transcript, post_id, job_id))

        conn.commit()
    return post_id


def process_job(conn, job):
    job_id, job_type, source_url = job
    print(f'[Job {job_id}] 開始處理，type={job_type}')

    try:
        print(f'[Job {job_id}] 下載音檔...')
        audio_path = download_audio(source_url, job_id)

        print(f'[Job {job_id}] Whisper 轉文字...')
        transcript = transcribe(audio_path)
        print(f'[Job {job_id}] 逐字稿：{transcript[:80]}...')

        print(f'[Job {job_id}] Qwen2.5 潤飾...')
        data = polish_with_qwen(transcript)
        print(f'[Job {job_id}] 標題：{data["title_zh"]}')

        post_id = create_post_and_finish(conn, job_id, transcript, data)
        print(f'[Job {job_id}] 完成，草稿 post_id={post_id}')

    except Exception as e:
        print(f'[Job {job_id}] 錯誤：{e}')
        with conn.cursor() as cur:
            cur.execute("""
                UPDATE jobs SET status = 'error', error_message = %s WHERE id = %s
            """, (str(e), job_id))
            conn.commit()


def main():
    print('Poll script 啟動')
    conn = psycopg.connect(DATABASE_URL)

    while True:
        job = get_pending_job(conn)
        if job:
            process_job(conn, job)
        else:
            print('沒有待處理任務，等待 30 秒...')
            time.sleep(30)


if __name__ == '__main__':
    main()
