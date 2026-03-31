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

async function callOllama(prompt: string) {
  const res = await fetch(OLLAMA_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: 'qwen2.5:14b', prompt, stream: false }),
  })
  if (!res.ok) throw new Error('Ollama 呼叫失敗')
  const data = await res.json()
  const text: string = data.response
  const start = text.indexOf('{')
  const end = text.lastIndexOf('}') + 1
  return JSON.parse(text.slice(start, end))
}

// POST /api/admin/jobs/[id]/generate
// action=preview → 只回傳結果，不存 DB
// action=save    → 存進 DB
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const { transcript, prompt_template, action, draft } = await req.json()

  if (action === 'save') {
    // draft 是前端傳來已確認的內容，直接存
    const slug = makeSlug(draft.title_zh)
    const rows = await sql`
      INSERT INTO posts (title_zh, content_zh, category, tags, status, slug)
      VALUES (${draft.title_zh}, ${draft.content_zh}, ${draft.category}, ${draft.tags}, 'draft', ${slug})
      RETURNING id
    `
    const postId = rows[0].id
    await sql`UPDATE jobs SET status = 'done', post_id = ${postId} WHERE id = ${id}`
    return NextResponse.json({ success: true, postId })
  }

  // action=preview（預設）
  const template = prompt_template || DEFAULT_PROMPT_TEMPLATE
  const prompt = template.replace('{{transcript}}', transcript)

  try {
    const data = await callOllama(prompt)
    return NextResponse.json({ success: true, draft: data })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
