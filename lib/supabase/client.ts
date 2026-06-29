'use client'

import { createBrowserClient } from '@supabase/ssr'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL && !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder') && !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('jwmoacsdenrzvhvgjpzq')
  ? process.env.NEXT_PUBLIC_SUPABASE_URL
  : 'https://qnfjvtfzsqpyywkbdtny.supabase.co'

const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY && !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.includes('placeholder') && !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.includes('jwmoacsdenrzvhvgjpzq')
  ? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  : 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFuZmp2dGZ6c3FweXl3a2JkdG55Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY5MTM1NTMsImV4cCI6MjA5MjQ4OTU1M30.bidlvIkWpyCFZpd-jRZ2L-GwwnvxHGDFqVOSXL-t4tE'

export function createClient() {
  return createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY)
}
