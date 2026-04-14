import { sql } from '@/lib/db'
import JobReviewCard from './JobReviewCard'
import JobErrorCard from './JobErrorCard'

export const dynamic = 'force-dynamic'

export default async function AdminJobsPage() {
  const [transcribedJobs, errorJobs] = await Promise.all([
    sql`
      SELECT id, type, transcript, created_at
      FROM jobs
      WHERE status = 'transcribed'
      ORDER BY created_at DESC
    `,
    sql`
      SELECT id, type, error_message, created_at
      FROM jobs
      WHERE status = 'error'
      ORDER BY created_at DESC
    `,
  ])

  return (
    <main className="w-full max-w-screen-xl mx-auto mt-8 sm:mt-16 px-4 sm:px-8 space-y-16">
      <section>
        <h1 className="text-2xl font-bold mb-8">待審核逐字稿</h1>
        {transcribedJobs.length === 0 ? (
          <p className="text-gray-500">目前沒有待審核的逐字稿。</p>
        ) : (
          <ul className="space-y-8">
            {transcribedJobs.map((job) => (
              <JobReviewCard
                key={job.id}
                jobId={job.id as number}
                transcript={job.transcript as string}
                createdAt={job.created_at as string}
              />
            ))}
          </ul>
        )}
      </section>

      {errorJobs.length > 0 && (
        <section>
          <h2 className="text-xl font-bold mb-4 text-red-700">失敗任務</h2>
          <ul className="space-y-4">
            {errorJobs.map((job) => (
              <JobErrorCard
                key={job.id}
                jobId={job.id as number}
                jobType={job.type as string}
                errorMessage={job.error_message as string}
                createdAt={job.created_at as string}
              />
            ))}
          </ul>
        </section>
      )}
    </main>
  )
}
