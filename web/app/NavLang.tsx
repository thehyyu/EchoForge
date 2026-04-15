'use client'

import { usePathname, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Suspense } from 'react'

function getAltPath(pathname: string, searchParams: URLSearchParams): { href: string; label: string } {
  const isEn = pathname === '/en' || pathname.startsWith('/en/')
  const q = searchParams.get('q')
  const qs = q ? `?q=${encodeURIComponent(q)}` : ''

  if (isEn) {
    if (pathname === '/en') return { href: '/zh', label: '華文' }
    if (pathname.startsWith('/en/posts/')) return { href: pathname.replace('/en/posts/', '/zh/posts/'), label: '華文' }
    if (pathname.startsWith('/en/category/')) return { href: pathname.replace('/en/category/', '/zh/category/'), label: '華文' }
    if (pathname.startsWith('/en/tag/')) return { href: pathname.replace('/en/tag/', '/zh/tag/'), label: '華文' }
    if (pathname === '/en/search') return { href: `/zh/search${qs}`, label: '華文' }
    return { href: '/zh', label: '華文' }
  } else {
    if (pathname === '/zh') return { href: '/en', label: 'EN' }
    if (pathname.startsWith('/zh/posts/')) return { href: pathname.replace('/zh/posts/', '/en/posts/'), label: 'EN' }
    if (pathname.startsWith('/zh/category/')) return { href: pathname.replace('/zh/category/', '/en/category/'), label: 'EN' }
    if (pathname.startsWith('/zh/tag/')) return { href: pathname.replace('/zh/tag/', '/en/tag/'), label: 'EN' }
    if (pathname === '/zh/search') return { href: `/en/search${qs}`, label: 'EN' }
    return { href: '/en', label: 'EN' }
  }
}

function NavLangInner() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { href, label } = getAltPath(pathname, searchParams)

  return (
    <Link href={href} className="hover:text-gray-700">
      {label}
    </Link>
  )
}

export default function NavLang() {
  return (
    <Suspense fallback={null}>
      <NavLangInner />
    </Suspense>
  )
}
