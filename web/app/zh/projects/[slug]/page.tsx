import { sql } from '@/lib/db'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import ReactMarkdown from 'react-markdown'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

function formatStartedAt(dateStr: string | null) {
  if (!dateStr) return null
  const d = new Date(dateStr)
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}`
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const rows = await sql`
    SELECT title_zh, tagline_zh FROM projects WHERE slug = ${slug} AND hidden = false
  `
  if (!rows.length) return {}
  return {
    title: rows[0].title_zh as string,
    description: (rows[0].tagline_zh as string) || undefined,
  }
}

export default async function ZhProjectPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const rows = await sql`
    SELECT title_zh, tagline_zh, description_zh, tech_stack,
           status, github_url, demo_url, started_at
    FROM projects
    WHERE slug = ${slug} AND hidden = false
  `
  if (!rows.length) notFound()
  const p = rows[0]

  const statusLabel =
    p.status === 'active' ? '進行中' :
    p.status === 'completed' ? '已完成' : '封存'

  return (
    <main className="max-w-2xl mx-auto mt-8 sm:mt-16 px-4 sm:px-8 pb-16">
      <div className="flex justify-end mb-4">
        <Link href={`/en/projects/${slug}`} className="text-sm text-gray-400 hover:underline">
          English →
        </Link>
      </div>
      <h1 className="text-2xl sm:text-3xl font-bold mb-2">{p.title_zh as string}</h1>
      {p.tagline_zh && (
        <p className="text-gray-500 mb-4">{p.tagline_zh as string}</p>
      )}
      <div className="flex flex-wrap items-center gap-3 text-sm text-gray-400 mb-6">
        {p.started_at && <span>{formatStartedAt(p.started_at as string)}</span>}
        <span className="text-xs border border-stone-300 text-stone-400 px-2 py-0.5 rounded-full">
          {statusLabel}
        </span>
        {p.github_url && (
          <a href={p.github_url as string} target="_blank" rel="noopener noreferrer" className="hover:text-gray-700 underline underline-offset-2">
            GitHub
          </a>
        )}
        {p.demo_url && (
          <a href={p.demo_url as string} target="_blank" rel="noopener noreferrer" className="hover:text-gray-700 underline underline-offset-2">
            Demo
          </a>
        )}
      </div>
      <div className="flex flex-wrap gap-1 mb-8">
        {((p.tech_stack as string[]) || []).map((t) => (
          <span key={t} className="text-xs border border-stone-300 text-stone-400 px-2 py-0.5 rounded-full">
            {t}
          </span>
        ))}
      </div>
      <article className="prose prose-lg max-w-none">
        {p.description_zh
          ? <ReactMarkdown>{p.description_zh as string}</ReactMarkdown>
          : <p className="text-gray-400">暫無說明</p>
        }
      </article>
    </main>
  )
}
