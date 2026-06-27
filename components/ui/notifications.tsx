'use client'

import { useState, useEffect, useRef } from 'react'
import { Bell, X, AlertTriangle, ShoppingCart, Truck, Package, CheckCircle } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { formatRelative } from '@/lib/utils/format'
import { createClient } from '@/lib/supabase/client'

type NotifType = 'venta' | 'entrega' | 'stock' | 'sistema'

interface Notification {
  id: string
  type: NotifType
  title: string
  body: string
  read: boolean
  created_at: string
}

const ICON_MAP: Record<NotifType, { icon: React.ElementType; color: string; bg: string }> = {
  venta: { icon: ShoppingCart, color: 'text-accent', bg: 'bg-accent/15' },
  entrega: { icon: Truck, color: 'text-purple-400', bg: 'bg-purple-500/15' },
  stock: { icon: AlertTriangle, color: 'text-amber-400', bg: 'bg-amber-500/15' },
  sistema: { icon: CheckCircle, color: 'text-emerald-400', bg: 'bg-emerald-500/15' },
}

const DEMO_NOTIFICATIONS: Notification[] = [
  { id: '1', type: 'venta', title: 'Nueva venta registrada', body: 'Comercial López · $4,820 MXN', read: false, created_at: new Date(Date.now() - 5 * 60 * 1000).toISOString() },
  { id: '2', type: 'entrega', title: 'Entrega completada', body: 'Folio ENT-00038 · Repartidor: Marco A.', read: false, created_at: new Date(Date.now() - 18 * 60 * 1000).toISOString() },
  { id: '3', type: 'stock', title: 'Stock bajo: Aceite 5W30', body: 'Solo quedan 3 unidades disponibles', read: false, created_at: new Date(Date.now() - 45 * 60 * 1000).toISOString() },
  { id: '4', type: 'venta', title: 'Cotización aceptada', body: 'Distribuidora Morales · $12,400 MXN', read: true, created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() },
  { id: '5', type: 'sistema', title: 'Bienvenido a GestorPro', body: 'Tu empresa está configurada y lista para operar', read: true, created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() },
]

export function NotificationBell() {
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>(DEMO_NOTIFICATIONS)
  const ref = useRef<HTMLDivElement>(null)

  const unreadCount = notifications.filter((n) => !n.read).length

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
  }

  const markRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n))
  }

  const dismiss = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id))
  }

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
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
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-text-primary">Notificaciones</h3>
              {unreadCount > 0 && (
                <span className="badge-accent text-2xs px-1.5">{unreadCount}</span>
              )}
            </div>
            {unreadCount > 0 && (
              <button onClick={markAllRead} className="text-xs text-accent hover:text-accent-400 transition-colors">
                Marcar todas leídas
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-[360px] overflow-y-auto divide-y divide-border/50">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center py-10 text-text-tertiary text-sm">
                <Bell className="w-6 h-6 mb-2 opacity-40" />
                Sin notificaciones
              </div>
            ) : (
              notifications.map((notif) => {
                const config = ICON_MAP[notif.type]
                return (
                  <div
                    key={notif.id}
                    onClick={() => markRead(notif.id)}
                    className={cn(
                      'flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors hover:bg-surface-2/50 group',
                      !notif.read && 'bg-accent/3'
                    )}
                  >
                    <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5', config.bg)}>
                      <config.icon className={cn('w-3.5 h-3.5', config.color)} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={cn('text-xs font-medium leading-snug', notif.read ? 'text-text-secondary' : 'text-text-primary')}>
                          {notif.title}
                        </p>
                        <button
                          onClick={(e) => { e.stopPropagation(); dismiss(notif.id) }}
                          className="opacity-0 group-hover:opacity-100 text-text-tertiary hover:text-text-secondary transition-all shrink-0 mt-0.5"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                      <p className="text-2xs text-text-tertiary mt-0.5 truncate">{notif.body}</p>
                      <p className="text-2xs text-text-tertiary mt-1">{formatRelative(notif.created_at)}</p>
                    </div>
                    {!notif.read && (
                      <div className="w-1.5 h-1.5 rounded-full bg-accent shrink-0 mt-2" />
                    )}
                  </div>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}
