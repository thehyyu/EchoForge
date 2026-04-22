'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'

export default function NavProjects() {
  const pathname = usePathname()
  const isEn = pathname === '/en' || pathname.startsWith('/en/')

  return (
    <Link href={isEn ? '/en/projects' : '/zh/projects'} className="hover:text-gray-700">
      {isEn ? 'Projects' : '專案'}
    </Link>
  )
}
