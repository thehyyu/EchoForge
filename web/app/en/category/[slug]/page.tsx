import { sql } from '@/lib/db'
import Link from 'next/link'
import { notFound } from 'next/navigation'

export const dynamic = 'force-dynamic'

const CATEGORIES = ['work', 'technology', 'life', 'sadhaka']

const CATEGORY_LABELS: Record<string, string> = {
  work: 'Work',
  technology: 'Technology',
  life: 'Life',
  sadhaka: 'Sadhaka',
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr)
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}`
}

export default async function CategoryPageEn({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  if (!CATEGORIES.includes(slug)) notFound()

  const posts = await sql`
    SELECT slug, title_en, title_zh, category, tags_en, created_at
    FROM posts
    WHERE status = 'published' AND hidden = false AND category = ${slug}
    ORDER BY created_at DESC
  `

  return (
    <main className="max-w-2xl mx-auto px-6 py-16">
      <div className="mb-10">
        <Link href="/en" className="text-sm text-gray-400 hover:underline">← All posts</Link>
        <h1 className="text-2xl font-bold mt-3">{CATEGORY_LABELS[slug]}</h1>
      </div>

      {posts.length === 0 ? (
        <p className="text-gray-400">No posts in this category.</p>
      ) : (
        <ul className="space-y-8">
          {posts.map((post) => (
            <li key={post.slug as string}>
              <Link href={`/en/posts/${post.slug}`} className="group block">
                <p className="text-xs text-gray-400 mb-1">
                  {formatDate(post.created_at as string)}
                </p>
                <h2 className="text-lg font-semibold group-hover:underline">
                  {(post.title_en as string) || (post.title_zh as string)}
                </h2>
                <div className="flex gap-1 mt-2 flex-wrap">
                  {((post.tags_en || []) as string[]).map((tag) => (
                    <span key={tag} className="text-xs border border-stone-300 text-stone-400 px-2 py-0.5 rounded-full">
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
