import pytest
from unittest.mock import patch, MagicMock, call
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from poll import download_audio, set_job_error


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
        with patch("builtins.open", MagicMock()) as mock_open:
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
            from poll import process_job
            process_job((7, "voice", "http://example.com/audio.m4a"))
            mock_set_error.assert_called_once_with(7, "網路錯誤")
