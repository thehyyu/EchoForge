'use client'

import { useState } from 'react'

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null)
  const [status, setStatus] = useState<'idle' | 'uploading' | 'done' | 'error'>('idle')
  const [message, setMessage] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!file) return

    setStatus('uploading')
    setMessage('')

    try {
      const res = await fetch('/api/upload', {
        method: 'PUT',
        body: file,
        headers: {
          'x-filename': file.name,
          'content-type': file.type,
        },
      })

      const data = await res.json()

      if (res.ok) {
        setStatus('done')
        setMessage('上傳成功，任務已建立，等待 Mac mini 處理。')
      } else {
        setStatus('error')
        setMessage(data.error || '上傳失敗')
      }
    } catch (err) {
      setStatus('error')
      setMessage((err as Error).message || '上傳失敗')
    }
  }

  return (
    <main className="max-w-lg mx-auto mt-16 p-8">
      <h1 className="text-2xl font-bold mb-8">上傳音檔</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="file"
          accept="audio/*"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="block w-full"
        />
        <button
          type="submit"
          disabled={!file || status === 'uploading'}
          className="px-4 py-2 bg-black text-white rounded disabled:opacity-50"
        >
          {status === 'uploading' ? '上傳中...' : '上傳'}
        </button>
      </form>
      {message && (
        <p className={`mt-4 ${status === 'error' ? 'text-red-500' : 'text-green-600'}`}>
          {message}
        </p>
      )}
    </main>
  )
}
