"""
Integration tests — 連接真實 DB 驗證 schema 正確性。
需要設定環境變數 DATABASE_URL 才會執行，否則自動跳過。
"""
import os
import pytest
import psycopg

DATABASE_URL = os.environ.get("DATABASE_URL", "")

pytestmark = pytest.mark.skipif(
    not DATABASE_URL,
    reason="DATABASE_URL 未設定，跳過 schema 整合測試"
)


def get_columns(table_name: str) -> set[str]:
    with psycopg.connect(DATABASE_URL) as conn:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT column_name FROM information_schema.columns WHERE table_name = %s",
                (table_name,)
            )
            return {row[0] for row in cur.fetchall()}


def get_constraint(constraint_name: str) -> str | None:
    with psycopg.connect(DATABASE_URL) as conn:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT pg_get_constraintdef(oid) FROM pg_constraint WHERE conname = %s",
                (constraint_name,)
            )
            row = cur.fetchone()
            return row[0] if row else None


def test_jobs_table_has_required_columns():
    columns = get_columns("jobs")
    required = {"id", "type", "status", "source_url", "transcript",
                "prompt_template", "result", "post_id", "error_message", "created_at"}
    missing = required - columns
    assert not missing, f"jobs 資料表缺少欄位：{missing}"


def test_posts_table_has_required_columns():
    columns = get_columns("posts")
    required = {"id", "slug", "title_zh", "title_en", "content_zh", "content_en",
                "category", "tags", "tags_en", "status", "created_at", "updated_at"}
    missing = required - columns
    assert not missing, f"posts 資料表缺少欄位：{missing}"


def test_jobs_type_check_includes_all_types():
    definition = get_constraint("jobs_type_check")
    assert definition is not None, "jobs_type_check constraint 不存在"
    for job_type in ("voice", "gemini", "generate", "translate"):
        assert job_type in definition, f"jobs_type_check 缺少 type：{job_type}"
