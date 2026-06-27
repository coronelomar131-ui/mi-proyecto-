'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Bell, X, AlertTriangle, ShoppingCart, Truck, Package, FileText } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { formatCurrency, formatRelative } from '@/lib/utils/format'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

interface Notification {
  id: string
  type: 'venta' | 'entrega' | 'stock' | 'cotizacion'
  title: string
  body: string
  href: string
  created_at: string
}

const ICON_MAP = {
  venta: { icon: ShoppingCart, color: 'text-accent', bg: 'bg-accent/15' },
  entrega: { icon: Truck, color: 'text-purple-400', bg: 'bg-purple-500/15' },
  stock: { icon: AlertTriangle, color: 'text-amber-400', bg: 'bg-amber-500/15' },
  cotizacion: { icon: FileText, color: 'text-blue-400', bg: 'bg-blue-500/15' },
}

export function NotificationBell() {
  const supabase = createClient()
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [dismissed, setDismissed] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const fetchNotifications = useCallback(async () => {
    setLoading(true)
    const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    const since1h = new Date(Date.now() - 60 * 60 * 1000).toISOString()

    const [
      { data: recentSales },
      { data: pendingDeliveries },
      { data: lowStock },
      { data: pendingQuotes },
    ] = await Promise.all([
      supabase.from('sales').select('id, folio, total, created_at, customer:customers(name)').gte('created_at', since1h).order('created_at', { ascending: false }).limit(5),
      supabase.from('deliveries').select('id, address, created_at, sale:sales(folio)').in('status', ['pendiente', 'en_ruta']).gte('created_at', since24h).limit(3),
      supabase.from('products').select('id, name, stock, min_stock').lte('stock', 5).eq('is_active', true).limit(5),
      supabase.from('quotes').select('id, folio, created_at, customer:customers(name)').in('status', ['borrador', 'enviada']).gte('created_at', since24h).limit(3),
    ])

    const notifs: Notification[] = []

    recentSales?.forEach((s) => {
      const customer = (s.customer as unknown as { name: string })?.name ?? 'Cliente'
      notifs.push({
        id: `sale-${s.id}`,
        type: 'venta',
        title: 'Nueva venta',
        body: `${customer} · ${formatCurrency(s.total ?? 0)}`,
        href: '/dashboard/ventas',
        created_at: s.created_at,
      })
    })

    pendingDeliveries?.forEach((d) => {
      const folio = (d.sale as unknown as { folio: string })?.folio ?? 'Entrega'
      notifs.push({
        id: `delivery-${d.id}`,
        type: 'entrega',
        title: 'Entrega pendiente',
        body: `${folio} · ${d.address ?? '—'}`,
        href: '/dashboard/entregas',
        created_at: d.created_at,
      })
    })

    lowStock?.forEach((p) => {
      notifs.push({
        id: `stock-${p.id}`,
        type: 'stock',
        title: p.stock === 0 ? 'Producto agotado' : 'Stock bajo',
        body: `${p.name} · ${p.stock === 0 ? 'Sin existencia' : `${p.stock} unidades`}`,
        href: '/dashboard/inventario',
        created_at: new Date().toISOString(),
      })
    })

    pendingQuotes?.forEach((q) => {
      const customer = (q.customer as unknown as { name: string })?.name ?? 'Cliente'
      notifs.push({
        id: `quote-${q.id}`,
        type: 'cotizacion',
        title: 'Cotización activa',
        body: `${q.folio} · ${customer}`,
        href: '/dashboard/cotizaciones',
        created_at: q.created_at,
      })
    })

    notifs.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    setNotifications(notifs)
    setLoading(false)
  }, [])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleOpen = () => {
    if (!open) fetchNotifications()
    setOpen(!open)
  }

  const visible = notifications.filter((n) => !dismissed.has(n.id))
  const unreadCount = visible.length

  return (
    <div ref={ref} className="relative">
      <button
        onClick={handleOpen}
        className={cn(
          'relative w-9 h-9 rounded-xl flex items-center justify-center transition-colors',
          open ? 'bg-surface-3' : 'hover:bg-surface-2'
        )}
      >
        <Bell className="w-4 h-4 text-text-secondary" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-accent rounded-full ring-2 ring-surface-1 animate-pulse-slow" />
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-11 w-80 bg-surface-1 border border-border rounded-2xl shadow-modal animate-scale-in z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-text-primary">Notificaciones</h3>
              {unreadCount > 0 && (
                <span className="badge badge-accent text-2xs px-1.5">{unreadCount}</span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={() => setDismissed(new Set<string>(notifications.map((n) => n.id)))}
                className="text-xs text-accent hover:text-accent-400 transition-colors"
              >
                Limpiar
              </button>
            )}
          </div>

          <div className="max-h-[360px] overflow-y-auto divide-y divide-border/50">
            {loading ? (
              <div className="flex items-center justify-center py-10">
                <span className="w-5 h-5 border-2 border-border border-t-accent rounded-full animate-spin" />
              </div>
            ) : visible.length === 0 ? (
              <div className="flex flex-col items-center py-10 text-text-tertiary text-sm">
                <Bell className="w-6 h-6 mb-2 opacity-40" />
                <p>Sin notificaciones nuevas</p>
                <p className="text-xs mt-1 text-text-tertiary">Última hora sin actividad</p>
              </div>
            ) : (
              visible.map((notif) => {
                const config = ICON_MAP[notif.type]
                return (
                  <Link
                    key={notif.id}
                    href={notif.href}
                    onClick={() => setOpen(false)}
                    className="flex items-start gap-3 px-4 py-3 transition-colors hover:bg-surface-2/50 group"
                  >
                    <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5', config.bg)}>
                      <config.icon className={cn('w-3.5 h-3.5', config.color)} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-xs font-medium text-text-primary leading-snug">{notif.title}</p>
                        <button
                          onClick={(e) => { e.preventDefault(); e.stopPropagation(); setDismissed((prev) => new Set(Array.from(prev).concat(notif.id))) }}
                          className="opacity-0 group-hover:opacity-100 text-text-tertiary hover:text-text-secondary transition-all shrink-0 mt-0.5"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                      <p className="text-2xs text-text-tertiary mt-0.5 truncate">{notif.body}</p>
                      <p className="text-2xs text-text-tertiary mt-1">{formatRelative(notif.created_at)}</p>
                    </div>
                  </Link>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}
