import { createClient } from '@/lib/supabase/server'
import { formatCurrency, formatNumber } from '@/lib/utils/format'
import {
  TrendingUp,
  ShoppingCart,
  Users,
  Package,
  Truck,
  FileText,
  AlertTriangle,
  ArrowRight,
  TrendingDown,
  CheckCircle2,
} from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils/cn'
import { OnboardingChecklist } from '@/components/ui/onboarding-checklist'
import { SalesSparkline } from '@/components/ui/sales-sparkline'

async function getKPIs(orgId: string) {
  const supabase = createClient()
  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
  const yesterdayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1).toISOString()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

  const [salesToday, salesYesterday, salesMonth, customers, allProducts, pendingQuotes, deliveries] =
    await Promise.all([
      supabase.from('sales').select('total').eq('organization_id', orgId).gte('created_at', todayStart).neq('status', 'cancelada'),
      supabase.from('sales').select('total').eq('organization_id', orgId).gte('created_at', yesterdayStart).lt('created_at', todayStart).neq('status', 'cancelada'),
      supabase.from('sales').select('total').eq('organization_id', orgId).gte('created_at', startOfMonth).neq('status', 'cancelada'),
      supabase.from('customers').select('id', { count: 'exact' }).eq('organization_id', orgId).eq('is_active', true),
      supabase.from('products').select('id, name, sku, stock, min_stock').eq('organization_id', orgId).eq('is_active', true),
      supabase.from('quotes').select('id', { count: 'exact' }).eq('organization_id', orgId).in('status', ['borrador', 'enviada']),
      supabase.from('deliveries').select('id', { count: 'exact' }).eq('organization_id', orgId).in('status', ['pendiente', 'en_ruta']),
    ])

  const ventasHoy = salesToday.data?.reduce((s, r) => s + (r.total ?? 0), 0) ?? 0
  const ventasAyer = salesYesterday.data?.reduce((s, r) => s + (r.total ?? 0), 0) ?? 0
  const ventasMes = salesMonth.data?.reduce((s, r) => s + (r.total ?? 0), 0) ?? 0

  const lowStockProducts = (allProducts.data ?? []).filter((p) => p.stock <= p.min_stock)

  const changeHoy = ventasAyer > 0 ? ((ventasHoy - ventasAyer) / ventasAyer) * 100 : null

  return {
    ventasHoy,
    ventasAyer,
    changeHoy,
    ventasMes,
    clientesActivos: customers.count ?? 0,
    cotizacionesPendientes: pendingQuotes.count ?? 0,
    entregasActivas: deliveries.count ?? 0,
    lowStockProducts,
  }
}

async function getRecentActivity(orgId: string) {
  const supabase = createClient()
  const { data } = await supabase
    .from('sales')
    .select('id, folio, total, status, created_at, customer:customers(name)')
    .eq('organization_id', orgId)
    .order('created_at', { ascending: false })
    .limit(6)
  return data ?? []
}

const STATUS_COLOR: Record<string, string> = {
  pendiente: 'text-amber-400',
  confirmada: 'text-accent',
  entregada: 'text-emerald-400',
  cancelada: 'text-text-tertiary',
}

export default async function DashboardPage() {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('*, organizations(*)')
    .eq('id', session.user.id)
    .single()

  const orgId = profile?.organization_id ?? ''
  const [kpis, recentSales] = orgId
    ? await Promise.all([getKPIs(orgId), getRecentActivity(orgId)])
    : [null, []]

  const greeting = (() => {
    const h = new Date().getHours()
    return h < 12 ? 'Buenos días' : h < 18 ? 'Buenas tardes' : 'Buenas noches'
  })()

  const kpiCards = [
    {
      label: 'Ventas de hoy',
      value: formatCurrency(kpis?.ventasHoy ?? 0),
      sub: kpis?.changeHoy != null
        ? { text: `${kpis.changeHoy >= 0 ? '+' : ''}${kpis.changeHoy.toFixed(1)}% vs ayer`, up: kpis.changeHoy >= 0 }
        : { text: 'Sin ventas ayer', up: null },
      icon: ShoppingCart,
      color: 'text-accent',
      bg: 'bg-accent/10',
      href: '/dashboard/ventas',
    },
    {
      label: 'Ventas del mes',
      value: formatCurrency(kpis?.ventasMes ?? 0),
      sub: null,
      icon: TrendingUp,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10',
      href: '/dashboard/ventas',
    },
    {
      label: 'Clientes activos',
      value: formatNumber(kpis?.clientesActivos ?? 0),
      sub: null,
      icon: Users,
      color: 'text-blue-400',
      bg: 'bg-blue-500/10',
      href: '/dashboard/clientes',
    },
    {
      label: 'Entregas activas',
      value: formatNumber(kpis?.entregasActivas ?? 0),
      sub: null,
      icon: Truck,
      color: 'text-purple-400',
      bg: 'bg-purple-500/10',
      href: '/dashboard/entregas',
    },
    {
      label: 'Cotizaciones activas',
      value: formatNumber(kpis?.cotizacionesPendientes ?? 0),
      sub: null,
      icon: FileText,
      color: 'text-amber-400',
      bg: 'bg-amber-500/10',
      href: '/dashboard/cotizaciones',
    },
    {
      label: 'Productos stock bajo',
      value: formatNumber(kpis?.lowStockProducts.length ?? 0),
      sub: null,
      icon: AlertTriangle,
      color: 'text-red-400',
      bg: 'bg-red-500/10',
      href: '/dashboard/inventario',
    },
  ]

  const quickActions = [
    { label: 'Nueva venta', href: '/dashboard/ventas?new=1', icon: ShoppingCart, color: 'bg-accent/10 text-accent border-accent/20' },
    { label: 'Nueva cotización', href: '/dashboard/cotizaciones?new=1', icon: FileText, color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
    { label: 'Ver entregas', href: '/dashboard/entregas', icon: Truck, color: 'bg-purple-500/10 text-purple-400 border-purple-500/20' },
    { label: 'Ver inventario', href: '/dashboard/inventario', icon: Package, color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  ]

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-text-primary">
          {greeting}, {profile?.full_name?.split(' ')[0] ?? 'usuario'}
        </h1>
        <p className="text-text-tertiary text-sm mt-1">
          {new Date().toLocaleDateString('es-MX', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      <OnboardingChecklist />

      {/* KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {kpiCards.map((kpi) => (
          <Link key={kpi.label} href={kpi.href} className="kpi-card card-hover group">
            <div className="flex items-center justify-between">
              <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center', kpi.bg)}>
                <kpi.icon className={cn('w-4.5 h-4.5', kpi.color)} size={18} />
              </div>
            </div>
            <div>
              <p className="text-2xl font-bold text-text-primary">{kpi.value}</p>
              <p className="text-xs text-text-tertiary mt-0.5">{kpi.label}</p>
              {kpi.sub && (
                <p className={cn('text-2xs mt-1 flex items-center gap-0.5', kpi.sub.up === true ? 'text-emerald-400' : kpi.sub.up === false ? 'text-red-400' : 'text-text-tertiary')}>
                  {kpi.sub.up === true && <TrendingUp className="w-3 h-3" />}
                  {kpi.sub.up === false && <TrendingDown className="w-3 h-3" />}
                  {kpi.sub.text}
                </p>
              )}
            </div>
          </Link>
        ))}
      </div>

      {/* Quick actions */}
      <div className="mb-8">
        <h2 className="text-sm font-medium text-text-secondary mb-3">Acciones rápidas</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {quickActions.map((action) => (
            <Link
              key={action.label}
              href={action.href}
              className={cn('flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-medium transition-all duration-150 hover:opacity-90 hover:scale-[1.02]', action.color)}
            >
              <action.icon className="w-4 h-4 shrink-0" />
              {action.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Bottom section */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent sales + sparkline */}
        <div className="card p-5 space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-accent" />
              Ventas recientes
            </h3>
            <Link href="/dashboard/ventas" className="text-xs text-accent hover:text-accent-400 flex items-center gap-1">
              Ver todas <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {recentSales.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <ShoppingCart className="w-8 h-8 text-text-tertiary mb-2 opacity-30" />
              <p className="text-sm text-text-secondary">Aún no hay ventas</p>
              <Link href="/dashboard/ventas?new=1" className="text-xs text-accent mt-2">Crear primera venta</Link>
            </div>
          ) : (
            <div className="space-y-0">
              {recentSales.map((sale) => {
                const customerName = (sale.customer as unknown as { name: string })?.name ?? '—'
                return (
                  <div key={sale.id} className="flex items-center justify-between gap-3 py-2.5 border-b border-border/50 last:border-0">
                    <div className="min-w-0">
                      <p className="text-sm text-text-primary font-mono truncate">{sale.folio}</p>
                      <p className="text-xs text-text-tertiary mt-0.5">{customerName}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-semibold text-text-primary">{formatCurrency(sale.total)}</p>
                      <p className={cn('text-xs capitalize', STATUS_COLOR[sale.status as string] ?? 'text-text-tertiary')}>{sale.status}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          <SalesSparkline />
        </div>

        {/* Low stock alerts */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              Alertas de inventario
            </h3>
            {(kpis?.lowStockProducts.length ?? 0) > 0 && (
              <Link href="/dashboard/inventario" className="text-xs text-accent hover:text-accent-400 flex items-center gap-1">
                Ver todos <ArrowRight className="w-3 h-3" />
              </Link>
            )}
          </div>

          {(kpis?.lowStockProducts.length ?? 0) === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <CheckCircle2 className="w-8 h-8 text-emerald-400 mb-2 opacity-60" />
              <p className="text-sm text-text-secondary">Todo el inventario está bien surtido</p>
            </div>
          ) : (
            <div className="space-y-0">
              {kpis!.lowStockProducts.slice(0, 6).map((p) => (
                <div key={p.id} className="flex items-center justify-between gap-3 py-2.5 border-b border-border/50 last:border-0">
                  <div className="min-w-0">
                    <p className="text-sm text-text-primary truncate">{p.name}</p>
                    <p className="text-xs text-text-tertiary font-mono">{p.sku}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className={cn('text-sm font-semibold', p.stock === 0 ? 'text-red-400' : 'text-amber-400')}>
                      {p.stock === 0 ? 'Agotado' : `${p.stock} uds`}
                    </p>
                    <p className="text-2xs text-text-tertiary">mín {p.min_stock}</p>
                  </div>
                </div>
              ))}
              {kpis!.lowStockProducts.length > 6 && (
                <p className="text-xs text-text-tertiary pt-2">
                  +{kpis!.lowStockProducts.length - 6} más con stock bajo
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
