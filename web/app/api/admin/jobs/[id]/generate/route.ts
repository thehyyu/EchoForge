import { sql } from '@/lib/db'
import { NextResponse } from 'next/server'
import crypto from 'crypto'

function makeSlug(title: string) {
  return crypto.createHash('md5').update(title).digest('hex').slice(0, 8)
}

// POST /api/admin/jobs/[id]/generate
// action=preview → 建立 generate job，由 poll.py 非同步處理，回傳 generateJobId
// action=save    → 將前端傳來的草稿直接存入 DB
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const { action, transcript, prompt_template, draft } = await req.json()

  if (action === 'save') {
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

  // action=preview：建立 generate job，交給 poll.py 處理
  const rows = await sql`
    INSERT INTO jobs (type, transcript, prompt_template, status)
    VALUES ('generate', ${transcript}, ${prompt_template}, 'pending')
    RETURNING id
  `
  return NextResponse.json({ generateJobId: rows[0].id })
}
