import { sql } from '@/lib/db'
import Link from 'next/link'
import { notFound } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function TagPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const tag = decodeURIComponent(slug)

  const posts = await sql`
    SELECT slug, title_zh, category, tags, created_at
    FROM posts
    WHERE status = 'published' AND ${tag} = ANY(tags)
    ORDER BY created_at DESC
  `

  if (posts.length === 0) notFound()

  return (
    <main className="max-w-2xl mx-auto px-6 py-16">
      <div className="mb-10">
        <Link href="/" className="text-sm text-gray-400 hover:underline">← 全部文章</Link>
        <h1 className="text-2xl font-bold mt-3"># {tag}</h1>
      </div>

      <ul className="space-y-8">
        {posts.map((post) => (
          <li key={post.slug as string}>
            <p className="text-xs text-gray-400 mb-1">
              <Link href={`/category/${post.category}`} className="hover:underline">
                {post.category as string}
              </Link>
              {' · '}
              {new Date(post.created_at as string).toLocaleDateString('zh-TW')}
            </p>
            <Link href={`/zh/posts/${post.slug}`} className="group block">
              <h2 className="text-lg font-semibold group-hover:underline">
                {post.title_zh as string}
              </h2>
            </Link>
            <div className="flex gap-1 mt-2 flex-wrap">
              {(post.tags as string[]).map((t) => (
                <Link
                  key={t}
                  href={`/tag/${encodeURIComponent(t)}`}
                  className={`text-xs px-2 py-0.5 rounded ${t === tag ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                >
                  {t}
                </Link>
              ))}
            </div>
          </li>
        ))}
      </ul>
    </main>
  )
}
