import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const result = await sql`DELETE FROM dictionary WHERE id = ${parseInt(id)} RETURNING id`
  if (result.length === 0) return NextResponse.json({ error: '找不到' }, { status: 404 })
  return NextResponse.json({ success: true })
}
