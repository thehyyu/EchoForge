import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'

export async function POST(req: NextRequest) {
  const { description } = await req.json()
  if (!description?.trim()) {
    return NextResponse.json({ error: '描述不能為空' }, { status: 400 })
  }

  const result = await sql`
    INSERT INTO jobs (type, transcript, status)
    VALUES ('generate_prompt', ${description.trim()}, 'pending')
    RETURNING id
  `
  return NextResponse.json({ jobId: result[0].id }, { status: 201 })
}


