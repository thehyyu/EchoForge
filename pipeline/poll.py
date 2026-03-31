import os
import time
import requests
import psycopg
from dotenv import load_dotenv

load_dotenv()

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
    from selenium.webdriver.common.by import By

    options = Options()
    driver = webdriver.Safari(options=options)
    try:
        driver.get(url)
        time.sleep(10)  # 等待 SPA 完整渲染

        # 用 JS 取得整個 body 的 innerText，過濾掉 script/style
        text = driver.execute_script("""
            var scripts = document.querySelectorAll('script, style, nav, header, footer');
            scripts.forEach(function(el){ el.remove(); });
            return document.body.innerText;
        """) or ''
    finally:
        driver.quit()

    lines = [l for l in text.splitlines() if l.strip()]
    return '\n'.join(lines)


def set_job_transcribed(job_id, transcript):
    with psycopg.connect(DATABASE_URL) as conn:
        with conn.cursor() as cur:
            cur.execute("""
                UPDATE jobs SET status = 'transcribed', transcript = %s WHERE id = %s
            """, (transcript, job_id))
            conn.commit()


def set_job_error(job_id, error_message):
    with psycopg.connect(DATABASE_URL) as conn:
        with conn.cursor() as cur:
            cur.execute("""
                UPDATE jobs SET status = 'error', error_message = %s WHERE id = %s
            """, (error_message, job_id))
            conn.commit()


def process_job(job):
    job_id, job_type, source_url = job
    print(f'[Job {job_id}] 開始處理，type={job_type}')

    try:
        if job_type == 'voice':
            print(f'[Job {job_id}] 下載音檔...')
            audio_path = download_audio(source_url, job_id)
            print(f'[Job {job_id}] Whisper 轉文字...')
            transcript = transcribe(audio_path)

        elif job_type == 'gemini':
            print(f'[Job {job_id}] 爬取 Gemini 對話...')
            transcript = scrape_gemini(source_url)

        else:
            raise ValueError(f'未知的 job type: {job_type}')

        print(f'[Job {job_id}] 內容前80字：{transcript[:80]}...')
        set_job_transcribed(job_id, transcript)
        print(f'[Job {job_id}] 完成，等待人工確認。')

    except Exception as e:
        print(f'[Job {job_id}] 錯誤：{e}')
        set_job_error(job_id, str(e))


def main():
    print('Poll script 啟動')

    while True:
        with psycopg.connect(DATABASE_URL) as conn:
            job = get_pending_job(conn)
        if job:
            process_job(job)
        else:
            print('沒有待處理任務，等待 30 秒...')
        time.sleep(30)


if __name__ == '__main__':
    main()
