import { sql } from '@/lib/db'
import { NextResponse } from 'next/server'

const OLLAMA_URL = 'http://localhost:11434/api/generate'

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  await sql`
    UPDATE posts SET status = 'published', updated_at = NOW()
    WHERE id = ${id}
  `

  // Translate to English in the background (non-blocking)
  translatePost(id).catch(console.error)

  return NextResponse.json({ success: true })
}

async function translatePost(id: string) {
  const rows = await sql`
    SELECT title_zh, content_zh FROM posts WHERE id = ${id}
  `
  if (rows.length === 0) return

  const { title_zh, content_zh } = rows[0]
  if (!title_zh || !content_zh) return

  const prompt = `Translate the following Chinese blog post to English. Also extract 3–5 English keyword tags from the translated content.
Return only JSON with "title_en", "content_en", and "tags_en" fields, no other text.
tags_en should be an array of short English keywords (e.g. ["meditation", "self-awareness"]).

title_zh: ${title_zh}
content_zh: ${content_zh}`

  const res = await fetch(OLLAMA_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: 'qwen2.5:14b', prompt, stream: false }),
  })

  if (!res.ok) return

  const data = await res.json()
  const text: string = data.response
  const start = text.indexOf('{')
  const end = text.lastIndexOf('}') + 1
  const translated = JSON.parse(text.slice(start, end))

  await sql`
    UPDATE posts
    SET title_en = ${translated.title_en || ''},
        content_en = ${translated.content_en || ''},
        tags_en = ${translated.tags_en || []},
        updated_at = NOW()
    WHERE id = ${id}
  `
}
