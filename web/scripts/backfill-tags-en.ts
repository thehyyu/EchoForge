import { sql } from '../lib/db'

const OLLAMA_URL = 'http://localhost:11434/api/generate'

async function extractTagsEn(content: string, isEnglish: boolean): Promise<string[]> {
  const prompt = isEnglish
    ? `Extract 3–5 short English keyword tags from the following blog post content.
Return only a JSON array of strings, no other text. Example: ["meditation", "self-awareness", "daily practice"]

Content:
${content.slice(0, 2000)}`
    : `Extract 3–5 short English keyword tags from the following Chinese blog post content.
Return only a JSON array of strings, no other text. Example: ["meditation", "self-awareness", "daily practice"]

Content:
${content.slice(0, 2000)}`

  const res = await fetch(OLLAMA_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: 'qwen2.5:14b', prompt, stream: false }),
  })

  if (!res.ok) throw new Error(`Ollama error: ${res.status}`)

  const data = await res.json()
  const text: string = data.response
  const start = text.indexOf('[')
  const end = text.lastIndexOf(']') + 1
  return JSON.parse(text.slice(start, end))
}

async function backfill() {
  const posts = await sql`
    SELECT id, title_zh, content_zh, content_en
    FROM posts
    WHERE status = 'published'
      AND (tags_en IS NULL OR array_length(tags_en, 1) IS NULL)
    ORDER BY created_at ASC
  `

  console.log(`Found ${posts.length} posts to backfill`)

  for (const post of posts) {
    const id = post.id
    const hasEnglish = !!(post.content_en as string)?.trim()
    const content = hasEnglish ? (post.content_en as string) : (post.content_zh as string)

    if (!content?.trim()) {
      console.log(`[${id}] skipped — no content`)
      continue
    }

    try {
      const tagsEn = await extractTagsEn(content, hasEnglish)
      await sql`UPDATE posts SET tags_en = ${tagsEn} WHERE id = ${id}`
      console.log(`[${id}] ${post.title_zh} → ${JSON.stringify(tagsEn)}`)
    } catch (e) {
      console.error(`[${id}] failed — ${e}`)
    }
  }

  console.log('Backfill complete')
}

backfill().catch(console.error)
