'use client'

import { UserProvider } from '@/lib/context/user-context'

export function DashboardClientWrapper({ children }: { children: React.ReactNode }) {
  return <UserProvider>{children}</UserProvider>
}
