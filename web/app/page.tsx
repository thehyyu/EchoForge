import { sql } from '@/lib/db'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const posts = await sql`
    SELECT slug, title_zh, category, tags, created_at
    FROM posts
    WHERE status = 'published'
    ORDER BY created_at DESC
  `

  return (
    <main className="max-w-2xl mx-auto px-6 py-16">
      <div className="flex items-baseline justify-between mb-10">
        <h1 className="text-2xl font-bold">文章</h1>
        <div className="flex gap-4 text-sm text-gray-500">
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
                {new Date(post.created_at as string).toLocaleDateString('zh-TW')}
              </p>
              <Link href={`/zh/posts/${post.slug}`} className="group block">
                <h2 className="text-lg font-semibold group-hover:underline">
                  {post.title_zh as string}
                </h2>
              </Link>
              <div className="flex gap-1 mt-2 flex-wrap">
                {(post.tags as string[]).map((tag) => (
                  <span key={tag} className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded">
                    {tag}
                  </span>
                ))}
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}
