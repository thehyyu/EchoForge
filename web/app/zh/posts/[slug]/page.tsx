import { sql } from '@/lib/db'
import { notFound } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function PostPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  const rows = await sql`
    SELECT title_zh, content_zh, category, tags, created_at
    FROM posts
    WHERE slug = ${slug} AND status = 'published'
  `

  if (rows.length === 0) notFound()

  const post = rows[0]

  return (
    <main className="max-w-2xl mx-auto mt-16 px-8 pb-16">
      <p className="text-sm text-gray-400 mb-2">
        {post.category} · {new Date(post.created_at as string).toLocaleDateString('zh-TW')}
      </p>
      <h1 className="text-3xl font-bold mb-6">{post.title_zh}</h1>
      <div className="flex gap-2 mb-8">
        {(post.tags as string[]).map((tag) => (
          <span key={tag} className="text-sm bg-gray-100 text-gray-600 px-2 py-1 rounded">
            {tag}
          </span>
        ))}
      </div>
      <article className="prose prose-lg max-w-none whitespace-pre-wrap">
        {post.content_zh as string}
      </article>
    </main>
  )
}
