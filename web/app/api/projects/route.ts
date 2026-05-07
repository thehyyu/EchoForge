import { sql } from '@/lib/db'
import { NextResponse } from 'next/server'

// GET /api/projects
// Query params:
//   lang   = zh | en  (default: zh)
//   limit  = number (default: 20, max: 100)
//   offset = number (default: 0)

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const lang = searchParams.get('lang') === 'en' ? 'en' : 'zh'
  const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 100)
  const offset = parseInt(searchParams.get('offset') || '0', 10)

  const rows = await sql`
    SELECT
      slug,
      title_zh, title_en,
      tagline_zh, tagline_en,
      tech_stack,
      status,
      github_url, demo_url,
      started_at, published_at, updated_at
    FROM projects
    WHERE hidden = false
    ORDER BY published_at DESC
    LIMIT ${limit} OFFSET ${offset}
  `

  const projects = rows.map((row) => ({
    slug: row.slug,
    title: lang === 'en' ? row.title_en : row.title_zh,
    title_zh: row.title_zh,
    title_en: row.title_en,
    tagline: lang === 'en' ? row.tagline_en : row.tagline_zh,
    tech_stack: row.tech_stack,
    status: row.status,
    github_url: row.github_url,
    demo_url: row.demo_url,
    url_zh: `/zh/projects/${row.slug}`,
    url_en: `/en/projects/${row.slug}`,
    started_at: row.started_at,
    published_at: row.published_at,
    updated_at: row.updated_at,
  }))

  return NextResponse.json({ projects, count: projects.length, offset, limit })
}
