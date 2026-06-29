import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

const envUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
const isStaleOrMissing = !envUrl || envUrl.includes('placeholder') || envUrl.includes('jwmoacsdenrzvhvgjpzq')

const SUPABASE_URL = isStaleOrMissing
  ? 'https://qnfjvtfzsqpyywkbdtny.supabase.co'
  : envUrl

const SUPABASE_ANON_KEY = isStaleOrMissing
  ? 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFuZmp2dGZ6c3FweXl3a2JkdG55Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY5MTM1NTMsImV4cCI6MjA5MjQ4OTU1M30.bidlvIkWpyCFZpd-jRZ2L-GwwnvxHGDFqVOSXL-t4tE'
  : (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '')

export function createClient() {
  const cookieStore = cookies()

  return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value
      },
      set(name: string, value: string, options: CookieOptions) {
        try {
          cookieStore.set({ name, value, ...options })
        } catch {}
      },
      remove(name: string, options: CookieOptions) {
        try {
          cookieStore.set({ name, value: '', ...options })
        } catch {}
      },
    },
  })
}
