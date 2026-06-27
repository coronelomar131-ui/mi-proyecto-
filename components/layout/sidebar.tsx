'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard,
  ShoppingCart,
  Users,
  Package,
  FileText,
  Truck,
  DollarSign,
  Factory,
  BarChart3,
  UserCog,
  Settings,
  TrendingUp,
  LogOut,
  ChevronRight,
  Menu,
  X,
  Monitor,
} from 'lucide-react'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'
import { cn } from '@/lib/utils/cn'
import type { Profile } from '@/types'

const navItems = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, roles: ['admin', 'vendedor', 'almacen'] },
  { label: 'Punto de Venta', href: '/dashboard/pos', icon: Monitor, roles: ['admin', 'vendedor'] },
  { label: 'Ventas', href: '/dashboard/ventas', icon: ShoppingCart, roles: ['admin', 'vendedor'] },
  { label: 'Clientes', href: '/dashboard/clientes', icon: Users, roles: ['admin', 'vendedor'] },
  { label: 'Inventario', href: '/dashboard/inventario', icon: Package, roles: ['admin', 'almacen'] },
  { label: 'Cotizaciones', href: '/dashboard/cotizaciones', icon: FileText, roles: ['admin', 'vendedor'] },
  { label: 'Entregas', href: '/dashboard/entregas', icon: Truck, roles: ['admin', 'vendedor', 'almacen'] },
  { label: 'Finanzas', href: '/dashboard/finanzas', icon: DollarSign, roles: ['admin'] },
  { label: 'Proveedores', href: '/dashboard/proveedores', icon: Factory, roles: ['admin', 'almacen'] },
  { label: 'Reportes', href: '/dashboard/reportes', icon: BarChart3, roles: ['admin'] },
  { label: 'Usuarios', href: '/dashboard/usuarios', icon: UserCog, roles: ['admin'] },
  { label: 'Configuración', href: '/dashboard/configuracion', icon: Settings, roles: ['admin'] },
]

interface SidebarProps {
  profile: Profile | null
}

export function Sidebar({ profile }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)

  const userRole = profile?.role ?? 'vendedor'
  const visibleItems = navItems.filter(
    (item) => !item.roles || item.roles.includes(userRole)
  )

  const handleLogout = async () => {
    setLoggingOut(true)
    await supabase.auth.signOut()
    toast.success('Sesión cerrada')
    router.push('/login')
    router.refresh()
  }

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-4 py-5 border-b border-border">
        <Link href="/dashboard" className="flex items-center gap-2.5" onClick={() => setMobileOpen(false)}>
          <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center shadow-glow-accent">
            <TrendingUp className="w-4 h-4 text-surface-0" strokeWidth={2.5} />
          </div>
          <div>
            <p className="text-sm font-semibold text-text-primary leading-none">GestorPro</p>
            <p className="text-2xs text-text-tertiary mt-0.5 truncate max-w-[120px]">
              {profile?.organizations?.name ?? (profile?.organization_id ? 'Mi empresa' : 'Demo')}
            </p>
          </div>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {visibleItems.map((item) => {
          const isActive = pathname === item.href ||
            (item.href !== '/dashboard' && pathname.startsWith(item.href))

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={cn('nav-item', isActive && 'nav-item-active')}
            >
              <item.icon className={cn('w-4 h-4 shrink-0', isActive ? 'text-accent' : 'text-text-tertiary')} />
              <span className="truncate">{item.label}</span>
              {isActive && <ChevronRight className="w-3 h-3 ml-auto text-text-tertiary" />}
            </Link>
          )
        })}
      </nav>

      {/* User */}
      <div className="px-3 pb-4 pt-2 border-t border-border space-y-1">
        <div className="flex items-center gap-3 px-3 py-2 rounded-lg">
          <div className="w-8 h-8 rounded-full bg-accent/20 border border-accent/30 flex items-center justify-center text-xs font-semibold text-accent shrink-0">
            {profile?.full_name?.slice(0, 2).toUpperCase() ?? 'U'}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-text-primary truncate">{profile?.full_name ?? 'Usuario'}</p>
            <p className="text-2xs text-text-tertiary truncate">{profile?.email ?? ''}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          disabled={loggingOut}
          className="nav-item w-full text-red-400 hover:text-red-300 hover:bg-red-500/10"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          {loggingOut ? 'Cerrando sesión...' : 'Cerrar sesión'}
        </button>
      </div>
    </div>
  )

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-40 w-10 h-10 flex items-center justify-center rounded-xl bg-surface-2 border border-border shadow-card"
      >
        <Menu className="w-4 h-4 text-text-secondary" />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/70 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      <aside
        className={cn(
          'lg:hidden fixed left-0 top-0 bottom-0 z-50 w-64 bg-surface-1 border-r border-border shadow-modal transition-transform duration-300',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <button
          onClick={() => setMobileOpen(false)}
          className="absolute top-4 right-4 w-7 h-7 flex items-center justify-center rounded-lg hover:bg-surface-2"
        >
          <X className="w-4 h-4 text-text-tertiary" />
        </button>
        <SidebarContent />
      </aside>

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex fixed left-0 top-0 bottom-0 w-56 flex-col bg-surface-1 border-r border-border z-30">
        <SidebarContent />
      </aside>
    </>
  )
}
