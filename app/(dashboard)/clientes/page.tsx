'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency, initials } from '@/lib/utils/format'
import { Plus, Search, X, Phone, Mail, MapPin, CreditCard } from 'lucide-react'
import toast from 'react-hot-toast'
import type { Customer } from '@/types'

export default function ClientesPage() {
  const supabase = createClient()
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)
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

  const filtered = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.email?.toLowerCase().includes(search.toLowerCase()) ||
      c.city?.toLowerCase().includes(search.toLowerCase())
  )

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
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-12 h-12 rounded-xl bg-surface-2 flex items-center justify-center mb-3">
            <Search className="w-5 h-5 text-text-tertiary" />
          </div>
          <p className="text-text-secondary text-sm">No se encontraron clientes</p>
          <p className="text-text-tertiary text-xs mt-1">Intenta con otro término de búsqueda</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((customer, idx) => {
            const colorClass = colors[idx % colors.length]
            return (
              <div key={customer.id} className="card-hover p-5 group">
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
    </div>
  )
}
