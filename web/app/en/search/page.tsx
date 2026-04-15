import { sql } from '@/lib/db'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

function formatDate(dateStr: string) {
  const d = new Date(dateStr)
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}`
}

export default async function SearchPageEn({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const { q } = await searchParams
  const query = q?.trim() || ''

  let posts: { slug: string; title_en: string; title_zh: string; category: string; created_at: string }[] = []

  if (query.length > 0) {
    const pattern = `%${query}%`
    const rows = await sql`
      SELECT slug, title_en, title_zh, category, created_at
      FROM posts
      WHERE status = 'published' AND hidden = false
        AND (title_zh ILIKE ${pattern}
          OR content_zh ILIKE ${pattern}
          OR title_en ILIKE ${pattern}
          OR content_en ILIKE ${pattern})
      ORDER BY created_at DESC
      LIMIT 20
    `
    posts = rows as typeof posts
  }

  return (
    <main className="max-w-2xl mx-auto px-6 py-16">
      <h1 className="text-2xl font-bold mb-8">Search</h1>

      <form method="get" action="/en/search" className="mb-10">
        <input
          type="text"
          name="q"
          defaultValue={query}
          placeholder="Enter keywords..."
          autoFocus
          className="w-full border rounded-lg px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-gray-300"
        />
      </form>

      {query && (
        <p className="text-sm text-gray-400 mb-6">
          {posts.length} result{posts.length !== 1 ? 's' : ''} for &ldquo;{query}&rdquo;
        </p>
      )}

      {posts.length > 0 && (
        <ul className="space-y-6">
          {posts.map((post) => (
            <li key={post.slug}>
              <p className="text-xs text-gray-400 mb-1">
                {post.category} · {formatDate(post.created_at)}
              </p>
              <Link href={`/en/posts/${post.slug}`} className="text-lg font-semibold hover:underline">
                {post.title_en || post.title_zh}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}
