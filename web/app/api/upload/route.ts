import { put } from '@vercel/blob'
import { sql } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function PUT(req: Request) {
  const filename = req.headers.get('x-filename') || 'audio.m4a'

  const blob = await put(filename, req.body!, {
    access: 'public',
    contentType: req.headers.get('content-type') || 'audio/mpeg',
  })

  await sql`
    INSERT INTO jobs (type, source_url, status)
    VALUES ('voice', ${blob.url}, 'pending')
  `

  return NextResponse.json({ success: true, url: blob.url })
}
