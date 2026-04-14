import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const jobId = parseInt(id)
  if (isNaN(jobId)) {
    return NextResponse.json({ error: '無效的 job id' }, { status: 400 })
  }

  const result = await sql`
    UPDATE jobs
    SET status = 'pending', error_message = NULL
    WHERE id = ${jobId} AND status = 'error'
    RETURNING id
  `

  if (result.length === 0) {
    return NextResponse.json({ error: '找不到該 error job' }, { status: 404 })
  }

  return NextResponse.json({ success: true })
}
