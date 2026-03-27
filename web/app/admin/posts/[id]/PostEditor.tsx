'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const CATEGORIES = ['work', 'technology', 'life', 'sadhaka']

export default function PostEditor({
  postId,
  initialTitle,
  initialContent,
  initialCategory,
  initialTags,
  status,
}: {
  postId: number
  initialTitle: string
  initialContent: string
  initialCategory: string
  initialTags: string
  status: string
}) {
  const [title, setTitle] = useState(initialTitle)
  const [content, setContent] = useState(initialContent)
  const [category, setCategory] = useState(initialCategory)
  const [tags, setTags] = useState(initialTags)
  const [saving, setSaving] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [message, setMessage] = useState('')
  const router = useRouter()

  async function handleSave() {
    setSaving(true)
    setMessage('')

    const res = await fetch(`/api/admin/posts/${postId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title_zh: title,
        content_zh: content,
        category,
        tags: tags.split(/[、,，]/).map((t) => t.trim()).filter(Boolean),
      }),
    })

    setSaving(false)
    setMessage(res.ok ? '已儲存' : '儲存失敗')
  }

  async function handlePublish() {
    setPublishing(true)
    await handleSave()
    const res = await fetch(`/api/admin/posts/${postId}/publish`, { method: 'POST' })
    setPublishing(false)
    if (res.ok) {
      router.push('/admin/posts')
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium mb-1">標題</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full border rounded p-3 text-lg"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">內文（Markdown）</label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={20}
          className="w-full border rounded p-3 text-sm font-mono leading-relaxed resize-y"
        />
      </div>

      <div className="flex gap-4">
        <div className="flex-1">
          <label className="block text-sm font-medium mb-1">分類</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full border rounded p-3"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        <div className="flex-1">
          <label className="block text-sm font-medium mb-1">標籤（用逗號或頓號分隔）</label>
          <input
            type="text"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            className="w-full border rounded p-3"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-4 py-2 border rounded disabled:opacity-50"
        >
          {saving ? '儲存中...' : '儲存'}
        </button>
        {status === 'draft' && (
          <button
            onClick={handlePublish}
            disabled={publishing}
            className="px-4 py-2 bg-black text-white rounded disabled:opacity-50"
          >
            {publishing ? '發佈中...' : '儲存並發佈'}
          </button>
        )}
        {message && <p className="text-sm text-gray-500">{message}</p>}
      </div>
    </div>
  )
}
