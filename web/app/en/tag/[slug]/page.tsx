import { sql } from '@/lib/db'
import Link from 'next/link'
import { notFound } from 'next/navigation'

export const dynamic = 'force-dynamic'

function formatDate(dateStr: string) {
  const d = new Date(dateStr)
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}`
}

export default async function TagPageEn({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const tag = decodeURIComponent(slug)

  const posts = await sql`
    SELECT slug, title_en, title_zh, category, tags_en, created_at
    FROM posts
    WHERE status = 'published' AND hidden = false AND ${tag} = ANY(tags_en)
    ORDER BY created_at DESC
  `

  if (posts.length === 0) notFound()

  return (
    <main className="max-w-2xl mx-auto px-6 py-16">
      <div className="mb-10">
        <Link href="/en" className="text-sm text-gray-400 hover:underline">← All posts</Link>
        <h1 className="text-2xl font-bold mt-3"># {tag}</h1>
      </div>

      <ul className="space-y-8">
        {posts.map((post) => (
          <li key={post.slug as string}>
            <p className="text-xs text-gray-400 mb-1">
              <Link href={`/en/category/${post.category}`} className="hover:underline">
                {post.category as string}
              </Link>
              {' · '}
              {formatDate(post.created_at as string)}
            </p>
            <Link href={`/en/posts/${post.slug}`} className="group block">
              <h2 className="text-lg font-semibold group-hover:underline">
                {(post.title_en as string) || (post.title_zh as string)}
              </h2>
            </Link>
            <div className="flex gap-1 mt-2 flex-wrap">
              {((post.tags_en || []) as string[]).map((t) => (
                <Link
                  key={t}
                  href={`/en/tag/${encodeURIComponent(t)}`}
                  className={`text-xs px-2 py-0.5 rounded-full border transition-colors ${t === tag ? 'border-stone-700 text-stone-700' : 'border-stone-300 text-stone-400 hover:border-stone-500 hover:text-stone-600'}`}
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
