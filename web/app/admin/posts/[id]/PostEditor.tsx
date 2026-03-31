'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import ReactMarkdown from 'react-markdown'

const CATEGORIES = ['work', 'technology', 'life', 'sadhaka']

type Tab = 'zh' | 'en'

export default function PostEditor({
  postId,
  initialTitle,
  initialContent,
  initialTitleEn,
  initialContentEn,
  initialCategory,
  initialTags,
  status,
}: {
  postId: number
  initialTitle: string
  initialContent: string
  initialTitleEn: string
  initialContentEn: string
  initialCategory: string
  initialTags: string
  status: string
}) {
  const [tab, setTab] = useState<Tab>('zh')
  const [preview, setPreview] = useState(false)

  const [title, setTitle] = useState(initialTitle)
  const [content, setContent] = useState(initialContent)
  const [titleEn, setTitleEn] = useState(initialTitleEn)
  const [contentEn, setContentEn] = useState(initialContentEn)
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
        title_en: titleEn,
        content_en: contentEn,
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
    if (res.ok) router.push('/admin/posts')
  }

  const currentContent = tab === 'zh' ? content : contentEn

  return (
    <div className="space-y-6">
      {/* 分頁切換 */}
      <div className="flex gap-1 border-b">
        {(['zh', 'en'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => { setTab(t); setPreview(false) }}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${
              tab === t ? 'border-black text-black' : 'border-transparent text-gray-400 hover:text-gray-700'
            }`}
          >
            {t === 'zh' ? '中文' : 'English'}
          </button>
        ))}
        <div className="ml-auto flex items-center">
          <button
            onClick={() => setPreview(!preview)}
            className="text-xs text-gray-400 hover:text-gray-700 px-3"
          >
            {preview ? '編輯' : '預覽'}
          </button>
        </div>
      </div>

      {/* 標題 */}
      <div>
        <label className="block text-sm font-medium mb-1">
          {tab === 'zh' ? '標題' : 'Title'}
        </label>
        {tab === 'zh' ? (
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full border rounded p-3 text-lg"
          />
        ) : (
          <input
            type="text"
            value={titleEn}
            onChange={(e) => setTitleEn(e.target.value)}
            className="w-full border rounded p-3 text-lg"
          />
        )}
      </div>

      {/* 內文 / 預覽 */}
      <div>
        <label className="block text-sm font-medium mb-1">
          {tab === 'zh' ? '內文（Markdown）' : 'Content (Markdown)'}
        </label>
        {preview ? (
          <div className="prose prose-sm max-w-none border rounded p-4 min-h-64 bg-white">
            <ReactMarkdown>
              {currentContent?.replace(/^#[^\n]*\n+/, '') || '（無內容）'}
            </ReactMarkdown>
          </div>
        ) : tab === 'zh' ? (
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={20}
            className="w-full border rounded p-3 text-sm font-mono leading-relaxed resize-y"
          />
        ) : (
          <textarea
            value={contentEn}
            onChange={(e) => setContentEn(e.target.value)}
            rows={20}
            className="w-full border rounded p-3 text-sm font-mono leading-relaxed resize-y"
          />
        )}
      </div>

      {/* 分類 + 標籤 */}
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
          <label className="block text-sm font-medium mb-1">標籤（逗號或頓號分隔）</label>
          <input
            type="text"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            className="w-full border rounded p-3"
          />
        </div>
      </div>

      {/* 按鈕 */}
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
