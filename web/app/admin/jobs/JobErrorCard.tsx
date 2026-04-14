'use client'

import { useState } from 'react'

interface Props {
  jobId: number
  jobType: string
  errorMessage: string
  createdAt: string
}

export default function JobErrorCard({ jobId, jobType, errorMessage, createdAt }: Props) {
  const [status, setStatus] = useState<'idle' | 'retrying' | 'done' | 'error'>('idle')

  async function handleRetry() {
    setStatus('retrying')
    const res = await fetch(`/api/admin/jobs/${jobId}/retry`, { method: 'POST' })
    if (res.ok) {
      setStatus('done')
    } else {
      setStatus('error')
    }
  }

  return (
    <li className="border border-red-200 rounded-lg p-6 bg-red-50">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-mono text-red-700">Job #{jobId} · {jobType}</span>
        <span className="text-xs text-gray-400">{new Date(createdAt).toLocaleString('zh-TW')}</span>
      </div>
      <p className="text-sm text-red-600 bg-red-100 rounded p-3 font-mono break-all mb-4">
        {errorMessage}
      </p>
      {status === 'done' ? (
        <p className="text-sm text-green-600">已重新排入佇列，等待 Mac mini 處理。</p>
      ) : (
        <button
          onClick={handleRetry}
          disabled={status === 'retrying'}
          className="text-sm px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
        >
          {status === 'retrying' ? '重試中...' : '重試'}
        </button>
      )}
      {status === 'error' && (
        <p className="text-sm text-red-500 mt-2">重試失敗，請稍後再試。</p>
      )}
    </li>
  )
}
