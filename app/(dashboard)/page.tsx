import { createClient } from '@/lib/supabase/server'
import { formatCurrency, formatNumber, formatRelative } from '@/lib/utils/format'
import {
  TrendingUp,
  ShoppingCart,
  Users,
  Package,
  Truck,
  FileText,
  AlertTriangle,
  ArrowRight,
} from 'lucide-react'
import Link from 'next/link'
import { OnboardingChecklist } from '@/components/ui/onboarding-checklist'

async function getKPIs(orgId: string) {
  const supabase = createClient()
  const today = new Date().toISOString().split('T')[0]
  const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()

  const [salesToday, salesMonth, customers, lowStock, pendingQuotes, deliveriesToday] =
    await Promise.all([
      supabase
        .from('sales')
        .select('total')
        .eq('organization_id', orgId)
        .gte('created_at', today)
        .neq('status', 'cancelada'),
      supabase
        .from('sales')
        .select('total')
        .eq('organization_id', orgId)
        .gte('created_at', startOfMonth)
        .neq('status', 'cancelada'),
      supabase
        .from('customers')
        .select('id', { count: 'exact' })
        .eq('organization_id', orgId)
        .eq('is_active', true),
      supabase
        .from('products')
        .select('id', { count: 'exact' })
        .eq('organization_id', orgId)
        .eq('is_active', true)
        .filter('stock', 'lte', 'min_stock'),
      supabase
        .from('quotes')
        .select('id', { count: 'exact' })
        .eq('organization_id', orgId)
        .in('status', ['borrador', 'enviada']),
      supabase
        .from('deliveries')
        .select('id', { count: 'exact' })
        .eq('organization_id', orgId)
        .in('status', ['pendiente', 'en_ruta'])
        .gte('scheduled_date', today),
    ])

  return {
    ventasHoy: salesToday.data?.reduce((sum, s) => sum + (s.total ?? 0), 0) ?? 0,
    ventasMes: salesMonth.data?.reduce((sum, s) => sum + (s.total ?? 0), 0) ?? 0,
    clientesActivos: customers.count ?? 0,
    stockBajo: lowStock.count ?? 0,
    cotizacionesPendientes: pendingQuotes.count ?? 0,
    entregasHoy: deliveriesToday.count ?? 0,
  }
}

async function getRecentActivity(orgId: string) {
  const supabase = createClient()
  const { data } = await supabase
    .from('sales')
    .select('id, folio, total, status, created_at, customer:customers(name)')
    .eq('organization_id', orgId)
    .order('created_at', { ascending: false })
    .limit(5)
  return data ?? []
}

export default async function DashboardPage() {
  const supabase = createClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

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

  const kpiCards = [
    {
      label: 'Ventas de hoy',
      value: formatCurrency(kpis?.ventasHoy ?? 0),
      icon: ShoppingCart,
      color: 'text-accent',
      bg: 'bg-accent/10',
      href: '/dashboard/ventas',
    },
    {
      label: 'Ventas del mes',
      value: formatCurrency(kpis?.ventasMes ?? 0),
      icon: TrendingUp,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10',
      href: '/dashboard/ventas',
    },
    {
      label: 'Clientes activos',
      value: formatNumber(kpis?.clientesActivos ?? 0),
      icon: Users,
      color: 'text-blue-400',
      bg: 'bg-blue-500/10',
      href: '/dashboard/clientes',
    },
    {
      label: 'Entregas hoy',
      value: formatNumber(kpis?.entregasHoy ?? 0),
      icon: Truck,
      color: 'text-purple-400',
      bg: 'bg-purple-500/10',
      href: '/dashboard/entregas',
    },
    {
      label: 'Cotizaciones activas',
      value: formatNumber(kpis?.cotizacionesPendientes ?? 0),
      icon: FileText,
      color: 'text-amber-400',
      bg: 'bg-amber-500/10',
      href: '/dashboard/cotizaciones',
    },
    {
      label: 'Productos con stock bajo',
      value: formatNumber(kpis?.stockBajo ?? 0),
      icon: AlertTriangle,
      color: 'text-red-400',
      bg: 'bg-red-500/10',
      href: '/dashboard/inventario',
    },
  ]

  const quickActions = [
    { label: 'Nueva venta', href: '/dashboard/ventas', icon: ShoppingCart, color: 'bg-accent/10 text-accent border-accent/20' },
    { label: 'Nueva cotización', href: '/dashboard/cotizaciones', icon: FileText, color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
    { label: 'Ver entregas', href: '/dashboard/entregas', icon: Truck, color: 'bg-purple-500/10 text-purple-400 border-purple-500/20' },
    { label: 'Ver inventario', href: '/dashboard/inventario', icon: Package, color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  ]

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-text-primary">
          {(() => {
            const h = new Date().getHours()
            return h < 12 ? 'Buenos días' : h < 18 ? 'Buenas tardes' : 'Buenas noches'
          })()}, {profile?.full_name?.split(' ')[0] ?? 'usuario'}
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
              <div className={`w-9 h-9 rounded-lg ${kpi.bg} flex items-center justify-center`}>
                <kpi.icon className={`w-4.5 h-4.5 ${kpi.color}`} size={18} />
              </div>
            </div>
            <div>
              <p className="text-2xl font-bold text-text-primary">{kpi.value}</p>
              <p className="text-xs text-text-tertiary mt-0.5">{kpi.label}</p>
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
              className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${action.color} text-sm font-medium transition-all duration-150 hover:opacity-90 hover:scale-[1.02]`}
            >
              <action.icon className="w-4 h-4 shrink-0" />
              {action.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Bottom section */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent activity - real data */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
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
              <Link href="/dashboard/ventas" className="text-xs text-accent mt-2">Crear primera venta</Link>
            </div>
          ) : (
            <div className="space-y-0">
              {recentSales.map((sale) => {
                const customerName = (sale.customer as unknown as { name: string })?.name ?? '—'
                const statusColor = {
                  pendiente: 'text-amber-400',
                  confirmada: 'text-accent',
                  entregada: 'text-emerald-400',
                  cancelada: 'text-text-tertiary',
                }[sale.status as string] ?? 'text-text-tertiary'
                return (
                  <div key={sale.id} className="flex items-center justify-between gap-3 py-2.5 border-b border-border/50 last:border-0">
                    <div className="min-w-0">
                      <p className="text-sm text-text-primary font-mono truncate">{sale.folio}</p>
                      <p className="text-xs text-text-tertiary mt-0.5">{customerName}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-semibold text-text-primary">{formatCurrency(sale.total)}</p>
                      <p className={`text-xs capitalize ${statusColor}`}>{sale.status}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Stock alerts */}
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-text-primary mb-4 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            Alertas de inventario
          </h3>
          {(kpis?.stockBajo ?? 0) === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Package className="w-8 h-8 text-text-tertiary mb-2" />
              <p className="text-sm text-text-secondary">Todo el inventario está bien surtido</p>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-text-secondary text-sm">
                Tienes <span className="text-amber-400 font-semibold">{kpis?.stockBajo}</span> productos con stock bajo.
              </p>
              <Link href="/dashboard/inventario" className="btn-secondary btn btn-sm inline-flex mt-2">
                Ver inventario
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
