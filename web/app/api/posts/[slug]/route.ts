import { sql } from '@/lib/db'
import { NextResponse } from 'next/server'

// GET /api/posts/[slug]
// Query params:
//   lang = zh | en  (default: zh，回傳對應語言的 title/content)

export async function GET(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  const { searchParams } = new URL(req.url)
  const lang = searchParams.get('lang') === 'en' ? 'en' : 'zh'

  const rows = await sql`
    SELECT
      slug,
      title_zh, title_en,
      content_zh, content_en,
      category,
      tags, tags_en,
      created_at, updated_at
    FROM posts
    WHERE slug = ${slug} AND status = 'published' AND hidden = false
    LIMIT 1
  `

  if (rows.length === 0) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const row = rows[0]
  const post = {
    slug: row.slug,
    title: lang === 'en' ? row.title_en : row.title_zh,
    content: lang === 'en' ? row.content_en : row.content_zh,
    title_zh: row.title_zh,
    title_en: row.title_en,
    category: row.category,
    tags: lang === 'en' ? row.tags_en : row.tags,
    url_zh: `/zh/posts/${row.slug}`,
    url_en: `/en/posts/${row.slug}`,
    created_at: row.created_at,
    updated_at: row.updated_at,
  }

  return NextResponse.json({ post })
}
