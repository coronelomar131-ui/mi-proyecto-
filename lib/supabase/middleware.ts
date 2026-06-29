import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { type NextRequest, NextResponse } from 'next/server'

const envUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
const isStaleOrMissing = !envUrl || envUrl.includes('placeholder') || envUrl.includes('jwmoacsdenrzvhvgjpzq')

const SUPABASE_URL = isStaleOrMissing
  ? 'https://qnfjvtfzsqpyywkbdtny.supabase.co'
  : envUrl

const SUPABASE_ANON_KEY = isStaleOrMissing
  ? 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFuZmp2dGZ6c3FweXl3a2JkdG55Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY5MTM1NTMsImV4cCI6MjA5MjQ4OTU1M30.bidlvIkWpyCFZpd-jRZ2L-GwwnvxHGDFqVOSXL-t4tE'
  : (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '')

export function createMiddlewareClient(request: NextRequest) {
  let response = NextResponse.next({ request: { headers: request.headers } })

  const supabase = createServerClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options })
          response = NextResponse.next({ request: { headers: request.headers } })
          response.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: '', ...options })
          response = NextResponse.next({ request: { headers: request.headers } })
          response.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )

  return { supabase, response }
}
