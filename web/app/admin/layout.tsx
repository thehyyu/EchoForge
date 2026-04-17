import Link from 'next/link'
import { auth, signOut } from '@/auth'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
        <nav className="flex items-center gap-4 text-sm">
          <span className="font-semibold text-gray-700">Admin</span>
          <Link href="/admin/jobs" className="text-gray-500 hover:text-gray-900">Jobs</Link>
          <Link href="/admin/prompts" className="text-gray-500 hover:text-gray-900">Prompts</Link>
          <Link href="/admin/posts" className="text-gray-500 hover:text-gray-900">Posts</Link>
        </nav>
        <div className="flex items-center gap-3 sm:gap-4 text-sm text-gray-600 min-w-0">
          <span className="truncate">{session?.user?.email}</span>
          <form action={async () => {
            'use server'
            await signOut({ redirectTo: '/' })
          }}>
            <button type="submit" className="text-red-500 hover:underline">
              登出
            </button>
          </form>
        </div>
      </header>
      <main>{children}</main>
    </div>
  )
}
