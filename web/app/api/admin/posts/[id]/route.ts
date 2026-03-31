import { sql } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const { title_zh, content_zh, title_en, content_en, category, tags } = await req.json()

  await sql`
    UPDATE posts
    SET title_zh = ${title_zh},
        content_zh = ${content_zh},
        title_en = ${title_en ?? ''},
        content_en = ${content_en ?? ''},
        category = ${category},
        tags = ${tags},
        updated_at = NOW()
    WHERE id = ${id}
  `

  return NextResponse.json({ success: true })
}
