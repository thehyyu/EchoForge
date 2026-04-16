"""
EchoForge Blog MCP Server

提供三個 tools 給 AI agent 使用：
  - list_posts:   列出已發佈文章（可依語言、分類篩選）
  - get_post:     取得單篇文章完整內容
  - search_posts: 關鍵字搜尋文章

啟動方式：
  python3 pipeline/mcp_server.py

Claude Code 設定（~/.claude/settings.json）：
  {
    "mcpServers": {
      "blog": {
        "command": "/path/to/.venv/bin/python3",
        "args": ["/path/to/pipeline/mcp_server.py"]
      }
    }
  }
"""

import os
import psycopg
from dotenv import load_dotenv
from mcp.server.fastmcp import FastMCP

load_dotenv()

DATABASE_URL = os.environ.get('DATABASE_URL', '')
if not DATABASE_URL:
    raise RuntimeError('DATABASE_URL is not set')

mcp = FastMCP("EchoForge Blog")


def _connect():
    return psycopg.connect(DATABASE_URL)


@mcp.tool()
def list_posts(lang: str = "zh", category: str = "", limit: int = 20) -> list[dict]:
    """列出已發佈的部落格文章。

    Args:
        lang:     語言，zh（繁體中文）或 en（英文），預設 zh
        category: 分類篩選，可選 work / technology / life / sadhaka，空字串代表不篩選
        limit:    最多回傳幾篇，預設 20，上限 50

    Returns:
        文章列表，每篇包含 slug、title、category、tags、created_at
    """
    limit = min(limit, 50)
    with _connect() as conn:
        with conn.cursor() as cur:
            if category:
                cur.execute("""
                    SELECT slug, title_zh, title_en, category, tags, tags_en, created_at
                    FROM posts
                    WHERE status = 'published' AND hidden = false AND category = %s
                    ORDER BY created_at DESC
                    LIMIT %s
                """, (category, limit))
            else:
                cur.execute("""
                    SELECT slug, title_zh, title_en, category, tags, tags_en, created_at
                    FROM posts
                    WHERE status = 'published' AND hidden = false
                    ORDER BY created_at DESC
                    LIMIT %s
                """, (limit,))
            rows = cur.fetchall()

    result = []
    for slug, title_zh, title_en, cat, tags, tags_en, created_at in rows:
        result.append({
            "slug": slug,
            "title": title_en if lang == "en" else title_zh,
            "category": cat,
            "tags": (tags_en or []) if lang == "en" else (tags or []),
            "url": f"https://thehyyu.com/{'en' if lang == 'en' else 'zh'}/posts/{slug}",
            "created_at": str(created_at),
        })
    return result


@mcp.tool()
def get_post(slug: str, lang: str = "zh") -> dict:
    """取得單篇文章的完整內容（Markdown 格式）。

    Args:
        slug: 文章的唯一識別碼（URL 中的路徑片段）
        lang: 語言，zh 或 en，預設 zh

    Returns:
        文章詳細資料，包含 title、content（Markdown）、category、tags
    """
    with _connect() as conn:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT slug, title_zh, title_en, content_zh, content_en,
                       category, tags, tags_en, created_at, updated_at
                FROM posts
                WHERE slug = %s AND status = 'published' AND hidden = false
                LIMIT 1
            """, (slug,))
            row = cur.fetchone()

    if not row:
        return {"error": f"找不到文章：{slug}"}

    slug, title_zh, title_en, content_zh, content_en, cat, tags, tags_en, created_at, updated_at = row
    return {
        "slug": slug,
        "title": title_en if lang == "en" else title_zh,
        "content": content_en if lang == "en" else content_zh,
        "category": cat,
        "tags": (tags_en or []) if lang == "en" else (tags or []),
        "url": f"https://thehyyu.com/{'en' if lang == 'en' else 'zh'}/posts/{slug}",
        "created_at": str(created_at),
        "updated_at": str(updated_at),
    }


@mcp.tool()
def search_posts(query: str, lang: str = "zh", limit: int = 10) -> list[dict]:
    """用關鍵字搜尋文章，中英文皆可。

    Args:
        query: 搜尋關鍵字
        lang:  語言，zh 或 en，決定搜尋哪個語言版本的內容，預設 zh
        limit: 最多回傳幾篇，預設 10

    Returns:
        符合的文章列表，包含 slug、title、category、tags
    """
    limit = min(limit, 20)
    pattern = f"%{query}%"
    with _connect() as conn:
        with conn.cursor() as cur:
            if lang == "en":
                cur.execute("""
                    SELECT slug, title_zh, title_en, category, tags, tags_en, created_at
                    FROM posts
                    WHERE status = 'published' AND hidden = false
                      AND (title_en ILIKE %s OR content_en ILIKE %s)
                    ORDER BY created_at DESC
                    LIMIT %s
                """, (pattern, pattern, limit))
            else:
                cur.execute("""
                    SELECT slug, title_zh, title_en, category, tags, tags_en, created_at
                    FROM posts
                    WHERE status = 'published' AND hidden = false
                      AND (title_zh ILIKE %s OR content_zh ILIKE %s)
                    ORDER BY created_at DESC
                    LIMIT %s
                """, (pattern, pattern, limit))
            rows = cur.fetchall()

    result = []
    for slug, title_zh, title_en, cat, tags, tags_en, created_at in rows:
        result.append({
            "slug": slug,
            "title": title_en if lang == "en" else title_zh,
            "category": cat,
            "tags": (tags_en or []) if lang == "en" else (tags or []),
            "url": f"https://thehyyu.com/{'en' if lang == 'en' else 'zh'}/posts/{slug}",
            "created_at": str(created_at),
        })
    return result


if __name__ == "__main__":
    mcp.run()
