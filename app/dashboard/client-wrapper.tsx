'use client'

import { UserProvider } from '@/lib/context/user-context'
import { ThemeProvider } from '@/lib/context/theme-context'

export function DashboardClientWrapper({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <UserProvider>{children}</UserProvider>
    </ThemeProvider>
  )
}
