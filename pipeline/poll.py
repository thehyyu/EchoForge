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
        print(f'[Job {job_id}] 下載音檔...')
        audio_path = download_audio(source_url, job_id)

        print(f'[Job {job_id}] Whisper 轉文字...')
        transcript = transcribe(audio_path)
        print(f'[Job {job_id}] 逐字稿：{transcript[:80]}...')

        set_job_transcribed(job_id, transcript)
        print(f'[Job {job_id}] 轉錄完成，等待人工確認。')

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
