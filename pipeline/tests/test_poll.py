import pytest
from unittest.mock import patch, MagicMock
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from poll import download_audio


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
