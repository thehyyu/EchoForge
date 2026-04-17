'use client'

import { useState } from 'react'

type Entry = { id: number; wrong: string; correct: string }

export default function DictionaryEditor({ initialEntries }: { initialEntries: Entry[] }) {
  const [entries, setEntries] = useState<Entry[]>(initialEntries)
  const [wrong, setWrong] = useState('')
  const [correct, setCorrect] = useState('')
  const [error, setError] = useState('')

  async function handleAdd() {
    if (!wrong.trim() || !correct.trim()) return
    setError('')
    const res = await fetch('/api/admin/dictionary', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ wrong, correct }),
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error); return }
    setEntries([...entries, data])
    setWrong('')
    setCorrect('')
  }

  async function handleDelete(id: number) {
    await fetch(`/api/admin/dictionary/${id}`, { method: 'DELETE' })
    setEntries(entries.filter(e => e.id !== id))
  }

  return (
    <div className="space-y-6">
      <div className="flex gap-2 items-end">
        <div className="flex-1">
          <label className="block text-sm font-medium mb-1">STT 錯誤詞</label>
          <input
            value={wrong}
            onChange={e => setWrong(e.target.value)}
            placeholder="例：艾爾法"
            className="w-full border rounded p-2 text-sm"
          />
        </div>
        <div className="flex-1">
          <label className="block text-sm font-medium mb-1">正確詞</label>
          <input
            value={correct}
            onChange={e => setCorrect(e.target.value)}
            placeholder="例：Alpha"
            className="w-full border rounded p-2 text-sm"
          />
        </div>
        <button
          onClick={handleAdd}
          disabled={!wrong.trim() || !correct.trim()}
          className="px-4 py-2 bg-black text-white rounded text-sm disabled:opacity-50"
        >
          新增
        </button>
      </div>
      {error && <p className="text-sm text-red-500">{error}</p>}

      <table className="w-full text-sm border rounded overflow-hidden">
        <thead className="bg-gray-50">
          <tr>
            <th className="text-left px-4 py-2 font-medium">錯誤詞</th>
            <th className="text-left px-4 py-2 font-medium">正確詞</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {entries.map(e => (
            <tr key={e.id} className="border-t">
              <td className="px-4 py-2 font-mono">{e.wrong}</td>
              <td className="px-4 py-2 font-mono">{e.correct}</td>
              <td className="px-4 py-2 text-right">
                <button onClick={() => handleDelete(e.id)} className="text-red-400 hover:text-red-600 text-xs">
                  刪除
                </button>
              </td>
            </tr>
          ))}
          {entries.length === 0 && (
            <tr><td colSpan={3} className="px-4 py-4 text-gray-400 text-center">尚無條目</td></tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
