import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'

export async function GET() {
  const rows = await sql`SELECT id, wrong, correct FROM dictionary ORDER BY id`
  return NextResponse.json(rows)
}

export async function POST(req: NextRequest) {
  const { wrong, correct } = await req.json()
  if (!wrong?.trim() || !correct?.trim()) {
    return NextResponse.json({ error: '錯誤詞與正確詞不能為空' }, { status: 400 })
  }
  const result = await sql`
    INSERT INTO dictionary (wrong, correct) VALUES (${wrong.trim()}, ${correct.trim()})
    RETURNING id, wrong, correct
  `
  return NextResponse.json(result[0], { status: 201 })
}
