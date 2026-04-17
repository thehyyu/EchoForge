import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'

export async function GET() {
  const rows = await sql`
    SELECT id, name, content, created_at FROM prompt_templates ORDER BY created_at DESC
  `
  return NextResponse.json(rows)
}

export async function POST(req: NextRequest) {
  const { name, content } = await req.json()
  if (!name?.trim() || !content?.trim()) {
    return NextResponse.json({ error: '名稱與內容不能為空' }, { status: 400 })
  }

  const result = await sql`
    INSERT INTO prompt_templates (name, content) VALUES (${name.trim()}, ${content.trim()})
    RETURNING id, name, content, created_at
  `
  return NextResponse.json(result[0], { status: 201 })
}
