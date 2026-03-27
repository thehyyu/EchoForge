import { sql } from '@/lib/db'
import { NextResponse } from 'next/server'
import crypto from 'crypto'

const OLLAMA_URL = 'http://localhost:11434/api/generate'
const DEFAULT_PROMPT_TEMPLATE = `你是一個部落格文章編輯。以下是語音轉文字的逐字稿，請整理成完整的中文部落格文章。

只回傳 JSON，格式如下，不要有其他文字：
{
  "title_zh": "文章標題",
  "content_zh": "文章內文（Markdown 格式）",
  "category": "work 或 technology 或 life 或 sadhaka 其中之一",
  "tags": ["關鍵字1", "關鍵字2", "關鍵字3"]
}

逐字稿：
{{transcript}}`

function makeSlug(title: string) {
  return crypto.createHash('md5').update(title).digest('hex').slice(0, 8)
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const { transcript, prompt_template } = await req.json()

  const template = prompt_template || DEFAULT_PROMPT_TEMPLATE
  const prompt = template.replace('{{transcript}}', transcript)

  // Call Ollama
  const ollamaRes = await fetch(OLLAMA_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: 'qwen2.5:14b', prompt, stream: false }),
  })

  if (!ollamaRes.ok) {
    return NextResponse.json({ error: 'Ollama 呼叫失敗' }, { status: 500 })
  }

  const ollamaData = await ollamaRes.json()
  const text: string = ollamaData.response
  const start = text.indexOf('{')
  const end = text.lastIndexOf('}') + 1
  const data = JSON.parse(text.slice(start, end))

  const slug = makeSlug(data.title_zh)

  const rows = await sql`
    INSERT INTO posts (title_zh, content_zh, category, tags, status, slug)
    VALUES (${data.title_zh}, ${data.content_zh}, ${data.category}, ${data.tags}, 'draft', ${slug})
    RETURNING id
  `
  const postId = rows[0].id

  await sql`
    UPDATE jobs SET status = 'done', post_id = ${postId} WHERE id = ${id}
  `

  return NextResponse.json({ success: true, postId })
}
