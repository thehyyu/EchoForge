import { sql } from '@/lib/db'
import { notFound } from 'next/navigation'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function PostPageEn({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  const rows = await sql`
    SELECT title_zh, title_en, content_zh, content_en, category, tags, created_at
    FROM posts
    WHERE slug = ${slug} AND status = 'published'
  `

  if (rows.length === 0) notFound()

  const post = rows[0]

  const title = (post.title_en as string) || (post.title_zh as string)
  const content = (post.content_en as string) || (post.content_zh as string)

  return (
    <main className="max-w-2xl mx-auto mt-16 px-8 pb-16">
      <div className="flex justify-end mb-4">
        <Link href={`/zh/posts/${slug}`} className="text-sm text-gray-400 hover:underline">
          中文版 →
        </Link>
      </div>
      <p className="text-sm text-gray-400 mb-2">
        {post.category as string} · {new Date(post.created_at as string).toLocaleDateString('en-US')}
      </p>
      <h1 className="text-3xl font-bold mb-6">{title}</h1>
      <div className="flex gap-2 mb-8">
        {(post.tags as string[]).map((tag) => (
          <span key={tag} className="text-sm bg-gray-100 text-gray-600 px-2 py-1 rounded">
            {tag}
          </span>
        ))}
      </div>
      <article className="prose prose-lg max-w-none whitespace-pre-wrap">
        {content}
      </article>
    </main>
  )
}
