'use client'

import { useEffect, useState } from 'react'
import { Search } from 'lucide-react'
import { NotificationBell } from '@/components/ui/notifications'
import { CommandPalette } from '@/components/ui/command-palette'
import { cn } from '@/lib/utils/cn'

interface DashboardHeaderProps {
  title?: string
}

export function DashboardHeader({ title }: DashboardHeaderProps) {
  const [cmdOpen, setCmdOpen] = useState(false)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setCmdOpen(true)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  return (
    <>
      <header className="hidden lg:flex items-center justify-between mb-8">
        {title && <h1 className="text-xl font-semibold text-text-primary">{title}</h1>}

        <div className="flex items-center gap-3 ml-auto">
          {/* Search trigger */}
          <button
            onClick={() => setCmdOpen(true)}
            className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-surface-2 border border-border hover:border-border-strong transition-colors group"
          >
            <Search className="w-3.5 h-3.5 text-text-tertiary" />
            <span className="text-sm text-text-tertiary">Buscar...</span>
            <div className="hidden sm:flex items-center gap-0.5 ml-8">
              <kbd className="px-1.5 py-0.5 rounded border border-border bg-surface-3 text-2xs text-text-tertiary">⌘</kbd>
              <kbd className="px-1.5 py-0.5 rounded border border-border bg-surface-3 text-2xs text-text-tertiary">K</kbd>
            </div>
          </button>

          <NotificationBell />
        </div>
      </header>

      {/* Mobile search bar */}
      <div className="lg:hidden flex items-center gap-2 mb-5">
        <button
          onClick={() => setCmdOpen(true)}
          className="flex-1 flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-surface-2 border border-border text-left"
        >
          <Search className="w-3.5 h-3.5 text-text-tertiary" />
          <span className="text-sm text-text-tertiary">Buscar...</span>
        </button>
        <NotificationBell />
      </div>

      <CommandPalette open={cmdOpen} onClose={() => setCmdOpen(false)} />
    </>
  )
}
