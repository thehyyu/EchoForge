import { auth } from '@/auth'
import { isAdmin, isSttAllowed } from '@/lib/auth-utils'
import { NextRequest, NextResponse } from 'next/server'

function detectLang(req: NextRequest): 'zh' | 'en' {
  const accept = req.headers.get('accept-language') || ''
  return accept.toLowerCase().includes('zh') ? 'zh' : 'en'
}

export default auth((req) => {
  const email = req.auth?.user?.email

  // protect /admin — admin only
  if (req.nextUrl.pathname.startsWith('/admin')) {
    if (!req.auth) {
      const loginUrl = new URL('/api/auth/signin', req.url)
      loginUrl.searchParams.set('callbackUrl', req.url)
      return NextResponse.redirect(loginUrl)
    }
    if (!isAdmin(email)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    return
  }

  // protect /stt — admin or ALLOWED_STT_EMAILS
  if (req.nextUrl.pathname === '/stt' || req.nextUrl.pathname.startsWith('/stt/')) {
    if (!req.auth) {
      const loginUrl = new URL('/api/auth/signin', req.url)
      loginUrl.searchParams.set('callbackUrl', req.url)
      return NextResponse.redirect(loginUrl)
    }
    if (!isSttAllowed(email)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    return
  }

  // protect /n8n-handbook — simple shared-password gate, not Google OAuth
  if (req.nextUrl.pathname === '/n8n-handbook' || req.nextUrl.pathname.startsWith('/n8n-handbook/')) {
    const token = req.cookies.get('n8n_handbook_auth')?.value
    if (!token || token !== process.env.N8N_HANDBOOK_PASSWORD) {
      const loginUrl = new URL('/n8n-handbook-login', req.url)
      loginUrl.searchParams.set('from', req.nextUrl.pathname)
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
  matcher: [
    '/admin/:path*',
    '/stt',
    '/stt/:path*',
    '/posts/:path*',
    '/n8n-handbook',
    '/n8n-handbook/:path*',
  ],
}
