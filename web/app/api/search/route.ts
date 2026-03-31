import { sql } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const q = searchParams.get('q')?.trim()

  if (!q || q.length < 1) {
    return NextResponse.json({ posts: [] })
  }

  const pattern = `%${q}%`

  const posts = await sql`
    SELECT slug, title_zh, title_en, category, created_at
    FROM posts
    WHERE status = 'published'
      AND (title_zh ILIKE ${pattern}
        OR content_zh ILIKE ${pattern}
        OR title_en ILIKE ${pattern}
        OR content_en ILIKE ${pattern})
    ORDER BY created_at DESC
    LIMIT 20
  `

  return NextResponse.json({ posts })
}
