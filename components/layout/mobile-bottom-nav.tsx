'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, ShoppingCart, Package, Truck, MoreHorizontal } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { useState } from 'react'

const PRIMARY_NAV = [
  { label: 'Inicio', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Ventas', href: '/dashboard/ventas', icon: ShoppingCart },
  { label: 'Inventario', href: '/dashboard/inventario', icon: Package },
  { label: 'Entregas', href: '/dashboard/entregas', icon: Truck },
]

const MORE_NAV = [
  { label: 'Clientes', href: '/dashboard/clientes' },
  { label: 'Cotizaciones', href: '/dashboard/cotizaciones' },
  { label: 'Finanzas', href: '/dashboard/finanzas' },
  { label: 'Proveedores', href: '/dashboard/proveedores' },
  { label: 'Reportes', href: '/dashboard/reportes' },
  { label: 'Usuarios', href: '/dashboard/usuarios' },
  { label: 'Configuración', href: '/dashboard/configuracion' },
]

export function MobileBottomNav() {
  const pathname = usePathname()
  const [showMore, setShowMore] = useState(false)

  return (
    <>
      {showMore && (
        <div className="lg:hidden fixed inset-0 z-40" onClick={() => setShowMore(false)}>
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          <div className="absolute bottom-20 left-4 right-4 bg-surface-1 border border-border rounded-2xl shadow-modal overflow-hidden animate-slide-up">
            {MORE_NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setShowMore(false)}
                className={cn(
                  'flex items-center px-4 py-3.5 text-sm border-b border-border/50 last:border-0 transition-colors',
                  pathname === item.href
                    ? 'text-accent font-medium bg-accent/5'
                    : 'text-text-secondary hover:text-text-primary hover:bg-surface-2'
                )}
              >
                {item.label}
                {pathname === item.href && <span className="ml-auto w-1.5 h-1.5 bg-accent rounded-full" />}
              </Link>
            ))}
          </div>
        </div>
      )}

      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-30 bg-surface-1/95 backdrop-blur-md border-t border-border">
        <div className="flex items-center">
          {PRIMARY_NAV.map((item) => {
            const isActive = pathname === item.href ||
              (item.href !== '/dashboard' && pathname.startsWith(item.href))
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex-1 flex flex-col items-center gap-1 py-3 transition-colors',
                  isActive ? 'text-accent' : 'text-text-tertiary hover:text-text-secondary'
                )}
              >
                <item.icon className="w-5 h-5" />
                <span className="text-2xs font-medium">{item.label}</span>
                {isActive && <span className="absolute bottom-0 w-5 h-0.5 bg-accent rounded-full" />}
              </Link>
            )
          })}
          <button
            onClick={() => setShowMore(!showMore)}
            className={cn(
              'flex-1 flex flex-col items-center gap-1 py-3 transition-colors',
              showMore ? 'text-accent' : 'text-text-tertiary hover:text-text-secondary'
            )}
          >
            <MoreHorizontal className="w-5 h-5" />
            <span className="text-2xs font-medium">Más</span>
          </button>
        </div>
        <div className="h-safe-bottom" style={{ height: 'env(safe-area-inset-bottom)' }} />
      </nav>

      <div className="lg:hidden h-16" />
    </>
  )
}
