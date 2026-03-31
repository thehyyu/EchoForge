'use client'

import { usePathname } from 'next/navigation'

export default function NavRss() {
  const pathname = usePathname()
  const isEn = pathname.startsWith('/en/')
  const href = isEn ? '/feed/en.xml' : '/feed/zh.xml'

  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="hover:text-gray-700">
      RSS
    </a>
  )
}
