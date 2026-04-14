import { sql } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const rows = await sql`
    SELECT status, result, error_message FROM jobs WHERE id = ${id}
  `
  if (rows.length === 0) return NextResponse.json({ error: 'not found' }, { status: 404 })

  const { status, result, error_message } = rows[0]
  return NextResponse.json({
    status,
    result: result ? JSON.parse(result as string) : null,
    error_message,
  })
}
