import { sql } from '@/lib/db'
import JobReviewCard from './JobReviewCard'

export const dynamic = 'force-dynamic'

export default async function AdminJobsPage() {
  const jobs = await sql`
    SELECT id, type, transcript, created_at
    FROM jobs
    WHERE status = 'transcribed'
    ORDER BY created_at DESC
  `

  return (
    <main className="max-w-3xl mx-auto mt-16 p-8">
      <h1 className="text-2xl font-bold mb-8">待審核逐字稿</h1>
      {jobs.length === 0 ? (
        <p className="text-gray-500">目前沒有待審核的逐字稿。</p>
      ) : (
        <ul className="space-y-8">
          {jobs.map((job) => (
            <JobReviewCard
              key={job.id}
              jobId={job.id as number}
              transcript={job.transcript as string}
              createdAt={job.created_at as string}
            />
          ))}
        </ul>
      )}
    </main>
  )
}
