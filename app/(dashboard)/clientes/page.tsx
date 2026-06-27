'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useDebounce } from '@/lib/hooks/use-debounce'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency, formatDate, initials } from '@/lib/utils/format'
import { Plus, Search, X, Phone, Mail, MapPin, CreditCard, Users, TrendingUp, AlertCircle, Eye, ShoppingCart, Building2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { EmptyState } from '@/components/ui/empty-state'
import { cn } from '@/lib/utils/cn'
import type { Customer, Sale } from '@/types'

export default function ClientesPage() {
  const supabase = createClient()
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [viewCustomer, setViewCustomer] = useState<Customer | null>(null)
  const [customerSales, setCustomerSales] = useState<Sale[]>([])
  const [loadingSales, setLoadingSales] = useState(false)
  const [form, setForm] = useState({
    name: '', email: '', phone: '', address: '', city: '', rfc: '', credit_limit: '0',
  })

  const fetchCustomers = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase.from('customers').select('*').order('name')
    setCustomers((data as Customer[]) ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { fetchCustomers() }, [fetchCustomers])

  const debouncedSearch = useDebounce(search)
  const filtered = useMemo(() => customers.filter(
    (c) =>
      c.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      c.email?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      c.city?.toLowerCase().includes(debouncedSearch.toLowerCase())
  ), [customers, debouncedSearch])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) { toast.error('El nombre es requerido'); return }
    setSaving(true)

    const { error } = await supabase.from('customers').insert({
      name: form.name,
      email: form.email || null,
      phone: form.phone || null,
      address: form.address || null,
      city: form.city || null,
      rfc: form.rfc || null,
      credit_limit: parseFloat(form.credit_limit) || 0,
      balance: 0,
      tags: [],
      is_active: true,
    })

    if (error) {
      toast.error('Error al crear cliente')
    } else {
      toast.success('Cliente creado')
      setShowModal(false)
      setForm({ name: '', email: '', phone: '', address: '', city: '', rfc: '', credit_limit: '0' })
      fetchCustomers()
    }
    setSaving(false)
  }

  const openCustomerDetail = async (customer: Customer) => {
    setViewCustomer(customer)
    setLoadingSales(true)
    const { data } = await supabase
      .from('sales')
      .select('id, folio, total, status, created_at, payment_method')
      .eq('customer_id', customer.id)
      .order('created_at', { ascending: false })
      .limit(10)
    setCustomerSales((data as Sale[]) ?? [])
    setLoadingSales(false)
  }

  const colors = [
    'bg-accent/20 text-accent border-accent/30',
    'bg-blue-500/20 text-blue-400 border-blue-500/30',
    'bg-purple-500/20 text-purple-400 border-purple-500/30',
    'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    'bg-amber-500/20 text-amber-400 border-amber-500/30',
  ]

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Clientes</h1>
          <p className="text-xs text-text-tertiary mt-0.5">{customers.length} clientes registrados</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary btn">
          <Plus className="w-4 h-4" /> Nuevo cliente
        </button>
      </div>

      {/* Summary */}
      {customers.length > 0 && (
        <div className="grid grid-cols-3 gap-3 mb-5">
          {[
            { label: 'Total clientes', value: customers.length, icon: Users, color: 'text-accent', bg: 'bg-accent/10' },
            { label: 'Con crédito', value: customers.filter(c => c.credit_limit > 0).length, icon: TrendingUp, color: 'text-blue-400', bg: 'bg-blue-500/10' },
            { label: 'Con saldo', value: customers.filter(c => c.balance > 0).length, icon: AlertCircle, color: 'text-amber-400', bg: 'bg-amber-500/10' },
          ].map((stat) => (
            <div key={stat.label} className="card p-4 flex items-center gap-3">
              <div className={`w-8 h-8 rounded-lg ${stat.bg} flex items-center justify-center shrink-0`}>
                <stat.icon className={`w-4 h-4 ${stat.color}`} />
              </div>
              <div>
                <p className="text-lg font-bold text-text-primary">{stat.value}</p>
                <p className="text-2xs text-text-tertiary">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nombre, email o ciudad..."
          className="input pl-9"
        />
      </div>

      {/* Cards grid */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <span className="w-6 h-6 border-2 border-border border-t-accent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={debouncedSearch ? <Search className="w-6 h-6" /> : <Users className="w-6 h-6" />}
          title={debouncedSearch ? 'Sin resultados' : 'Aún no hay clientes'}
          description={debouncedSearch ? `No encontramos clientes con "${debouncedSearch}"` : 'Agrega tu primer cliente para empezar a gestionar tus ventas y créditos.'}
          action={!debouncedSearch ? { label: 'Agregar cliente', onClick: () => setShowModal(true) } : undefined}
        />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((customer, idx) => {
            const colorClass = colors[idx % colors.length]
            return (
              <div key={customer.id} className="card-hover p-5 group cursor-pointer" onClick={() => openCustomerDetail(customer)}>
                <div className="flex items-start gap-3 mb-4">
                  <div className={`w-10 h-10 rounded-xl border flex items-center justify-center text-sm font-semibold shrink-0 ${colorClass}`}>
                    {initials(customer.name)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-text-primary truncate text-sm">{customer.name}</h3>
                    {customer.city && (
                      <p className="text-xs text-text-tertiary flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3" /> {customer.city}
                      </p>
                    )}
                  </div>
                  <span className={`badge ${customer.is_active ? 'badge-green' : 'badge-gray'}`}>
                    {customer.is_active ? 'Activo' : 'Inactivo'}
                  </span>
                </div>

                <div className="space-y-1.5 text-xs text-text-tertiary">
                  {customer.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{customer.email}</span>
                    </div>
                  )}
                  {customer.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 shrink-0" />
                      <span>{customer.phone}</span>
                    </div>
                  )}
                  {customer.rfc && (
                    <div className="flex items-center gap-2">
                      <CreditCard className="w-3.5 h-3.5 shrink-0" />
                      <span>{customer.rfc}</span>
                    </div>
                  )}
                </div>

                <div className="divider" />

                <div className="flex items-center justify-between text-xs">
                  <div>
                    <p className="text-text-tertiary">Crédito</p>
                    <p className="font-semibold text-text-primary">{formatCurrency(customer.credit_limit)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-text-tertiary">Saldo</p>
                    <p className={`font-semibold ${customer.balance > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                      {formatCurrency(customer.balance)}
                    </p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h2 className="font-semibold text-text-primary">Nuevo cliente</h2>
              <button onClick={() => setShowModal(false)} className="btn-ghost btn p-1.5">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="label">Nombre *</label>
                  <input type="text" value={form.name} onChange={(e) => setForm(p => ({ ...p, name: e.target.value }))} className="input" placeholder="Distribuidora El Sol" required />
                </div>
                <div>
                  <label className="label">Email</label>
                  <input type="email" value={form.email} onChange={(e) => setForm(p => ({ ...p, email: e.target.value }))} className="input" placeholder="contacto@empresa.com" />
                </div>
                <div>
                  <label className="label">Teléfono</label>
                  <input type="tel" value={form.phone} onChange={(e) => setForm(p => ({ ...p, phone: e.target.value }))} className="input" placeholder="55 1234 5678" />
                </div>
                <div>
                  <label className="label">Ciudad</label>
                  <input type="text" value={form.city} onChange={(e) => setForm(p => ({ ...p, city: e.target.value }))} className="input" placeholder="CDMX" />
                </div>
                <div>
                  <label className="label">RFC</label>
                  <input type="text" value={form.rfc} onChange={(e) => setForm(p => ({ ...p, rfc: e.target.value }))} className="input" placeholder="ABC123456XYZ" />
                </div>
                <div className="col-span-2">
                  <label className="label">Dirección</label>
                  <input type="text" value={form.address} onChange={(e) => setForm(p => ({ ...p, address: e.target.value }))} className="input" placeholder="Calle, No., Colonia" />
                </div>
                <div>
                  <label className="label">Límite de crédito</label>
                  <input type="number" min="0" value={form.credit_limit} onChange={(e) => setForm(p => ({ ...p, credit_limit: e.target.value }))} className="input" placeholder="0.00" />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary btn flex-1">Cancelar</button>
                <button type="submit" disabled={saving} className="btn-primary btn flex-1">
                  {saving ? 'Guardando...' : 'Crear cliente'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Customer detail modal */}
      {viewCustomer && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setViewCustomer(null)}>
          <div className="modal w-full max-w-lg max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-accent/20 border border-accent/30 flex items-center justify-center text-sm font-semibold text-accent">
                  {initials(viewCustomer.name)}
                </div>
                <div>
                  <h2 className="font-semibold text-text-primary">{viewCustomer.name}</h2>
                  {viewCustomer.city && <p className="text-xs text-text-tertiary">{viewCustomer.city}</p>}
                </div>
              </div>
              <button onClick={() => setViewCustomer(null)} className="btn-ghost btn p-1.5">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              {/* Contact info */}
              <div>
                <p className="text-xs font-medium text-text-tertiary uppercase tracking-wider mb-3">Contacto</p>
                <div className="space-y-2 text-sm">
                  {viewCustomer.email && (
                    <div className="flex items-center gap-2 text-text-secondary">
                      <Mail className="w-4 h-4 text-text-tertiary shrink-0" />
                      <a href={`mailto:${viewCustomer.email}`} className="hover:text-accent transition-colors">{viewCustomer.email}</a>
                    </div>
                  )}
                  {viewCustomer.phone && (
                    <div className="flex items-center gap-2 text-text-secondary">
                      <Phone className="w-4 h-4 text-text-tertiary shrink-0" />
                      <a href={`tel:${viewCustomer.phone}`} className="hover:text-accent transition-colors">{viewCustomer.phone}</a>
                    </div>
                  )}
                  {viewCustomer.address && (
                    <div className="flex items-center gap-2 text-text-secondary">
                      <MapPin className="w-4 h-4 text-text-tertiary shrink-0" />
                      <span>{viewCustomer.address}{viewCustomer.city ? `, ${viewCustomer.city}` : ''}</span>
                    </div>
                  )}
                  {viewCustomer.rfc && (
                    <div className="flex items-center gap-2 text-text-secondary">
                      <CreditCard className="w-4 h-4 text-text-tertiary shrink-0" />
                      <span className="font-mono">{viewCustomer.rfc}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Credit / Balance */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-surface-2 rounded-xl p-4">
                  <p className="text-xs text-text-tertiary mb-1">Límite de crédito</p>
                  <p className="text-lg font-bold text-text-primary">{formatCurrency(viewCustomer.credit_limit)}</p>
                </div>
                <div className="bg-surface-2 rounded-xl p-4">
                  <p className="text-xs text-text-tertiary mb-1">Saldo pendiente</p>
                  <p className={cn('text-lg font-bold', viewCustomer.balance > 0 ? 'text-amber-400' : 'text-emerald-400')}>
                    {formatCurrency(viewCustomer.balance)}
                  </p>
                </div>
              </div>

              {/* Recent sales */}
              <div>
                <p className="text-xs font-medium text-text-tertiary uppercase tracking-wider mb-3">Últimas compras</p>
                {loadingSales ? (
                  <div className="flex items-center justify-center py-8">
                    <span className="w-5 h-5 border-2 border-border border-t-accent rounded-full animate-spin" />
                  </div>
                ) : customerSales.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <ShoppingCart className="w-8 h-8 text-text-tertiary mb-2 opacity-30" />
                    <p className="text-sm text-text-secondary">Sin compras registradas</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {customerSales.map((sale) => (
                      <div key={sale.id} className="flex items-center justify-between bg-surface-2 rounded-lg px-3 py-2.5">
                        <div>
                          <p className="text-sm font-mono text-accent">{sale.folio}</p>
                          <p className="text-xs text-text-tertiary">{formatDate(sale.created_at)} · {sale.payment_method}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-text-primary">{formatCurrency(sale.total)}</p>
                          <p className="text-xs text-text-tertiary capitalize">{sale.status}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
