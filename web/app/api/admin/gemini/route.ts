import { sql } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const { url } = await req.json()

  if (!url || !url.includes('gemini.google.com/share/')) {
    return NextResponse.json({ error: '請提供有效的 Gemini share URL' }, { status: 400 })
  }

  await sql`
    INSERT INTO jobs (type, source_url, status)
    VALUES ('gemini', ${url}, 'pending')
  `

  return NextResponse.json({ success: true })
}
