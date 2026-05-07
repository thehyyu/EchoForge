import { sql } from '@/lib/db'
import { NextResponse } from 'next/server'

// GET /api/projects/[slug]
// Query params:
//   lang = zh | en  (default: zh)

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
      tagline_zh, tagline_en,
      description_zh, description_en,
      tech_stack,
      status,
      github_url, demo_url,
      started_at, published_at, updated_at
    FROM projects
    WHERE slug = ${slug} AND hidden = false
    LIMIT 1
  `

  if (rows.length === 0) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const row = rows[0]
  const content = lang === 'en' ? row.description_en : row.description_zh

  const project = {
    slug: row.slug,
    title: lang === 'en' ? row.title_en : row.title_zh,
    tagline: lang === 'en' ? row.tagline_en : row.tagline_zh,
    content: content || '',
    title_zh: row.title_zh,
    title_en: row.title_en,
    tagline_zh: row.tagline_zh,
    tagline_en: row.tagline_en,
    tech_stack: row.tech_stack,
    status: row.status,
    github_url: row.github_url,
    demo_url: row.demo_url,
    url_zh: `/zh/projects/${row.slug}`,
    url_en: `/en/projects/${row.slug}`,
    started_at: row.started_at,
    published_at: row.published_at,
    updated_at: row.updated_at,
  }

  return NextResponse.json({ project })
}
