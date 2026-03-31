import { sql } from '@/lib/db'
import Link from 'next/link'
import { notFound } from 'next/navigation'

export const dynamic = 'force-dynamic'

const CATEGORIES = ['work', 'technology', 'life', 'sadhaka']

const CATEGORY_LABELS: Record<string, string> = {
  work: '工作',
  technology: '科技',
  life: '生活',
  sadhaka: '修行',
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  if (!CATEGORIES.includes(slug)) notFound()

  const posts = await sql`
    SELECT slug, title_zh, category, tags, created_at
    FROM posts
    WHERE status = 'published' AND category = ${slug}
    ORDER BY created_at DESC
  `

  return (
    <main className="max-w-2xl mx-auto px-6 py-16">
      <div className="mb-10">
        <Link href="/" className="text-sm text-gray-400 hover:underline">← 全部文章</Link>
        <h1 className="text-2xl font-bold mt-3">{CATEGORY_LABELS[slug]}</h1>
      </div>

      {posts.length === 0 ? (
        <p className="text-gray-400">這個分類還沒有文章。</p>
      ) : (
        <ul className="space-y-8">
          {posts.map((post) => (
            <li key={post.slug as string}>
              <Link href={`/zh/posts/${post.slug}`} className="group block">
                <p className="text-xs text-gray-400 mb-1">
                  {new Date(post.created_at as string).toLocaleDateString('zh-TW')}
                </p>
                <h2 className="text-lg font-semibold group-hover:underline">
                  {post.title_zh as string}
                </h2>
                <div className="flex gap-1 mt-2 flex-wrap">
                  {(post.tags as string[]).map((tag) => (
                    <span key={tag} className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded">
                      {tag}
                    </span>
                  ))}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}
