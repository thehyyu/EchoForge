import { sql } from '@/lib/db'
import HideProjectButton from './HideProjectButton'

export const dynamic = 'force-dynamic'

export default async function AdminProjectsPage() {
  const projects = await sql`
    SELECT id, slug, title_zh, status, hidden, published_at
    FROM projects
    ORDER BY published_at DESC
  `

  return (
    <main className="max-w-2xl mx-auto mt-8 sm:mt-16 p-4 sm:p-8">
      <h1 className="text-2xl font-bold mb-8">專案管理</h1>
      {projects.length === 0 ? (
        <p className="text-gray-500">還沒有專案。使用 publish_project.py 新增。</p>
      ) : (
        <ul className="space-y-4">
          {projects.map((p) => (
            <li key={p.id as number} className="border rounded p-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <p className="font-medium">{p.title_zh as string}</p>
                  <p className="text-sm text-gray-500 mt-0.5">
                    {p.slug as string} ·{' '}
                    {p.status as string} ·{' '}
                    {new Date(p.published_at as string).toLocaleDateString('zh-TW')}
                  </p>
                  <a
                    href={`/zh/projects/${p.slug}`}
                    target="_blank"
                    className="text-sm text-blue-500 hover:underline"
                  >
                    查看專案 →
                  </a>
                </div>
                <div className="flex items-center gap-2 sm:shrink-0">
                  {p.hidden && (
                    <span className="text-sm px-2 py-1 rounded bg-gray-100 text-gray-500">已隱藏</span>
                  )}
                  <HideProjectButton projectId={p.id as number} hidden={p.hidden as boolean} />
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}
