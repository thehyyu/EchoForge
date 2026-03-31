import { sql } from '@/lib/db'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

export async function GET() {
  const posts = await sql`
    SELECT slug, title_zh, title_en, content_en, category, created_at
    FROM posts
    WHERE status = 'published'
    ORDER BY created_at DESC
    LIMIT 20
  `

  const items = posts.map((post) => {
    const title = (post.title_en as string) || (post.title_zh as string)
    const url = `${SITE_URL}/en/posts/${post.slug}`
    const description = (post.content_en as string)
      ?.replace(/^#[^\n]*\n+/, '')
      .replace(/[#*`]/g, '')
      .slice(0, 200)
    return `
    <item>
      <title><![CDATA[${title}]]></title>
      <link>${url}</link>
      <guid>${url}</guid>
      <pubDate>${new Date(post.created_at as string).toUTCString()}</pubDate>
      <description><![CDATA[${description || ''}]]></description>
    </item>`
  }).join('')

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>thehyyu</title>
    <link>${SITE_URL}</link>
    <description>Sound, thoughts, words</description>
    <language>en</language>
    ${items}
  </channel>
</rss>`

  return new Response(xml, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  })
}
