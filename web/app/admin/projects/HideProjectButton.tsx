'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function HideProjectButton({ projectId, hidden }: { projectId: number; hidden: boolean }) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleToggle() {
    setLoading(true)
    await fetch(`/api/admin/projects/${projectId}/hide`, { method: 'POST' })
    setLoading(false)
    router.refresh()
  }

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      className="text-sm px-2 py-1 border rounded text-gray-500 hover:text-gray-800 disabled:opacity-50"
    >
      {loading ? '...' : hidden ? '顯示' : '隱藏'}
    </button>
  )
}
