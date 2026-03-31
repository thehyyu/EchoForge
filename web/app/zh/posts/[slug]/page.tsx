import { sql } from '@/lib/db'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import ReactMarkdown from 'react-markdown'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const rows = await sql`
    SELECT title_zh, content_zh FROM posts WHERE slug = ${slug} AND status = 'published'
  `
  if (rows.length === 0) return {}
  const post = rows[0]
  const description = (post.content_zh as string)?.slice(0, 120).replace(/\n/g, ' ')
  return {
    title: post.title_zh as string,
    description,
  }
}

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

  // 移除內文開頭重複的標題行
  const content = (post.content_zh as string)?.replace(/^#[^\n]*\n+/, '') ?? ''

  return (
    <main className="max-w-2xl mx-auto mt-16 px-8 pb-16">
      <div className="flex justify-end mb-4">
        <Link href={`/en/posts/${slug}`} className="text-sm text-gray-400 hover:underline">
          English →
        </Link>
      </div>
      <p className="text-sm text-gray-400 mb-2">
        <Link href={`/category/${post.category}`} className="hover:underline">
          {post.category as string}
        </Link>
        {' · '}
        {new Date(post.created_at as string).toLocaleDateString('zh-TW')}
      </p>
      <h1 className="text-3xl font-bold mb-6">{post.title_zh as string}</h1>
      <div className="flex gap-2 mb-8 flex-wrap">
        {(post.tags as string[]).map((tag) => (
          <Link
            key={tag}
            href={`/tag/${encodeURIComponent(tag)}`}
            className="text-sm bg-gray-100 text-gray-600 px-2 py-1 rounded hover:bg-gray-200"
          >
            {tag}
          </Link>
        ))}
      </div>
      <article className="prose prose-lg max-w-none">
        <ReactMarkdown>{content}</ReactMarkdown>
      </article>
    </main>
  )
}
