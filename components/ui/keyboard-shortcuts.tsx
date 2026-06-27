'use client'

import { useState, useEffect } from 'react'
import { X, Keyboard } from 'lucide-react'

const SHORTCUTS = [
  { keys: ['⌘', 'K'], label: 'Abrir búsqueda global', group: 'Global' },
  { keys: ['?'], label: 'Mostrar atajos de teclado', group: 'Global' },
  { keys: ['Esc'], label: 'Cerrar modal / paleta', group: 'Global' },
  { keys: ['G', 'D'], label: 'Ir al Dashboard', group: 'Navegación' },
  { keys: ['G', 'V'], label: 'Ir a Ventas', group: 'Navegación' },
  { keys: ['G', 'C'], label: 'Ir a Clientes', group: 'Navegación' },
  { keys: ['G', 'I'], label: 'Ir a Inventario', group: 'Navegación' },
  { keys: ['↑', '↓'], label: 'Navegar en lista', group: 'Paleta de comandos' },
  { keys: ['↵'], label: 'Seleccionar opción', group: 'Paleta de comandos' },
]

const groups = Array.from(new Set(SHORTCUTS.map((s) => s.group)))

export function KeyboardShortcutsModal() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === '?' && !e.ctrlKey && !e.metaKey && !(e.target instanceof HTMLInputElement) && !(e.target instanceof HTMLTextAreaElement)) {
        setOpen((o) => !o)
      }
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)} />
      <div className="relative w-full max-w-md bg-surface-1 border border-border rounded-2xl shadow-modal animate-scale-in overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Keyboard className="w-4 h-4 text-accent" />
            <h2 className="font-semibold text-text-primary text-sm">Atajos de teclado</h2>
          </div>
          <button onClick={() => setOpen(false)} className="text-text-tertiary hover:text-text-secondary">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 space-y-5 max-h-[70vh] overflow-y-auto">
          {groups.map((group) => (
            <div key={group}>
              <p className="text-2xs font-semibold text-text-tertiary uppercase tracking-wider mb-2">{group}</p>
              <div className="space-y-1">
                {SHORTCUTS.filter((s) => s.group === group).map((shortcut, i) => (
                  <div key={i} className="flex items-center justify-between py-2">
                    <span className="text-sm text-text-secondary">{shortcut.label}</span>
                    <div className="flex items-center gap-1">
                      {shortcut.keys.map((k, ki) => (
                        <kbd key={ki} className="px-2 py-1 rounded-md border border-border bg-surface-2 text-xs text-text-tertiary font-mono">
                          {k}
                        </kbd>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="border-t border-border px-5 py-3">
          <p className="text-xs text-text-tertiary text-center">
            Presiona <kbd className="px-1.5 py-0.5 rounded border border-border bg-surface-2 text-2xs">?</kbd> en cualquier momento para ver esto
          </p>
        </div>
      </div>
    </div>
  )
}
