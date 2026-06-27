'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency, formatShortDate, formatNumber } from '@/lib/utils/format'
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import { BarChart3, TrendingUp, Package, Users, ShoppingCart, DollarSign, RefreshCw } from 'lucide-react'
import { subDays } from 'date-fns'
import { cn } from '@/lib/utils/cn'

const ACCENT = '#00C4D4'
const COLORS = ['#00C4D4', '#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']

const RANGES = [
  { label: '7 días', days: 7 },
  { label: '30 días', days: 30 },
  { label: '90 días', days: 90 },
]

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: { value: number; name: string }[]; label?: string }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-surface-2 border border-border rounded-lg px-3 py-2 text-xs shadow-card">
      <p className="text-text-secondary mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="text-text-primary font-medium">
          {p.name}: {typeof p.value === 'number' && p.value > 1000 ? formatCurrency(p.value) : p.value}
        </p>
      ))}
    </div>
  )
}

export default function ReportesPage() {
  const supabase = createClient()
  const [rangeDays, setRangeDays] = useState(30)
  const [salesData, setSalesData] = useState<{ name: string; ventas: number; pedidos: number }[]>([])
  const [topProducts, setTopProducts] = useState<{ name: string; value: number }[]>([])
  const [productMargins, setProductMargins] = useState<{ name: string; revenue: number; cost: number; margin: number }[]>([])
  const [topCustomers, setTopCustomers] = useState<{ name: string; value: number; orders: number }[]>([])
  const [customerSegments, setCustomerSegments] = useState<{ name: string; value: number }[]>([])
  const [summary, setSummary] = useState({ totalRevenue: 0, totalOrders: 0, avgOrder: 0, uniqueCustomers: 0 })
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async (days: number) => {
    setLoading(true)
    const since = subDays(new Date(), days).toISOString()

    const [{ data: salesRaw }, { data: itemsRaw }, { data: customersRaw }, { data: salesWithCustomer }] = await Promise.all([
      supabase.from('sales').select('id, total, created_at, status, customer_id').gte('created_at', since).neq('status', 'cancelada'),
      supabase.from('sale_items').select('quantity, subtotal, unit_price, product:products(name, cost_price)').limit(1000),
      supabase.from('customers').select('city, is_active').eq('is_active', true),
      supabase.from('sales').select('total, customer_id, customer:customers(name)').gte('created_at', since).neq('status', 'cancelada').limit(500),
    ])

    // Summary KPIs
    const validSales = salesRaw ?? []
    const totalRevenue = validSales.reduce((s, r) => s + (r.total ?? 0), 0)
    const totalOrders = validSales.length
    const uniqueCustomers = new Set(validSales.map((s) => s.customer_id)).size
    setSummary({ totalRevenue, totalOrders, avgOrder: totalOrders > 0 ? totalRevenue / totalOrders : 0, uniqueCustomers })

    // Daily sales chart — show last N days up to 30 buckets
    const buckets = Math.min(days, 30)
    const dayMap: Record<string, { ventas: number; pedidos: number }> = {}
    for (let i = buckets - 1; i >= 0; i--) {
      const d = subDays(new Date(), i)
      const key = formatShortDate(d)
      dayMap[key] = { ventas: 0, pedidos: 0 }
    }
    validSales.forEach((s) => {
      const key = formatShortDate(s.created_at)
      if (dayMap[key]) {
        dayMap[key].ventas += s.total ?? 0
        dayMap[key].pedidos += 1
      }
    })
    setSalesData(Object.entries(dayMap).map(([name, v]) => ({ name, ...v })))

    // Top products by revenue + margin analysis
    const productMap: Record<string, { revenue: number; cost: number }> = {}
    itemsRaw?.forEach((item) => {
      const prod = item.product as unknown as { name: string; cost_price: number }
      const name = prod?.name ?? 'Desconocido'
      if (!productMap[name]) productMap[name] = { revenue: 0, cost: 0 }
      productMap[name].revenue += item.subtotal ?? 0
      productMap[name].cost += (prod?.cost_price ?? 0) * (item.quantity ?? 0)
    })
    const sorted = Object.entries(productMap).sort((a, b) => b[1].revenue - a[1].revenue).slice(0, 5)
    setTopProducts(sorted.map(([name, d]) => ({ name: name.slice(0, 20), value: d.revenue })))

    const marginData = Object.entries(productMap)
      .map(([name, d]) => ({
        name: name.slice(0, 22),
        revenue: d.revenue,
        cost: d.cost,
        margin: d.revenue > 0 ? ((d.revenue - d.cost) / d.revenue) * 100 : 0,
      }))
      .sort((a, b) => b.margin - a.margin)
      .slice(0, 5)
    setProductMargins(marginData)

    // Top customers by revenue
    const customerMap: Record<string, { value: number; orders: number }> = {}
    salesWithCustomer?.forEach((s) => {
      const name = (s.customer as unknown as { name: string })?.name ?? 'Desconocido'
      if (!customerMap[name]) customerMap[name] = { value: 0, orders: 0 }
      customerMap[name].value += s.total ?? 0
      customerMap[name].orders += 1
    })
    const topCust = Object.entries(customerMap).sort((a, b) => b[1].value - a[1].value).slice(0, 5)
    setTopCustomers(topCust.map(([name, d]) => ({ name: name.slice(0, 22), value: d.value, orders: d.orders })))

    // Customer by city
    const cityMap: Record<string, number> = {}
    customersRaw?.forEach((c) => {
      const city = (c.city as string) ?? 'Sin ciudad'
      cityMap[city] = (cityMap[city] ?? 0) + 1
    })
    const citySorted = Object.entries(cityMap).sort((a, b) => b[1] - a[1]).slice(0, 5)
    setCustomerSegments(citySorted.map(([name, value]) => ({ name, value })))

    setLoading(false)
  }, [])

  useEffect(() => { fetchData(rangeDays) }, [fetchData, rangeDays])

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Reportes</h1>
          <p className="text-xs text-text-tertiary mt-0.5">Análisis de rendimiento</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-surface-2 border border-border rounded-lg p-0.5 gap-0.5">
            {RANGES.map((r) => (
              <button
                key={r.days}
                onClick={() => setRangeDays(r.days)}
                className={cn('text-xs px-3 py-1.5 rounded-md transition-all', rangeDays === r.days ? 'bg-accent text-surface-0 font-medium' : 'text-text-secondary hover:text-text-primary')}
              >
                {r.label}
              </button>
            ))}
          </div>
          <button onClick={() => fetchData(rangeDays)} className="btn-secondary btn btn-sm" disabled={loading}>
            <RefreshCw className={cn('w-3.5 h-3.5', loading && 'animate-spin')} />
          </button>
        </div>
      </div>

      {/* Summary KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Ingresos totales', value: loading ? '—' : formatCurrency(summary.totalRevenue), icon: DollarSign, color: 'text-accent', bg: 'bg-accent/10' },
          { label: 'Pedidos', value: loading ? '—' : formatNumber(summary.totalOrders), icon: ShoppingCart, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
          { label: 'Ticket promedio', value: loading ? '—' : formatCurrency(summary.avgOrder), icon: TrendingUp, color: 'text-blue-400', bg: 'bg-blue-500/10' },
          { label: 'Clientes únicos', value: loading ? '—' : formatNumber(summary.uniqueCustomers), icon: Users, color: 'text-purple-400', bg: 'bg-purple-500/10' },
        ].map((k) => (
          <div key={k.label} className="card p-4">
            <div className={`w-8 h-8 rounded-lg ${k.bg} flex items-center justify-center mb-3`}>
              <k.icon className={`w-4 h-4 ${k.color}`} />
            </div>
            <p className="text-xl font-bold text-text-primary">{k.value}</p>
            <p className="text-xs text-text-tertiary mt-0.5">{k.label}</p>
          </div>
        ))}
      </div>

      <div className="space-y-6">
        {/* Sales trend */}
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-5">
            <TrendingUp className="w-4 h-4 text-accent" />
            <h3 className="text-sm font-semibold text-text-primary">Ventas — últimos {rangeDays} días</h3>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={salesData}>
              <defs>
                <linearGradient id="colorVentas" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={ACCENT} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={ACCENT} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="name" tick={{ fill: '#5E5E6E', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#5E5E6E', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="ventas" name="Ventas" stroke={ACCENT} strokeWidth={2} fill="url(#colorVentas)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Top products */}
          <div className="card p-5">
            <div className="flex items-center gap-2 mb-5">
              <Package className="w-4 h-4 text-accent" />
              <h3 className="text-sm font-semibold text-text-primary">Top 5 productos por venta</h3>
            </div>
            {topProducts.length === 0 ? (
              <div className="flex items-center justify-center py-12 text-text-tertiary text-sm">Sin datos suficientes</div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={topProducts} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                  <XAxis type="number" tick={{ fill: '#5E5E6E', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                  <YAxis type="category" dataKey="name" tick={{ fill: '#9898A8', fontSize: 10 }} axisLine={false} tickLine={false} width={90} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="value" name="Ingresos" fill={ACCENT} radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Top customers */}
          <div className="card p-5">
            <div className="flex items-center gap-2 mb-5">
              <Users className="w-4 h-4 text-accent" />
              <h3 className="text-sm font-semibold text-text-primary">Top clientes por ingresos</h3>
            </div>
            {topCustomers.length === 0 ? (
              <div className="flex items-center justify-center py-12 text-text-tertiary text-sm">Sin datos suficientes</div>
            ) : (
              <div className="space-y-3">
                {topCustomers.map((c, i) => {
                  const pct = topCustomers[0].value > 0 ? (c.value / topCustomers[0].value) * 100 : 0
                  return (
                    <div key={c.name} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-surface-3 flex items-center justify-center text-2xs font-bold text-text-tertiary">{i + 1}</span>
                          <span className="text-text-primary font-medium truncate max-w-[130px]">{c.name}</span>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="text-text-primary font-semibold">{formatCurrency(c.value)}</span>
                          <span className="text-text-tertiary ml-2">{c.orders} ped.</span>
                        </div>
                      </div>
                      <div className="h-1.5 bg-surface-3 rounded-full overflow-hidden">
                        <div className="h-full rounded-full bg-accent" style={{ width: `${pct.toFixed(0)}%` }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Gross margin by product */}
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-5">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-semibold text-text-primary">Margen bruto por producto</h3>
          </div>
          {productMargins.length === 0 ? (
            <div className="flex items-center justify-center py-8 text-text-tertiary text-sm">Sin datos suficientes</div>
          ) : (
            <div className="space-y-3">
              {productMargins.map((p, i) => (
                <div key={p.name} className="flex items-center gap-3">
                  <span className="text-xs text-text-tertiary w-4 text-right shrink-0">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="text-text-primary font-medium truncate max-w-[150px]">{p.name}</span>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-text-tertiary">{formatCurrency(p.revenue)}</span>
                        <span className={cn('font-semibold w-12 text-right', p.margin >= 40 ? 'text-emerald-400' : p.margin >= 20 ? 'text-amber-400' : 'text-red-400')}>
                          {p.margin.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                    <div className="h-1.5 bg-surface-3 rounded-full overflow-hidden">
                      <div
                        className={cn('h-full rounded-full', p.margin >= 40 ? 'bg-emerald-400' : p.margin >= 20 ? 'bg-amber-400' : 'bg-red-400')}
                        style={{ width: `${Math.min(100, p.margin).toFixed(0)}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Orders bar */}
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-5">
            <BarChart3 className="w-4 h-4 text-accent" />
            <h3 className="text-sm font-semibold text-text-primary">Pedidos por día — últimos {rangeDays} días</h3>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={salesData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="name" tick={{ fill: '#5E5E6E', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#5E5E6E', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="pedidos" name="Pedidos" fill="#6366f1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
