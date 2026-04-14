import { sql } from '@/lib/db'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

function formatDate(dateStr: string) {
  const d = new Date(dateStr)
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}`
}

export default async function HomePage() {
  const posts = await sql`
    SELECT slug, title_zh, category, tags, created_at
    FROM posts
    WHERE status = 'published'
    ORDER BY created_at DESC
  `

  const tagCount: Record<string, number> = {}
  for (const post of posts) {
    for (const tag of (post.tags as string[])) {
      tagCount[tag] = (tagCount[tag] || 0) + 1
    }
  }
  const tags = Object.entries(tagCount).sort((a, b) => b[1] - a[1])

  return (
    <main className="max-w-2xl mx-auto px-4 sm:px-6 py-10 sm:py-16">
      <div className="flex flex-wrap items-baseline justify-between gap-3 mb-10">
        <h1 className="text-2xl font-bold">文章</h1>
        <div className="flex gap-3 sm:gap-4 text-sm text-gray-500">
          {[
            { slug: 'work', label: '工作' },
            { slug: 'technology', label: '科技' },
            { slug: 'life', label: '生活' },
            { slug: 'sadhaka', label: '修行' },
          ].map(({ slug, label }) => (
            <Link key={slug} href={`/category/${slug}`} className="hover:text-gray-900">
              {label}
            </Link>
          ))}
        </div>
      </div>

      {posts.length === 0 ? (
        <p className="text-gray-400">還沒有文章。</p>
      ) : (
        <ul className="space-y-8">
          {posts.map((post) => (
            <li key={post.slug as string}>
              <p className="text-xs text-gray-400 mb-1">
                <Link href={`/category/${post.category}`} className="hover:underline">
                  {post.category as string}
                </Link>
                {' · '}
                {formatDate(post.created_at as string)}
              </p>
              <Link href={`/zh/posts/${post.slug}`} className="group block">
                <h2 className="text-lg font-semibold group-hover:underline">
                  {post.title_zh as string}
                </h2>
              </Link>
              <div className="flex gap-1 mt-2 flex-wrap">
                {(post.tags as string[]).map((tag) => (
                  <Link
                    key={tag}
                    href={`/tag/${encodeURIComponent(tag)}`}
                    className="text-xs border border-stone-300 text-stone-400 hover:border-stone-500 hover:text-stone-600 px-2 py-0.5 rounded-full transition-colors"
                  >
                    {tag}
                  </Link>
                ))}
              </div>
            </li>
          ))}
        </ul>
      )}

      {tags.length > 0 && (
        <div className="mt-16 pt-8 border-t">
          <p className="text-xs text-gray-400 mb-3">標籤</p>
          <div className="flex flex-wrap gap-2">
            {tags.map(([tag, count]) => (
              <Link
                key={tag}
                href={`/tag/${encodeURIComponent(tag)}`}
                className="text-xs border border-stone-300 text-stone-400 hover:border-stone-500 hover:text-stone-600 px-2 py-0.5 rounded-full transition-colors"
              >
                {tag}
                {count > 1 && <span className="ml-1 text-gray-400">{count}</span>}
              </Link>
            ))}
          </div>
        </div>
      )}
    </main>
  )
}
