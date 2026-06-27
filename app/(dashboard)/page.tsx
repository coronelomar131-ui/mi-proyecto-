import { createClient } from '@/lib/supabase/server'
import { formatCurrency, formatNumber } from '@/lib/utils/format'
import {
  TrendingUp,
  TrendingDown,
  ShoppingCart,
  Users,
  Package,
  Truck,
  DollarSign,
  FileText,
  AlertTriangle,
} from 'lucide-react'
import Link from 'next/link'

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
  const kpis = orgId ? await getKPIs(orgId) : null

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
          Buenos días, {profile?.full_name?.split(' ')[0] ?? 'usuario'} 👋
        </h1>
        <p className="text-text-tertiary text-sm mt-1">
          {new Date().toLocaleDateString('es-MX', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

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
        {/* Recent activity placeholder */}
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-text-primary mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-accent" />
            Actividad reciente
          </h3>
          <div className="space-y-3">
            {[
              { text: 'Venta #00042 confirmada', sub: 'Cliente: Comercial López', time: 'Hace 5 min' },
              { text: 'Entrega #00038 completada', sub: 'Repartidor: Marco A.', time: 'Hace 12 min' },
              { text: 'Stock bajo: Aceite 5W30', sub: 'Solo 3 unidades', time: 'Hace 20 min' },
              { text: 'Nueva cotización enviada', sub: 'Distribuidora Morales', time: 'Hace 45 min' },
            ].map((item, i) => (
              <div key={i} className="flex items-start justify-between gap-3 py-2 border-b border-border/50 last:border-0">
                <div>
                  <p className="text-sm text-text-primary">{item.text}</p>
                  <p className="text-xs text-text-tertiary mt-0.5">{item.sub}</p>
                </div>
                <span className="text-2xs text-text-tertiary shrink-0 mt-0.5">{item.time}</span>
              </div>
            ))}
          </div>
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
