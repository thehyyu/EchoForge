import { auth } from '@/auth'
import { NextRequest, NextResponse } from 'next/server'

function detectLang(req: NextRequest): 'zh' | 'en' {
  const accept = req.headers.get('accept-language') || ''
  return accept.toLowerCase().includes('zh') ? 'zh' : 'en'
}

export default auth((req) => {
  // protect /admin
  if (req.nextUrl.pathname.startsWith('/admin')) {
    if (!req.auth) {
      const loginUrl = new URL('/api/auth/signin', req.url)
      loginUrl.searchParams.set('callbackUrl', req.url)
      return NextResponse.redirect(loginUrl)
    }
    return
  }

  // language redirect for article pages
  if (req.nextUrl.pathname === '/posts' || req.nextUrl.pathname.startsWith('/posts/')) {
    const lang = detectLang(req)
    return NextResponse.redirect(new URL(`/${lang}${req.nextUrl.pathname}`, req.url))
  }
})

export const config = {
  matcher: ['/admin/:path*', '/posts/:path*'],
}
