'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import { useDebounce } from '@/lib/hooks/use-debounce'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency, formatDate, initials } from '@/lib/utils/format'
import { Plus, Search, X, Phone, Mail, MapPin, CreditCard, Users, TrendingUp, AlertCircle, Eye, ShoppingCart, Building2, Download, Upload, FileSpreadsheet, Edit2, MessageCircle, Wallet, ChevronDown, ChevronUp } from 'lucide-react'
import toast from 'react-hot-toast'
import { EmptyState } from '@/components/ui/empty-state'
import { cn } from '@/lib/utils/cn'
import type { Customer, Sale } from '@/types'

const WhatsAppIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
)

export default function ClientesPage() {
  const supabase = createClient()
  const searchParams = useSearchParams()
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
  const [editCustomer, setEditCustomer] = useState<Customer | null>(null)
  const [editForm, setEditForm] = useState({
    name: '', email: '', phone: '', address: '', city: '', rfc: '', credit_limit: '',
  })
  const [showImport, setShowImport] = useState(false)
  const [importing, setImporting] = useState(false)
  const [importPreview, setImportPreview] = useState<{ name: string; email: string; phone: string; city: string; rfc: string }[]>([])
  const [paymentAmount, setPaymentAmount] = useState('')
  const [registeringPayment, setRegisteringPayment] = useState(false)
  const [tagInput, setTagInput] = useState('')
  const [savingTags, setSavingTags] = useState(false)
  const [showCartera, setShowCartera] = useState(false)

  const fetchCustomers = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase.from('customers').select('*').order('name')
    setCustomers((data as Customer[]) ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { fetchCustomers() }, [fetchCustomers])
  useEffect(() => { if (searchParams.get('new') === '1') setShowModal(true) }, [searchParams])

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

  const openEdit = (customer: Customer) => {
    setEditCustomer(customer)
    setEditForm({
      name: customer.name,
      email: customer.email ?? '',
      phone: customer.phone ?? '',
      address: customer.address ?? '',
      city: customer.city ?? '',
      rfc: customer.rfc ?? '',
      credit_limit: String(customer.credit_limit),
    })
  }

  const handleUpdateCustomer = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editCustomer) return
    setSaving(true)
    const { error } = await supabase.from('customers').update({
      name: editForm.name,
      email: editForm.email || null,
      phone: editForm.phone || null,
      address: editForm.address || null,
      city: editForm.city || null,
      rfc: editForm.rfc || null,
      credit_limit: parseFloat(editForm.credit_limit) || 0,
    }).eq('id', editCustomer.id)
    if (error) toast.error('Error al actualizar cliente')
    else { toast.success('Cliente actualizado'); setEditCustomer(null); fetchCustomers() }
    setSaving(false)
  }

  const handleCSVFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const text = ev.target?.result as string
      const lines = text.split('\n').map((l) => l.trim()).filter(Boolean).slice(1)
      const rows = lines.map((line) => {
        const cols = line.split(',').map((c) => c.replace(/^"|"$/g, '').trim())
        return { name: cols[0] ?? '', email: cols[1] ?? '', phone: cols[2] ?? '', city: cols[3] ?? '', rfc: cols[4] ?? '' }
      }).filter((r) => r.name)
      setImportPreview(rows)
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  const handleImportCustomers = async () => {
    if (importPreview.length === 0) return
    setImporting(true)
    let success = 0
    for (const row of importPreview) {
      const { error } = await supabase.from('customers').insert({
        name: row.name,
        email: row.email || null,
        phone: row.phone || null,
        city: row.city || null,
        rfc: row.rfc || null,
        credit_limit: 0,
        balance: 0,
        tags: [],
        is_active: true,
      })
      if (!error) success++
    }
    toast.success(`${success} clientes importados`)
    setShowImport(false)
    setImportPreview([])
    fetchCustomers()
    setImporting(false)
  }

  const exportCSV = () => {
    const csv = ['Nombre,Email,Teléfono,Ciudad,RFC,Límite de crédito,Saldo,Estado']
    customers.forEach((c) => {
      csv.push(`"${c.name}",${c.email ?? ''},${c.phone ?? ''},${c.city ?? ''},${c.rfc ?? ''},${c.credit_limit},${c.balance},${c.is_active ? 'Activo' : 'Inactivo'}`)
    })
    const blob = new Blob([csv.join('\n')], { type: 'text/csv' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `clientes-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
  }

  const downloadTemplate = () => {
    const csv = 'Nombre,Email,Teléfono,Ciudad,RFC\n"Empresa Ejemplo S.A.",contacto@empresa.com,555-1234,CDMX,EEJ010101ABC'
    const blob = new Blob([csv], { type: 'text/csv' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = 'plantilla-clientes.csv'
    a.click()
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

  const handleRegisterPayment = async () => {
    if (!viewCustomer) return
    const amount = parseFloat(paymentAmount)
    if (!amount || amount <= 0) { toast.error('Monto inválido'); return }
    if (amount > viewCustomer.balance) { toast.error('El pago excede el saldo pendiente'); return }
    setRegisteringPayment(true)
    const newBalance = viewCustomer.balance - amount
    const { error } = await supabase.from('customers').update({ balance: newBalance }).eq('id', viewCustomer.id)
    if (error) {
      toast.error('Error al registrar pago')
    } else {
      await supabase.from('transactions').insert({
        type: 'ingreso',
        category: 'Cobro de deuda',
        description: `Pago de ${viewCustomer.name}`,
        amount,
        date: new Date().toISOString().split('T')[0],
        reference: viewCustomer.name,
      })
      toast.success('Pago registrado')
      setViewCustomer(prev => prev ? { ...prev, balance: newBalance } : null)
      setPaymentAmount('')
      fetchCustomers()
    }
    setRegisteringPayment(false)
  }

  const handleAddTag = async (tag: string) => {
    if (!viewCustomer || !tag.trim()) return
    const newTag = tag.trim()
    if (viewCustomer.tags?.includes(newTag)) return
    setSavingTags(true)
    const newTags = Array.from(new Set((viewCustomer.tags ?? []).concat(newTag)))
    const { error } = await supabase.from('customers').update({ tags: newTags }).eq('id', viewCustomer.id)
    if (!error) {
      setViewCustomer(prev => prev ? { ...prev, tags: newTags } : null)
      setTagInput('')
      fetchCustomers()
    }
    setSavingTags(false)
  }

  const handleRemoveTag = async (tag: string) => {
    if (!viewCustomer) return
    setSavingTags(true)
    const newTags = (viewCustomer.tags ?? []).filter(t => t !== tag)
    const { error } = await supabase.from('customers').update({ tags: newTags }).eq('id', viewCustomer.id)
    if (!error) {
      setViewCustomer(prev => prev ? { ...prev, tags: newTags } : null)
      fetchCustomers()
    }
    setSavingTags(false)
  }

  const TAG_SUGGESTIONS = ['VIP', 'Mayoreo', 'Menudeo', 'Gobierno', 'Nuevo', 'Moroso', 'Premium', 'Exportación']

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
        <div className="flex items-center gap-2">
          <button onClick={exportCSV} className="btn-secondary btn btn-sm">
            <Download className="w-3.5 h-3.5" /> Exportar
          </button>
          <button onClick={() => setShowImport(true)} className="btn-secondary btn btn-sm">
            <Upload className="w-3.5 h-3.5" /> Importar
          </button>
          <button onClick={() => setShowModal(true)} className="btn-primary btn">
            <Plus className="w-4 h-4" /> Nuevo cliente
          </button>
        </div>
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

      {/* Cartera pendiente */}
      {customers.filter(c => c.balance > 0).length > 0 && (
        <div className="mb-5">
          <button
            onClick={() => setShowCartera(!showCartera)}
            className="w-full flex items-center justify-between bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 hover:bg-amber-500/15 transition-colors group"
          >
            <div className="flex items-center gap-3">
              <Wallet className="w-5 h-5 text-amber-400 shrink-0" />
              <div className="text-left">
                <p className="text-sm font-semibold text-amber-300">
                  Cartera pendiente: {formatCurrency(customers.reduce((s, c) => s + c.balance, 0))}
                </p>
                <p className="text-xs text-amber-400/70">
                  {customers.filter(c => c.balance > 0).length} clientes con saldo — clic para {showCartera ? 'ocultar' : 'ver'}
                </p>
              </div>
            </div>
            {showCartera ? <ChevronUp className="w-4 h-4 text-amber-400" /> : <ChevronDown className="w-4 h-4 text-amber-400" />}
          </button>

          {showCartera && (
            <div className="mt-2 border border-border rounded-xl overflow-hidden">
              <table className="table text-xs">
                <thead>
                  <tr>
                    <th>Cliente</th>
                    <th>Ciudad</th>
                    <th className="text-right">Saldo</th>
                    <th className="text-right">Límite</th>
                    <th className="text-center">% Usado</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {customers
                    .filter(c => c.balance > 0)
                    .sort((a, b) => b.balance - a.balance)
                    .map((c) => {
                      const pct = c.credit_limit > 0 ? Math.min(100, (c.balance / c.credit_limit) * 100) : 0
                      const isOver = c.balance > c.credit_limit && c.credit_limit > 0
                      return (
                        <tr key={c.id} className="cursor-pointer" onClick={() => openCustomerDetail(c)}>
                          <td className="font-medium text-text-primary">{c.name}</td>
                          <td className="text-text-tertiary">{c.city ?? '—'}</td>
                          <td className={cn('text-right font-semibold', isOver ? 'text-red-400' : 'text-amber-400')}>
                            {formatCurrency(c.balance)}
                          </td>
                          <td className="text-right text-text-tertiary">{c.credit_limit > 0 ? formatCurrency(c.credit_limit) : '—'}</td>
                          <td className="text-center">
                            {c.credit_limit > 0 ? (
                              <span className={cn('font-medium', isOver ? 'text-red-400' : pct > 80 ? 'text-amber-400' : 'text-text-secondary')}>
                                {pct.toFixed(0)}%
                              </span>
                            ) : '—'}
                          </td>
                          <td onClick={(e) => e.stopPropagation()}>
                            {c.phone && (
                              <a
                                href={`https://wa.me/${c.phone.replace(/\D/g, '')}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-emerald-400 hover:text-emerald-300"
                                title="WhatsApp"
                              >
                                <WhatsAppIcon className="w-3.5 h-3.5" />
                              </a>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                </tbody>
              </table>
            </div>
          )}
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
                      <span className="flex-1">{customer.phone}</span>
                      <a
                        href={`https://wa.me/${customer.phone.replace(/\D/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="text-emerald-400 hover:text-emerald-300 transition-colors"
                        title="Contactar por WhatsApp"
                      >
                        <WhatsAppIcon className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  )}
                  {customer.rfc && (
                    <div className="flex items-center gap-2">
                      <CreditCard className="w-3.5 h-3.5 shrink-0" />
                      <span>{customer.rfc}</span>
                    </div>
                  )}
                </div>

                {customer.tags && customer.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {customer.tags.map((tag) => (
                      <span key={tag} className="text-2xs px-2 py-0.5 rounded-full bg-accent/10 text-accent border border-accent/20 font-medium">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                <div className="divider" />

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <div>
                      <p className="text-text-tertiary">Crédito</p>
                      <p className="font-semibold text-text-primary">{formatCurrency(customer.credit_limit)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => { e.stopPropagation(); openEdit(customer) }}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg hover:bg-surface-3 text-text-tertiary hover:text-text-primary"
                        title="Editar cliente"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <div className="text-right">
                        <p className="text-text-tertiary">Saldo</p>
                        <p className={`font-semibold ${customer.balance > 0 ? (customer.balance > customer.credit_limit && customer.credit_limit > 0 ? 'text-red-400' : 'text-amber-400') : 'text-emerald-400'}`}>
                          {formatCurrency(customer.balance)}
                        </p>
                      </div>
                    </div>
                  </div>
                  {customer.credit_limit > 0 && (
                    <div className="h-1.5 bg-surface-3 rounded-full overflow-hidden">
                      <div
                        className={cn('h-full rounded-full transition-all', customer.balance > customer.credit_limit ? 'bg-red-400' : customer.balance / customer.credit_limit > 0.8 ? 'bg-amber-400' : 'bg-accent')}
                        style={{ width: `${Math.min(100, (customer.balance / customer.credit_limit) * 100).toFixed(0)}%` }}
                      />
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Edit modal */}
      {editCustomer && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setEditCustomer(null)}>
          <div className="modal">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h2 className="font-semibold text-text-primary">Editar cliente</h2>
              <button onClick={() => setEditCustomer(null)} className="btn-ghost btn p-1.5"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleUpdateCustomer} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="label">Nombre *</label>
                  <input type="text" value={editForm.name} onChange={(e) => setEditForm(f => ({ ...f, name: e.target.value }))} className="input" required />
                </div>
                <div>
                  <label className="label">Email</label>
                  <input type="email" value={editForm.email} onChange={(e) => setEditForm(f => ({ ...f, email: e.target.value }))} className="input" placeholder="contacto@empresa.com" />
                </div>
                <div>
                  <label className="label">Teléfono</label>
                  <input type="tel" value={editForm.phone} onChange={(e) => setEditForm(f => ({ ...f, phone: e.target.value }))} className="input" placeholder="55 1234 5678" />
                </div>
                <div>
                  <label className="label">RFC</label>
                  <input type="text" value={editForm.rfc} onChange={(e) => setEditForm(f => ({ ...f, rfc: e.target.value.toUpperCase() }))} className="input" placeholder="XAXX010101000" />
                </div>
                <div>
                  <label className="label">Ciudad</label>
                  <input type="text" value={editForm.city} onChange={(e) => setEditForm(f => ({ ...f, city: e.target.value }))} className="input" placeholder="CDMX" />
                </div>
                <div className="col-span-2">
                  <label className="label">Dirección</label>
                  <input type="text" value={editForm.address} onChange={(e) => setEditForm(f => ({ ...f, address: e.target.value }))} className="input" placeholder="Calle, Número, Colonia" />
                </div>
                <div>
                  <label className="label">Límite de crédito</label>
                  <input type="number" min="0" step="100" value={editForm.credit_limit} onChange={(e) => setEditForm(f => ({ ...f, credit_limit: e.target.value }))} className="input" />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setEditCustomer(null)} className="btn-secondary btn flex-1">Cancelar</button>
                <button type="submit" disabled={saving} className="btn-primary btn flex-1">
                  {saving ? 'Guardando...' : 'Guardar cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CSV Import modal */}
      {showImport && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowImport(false)}>
          <div className="modal w-full max-w-xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <div>
                <h2 className="font-semibold text-text-primary">Importar clientes desde CSV</h2>
                <p className="text-xs text-text-tertiary mt-0.5">Columnas: Nombre, Email, Teléfono, Ciudad, RFC</p>
              </div>
              <button onClick={() => setShowImport(false)} className="btn-ghost btn p-1.5"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-surface-2 border border-dashed border-border rounded-xl p-6 flex flex-col items-center gap-3 text-center">
                <FileSpreadsheet className="w-8 h-8 text-text-tertiary opacity-50" />
                <div>
                  <p className="text-sm text-text-secondary">Arrastra tu archivo CSV o</p>
                  <label className="text-accent text-sm cursor-pointer hover:underline">
                    selecciona un archivo
                    <input type="file" accept=".csv" onChange={handleCSVFile} className="hidden" />
                  </label>
                </div>
                <button onClick={downloadTemplate} className="btn-secondary btn btn-sm text-xs">
                  <Download className="w-3 h-3" /> Descargar plantilla
                </button>
              </div>

              {importPreview.length > 0 && (
                <div>
                  <p className="text-xs text-text-tertiary mb-2">{importPreview.length} clientes listos para importar:</p>
                  <div className="max-h-48 overflow-y-auto table-container">
                    <table className="table text-xs">
                      <thead><tr><th>Nombre</th><th>Email</th><th>Teléfono</th><th>Ciudad</th></tr></thead>
                      <tbody>
                        {importPreview.slice(0, 15).map((r, i) => (
                          <tr key={i}>
                            <td className="font-medium">{r.name}</td>
                            <td className="text-text-tertiary">{r.email || '—'}</td>
                            <td className="text-text-tertiary">{r.phone || '—'}</td>
                            <td className="text-text-tertiary">{r.city || '—'}</td>
                          </tr>
                        ))}
                        {importPreview.length > 15 && (
                          <tr><td colSpan={4} className="text-center text-text-tertiary py-2">...y {importPreview.length - 15} más</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <button type="button" onClick={() => { setShowImport(false); setImportPreview([]) }} className="btn-secondary btn flex-1">Cancelar</button>
                <button
                  onClick={handleImportCustomers}
                  disabled={importing || importPreview.length === 0}
                  className="btn-primary btn flex-1"
                >
                  {importing ? 'Importando...' : `Importar ${importPreview.length} clientes`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create modal */}
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
                      <a href={`tel:${viewCustomer.phone}`} className="hover:text-accent transition-colors flex-1">{viewCustomer.phone}</a>
                      <a
                        href={`https://wa.me/${viewCustomer.phone.replace(/\D/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 transition-colors rounded-lg text-xs font-medium"
                      >
                        <WhatsAppIcon className="w-3.5 h-3.5" />
                        WhatsApp
                      </a>
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

              {/* Tags */}
              <div>
                <p className="text-xs font-medium text-text-tertiary uppercase tracking-wider mb-3">Etiquetas</p>
                <div className="flex flex-wrap gap-2 mb-2">
                  {(viewCustomer.tags ?? []).map((tag) => (
                    <span key={tag} className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-accent/10 text-accent border border-accent/20 font-medium">
                      {tag}
                      <button
                        onClick={() => handleRemoveTag(tag)}
                        disabled={savingTags}
                        className="ml-0.5 hover:text-red-400 transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddTag(tagInput) } }}
                    placeholder="Nueva etiqueta..."
                    className="input h-8 text-xs flex-1"
                  />
                  <button
                    onClick={() => handleAddTag(tagInput)}
                    disabled={savingTags || !tagInput.trim()}
                    className="btn-secondary btn btn-sm text-xs px-3"
                  >
                    +
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {TAG_SUGGESTIONS.filter(t => !(viewCustomer.tags ?? []).includes(t)).map((tag) => (
                    <button
                      key={tag}
                      onClick={() => handleAddTag(tag)}
                      className="text-2xs px-2 py-0.5 rounded-full bg-surface-3 text-text-tertiary hover:bg-accent/10 hover:text-accent border border-border hover:border-accent/30 transition-all"
                    >
                      + {tag}
                    </button>
                  ))}
                </div>
              </div>

              {/* Credit / Balance */}
              <div className="bg-surface-2 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-text-tertiary uppercase tracking-wider">Crédito</p>
                  {viewCustomer.balance > viewCustomer.credit_limit && viewCustomer.credit_limit > 0 && (
                    <span className="badge badge-red flex items-center gap-1"><AlertCircle className="w-3 h-3" /> Límite excedido</span>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-text-tertiary">Límite</p>
                    <p className="text-base font-bold text-text-primary">{formatCurrency(viewCustomer.credit_limit)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-text-tertiary">Saldo pendiente</p>
                    <p className={cn('text-base font-bold', viewCustomer.balance > 0 ? 'text-amber-400' : 'text-emerald-400')}>
                      {formatCurrency(viewCustomer.balance)}
                    </p>
                  </div>
                </div>
                {viewCustomer.credit_limit > 0 && (
                  <div>
                    <div className="h-2 bg-surface-3 rounded-full overflow-hidden">
                      <div
                        className={cn('h-full rounded-full transition-all', viewCustomer.balance > viewCustomer.credit_limit ? 'bg-red-400' : viewCustomer.balance / viewCustomer.credit_limit > 0.8 ? 'bg-amber-400' : 'bg-accent')}
                        style={{ width: `${Math.min(100, (viewCustomer.balance / viewCustomer.credit_limit) * 100).toFixed(1)}%` }}
                      />
                    </div>
                    <p className="text-2xs text-text-tertiary mt-1">
                      {((viewCustomer.balance / viewCustomer.credit_limit) * 100).toFixed(1)}% utilizado
                    </p>
                  </div>
                )}
                {viewCustomer.balance > 0 && (
                  <div className="flex gap-2 pt-1">
                    <input
                      type="number"
                      min="0.01"
                      step="0.01"
                      max={viewCustomer.balance}
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(e.target.value)}
                      className="input flex-1 h-8 text-sm"
                      placeholder="Monto a pagar..."
                    />
                    <button
                      onClick={handleRegisterPayment}
                      disabled={registeringPayment || !paymentAmount}
                      className="btn-primary btn btn-sm"
                    >
                      {registeringPayment ? '...' : 'Registrar pago'}
                    </button>
                  </div>
                )}
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
