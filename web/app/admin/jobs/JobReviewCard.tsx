'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import ReactMarkdown from 'react-markdown'

const DEFAULT_PROMPT = `你是一個部落格文章編輯。以下是語音轉文字的逐字稿，請整理成完整的中文部落格文章。

只回傳 JSON，格式如下，不要有其他文字：
{
  "title_zh": "文章標題",
  "content_zh": "文章內文（Markdown 格式）",
  "category": "work 或 technology 或 life 或 sadhaka 其中之一",
  "tags": ["關鍵字1", "關鍵字2", "關鍵字3"]
}

逐字稿：
{{transcript}}`

type Draft = {
  title_zh: string
  content_zh: string
  category: string
  tags: string[]
}

export default function JobReviewCard({
  jobId,
  transcript,
  createdAt,
}: {
  jobId: number
  transcript: string
  createdAt: string
}) {
  const [editedTranscript, setEditedTranscript] = useState(transcript)
  const [promptTemplate, setPromptTemplate] = useState(DEFAULT_PROMPT)
  const [showPrompt, setShowPrompt] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [saving, setSaving] = useState(false)
  const [draft, setDraft] = useState<Draft | null>(null)
  const [error, setError] = useState('')
  const pollTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const router = useRouter()

  function startPolling(genJobId: number) {
    async function poll() {
      try {
        const res = await fetch(`/api/admin/jobs/${genJobId}/status`)
        const data = await res.json()

        if (data.status === 'done') {
          setGenerating(false)
          setDraft(data.result)
        } else if (data.status === 'error') {
          setGenerating(false)
          setError(data.error_message || '產生失敗')
        } else {
          pollTimer.current = setTimeout(poll, 3000)
        }
      } catch {
        setGenerating(false)
        setError('無法取得產生結果')
      }
    }
    poll()
  }

  async function handlePreview() {
    if (pollTimer.current) clearTimeout(pollTimer.current)
    setGenerating(true)
    setError('')
    setDraft(null)

    const res = await fetch(`/api/admin/jobs/${jobId}/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'preview',
        transcript: editedTranscript,
        prompt_template: promptTemplate,
      }),
    })

    const data = await res.json()

    if (!res.ok) {
      setGenerating(false)
      setError(data.error || '產生失敗')
      return
    }

    startPolling(data.generateJobId)
  }

  async function handleSave() {
    if (!draft) return
    setSaving(true)

    const res = await fetch(`/api/admin/jobs/${jobId}/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'save', draft }),
    })

    setSaving(false)
    if (res.ok) {
      router.push('/admin/posts')
    } else {
      setError('儲存失敗')
    }
  }

  return (
    <li className="border rounded-lg p-6 space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-400">
          {new Date(createdAt).toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' })} · Job #{jobId}
        </p>
        <button
          onClick={() => setShowPrompt(!showPrompt)}
          className="text-sm text-gray-500 hover:text-gray-800"
        >
          {showPrompt ? '隱藏 Prompt' : '調整 Prompt'}
        </button>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">逐字稿</label>
        <textarea
          value={editedTranscript}
          onChange={(e) => setEditedTranscript(e.target.value)}
          rows={8}
          className="w-full border rounded p-3 text-sm font-mono leading-relaxed resize-y"
        />
      </div>

      {showPrompt && (
        <div>
          <label className="block text-sm font-medium mb-1">Prompt 模板</label>
          <textarea
            value={promptTemplate}
            onChange={(e) => setPromptTemplate(e.target.value)}
            rows={12}
            className="w-full border rounded p-3 text-sm font-mono leading-relaxed resize-y"
          />
          <p className="text-xs text-gray-400 mt-1">
            {'{{transcript}}'} 會被替換為上方的逐字稿內容
          </p>
        </div>
      )}

      <div className="flex items-center gap-4">
        <button
          onClick={handlePreview}
          disabled={generating}
          className="px-4 py-2 bg-black text-white rounded disabled:opacity-50"
        >
          {generating ? '產生中（Mac mini 處理中...）' : draft ? '重新產生' : '產生預覽'}
        </button>
        {error && <p className="text-sm text-red-500">{error}</p>}
      </div>

      {draft && (
        <div className="border-t pt-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-700">預覽結果</h3>
            <div className="flex gap-2 text-xs text-gray-400">
              <span className="bg-gray-100 px-2 py-1 rounded">{draft.category}</span>
              {draft.tags.map((t) => (
                <span key={t} className="bg-gray-100 px-2 py-1 rounded">{t}</span>
              ))}
            </div>
          </div>
          <h2 className="text-xl font-bold">{draft.title_zh}</h2>
          <div className="prose prose-sm max-w-none">
            <ReactMarkdown>
              {draft.content_zh?.replace(/^#[^\n]*\n+/, '')}
            </ReactMarkdown>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 border-2 border-black rounded font-medium disabled:opacity-50"
          >
            {saving ? '儲存中...' : '✓ 滿意，存為草稿'}
          </button>
        </div>
      )}
    </li>
  )
}
