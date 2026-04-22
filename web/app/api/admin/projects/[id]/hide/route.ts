import { sql } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const rows = await sql`
    UPDATE projects SET hidden = NOT hidden WHERE id = ${id}
    RETURNING hidden
  `
  if (rows.length === 0) return NextResponse.json({ error: 'not found' }, { status: 404 })
  return NextResponse.json({ hidden: rows[0].hidden })
}
