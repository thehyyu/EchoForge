import { sql } from '@/lib/db'
import { NextResponse } from 'next/server'

// GET /api/posts
// Query params:
//   lang     = zh | en  (default: zh)
//   category = work | technology | life | sadhaka
//   tag      = string
//   limit    = number (default: 20, max: 100)
//   offset   = number (default: 0)

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const lang = searchParams.get('lang') === 'en' ? 'en' : 'zh'
  const category = searchParams.get('category')
  const tag = searchParams.get('tag')
  const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 100)
  const offset = parseInt(searchParams.get('offset') || '0', 10)

  const rows = await sql`
    SELECT
      slug,
      title_zh, title_en,
      category,
      tags, tags_en,
      created_at, updated_at
    FROM posts
    WHERE status = 'published' AND hidden = false
      AND (${category}::text IS NULL OR category = ${category})
      AND (${tag}::text IS NULL OR (
        CASE WHEN ${lang} = 'en' THEN ${tag} = ANY(tags_en)
             ELSE ${tag} = ANY(tags)
        END
      ))
    ORDER BY created_at DESC
    LIMIT ${limit} OFFSET ${offset}
  `

  const posts = rows.map((row) => ({
    slug: row.slug,
    title: lang === 'en' ? row.title_en : row.title_zh,
    title_zh: row.title_zh,
    title_en: row.title_en,
    category: row.category,
    tags: lang === 'en' ? row.tags_en : row.tags,
    url_zh: `/zh/posts/${row.slug}`,
    url_en: `/en/posts/${row.slug}`,
    created_at: row.created_at,
    updated_at: row.updated_at,
  }))

  return NextResponse.json({ posts, count: posts.length, offset, limit })
}
