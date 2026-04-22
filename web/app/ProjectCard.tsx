import Link from 'next/link'

interface Project {
  slug: string
  title: string
  tagline: string | null
  tech_stack: string[]
  status: string
  github_url: string | null
  demo_url: string | null
  started_at: string | null
}

function formatStartedAt(dateStr: string | null): string | null {
  if (!dateStr) return null
  const d = new Date(dateStr)
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}`
}

const STATUS_LABELS: Record<string, { zh: string; en: string }> = {
  active:    { zh: '進行中', en: 'Active' },
  completed: { zh: '已完成', en: 'Completed' },
  archived:  { zh: '封存',   en: 'Archived' },
}

export default function ProjectCard({
  project,
  lang,
  href,
}: {
  project: Project
  lang: 'zh' | 'en'
  href: string
}) {
  const statusLabel = STATUS_LABELS[project.status]?.[lang] ?? project.status

  return (
    <li className="border-b border-stone-100 pb-8 last:border-0">
      <div className="flex items-start justify-between gap-4 mb-2">
        <Link href={href} className="group">
          <h2 className="text-lg font-semibold group-hover:underline">{project.title}</h2>
        </Link>
        <span className="text-xs border border-stone-300 text-stone-400 px-2 py-0.5 rounded-full shrink-0">
          {statusLabel}
        </span>
      </div>
      {project.tagline && (
        <p className="text-sm text-gray-500 mb-3">{project.tagline}</p>
      )}
      <div className="flex flex-wrap gap-1 mb-3">
        {project.tech_stack.map((t) => (
          <span
            key={t}
            className="text-xs border border-stone-300 text-stone-400 px-2 py-0.5 rounded-full"
          >
            {t}
          </span>
        ))}
      </div>
      <div className="flex items-center gap-3 text-xs text-gray-400">
        {project.started_at && <span>{formatStartedAt(project.started_at)}</span>}
        {project.github_url && (
          <a href={project.github_url} target="_blank" rel="noopener noreferrer" className="hover:text-gray-700 underline underline-offset-2">
            GitHub
          </a>
        )}
        {project.demo_url && (
          <a href={project.demo_url} target="_blank" rel="noopener noreferrer" className="hover:text-gray-700 underline underline-offset-2">
            Demo
          </a>
        )}
      </div>
    </li>
  )
}
