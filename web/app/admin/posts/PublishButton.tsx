'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function PublishButton({ postId, slug }: { postId: number; slug: string }) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handlePublish() {
    setLoading(true)
    await fetch(`/api/admin/posts/${postId}/publish`, { method: 'POST' })
    router.refresh()
    setLoading(false)
  }

  return (
    <button
      onClick={handlePublish}
      disabled={loading}
      className="text-sm px-4 py-1.5 bg-black text-white rounded disabled:opacity-50"
    >
      {loading ? '發佈中...' : '發佈'}
    </button>
  )
}
