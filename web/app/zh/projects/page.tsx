import { sql } from '@/lib/db'
import ProjectCard from '@/app/ProjectCard'

export const dynamic = 'force-dynamic'

export default async function ZhProjectsPage() {
  const projects = await sql`
    SELECT slug, title_zh AS title, tagline_zh AS tagline,
           tech_stack, status, github_url, demo_url, started_at
    FROM projects
    WHERE hidden = false
    ORDER BY published_at DESC
  `

  return (
    <main className="max-w-2xl mx-auto px-4 sm:px-6 py-10 sm:py-16">
      <h1 className="text-2xl font-bold mb-10">專案</h1>
      {projects.length === 0 ? (
        <p className="text-gray-400">還沒有專案。</p>
      ) : (
        <ul className="space-y-8">
          {projects.map((p) => (
            <ProjectCard
              key={p.slug as string}
              project={{
                slug:       p.slug as string,
                title:      p.title as string,
                tagline:    p.tagline as string | null,
                tech_stack: (p.tech_stack as string[]) || [],
                status:     p.status as string,
                github_url: p.github_url as string | null,
                demo_url:   p.demo_url as string | null,
                started_at: p.started_at as string | null,
              }}
              lang="zh"
              href={`/zh/projects/${p.slug}`}
            />
          ))}
        </ul>
      )}
    </main>
  )
}
