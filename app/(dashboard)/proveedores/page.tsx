'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, Search, X, Phone, Mail, Building2, Factory } from 'lucide-react'
import toast from 'react-hot-toast'
import { cn } from '@/lib/utils/cn'
import { EmptyState } from '@/components/ui/empty-state'
import { CardSkeleton } from '@/components/ui/skeleton'
import type { Supplier } from '@/types'

export default function ProveedoresPage() {
  const supabase = createClient()
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    name: '', contact_name: '', email: '', phone: '', address: '', rfc: '', payment_terms: '30',
  })

  const fetchSuppliers = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase.from('suppliers').select('*').order('name')
    setSuppliers((data as Supplier[]) ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { fetchSuppliers() }, [fetchSuppliers])

  const filtered = suppliers.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.contact_name?.toLowerCase().includes(search.toLowerCase()) ||
      s.email?.toLowerCase().includes(search.toLowerCase())
  )

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name) { toast.error('El nombre es requerido'); return }
    setSaving(true)

    const { error } = await supabase.from('suppliers').insert({
      name: form.name,
      contact_name: form.contact_name || null,
      email: form.email || null,
      phone: form.phone || null,
      address: form.address || null,
      rfc: form.rfc || null,
      payment_terms: parseInt(form.payment_terms) || 30,
      is_active: true,
    })

    if (error) { toast.error('Error al crear proveedor') } else {
      toast.success('Proveedor creado')
      setShowModal(false)
      setForm({ name: '', contact_name: '', email: '', phone: '', address: '', rfc: '', payment_terms: '30' })
      fetchSuppliers()
    }
    setSaving(false)
  }

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Proveedores</h1>
          <p className="text-xs text-text-tertiary mt-0.5">{suppliers.length} proveedores</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary btn">
          <Plus className="w-4 h-4" /> Nuevo proveedor
        </button>
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar proveedor..." className="input pl-9" />
      </div>

      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={search ? <Search className="w-6 h-6" /> : <Factory className="w-6 h-6" />}
          title={search ? 'Sin resultados' : 'Sin proveedores aún'}
          description={search ? `No encontramos proveedores con "${search}"` : 'Agrega tus proveedores para gestionar compras y créditos de abastecimiento.'}
          action={!search ? { label: 'Agregar proveedor', onClick: () => setShowModal(true) } : undefined}
        />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((supplier) => (
            <div key={supplier.id} className="card-hover p-5">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-surface-3 border border-border flex items-center justify-center shrink-0">
                  <Building2 className="w-5 h-5 text-text-tertiary" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-text-primary text-sm truncate">{supplier.name}</h3>
                  {supplier.contact_name && (
                    <p className="text-xs text-text-tertiary mt-0.5">Contacto: {supplier.contact_name}</p>
                  )}
                </div>
                <span className={cn('badge', supplier.is_active ? 'badge-green' : 'badge-gray')}>
                  {supplier.is_active ? 'Activo' : 'Inactivo'}
                </span>
              </div>
              <div className="space-y-1.5 text-xs text-text-tertiary">
                {supplier.email && (
                  <div className="flex items-center gap-2"><Mail className="w-3.5 h-3.5 shrink-0" /><span className="truncate">{supplier.email}</span></div>
                )}
                {supplier.phone && (
                  <div className="flex items-center gap-2"><Phone className="w-3.5 h-3.5 shrink-0" /><span>{supplier.phone}</span></div>
                )}
              </div>
              {supplier.payment_terms && (
                <div className="mt-3 pt-3 border-t border-border/50">
                  <p className="text-xs text-text-tertiary">Días de crédito: <span className="text-text-primary font-medium">{supplier.payment_terms} días</span></p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h2 className="font-semibold text-text-primary">Nuevo proveedor</h2>
              <button onClick={() => setShowModal(false)} className="btn-ghost btn p-1.5"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="label">Nombre de la empresa *</label>
                  <input type="text" value={form.name} onChange={(e) => setForm(p => ({ ...p, name: e.target.value }))} className="input" placeholder="Proveedor SA de CV" required />
                </div>
                <div>
                  <label className="label">Contacto</label>
                  <input type="text" value={form.contact_name} onChange={(e) => setForm(p => ({ ...p, contact_name: e.target.value }))} className="input" placeholder="Nombre del contacto" />
                </div>
                <div>
                  <label className="label">RFC</label>
                  <input type="text" value={form.rfc} onChange={(e) => setForm(p => ({ ...p, rfc: e.target.value }))} className="input" placeholder="XAXX010101000" />
                </div>
                <div>
                  <label className="label">Email</label>
                  <input type="email" value={form.email} onChange={(e) => setForm(p => ({ ...p, email: e.target.value }))} className="input" placeholder="ventas@proveedor.com" />
                </div>
                <div>
                  <label className="label">Teléfono</label>
                  <input type="tel" value={form.phone} onChange={(e) => setForm(p => ({ ...p, phone: e.target.value }))} className="input" placeholder="55 1234 5678" />
                </div>
                <div className="col-span-2">
                  <label className="label">Dirección</label>
                  <input type="text" value={form.address} onChange={(e) => setForm(p => ({ ...p, address: e.target.value }))} className="input" placeholder="Dirección completa" />
                </div>
                <div>
                  <label className="label">Días de crédito</label>
                  <select className="input" value={form.payment_terms} onChange={(e) => setForm(p => ({ ...p, payment_terms: e.target.value }))}>
                    <option value="0">Contado</option>
                    <option value="8">8 días</option>
                    <option value="15">15 días</option>
                    <option value="30">30 días</option>
                    <option value="45">45 días</option>
                    <option value="60">60 días</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary btn flex-1">Cancelar</button>
                <button type="submit" disabled={saving} className="btn-primary btn flex-1">
                  {saving ? 'Guardando...' : 'Crear proveedor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
