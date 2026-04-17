'use client'

import { useState } from 'react'

type Prompt = { id: number; name: string; content: string; created_at: string }

export default function PromptLibrary({ initialPrompts }: { initialPrompts: Prompt[] }) {
  const [prompts, setPrompts] = useState<Prompt[]>(initialPrompts)
  const [name, setName] = useState('')
  const [content, setContent] = useState('')
  const [description, setDescription] = useState('')
  const [generating, setGenerating] = useState(false)
  const [generatedPrompt, setGeneratedPrompt] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [expanded, setExpanded] = useState<number | null>(null)

  async function pollJobResult(jobId: number): Promise<string> {
    while (true) {
      await new Promise(r => setTimeout(r, 3000))
      const res = await fetch(`/api/admin/jobs/${jobId}/status`)
      const data = await res.json()
      if (data.status === 'done') return data.result?.prompt ?? ''
      if (data.status === 'error') throw new Error(data.error_message || '生成失敗')
    }
  }

  async function handleGenerate() {
    if (!description.trim()) return
    setGenerating(true)
    setError('')
    setGeneratedPrompt('')
    try {
      const res = await fetch('/api/admin/prompts/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      const prompt = await pollJobResult(data.jobId)
      setGeneratedPrompt(prompt)
      setContent(prompt)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : '生成失敗')
    } finally {
      setGenerating(false)
    }
  }

  async function handleSave() {
    if (!name.trim() || !content.trim()) return
    setSaving(true)
    setError('')
    try {
      const res = await fetch('/api/admin/prompts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, content }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setPrompts([data, ...prompts])
      setName('')
      setContent('')
      setDescription('')
      setGeneratedPrompt('')
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : '儲存失敗')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: number) {
    if (!confirm('確定要刪除這個 Prompt？')) return
    await fetch(`/api/admin/prompts/${id}`, { method: 'DELETE' })
    setPrompts(prompts.filter(p => p.id !== id))
  }

  return (
    <div className="space-y-8">
      {/* 新增區塊 */}
      <div className="border rounded-lg p-6 space-y-4">
        <h2 className="font-semibold">新增 Prompt</h2>

        <div className="flex gap-2">
          <input
            placeholder="輸入描述，自動生成 Prompt（例如：科技創業訪談）"
            value={description}
            onChange={e => setDescription(e.target.value)}
            className="flex-1 border rounded p-2 text-sm"
          />
          <button
            onClick={handleGenerate}
            disabled={generating || !description.trim()}
            className="px-4 py-2 bg-gray-800 text-white rounded text-sm disabled:opacity-50"
          >
            {generating ? '生成中...' : '自動生成'}
          </button>
        </div>

        {generatedPrompt && (
          <p className="text-xs text-green-600">✓ 已生成，可在下方編輯後儲存</p>
        )}

        <input
          placeholder="Prompt 名稱"
          value={name}
          onChange={e => setName(e.target.value)}
          className="w-full border rounded p-2 text-sm"
        />
        <textarea
          placeholder="Prompt 內容（使用 {{transcript}} 作為逐字稿佔位符）"
          value={content}
          onChange={e => setContent(e.target.value)}
          rows={10}
          className="w-full border rounded p-2 text-sm font-mono resize-y"
        />

        {error && <p className="text-sm text-red-500">{error}</p>}

        <button
          onClick={handleSave}
          disabled={saving || !name.trim() || !content.trim()}
          className="px-4 py-2 bg-black text-white rounded text-sm disabled:opacity-50"
        >
          {saving ? '儲存中...' : '儲存到 Library'}
        </button>
      </div>

      {/* Library 列表 */}
      <ul className="space-y-3">
        {prompts.map(p => (
          <li key={p.id} className="border rounded-lg p-4">
            <div className="flex items-center justify-between">
              <button
                onClick={() => setExpanded(expanded === p.id ? null : p.id)}
                className="font-medium text-sm text-left hover:underline"
              >
                {p.name}
              </button>
              <div className="flex items-center gap-3">
                <span className="text-xs text-gray-400">
                  {new Date(p.created_at).toLocaleDateString('zh-TW')}
                </span>
                <button
                  onClick={() => handleDelete(p.id)}
                  className="text-xs text-red-400 hover:text-red-600"
                >
                  刪除
                </button>
              </div>
            </div>
            {expanded === p.id && (
              <pre className="mt-3 text-xs font-mono bg-gray-50 rounded p-3 whitespace-pre-wrap break-words">
                {p.content}
              </pre>
            )}
          </li>
        ))}
        {prompts.length === 0 && (
          <p className="text-sm text-gray-400">尚無 Prompt，新增一個吧。</p>
        )}
      </ul>
    </div>
  )
}
