import pytest
from unittest.mock import patch, MagicMock
import json
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from poll import download_audio, set_job_error, handle_generate, handle_translate, process_job


def make_job(job_id, job_type, source_url=None, transcript=None, prompt_template=None, post_id=None):
    return (job_id, job_type, source_url, transcript, prompt_template, post_id)


# --- 既有測試 ---

def test_download_audio_raises_on_bad_status():
    mock_response = MagicMock()
    mock_response.raise_for_status.side_effect = Exception("404 Not Found")

    with patch("poll.requests.get", return_value=mock_response):
        with pytest.raises(Exception, match="404 Not Found"):
            download_audio("http://example.com/bad.m4a", job_id=99)


def test_download_audio_writes_file(tmp_path):
    mock_response = MagicMock()
    mock_response.raise_for_status.return_value = None
    mock_response.content = b"fake audio content"

    with patch("poll.requests.get", return_value=mock_response):
        with patch("builtins.open", MagicMock()):
            result = download_audio("http://example.com/audio.m4a", job_id=1)
            assert result == "/tmp/job_1.m4a"


def test_set_job_error_sets_status_and_message():
    mock_cur = MagicMock()
    mock_conn = MagicMock()
    mock_conn.cursor.return_value.__enter__ = MagicMock(return_value=mock_cur)
    mock_conn.cursor.return_value.__exit__ = MagicMock(return_value=False)
    mock_conn.__enter__ = MagicMock(return_value=mock_conn)
    mock_conn.__exit__ = MagicMock(return_value=False)

    with patch("poll.psycopg.connect", return_value=mock_conn):
        set_job_error(job_id=42, error_message="Whisper 失敗")

    sql_call = mock_cur.execute.call_args
    query, params = sql_call[0]
    assert "status = 'error'" in query
    assert "error_message" in query
    assert params == ("Whisper 失敗", 42)
    mock_conn.commit.assert_called_once()


def test_process_job_calls_set_job_error_on_exception():
    with patch("poll.download_audio", side_effect=RuntimeError("網路錯誤")):
        with patch("poll.set_job_error") as mock_set_error:
            process_job(make_job(7, "voice", source_url="http://example.com/audio.m4a"))
            mock_set_error.assert_called_once_with(7, "網路錯誤")


# --- generate job 測試 ---

def test_handle_generate_writes_result_to_db():
    fake_result = {"title_zh": "測試標題", "content_zh": "內文", "category": "life", "tags": ["tag1"]}

    mock_cur = MagicMock()
    mock_conn = MagicMock()
    mock_conn.cursor.return_value.__enter__ = MagicMock(return_value=mock_cur)
    mock_conn.cursor.return_value.__exit__ = MagicMock(return_value=False)
    mock_conn.__enter__ = MagicMock(return_value=mock_conn)
    mock_conn.__exit__ = MagicMock(return_value=False)

    with patch("poll.call_ollama", return_value=fake_result):
        with patch("poll.psycopg.connect", return_value=mock_conn):
            handle_generate(job_id=10, transcript="逐字稿內容", prompt_template="{{transcript}}")

    sql_call = mock_cur.execute.call_args
    query, params = sql_call[0]
    assert "status = 'done'" in query
    assert "result" in query
    assert json.loads(params[0]) == fake_result
    assert params[1] == 10


def test_handle_generate_uses_prompt_template():
    captured_prompts = []

    def fake_ollama(prompt):
        captured_prompts.append(prompt)
        return {"title_zh": "t", "content_zh": "c", "category": "life", "tags": []}

    mock_cur = MagicMock()
    mock_conn = MagicMock()
    mock_conn.cursor.return_value.__enter__ = MagicMock(return_value=mock_cur)
    mock_conn.cursor.return_value.__exit__ = MagicMock(return_value=False)
    mock_conn.__enter__ = MagicMock(return_value=mock_conn)
    mock_conn.__exit__ = MagicMock(return_value=False)

    with patch("poll.call_ollama", side_effect=fake_ollama):
        with patch("poll.psycopg.connect", return_value=mock_conn):
            handle_generate(10, "hello world", "請整理：{{transcript}}")

    assert "hello world" in captured_prompts[0]
    assert "請整理：" in captured_prompts[0]


def test_process_job_generate_calls_handle_generate():
    with patch("poll.handle_generate") as mock_gen:
        with patch("poll.set_job_error"):
            process_job(make_job(5, "generate", transcript="逐字稿", prompt_template="{{transcript}}"))
            mock_gen.assert_called_once_with(5, "逐字稿", "{{transcript}}")


# --- translate job 測試 ---

def test_handle_translate_updates_post_and_job():
    fake_result = {"title_en": "Title", "content_en": "Content", "tags_en": ["tag1"]}

    mock_cur = MagicMock()
    mock_cur.fetchone.return_value = ("華文標題", "華文內容")
    mock_conn = MagicMock()
    mock_conn.cursor.return_value.__enter__ = MagicMock(return_value=mock_cur)
    mock_conn.cursor.return_value.__exit__ = MagicMock(return_value=False)
    mock_conn.__enter__ = MagicMock(return_value=mock_conn)
    mock_conn.__exit__ = MagicMock(return_value=False)

    with patch("poll.call_ollama", return_value=fake_result):
        with patch("poll.psycopg.connect", return_value=mock_conn):
            handle_translate(job_id=20, post_id=3)

    calls = mock_cur.execute.call_args_list
    queries = [c[0][0] for c in calls]
    assert any("UPDATE posts" in q for q in queries)
    assert any("UPDATE jobs" in q and "done" in q for q in queries)


def test_handle_translate_raises_if_post_not_found():
    mock_cur = MagicMock()
    mock_cur.fetchone.return_value = None
    mock_conn = MagicMock()
    mock_conn.cursor.return_value.__enter__ = MagicMock(return_value=mock_cur)
    mock_conn.cursor.return_value.__exit__ = MagicMock(return_value=False)
    mock_conn.__enter__ = MagicMock(return_value=mock_conn)
    mock_conn.__exit__ = MagicMock(return_value=False)

    with patch("poll.psycopg.connect", return_value=mock_conn):
        with pytest.raises(ValueError, match="not found"):
            handle_translate(job_id=20, post_id=999)


def test_process_job_translate_calls_handle_translate():
    with patch("poll.handle_translate") as mock_trans:
        with patch("poll.set_job_error"):
            process_job(make_job(6, "translate", post_id=42))
            mock_trans.assert_called_once_with(6, 42)
