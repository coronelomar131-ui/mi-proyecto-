'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency, formatDate } from '@/lib/utils/format'
import { Plus, X, TrendingUp, TrendingDown, DollarSign, ArrowUpRight, ArrowDownRight } from 'lucide-react'
import toast from 'react-hot-toast'
import { cn } from '@/lib/utils/cn'
import type { Transaction } from '@/types'

const INCOME_CATEGORIES = ['Ventas', 'Cobro de deuda', 'Devolución de proveedor', 'Otro ingreso']
const EXPENSE_CATEGORIES = ['Proveedores', 'Nómina', 'Renta', 'Servicios', 'Logística', 'Otro egreso']

export default function FinanzasPage() {
  const supabase = createClient()
  const [transactions, setTransactions] = useState<Transaction[]>([])
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

  const fetchTransactions = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase.from('transactions').select('*').order('date', { ascending: false }).limit(100)
    setTransactions((data as Transaction[]) ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { fetchTransactions() }, [fetchTransactions])

  const filtered = transactions.filter((t) => filterType === 'all' || t.type === filterType)

  const totalIngresos = transactions.filter((t) => t.type === 'ingreso').reduce((s, t) => s + t.amount, 0)
  const totalEgresos = transactions.filter((t) => t.type === 'egreso').reduce((s, t) => s + t.amount, 0)
  const balance = totalIngresos - totalEgresos

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.amount || !form.description) { toast.error('Completa todos los campos'); return }
    setSaving(true)

    const { error } = await supabase.from('transactions').insert({
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
        <button onClick={() => setShowModal(true)} className="btn-primary btn">
          <Plus className="w-4 h-4" /> Nuevo movimiento
        </button>
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
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="text-center py-12"><span className="inline-block w-5 h-5 border-2 border-border border-t-accent rounded-full animate-spin" /></td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-12 text-text-tertiary text-sm">
                <DollarSign className="w-8 h-8 mx-auto mb-2 opacity-30" />No hay movimientos
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
