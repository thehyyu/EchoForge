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
    SELECT title_en, content_en, title_zh FROM posts WHERE slug = ${slug} AND status = 'published'
  `
  if (rows.length === 0) return {}
  const post = rows[0]
  const title = (post.title_en as string) || (post.title_zh as string)
  const description = (post.content_en as string)?.slice(0, 120).replace(/\n/g, ' ')
  return { title, description }
}

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
  const rawContent = (post.content_en as string) || (post.content_zh as string)
  const content = rawContent?.replace(/^#[^\n]*\n+/, '') ?? ''

  return (
    <main className="max-w-2xl mx-auto mt-16 px-8 pb-16">
      <div className="flex justify-end mb-4">
        <Link href={`/zh/posts/${slug}`} className="text-sm text-gray-400 hover:underline">
          中文版 →
        </Link>
      </div>
      <p className="text-sm text-gray-400 mb-2">
        <Link href={`/category/${post.category}`} className="hover:underline">
          {post.category as string}
        </Link>
        {' · '}
        {new Date(post.created_at as string).toLocaleDateString('en-US')}
      </p>
      <h1 className="text-3xl font-bold mb-6">{title}</h1>
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
