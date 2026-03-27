import { sql } from '@/lib/db'
import { notFound } from 'next/navigation'
import PostEditor from './PostEditor'

export const dynamic = 'force-dynamic'

export default async function EditPostPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const rows = await sql`
    SELECT id, title_zh, content_zh, category, tags, status
    FROM posts
    WHERE id = ${id}
  `

  if (rows.length === 0) notFound()

  const post = rows[0]

  return (
    <main className="w-full max-w-screen-xl mx-auto mt-16 px-8">
      <h1 className="text-2xl font-bold mb-8">編輯草稿</h1>
      <PostEditor
        postId={post.id as number}
        initialTitle={post.title_zh as string}
        initialContent={post.content_zh as string}
        initialCategory={post.category as string}
        initialTags={(post.tags as string[]).join('、')}
        status={post.status as string}
      />
    </main>
  )
}
