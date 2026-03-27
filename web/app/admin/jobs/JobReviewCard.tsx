'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

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
  const [status, setStatus] = useState<'idle' | 'generating' | 'done' | 'error'>('idle')
  const [message, setMessage] = useState('')
  const router = useRouter()

  async function handleGenerate() {
    setStatus('generating')
    setMessage('')

    const res = await fetch(`/api/admin/jobs/${jobId}/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        transcript: editedTranscript,
        prompt_template: promptTemplate,
      }),
    })

    const data = await res.json()

    if (res.ok) {
      setStatus('done')
      setMessage('草稿已產生！')
      setTimeout(() => router.push('/admin/posts'), 1500)
    } else {
      setStatus('error')
      setMessage(data.error || '產生失敗')
    }
  }

  return (
    <li className="border rounded-lg p-6 space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-400">
          {new Date(createdAt).toLocaleString('zh-TW')} · Job #{jobId}
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
          onClick={handleGenerate}
          disabled={status === 'generating'}
          className="px-4 py-2 bg-black text-white rounded disabled:opacity-50"
        >
          {status === 'generating' ? '產生中...' : '產生草稿'}
        </button>
        {message && (
          <p className={status === 'error' ? 'text-red-500' : 'text-green-600'}>
            {message}
          </p>
        )}
      </div>
    </li>
  )
}
