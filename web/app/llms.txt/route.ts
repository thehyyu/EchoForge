import { sql } from '@/lib/db'

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://thehyyu.com'

export async function GET() {
  const posts = await sql`
    SELECT slug, title_zh, title_en, category, tags, created_at
    FROM posts
    WHERE status = 'published' AND hidden = false
    ORDER BY created_at DESC
  `

  const lines: string[] = [
    `# Hubert's Blog`,
    `> 個人部落格，紀錄工作、科技、生活與修行。`,
    `> A personal blog on work, technology, life, and spiritual practice.`,
    ``,
    `作者：Hubert（thehyyu）`,
    `語言：繁體中文（主）/ English`,
    `網址：${BASE_URL}`,
    ``,
    `## 文章索引 / Article Index`,
    ``,
  ]

  for (const post of posts) {
    const tags = Array.isArray(post.tags) ? (post.tags as string[]).join(', ') : ''
    lines.push(`- [${post.title_zh}](${BASE_URL}/zh/posts/${post.slug}): [${post.category}] ${tags}`)
    if (post.title_en) {
      lines.push(`  EN: [${post.title_en}](${BASE_URL}/en/posts/${post.slug})`)
    }
  }

  lines.push(``)
  lines.push(`## 機器可讀資源 / Machine-Readable Resources`)
  lines.push(``)
  lines.push(`- JSON API: ${BASE_URL}/api/posts`)
  lines.push(`- RSS (zh): ${BASE_URL}/feed/zh.xml`)
  lines.push(`- RSS (en): ${BASE_URL}/feed/en.xml`)
  lines.push(`- Sitemap: ${BASE_URL}/sitemap.xml`)

  return new Response(lines.join('\n'), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  })
}
