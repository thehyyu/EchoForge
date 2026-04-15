import Link from 'next/link'
import { sql } from '@/lib/db'
import PublishButton from './PublishButton'
import HideButton from './HideButton'

export const dynamic = 'force-dynamic'

export default async function AdminPostsPage() {
  const posts = await sql`
    SELECT id, title_zh, category, tags, status, slug, hidden, created_at
    FROM posts
    ORDER BY created_at DESC
  `

  return (
    <main className="max-w-2xl mx-auto mt-8 sm:mt-16 p-4 sm:p-8">
      <h1 className="text-2xl font-bold mb-8">文章管理</h1>
      {posts.length === 0 ? (
        <p className="text-gray-500">目前沒有文章。</p>
      ) : (
        <ul className="space-y-4">
          {posts.map((post) => (
            <li key={post.id} className="border rounded p-4 space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
                <div>
                  <Link href={`/admin/posts/${post.id}`} className="text-lg font-medium hover:underline">
                    {post.title_zh}
                  </Link>
                  <p className="text-base text-gray-500 mt-1">
                    {post.category} ·{' '}
                    {(post.tags as string[]).join('、')} ·{' '}
                    {new Date(post.created_at as string).toLocaleDateString('zh-TW')}
                  </p>
                  {post.status === 'published' && (
                    <a
                      href={`/zh/posts/${post.slug}`}
                      target="_blank"
                      className="text-sm text-blue-500 hover:underline"
                    >
                      查看文章 →
                    </a>
                  )}
                </div>
                <div className="flex items-center gap-2 sm:shrink-0">
                  {post.hidden && (
                    <span className="text-sm px-2 py-1 rounded bg-gray-100 text-gray-500">已隱藏</span>
                  )}
                  <span className={`text-sm px-2 py-1 rounded ${
                    post.status === 'published'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {post.status === 'published' ? '已發佈' : '草稿'}
                  </span>
                  {post.status === 'draft' && (
                    <PublishButton postId={post.id as number} slug={post.slug as string} />
                  )}
                  {post.status === 'published' && (
                    <HideButton postId={post.id as number} hidden={post.hidden as boolean} />
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}
