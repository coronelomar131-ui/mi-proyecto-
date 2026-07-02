import { NextResponse, type NextRequest } from 'next/server'
import { createMiddlewareClient } from '@/lib/supabase/middleware'

const PUBLIC_ROUTES = ['/', '/login', '/register', '/forgot-password', '/reset-password', '/auth/callback', '/preview']
const AUTH_ROUTES = ['/login', '/register']

// Simple in-process rate limiter for Edge middleware (no Redis required).
// Resets every WINDOW_MS. Good enough for Vercel serverless (single-instance window).
const RATE_LIMIT_ROUTES = ['/api/cfdi', '/api/payments', '/api/whatsapp']
const WINDOW_MS = 60_000   // 1 minute
const MAX_REQUESTS = 20    // per IP per minute on sensitive routes

const hits = new Map<string, { count: number; reset: number }>()

function isRateLimited(ip: string, pathname: string): boolean {
  const isSensitive = RATE_LIMIT_ROUTES.some((r) => pathname.startsWith(r))
  if (!isSensitive) return false

  const now = Date.now()
  const key = `${ip}:${pathname.split('/').slice(0, 3).join('/')}`
  const entry = hits.get(key)

  if (!entry || now > entry.reset) {
    hits.set(key, { count: 1, reset: now + WINDOW_MS })
    return false
  }

  entry.count += 1
  if (entry.count > MAX_REQUESTS) return true
  return false
}

export async function middleware(request: NextRequest) {
  const { supabase, response } = createMiddlewareClient(request)

  const {
    data: { session },
  } = await supabase.auth.getSession()

  const pathname = request.nextUrl.pathname

  // Rate limiting
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    request.headers.get('x-real-ip') ??
    '127.0.0.1'

  if (isRateLimited(ip, pathname)) {
    return new NextResponse(
      JSON.stringify({ error: 'Demasiados intentos. Espera un momento e intenta de nuevo.' }),
      { status: 429, headers: { 'Content-Type': 'application/json', 'Retry-After': '60' } }
    )
  }

  const isPublicRoute = PUBLIC_ROUTES.some(
    (route) => pathname === route || pathname.startsWith('/auth/') || pathname.startsWith('/preview')
  )
  const isAuthRoute = AUTH_ROUTES.some((route) => pathname === route)

  if (!session && !isPublicRoute) {
    const redirectUrl = new URL('/login', request.url)
    redirectUrl.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(redirectUrl)
  }

  if (session && isAuthRoute) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
