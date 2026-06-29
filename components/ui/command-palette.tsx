'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  Search, LayoutDashboard, ShoppingCart, Users, Package,
  FileText, Truck, DollarSign, Factory, BarChart3, UserCog,
  Settings, X, ArrowRight, Hash, TrendingUp,
} from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency } from '@/lib/utils/format'

const COMMANDS = [
  { id: 'dashboard', label: 'Ir al Dashboard', icon: LayoutDashboard, href: '/dashboard', group: 'Navegación', shortcut: 'G D' },
  { id: 'ventas', label: 'Ir a Ventas', icon: ShoppingCart, href: '/dashboard/ventas', group: 'Navegación', shortcut: 'G V' },
  { id: 'clientes', label: 'Ir a Clientes', icon: Users, href: '/dashboard/clientes', group: 'Navegación', shortcut: 'G C' },
  { id: 'inventario', label: 'Ir a Inventario', icon: Package, href: '/dashboard/inventario', group: 'Navegación', shortcut: 'G I' },
  { id: 'cotizaciones', label: 'Ir a Cotizaciones', icon: FileText, href: '/dashboard/cotizaciones', group: 'Navegación' },
  { id: 'entregas', label: 'Ir a Entregas', icon: Truck, href: '/dashboard/entregas', group: 'Navegación' },
  { id: 'finanzas', label: 'Ir a Finanzas', icon: DollarSign, href: '/dashboard/finanzas', group: 'Navegación' },
  { id: 'proveedores', label: 'Ir a Proveedores', icon: Factory, href: '/dashboard/proveedores', group: 'Navegación' },
  { id: 'reportes', label: 'Ir a Reportes', icon: BarChart3, href: '/dashboard/reportes', group: 'Navegación' },
  { id: 'usuarios', label: 'Ir a Usuarios', icon: UserCog, href: '/dashboard/usuarios', group: 'Navegación' },
  { id: 'configuracion', label: 'Ir a Configuración', icon: Settings, href: '/dashboard/configuracion', group: 'Navegación' },
  { id: 'nueva-venta', label: 'Nueva venta', icon: ShoppingCart, href: '/dashboard/ventas?new=1', group: 'Acciones rápidas', accent: true },
  { id: 'nuevo-cliente', label: 'Nuevo cliente', icon: Users, href: '/dashboard/clientes?new=1', group: 'Acciones rápidas', accent: true },
  { id: 'nueva-cot', label: 'Nueva cotización', icon: FileText, href: '/dashboard/cotizaciones?new=1', group: 'Acciones rápidas', accent: true },
  { id: 'nuevo-producto', label: 'Nuevo producto', icon: Package, href: '/dashboard/inventario?new=1', group: 'Acciones rápidas', accent: true },
]

interface SearchResult {
  id: string
  label: string
  sub: string
  icon: React.ElementType
  href: string
  group: string
}

interface CommandPaletteProps {
  open: boolean
  onClose: () => void
}

export function CommandPalette({ open, onClose }: CommandPaletteProps) {
  const router = useRouter()
  const supabase = createClient()
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState(0)
  const [liveResults, setLiveResults] = useState<SearchResult[]>([])
  const [searching, setSearching] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const staticFiltered = query.trim()
    ? COMMANDS.filter(
        (c) =>
          c.label.toLowerCase().includes(query.toLowerCase()) ||
          c.group.toLowerCase().includes(query.toLowerCase())
      )
    : COMMANDS

  const allResults: ({ type: 'static'; item: (typeof COMMANDS)[0] } | { type: 'live'; item: SearchResult })[] = [
    ...staticFiltered.map((item) => ({ type: 'static' as const, item })),
    ...liveResults.map((item) => ({ type: 'live' as const, item })),
  ]

  const execute = useCallback(
    (href: string) => {
      router.push(href)
      onClose()
      setQuery('')
    },
    [router, onClose]
  )

  const doSearch = useCallback(async (q: string) => {
    if (q.length < 2) { setLiveResults([]); return }
    setSearching(true)
    const term = `%${q}%`
    const [{ data: customers }, { data: products }, { data: sales }] = await Promise.all([
      supabase.from('customers').select('id, name, city').ilike('name', term).limit(3),
      supabase.from('products').select('id, name, sku, sale_price').ilike('name', term).limit(3),
      supabase.from('sales').select('id, folio, total').ilike('folio', term).limit(2),
    ])

    const results: SearchResult[] = []
    customers?.forEach((c) => results.push({
      id: `c-${c.id}`, label: c.name, sub: c.city ?? 'Cliente',
      icon: Users, href: '/dashboard/clientes', group: 'Clientes',
    }))
    products?.forEach((p) => results.push({
      id: `p-${p.id}`, label: p.name, sub: `${p.sku} · ${formatCurrency(p.sale_price)}`,
      icon: Package, href: '/dashboard/inventario', group: 'Productos',
    }))
    sales?.forEach((s) => results.push({
      id: `s-${s.id}`, label: s.folio, sub: formatCurrency(s.total),
      icon: TrendingUp, href: '/dashboard/ventas', group: 'Ventas',
    }))
    setLiveResults(results)
    setSearching(false)
  }, [])

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => doSearch(query), 250)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [query, doSearch])

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50)
      setSelected(0)
      setQuery('')
      setLiveResults([])
    }
  }, [open])

  useEffect(() => {
    const el = listRef.current?.querySelector(`[data-idx="${selected}"]`)
    el?.scrollIntoView({ block: 'nearest' })
  }, [selected])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!open) return
      if (e.key === 'ArrowDown') { e.preventDefault(); setSelected((s) => Math.min(s + 1, allResults.length - 1)) }
      if (e.key === 'ArrowUp') { e.preventDefault(); setSelected((s) => Math.max(s - 1, 0)) }
      if (e.key === 'Enter') {
        e.preventDefault()
        const r = allResults[selected]
        if (r) execute(r.type === 'static' ? r.item.href : r.item.href)
      }
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, allResults, selected, execute, onClose])

  if (!open) return null

  const staticGroups = Array.from(new Set(staticFiltered.map((c) => c.group)))
  const liveGroups = Array.from(new Set(liveResults.map((r) => r.group)))

  let itemIdx = -1

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] px-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-lg bg-surface-1 border border-border rounded-2xl shadow-modal overflow-hidden animate-scale-in">
        {/* Input */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-border">
          <Search className={cn('w-4 h-4 shrink-0', searching ? 'text-accent animate-pulse' : 'text-text-tertiary')} />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setSelected(0) }}
            placeholder="Buscar páginas, clientes, productos..."
            className="flex-1 bg-transparent text-text-primary placeholder:text-text-tertiary text-sm outline-none"
          />
          {query && (
            <button onClick={() => { setQuery(''); setLiveResults([]) }} className="text-text-tertiary hover:text-text-secondary">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <kbd className="hidden sm:flex items-center gap-1 px-1.5 py-0.5 rounded border border-border bg-surface-2 text-text-tertiary text-2xs">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div ref={listRef} className="max-h-[400px] overflow-y-auto py-2">
          {allResults.length === 0 ? (
            <div className="flex flex-col items-center py-10 text-text-tertiary text-sm">
              <Hash className="w-6 h-6 mb-2 opacity-50" />
              {query.length >= 2 ? `Sin resultados para "${query}"` : 'Escribe para buscar...'}
            </div>
          ) : (
            <>
              {/* Static commands */}
              {staticGroups.map((group) => {
                const groupItems = staticFiltered.filter((c) => c.group === group)
                return (
                  <div key={group}>
                    <p className="px-4 py-1.5 text-2xs font-semibold text-text-tertiary uppercase tracking-wider">{group}</p>
                    {groupItems.map((cmd) => {
                      itemIdx++
                      const idx = itemIdx
                      const isActive = selected === idx
                      return (
                        <button
                          key={cmd.id}
                          data-idx={idx}
                          onClick={() => execute(cmd.href)}
                          onMouseEnter={() => setSelected(idx)}
                          className={cn('w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors', isActive ? 'bg-surface-2' : 'hover:bg-surface-2/50')}
                        >
                          <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center shrink-0', cmd.accent ? 'bg-accent/15' : 'bg-surface-3')}>
                            <cmd.icon className={cn('w-3.5 h-3.5', cmd.accent ? 'text-accent' : 'text-text-tertiary')} />
                          </div>
                          <span className={cn('flex-1 text-sm', isActive ? 'text-text-primary' : 'text-text-secondary')}>{cmd.label}</span>
                          {cmd.shortcut && (
                            <div className="hidden sm:flex items-center gap-1">
                              {cmd.shortcut.split(' ').map((k, i) => (
                                <kbd key={i} className="px-1.5 py-0.5 rounded border border-border bg-surface-3 text-text-tertiary text-2xs">{k}</kbd>
                              ))}
                            </div>
                          )}
                          {isActive && <ArrowRight className="w-3.5 h-3.5 text-text-tertiary" />}
                        </button>
                      )
                    })}
                  </div>
                )
              })}

              {/* Live search results */}
              {liveGroups.map((group) => {
                const groupItems = liveResults.filter((r) => r.group === group)
                return (
                  <div key={group}>
                    <p className="px-4 py-1.5 text-2xs font-semibold text-accent uppercase tracking-wider">{group}</p>
                    {groupItems.map((result) => {
                      itemIdx++
                      const idx = itemIdx
                      const isActive = selected === idx
                      return (
                        <button
                          key={result.id}
                          data-idx={idx}
                          onClick={() => execute(result.href)}
                          onMouseEnter={() => setSelected(idx)}
                          className={cn('w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors', isActive ? 'bg-surface-2' : 'hover:bg-surface-2/50')}
                        >
                          <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 bg-accent/10">
                            <result.icon className="w-3.5 h-3.5 text-accent" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={cn('text-sm truncate', isActive ? 'text-text-primary' : 'text-text-secondary')}>{result.label}</p>
                            <p className="text-2xs text-text-tertiary truncate">{result.sub}</p>
                          </div>
                          {isActive && <ArrowRight className="w-3.5 h-3.5 text-text-tertiary shrink-0" />}
                        </button>
                      )
                    })}
                  </div>
                )
              })}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-border px-4 py-2.5 flex items-center gap-4 text-2xs text-text-tertiary">
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 rounded border border-border bg-surface-2">↑↓</kbd> navegar
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 rounded border border-border bg-surface-2">↵</kbd> abrir
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 rounded border border-border bg-surface-2">ESC</kbd> cerrar
          </span>
        </div>
      </div>
    </div>
  )
}
