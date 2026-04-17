import { sql } from '@/lib/db'
import DictionaryEditor from './DictionaryEditor'

export default async function DictionaryPage() {
  const entries = await sql`SELECT id, wrong, correct FROM dictionary ORDER BY id`
  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">專有名詞字典</h1>
      <DictionaryEditor initialEntries={entries as { id: number; wrong: string; correct: string }[]} />
    </div>
  )
}
