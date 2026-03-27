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

  return NextResponse.json({ success: true })
}
