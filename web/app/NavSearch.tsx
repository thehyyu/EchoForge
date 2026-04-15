'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'

export default function NavSearch() {
  const pathname = usePathname()
  const isEn = pathname === '/en' || pathname.startsWith('/en/')

  return (
    <Link href={isEn ? '/en/search' : '/zh/search'} className="hover:text-gray-700">
      {isEn ? 'Search' : '搜尋'}
    </Link>
  )
}
