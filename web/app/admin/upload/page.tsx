'use client'

import { useState } from 'react'
import { upload } from '@vercel/blob/client'

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null)
  const [fileStatus, setFileStatus] = useState<'idle' | 'uploading' | 'done' | 'error'>('idle')
  const [fileMessage, setFileMessage] = useState('')

  const [geminiUrl, setGeminiUrl] = useState('')
  const [geminiStatus, setGeminiStatus] = useState<'idle' | 'submitting' | 'done' | 'error'>('idle')
  const [geminiMessage, setGeminiMessage] = useState('')

  async function handleFileSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!file) return

    setFileStatus('uploading')
    setFileMessage('')

    try {
      const uniqueName = `${Date.now()}-${file.name}`
      await upload(uniqueName, file, {
        access: 'public',
        handleUploadUrl: '/api/upload',
      })
      setFileStatus('done')
      setFileMessage('上傳成功，任務已建立，等待 Mac mini 處理。')
      setFile(null)
    } catch (err) {
      setFileStatus('error')
      setFileMessage((err as Error).message || '上傳失敗')
    }
  }

  async function handleGeminiSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!geminiUrl.trim()) return

    setGeminiStatus('submitting')
    setGeminiMessage('')

    const res = await fetch('/api/admin/gemini', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: geminiUrl.trim() }),
    })
    const data = await res.json()

    if (res.ok) {
      setGeminiStatus('done')
      setGeminiMessage('任務已建立，等待 Mac mini 處理。')
      setGeminiUrl('')
    } else {
      setGeminiStatus('error')
      setGeminiMessage(data.error || '提交失敗')
    }
  }

  return (
    <main className="max-w-lg mx-auto mt-8 sm:mt-16 p-4 sm:p-8 space-y-12">
      {/* 音檔上傳 */}
      <section>
        <h1 className="text-2xl font-bold mb-6">上傳音檔</h1>
        <form onSubmit={handleFileSubmit} className="space-y-4">
          <input
            type="file"
            accept="audio/*"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="block w-full"
          />
          <button
            type="submit"
            disabled={!file || fileStatus === 'uploading'}
            className="px-4 py-2 bg-black text-white rounded disabled:opacity-50"
          >
            {fileStatus === 'uploading' ? '上傳中...' : '上傳'}
          </button>
        </form>
        {fileMessage && (
          <p className={`mt-3 text-sm ${fileStatus === 'error' ? 'text-red-500' : 'text-green-600'}`}>
            {fileMessage}
          </p>
        )}
      </section>

      {/* Gemini URL */}
      <section>
        <h2 className="text-2xl font-bold mb-2">Gemini 對話</h2>
        <p className="text-sm text-gray-400 mb-4">貼入 Gemini share URL（gemini.google.com/share/...）</p>
        <form onSubmit={handleGeminiSubmit} className="space-y-4">
          <input
            type="url"
            value={geminiUrl}
            onChange={(e) => setGeminiUrl(e.target.value)}
            placeholder="https://gemini.google.com/share/..."
            className="w-full border rounded p-3 text-sm"
          />
          <button
            type="submit"
            disabled={!geminiUrl.trim() || geminiStatus === 'submitting'}
            className="px-4 py-2 bg-black text-white rounded disabled:opacity-50"
          >
            {geminiStatus === 'submitting' ? '提交中...' : '提交'}
          </button>
        </form>
        {geminiMessage && (
          <p className={`mt-3 text-sm ${geminiStatus === 'error' ? 'text-red-500' : 'text-green-600'}`}>
            {geminiMessage}
          </p>
        )}
      </section>
    </main>
  )
}
