import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Sidebar } from '@/components/layout/sidebar'
import { DashboardHeader } from '@/components/layout/dashboard-header'
import { MobileBottomNav } from '@/components/layout/mobile-bottom-nav'
import { KeyboardShortcutsModal } from '@/components/ui/keyboard-shortcuts'
import type { Profile } from '@/types'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient()

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*, organizations(name, plan)')
    .eq('id', session.user.id)
    .single()

  return (
    <div className="min-h-screen bg-surface-0">
      <Sidebar profile={profile as Profile | null} />
      <main className="lg:pl-56 min-h-screen">
        <div className="p-4 sm:p-6 lg:p-8 pt-16 lg:pt-8 max-w-7xl mx-auto">
          <DashboardHeader />
          {children}
        </div>
      </main>
      <MobileBottomNav />
      <KeyboardShortcutsModal />
    </div>
  )
}
