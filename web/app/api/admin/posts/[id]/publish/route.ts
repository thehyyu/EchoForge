import { sql } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  await sql`
    UPDATE posts SET status = 'published', updated_at = NOW()
    WHERE id = ${id}
  `

  // 翻譯交給 poll.py 在 Mac mini 本機非同步處理
  await sql`
    INSERT INTO jobs (type, post_id, status)
    VALUES ('translate', ${id}, 'pending')
  `

  return NextResponse.json({ success: true })
}
