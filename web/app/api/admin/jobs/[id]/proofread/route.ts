import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const jobId = parseInt(id)
  const { transcript } = await req.json()

  if (!transcript?.trim()) {
    return NextResponse.json({ error: '逐字稿不能為空' }, { status: 400 })
  }

  const result = await sql`
    INSERT INTO jobs (type, transcript, status)
    VALUES ('proofread', ${transcript.trim()}, 'pending')
    RETURNING id
  `
  return NextResponse.json({ proofreadJobId: result[0].id })
}
