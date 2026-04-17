import { sql } from '@/lib/db'
import PromptLibrary from './PromptLibrary'

export default async function PromptsPage() {
  const prompts = await sql`
    SELECT id, name, content, created_at FROM prompt_templates ORDER BY created_at DESC
  `
  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Prompt Library</h1>
      <PromptLibrary initialPrompts={prompts as { id: number; name: string; content: string; created_at: string }[]} />
    </div>
  )
}
