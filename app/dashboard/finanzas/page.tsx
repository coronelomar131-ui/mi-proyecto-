'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency, formatDate } from '@/lib/utils/format'
import { Plus, X, TrendingUp, TrendingDown, DollarSign, ArrowUpRight, ArrowDownRight, Download, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { cn } from '@/lib/utils/cn'
import { EmptyState } from '@/components/ui/empty-state'
import { TableSkeleton } from '@/components/ui/skeleton'
import { FinanceMonthlyChart } from '@/components/ui/finance-chart'
import type { Transaction } from '@/types'

const INCOME_CATEGORIES = ['Ventas', 'Cobro de deuda', 'Devolución de proveedor', 'Otro ingreso']
const EXPENSE_CATEGORIES = ['Proveedores', 'Nómina', 'Renta', 'Servicios', 'Logística', 'Otro egreso']

interface DailyBrief {
  efectivo: number
  transferencia: number
  credito: number
  cheque: number
  totalSales: number
  saleCount: number
}

export default function FinanzasPage() {
  const supabase = createClient()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [dailyBrief, setDailyBrief] = useState<DailyBrief | null>(null)
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [filterType, setFilterType] = useState<'all' | 'ingreso' | 'egreso'>('all')
  const [form, setForm] = useState({
    type: 'ingreso' as 'ingreso' | 'egreso',
    category: INCOME_CATEGORIES[0],
    description: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    reference: '',
  })

  const [orgId, setOrgId] = useState('')

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('transactions').delete().eq('id', id).eq('organization_id', orgId)
    if (error) toast.error('Error al eliminar')
    else { toast.success('Movimiento eliminado'); fetchTransactions() }
  }

  const fetchTransactions = useCallback(async (currentOrgId?: string) => {
    setLoading(true)
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    const [{ data }, { data: todaySales }] = await Promise.all([
      supabase.from('transactions').select('*').eq('organization_id', currentOrgId ?? orgId).order('date', { ascending: false }).limit(100),
      supabase.from('sales').select('total, payment_method').eq('organization_id', currentOrgId ?? orgId).gte('created_at', todayStart.toISOString()).neq('status', 'cancelada'),
    ])
    setTransactions((data as Transaction[]) ?? [])

    const brief: DailyBrief = { efectivo: 0, transferencia: 0, credito: 0, cheque: 0, totalSales: 0, saleCount: 0 }
    todaySales?.forEach((s) => {
      const pm = s.payment_method as keyof typeof brief
      if (pm in brief) (brief[pm] as number) += s.total ?? 0
      brief.totalSales += s.total ?? 0
      brief.saleCount += 1
    })
    setDailyBrief(brief)
    setLoading(false)
  }, [])

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) return
      const { data } = await supabase.from('profiles').select('organization_id').eq('id', session.user.id).single()
      if (data) {
        setOrgId(data.organization_id)
        fetchTransactions(data.organization_id)
      }
    })
  }, [fetchTransactions])

  const filtered = transactions.filter((t) => filterType === 'all' || t.type === filterType)

  const totalIngresos = transactions.filter((t) => t.type === 'ingreso').reduce((s, t) => s + t.amount, 0)
  const totalEgresos = transactions.filter((t) => t.type === 'egreso').reduce((s, t) => s + t.amount, 0)
  const balance = totalIngresos - totalEgresos

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.amount || !form.description) { toast.error('Completa todos los campos'); return }
    setSaving(true)

    const { error } = await supabase.from('transactions').insert({
      organization_id: orgId,
      type: form.type,
      category: form.category,
      description: form.description,
      amount: parseFloat(form.amount),
      date: form.date,
      reference: form.reference || null,
    })

    if (error) { toast.error('Error al registrar') } else {
      toast.success('Movimiento registrado')
      setShowModal(false)
      setForm({ type: 'ingreso', category: INCOME_CATEGORIES[0], description: '', amount: '', date: new Date().toISOString().split('T')[0], reference: '' })
      fetchTransactions()
    }
    setSaving(false)
  }

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Finanzas</h1>
          <p className="text-xs text-text-tertiary mt-0.5">Control de ingresos y egresos</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              const csv = ['Fecha,Tipo,Categoría,Descripción,Referencia,Monto']
              filtered.forEach((t) => {
                csv.push(`${formatDate(t.date)},${t.type},${t.category},"${t.description}",${t.reference ?? ''},${t.amount}`)
              })
              const blob = new Blob([csv.join('\n')], { type: 'text/csv' })
              const a = document.createElement('a')
              a.href = URL.createObjectURL(blob)
              a.download = `finanzas-${new Date().toISOString().split('T')[0]}.csv`
              a.click()
            }}
            className="btn-secondary btn btn-sm"
          >
            <Download className="w-3.5 h-3.5" /> Exportar
          </button>
          <button onClick={() => setShowModal(true)} className="btn-primary btn">
            <Plus className="w-4 h-4" /> Nuevo movimiento
          </button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <ArrowUpRight className="w-4 h-4 text-emerald-400" />
            </div>
            <span className="text-xs text-text-tertiary">Ingresos</span>
          </div>
          <p className="text-2xl font-bold text-emerald-400">{formatCurrency(totalIngresos)}</p>
        </div>
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center">
              <ArrowDownRight className="w-4 h-4 text-red-400" />
            </div>
            <span className="text-xs text-text-tertiary">Egresos</span>
          </div>
          <p className="text-2xl font-bold text-red-400">{formatCurrency(totalEgresos)}</p>
        </div>
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
              <DollarSign className="w-4 h-4 text-accent" />
            </div>
            <span className="text-xs text-text-tertiary">Balance</span>
          </div>
          <p className={cn('text-2xl font-bold', balance >= 0 ? 'text-accent' : 'text-red-400')}>
            {formatCurrency(balance)}
          </p>
        </div>
      </div>

      {/* Daily brief / Arqueo de caja */}
      {dailyBrief && dailyBrief.saleCount > 0 && (
        <div className="card p-5 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-accent" />
              Resumen de hoy — {new Date().toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })}
            </h3>
            <div className="text-right">
              <p className="text-lg font-bold text-accent">{formatCurrency(dailyBrief.totalSales)}</p>
              <p className="text-xs text-text-tertiary">{dailyBrief.saleCount} venta{dailyBrief.saleCount !== 1 ? 's' : ''}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Efectivo', amount: dailyBrief.efectivo, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
              { label: 'Transferencia', amount: dailyBrief.transferencia, color: 'text-blue-400', bg: 'bg-blue-500/10' },
              { label: 'Crédito', amount: dailyBrief.credito, color: 'text-amber-400', bg: 'bg-amber-500/10' },
              { label: 'Cheque', amount: dailyBrief.cheque, color: 'text-purple-400', bg: 'bg-purple-500/10' },
            ].map((pm) => (
              <div key={pm.label} className={cn('rounded-xl p-3 text-center', pm.bg, pm.amount === 0 && 'opacity-40')}>
                <p className={cn('text-lg font-bold', pm.color)}>{formatCurrency(pm.amount)}</p>
                <p className="text-xs text-text-tertiary mt-0.5">{pm.label}</p>
              </div>
            ))}
          </div>
          {dailyBrief.efectivo > 0 && (
            <p className="text-xs text-text-tertiary mt-3 text-center">
              Efectivo esperado en caja: <strong className="text-emerald-400">{formatCurrency(dailyBrief.efectivo)}</strong>
            </p>
          )}
        </div>
      )}

      {/* Monthly chart */}
      <div className="card p-5 mb-6">
        <h3 className="text-sm font-semibold text-text-primary mb-4">Ingresos vs Egresos — 6 meses</h3>
        <FinanceMonthlyChart />
      </div>

      {/* Filter */}
      <div className="flex items-center gap-2 mb-4">
        {(['all', 'ingreso', 'egreso'] as const).map((t) => (
          <button key={t} onClick={() => setFilterType(t)} className={cn('btn btn-sm', filterType === t ? 'btn-primary' : 'btn-secondary')}>
            {t === 'all' ? 'Todos' : t === 'ingreso' ? 'Ingresos' : 'Egresos'}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Tipo</th>
              <th>Categoría</th>
              <th>Descripción</th>
              <th>Referencia</th>
              <th>Monto</th>
              <th className="w-8"></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <TableSkeleton rows={8} cols={7} />
            ) : filtered.length === 0 ? (
              <tr><td colSpan={7}>
                <EmptyState
                  icon={<DollarSign className="w-6 h-6" />}
                  title={filterType === 'all' ? 'Sin movimientos aún' : filterType === 'ingreso' ? 'Sin ingresos registrados' : 'Sin egresos registrados'}
                  description={filterType === 'all' ? 'Registra tus ingresos y egresos para llevar un control financiero claro.' : `No hay ${filterType === 'ingreso' ? 'ingresos' : 'egresos'} registrados en este período.`}
                  action={filterType === 'all' ? { label: 'Registrar movimiento', onClick: () => setShowModal(true) } : undefined}
                />
              </td></tr>
            ) : (
              filtered.map((t) => (
                <tr key={t.id}>
                  <td>{formatDate(t.date)}</td>
                  <td>
                    <span className={cn('badge', t.type === 'ingreso' ? 'badge-green' : 'badge-red')}>
                      {t.type === 'ingreso' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                      {t.type === 'ingreso' ? 'Ingreso' : 'Egreso'}
                    </span>
                  </td>
                  <td className="text-text-secondary">{t.category}</td>
                  <td className="text-text-primary text-sm">{t.description}</td>
                  <td className="font-mono text-xs text-text-tertiary">{t.reference ?? '—'}</td>
                  <td className={cn('font-semibold', t.type === 'ingreso' ? 'text-emerald-400' : 'text-red-400')}>
                    {t.type === 'egreso' ? '-' : '+'}{formatCurrency(t.amount)}
                  </td>
                  <td>
                    <button
                      onClick={() => { if (confirm('¿Eliminar este movimiento?')) handleDelete(t.id) }}
                      className="p-1.5 rounded-lg hover:bg-red-500/10 text-text-tertiary hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h2 className="font-semibold text-text-primary">Nuevo movimiento</h2>
              <button onClick={() => setShowModal(false)} className="btn-ghost btn p-1.5"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Tipo</label>
                  <select className="input" value={form.type} onChange={(e) => { const t = e.target.value as 'ingreso' | 'egreso'; setForm(p => ({ ...p, type: t, category: t === 'ingreso' ? INCOME_CATEGORIES[0] : EXPENSE_CATEGORIES[0] })) }}>
                    <option value="ingreso">Ingreso</option>
                    <option value="egreso">Egreso</option>
                  </select>
                </div>
                <div>
                  <label className="label">Categoría</label>
                  <select className="input" value={form.category} onChange={(e) => setForm(p => ({ ...p, category: e.target.value }))}>
                    {(form.type === 'ingreso' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES).map((c) => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="label">Descripción *</label>
                  <input type="text" value={form.description} onChange={(e) => setForm(p => ({ ...p, description: e.target.value }))} className="input" placeholder="Descripción del movimiento" required />
                </div>
                <div>
                  <label className="label">Monto *</label>
                  <input type="number" min="0" step="0.01" value={form.amount} onChange={(e) => setForm(p => ({ ...p, amount: e.target.value }))} className="input" placeholder="0.00" required />
                </div>
                <div>
                  <label className="label">Fecha</label>
                  <input type="date" value={form.date} onChange={(e) => setForm(p => ({ ...p, date: e.target.value }))} className="input" />
                </div>
                <div className="col-span-2">
                  <label className="label">Referencia / Folio</label>
                  <input type="text" value={form.reference} onChange={(e) => setForm(p => ({ ...p, reference: e.target.value }))} className="input" placeholder="Número de cheque, transferencia, etc." />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary btn flex-1">Cancelar</button>
                <button type="submit" disabled={saving} className="btn-primary btn flex-1">
                  {saving ? 'Guardando...' : 'Registrar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
