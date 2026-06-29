'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, Search, X, Phone, Mail, Building2, Factory, ShoppingBag, Trash2, Download, PackageCheck, Clock, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import { cn } from '@/lib/utils/cn'
import { EmptyState } from '@/components/ui/empty-state'
import { CardSkeleton } from '@/components/ui/skeleton'
import { formatCurrency, formatDate } from '@/lib/utils/format'
import type { Supplier, Product, Purchase, PurchaseItem } from '@/types'

type PurchaseWithItems = Purchase & { items: (PurchaseItem & { product: { name: string; sku: string } })[] }

interface OrderItem {
  product: Product
  quantity: number
  unit_cost: number
}

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
  const [orderSupplier, setOrderSupplier] = useState<Supplier | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [orderItems, setOrderItems] = useState<OrderItem[]>([])
  const [productSearch, setProductSearch] = useState('')
  const [placingOrder, setPlacingOrder] = useState(false)
  const [expectedDate, setExpectedDate] = useState(
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  )
  const [ordersSupplier, setOrdersSupplier] = useState<Supplier | null>(null)
  const [pendingOrders, setPendingOrders] = useState<PurchaseWithItems[]>([])
  const [loadingOrders, setLoadingOrders] = useState(false)
  const [receivingId, setReceivingId] = useState<string | null>(null)

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

  const openOrderModal = async (supplier: Supplier) => {
    setOrderSupplier(supplier)
    setOrderItems([])
    setProductSearch('')
    if (products.length === 0) {
      const { data } = await supabase.from('products').select('*').eq('is_active', true).order('name')
      setProducts((data as Product[]) ?? [])
    }
  }

  const addProductToOrder = (product: Product) => {
    setOrderItems((prev) => {
      const existing = prev.find((i) => i.product.id === product.id)
      if (existing) return prev
      return [...prev, { product, quantity: 1, unit_cost: product.cost_price }]
    })
  }

  const orderSubtotal = orderItems.reduce((s, i) => s + i.quantity * i.unit_cost, 0)
  const orderTax = orderSubtotal * 0.16
  const orderTotal = orderSubtotal + orderTax

  const handlePlaceOrder = async () => {
    if (!orderSupplier || orderItems.length === 0) return
    setPlacingOrder(true)
    const { count } = await supabase.from('purchases').select('id', { count: 'exact' })
    const folio = `OC-${String((count ?? 0) + 1).padStart(5, '0')}`
    const { data: purchaseData, error } = await supabase.from('purchases').insert({
      supplier_id: orderSupplier.id,
      folio,
      status: 'pendiente',
      subtotal: orderSubtotal,
      tax: orderTax,
      total: orderTotal,
      expected_date: expectedDate,
    }).select().single()
    if (error || !purchaseData) { toast.error('Error al crear orden'); setPlacingOrder(false); return }
    await supabase.from('purchase_items').insert(
      orderItems.map((i) => ({
        purchase_id: purchaseData.id,
        product_id: i.product.id,
        quantity: i.quantity,
        unit_cost: i.unit_cost,
        received_qty: 0,
        subtotal: i.quantity * i.unit_cost,
      }))
    )
    toast.success(`Orden ${folio} creada con ${orderItems.length} productos`)
    setOrderSupplier(null)
    setOrderItems([])
    setPlacingOrder(false)
  }

  const openOrdersView = async (supplier: Supplier) => {
    setOrdersSupplier(supplier)
    setLoadingOrders(true)
    const { data } = await supabase
      .from('purchases')
      .select('*, items:purchase_items(*, product:products(name, sku))')
      .eq('supplier_id', supplier.id)
      .in('status', ['pendiente', 'parcial'])
      .order('created_at', { ascending: false })
      .limit(20)
    setPendingOrders((data as PurchaseWithItems[]) ?? [])
    setLoadingOrders(false)
  }

  const handleReceiveOrder = async (purchase: PurchaseWithItems) => {
    setReceivingId(purchase.id)
    for (const item of purchase.items) {
      const { data: prod } = await supabase.from('products').select('stock').eq('id', item.product_id).single()
      const newStock = (prod?.stock ?? 0) + item.quantity
      await supabase.from('products').update({ stock: newStock }).eq('id', item.product_id)
      await supabase.from('purchase_items').update({ received_qty: item.quantity }).eq('id', item.id)
    }
    await supabase.from('purchases').update({ status: 'recibida', received_at: new Date().toISOString() }).eq('id', purchase.id)
    toast.success(`Orden ${purchase.folio} recibida — stock actualizado`)
    setReceivingId(null)
    if (ordersSupplier) openOrdersView(ordersSupplier)
  }

  const exportCSV = () => {
    const csv = ['Nombre,Contacto,Email,Teléfono,RFC,Días de crédito,Estado']
    suppliers.forEach((s) => {
      csv.push(`"${s.name}","${s.contact_name ?? ''}",${s.email ?? ''},${s.phone ?? ''},${s.rfc ?? ''},${s.payment_terms ?? 0},${s.is_active ? 'Activo' : 'Inactivo'}`)
    })
    const blob = new Blob([csv.join('\n')], { type: 'text/csv' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `proveedores-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
  }

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Proveedores</h1>
          <p className="text-xs text-text-tertiary mt-0.5">{suppliers.length} proveedores</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={exportCSV} className="btn-secondary btn btn-sm">
            <Download className="w-3.5 h-3.5" /> Exportar
          </button>
          <button onClick={() => setShowModal(true)} className="btn-primary btn">
            <Plus className="w-4 h-4" /> Nuevo proveedor
          </button>
        </div>
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
                  <a href={`mailto:${supplier.email}`} className="flex items-center gap-2 hover:text-accent transition-colors">
                    <Mail className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{supplier.email}</span>
                  </a>
                )}
                {supplier.phone && (
                  <a href={`tel:${supplier.phone}`} className="flex items-center gap-2 hover:text-accent transition-colors">
                    <Phone className="w-3.5 h-3.5 shrink-0" />
                    <span>{supplier.phone}</span>
                  </a>
                )}
              </div>
              <div className="mt-3 pt-3 border-t border-border/50 flex items-center justify-between gap-2">
                {supplier.payment_terms ? (
                  <p className="text-xs text-text-tertiary shrink-0">Crédito: <span className="text-text-primary font-medium">{supplier.payment_terms}d</span></p>
                ) : <span />}
                <div className="flex gap-1.5">
                  <button
                    onClick={() => openOrdersView(supplier)}
                    className="btn btn-sm bg-surface-3 hover:bg-purple-500/10 text-text-secondary hover:text-purple-400 border border-border hover:border-purple-500/30 text-xs transition-all"
                  >
                    <PackageCheck className="w-3 h-3" /> Pedidos
                  </button>
                  <button
                    onClick={() => openOrderModal(supplier)}
                    className="btn btn-sm bg-surface-3 hover:bg-accent/10 text-text-secondary hover:text-accent border border-border hover:border-accent/30 text-xs transition-all"
                  >
                    <ShoppingBag className="w-3 h-3" /> Nueva OC
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pending orders view modal */}
      {ordersSupplier && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setOrdersSupplier(null)}>
          <div className="modal w-full max-w-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
              <div>
                <h2 className="font-semibold text-text-primary">Órdenes de compra</h2>
                <p className="text-xs text-text-tertiary mt-0.5">{ordersSupplier.name} · pendientes de recepción</p>
              </div>
              <button onClick={() => setOrdersSupplier(null)} className="btn-ghost btn p-1.5"><X className="w-4 h-4" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              {loadingOrders ? (
                <div className="flex items-center justify-center py-12">
                  <span className="w-6 h-6 border-2 border-border border-t-accent rounded-full animate-spin" />
                </div>
              ) : pendingOrders.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <PackageCheck className="w-8 h-8 text-emerald-400 mb-2 opacity-60" />
                  <p className="text-sm text-text-secondary">Sin órdenes pendientes</p>
                  <p className="text-xs text-text-tertiary mt-1">Todas las órdenes han sido recibidas</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingOrders.map((order) => (
                    <div key={order.id} className="card p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-mono text-sm font-semibold text-text-primary">{order.folio}</p>
                          <p className="text-xs text-text-tertiary flex items-center gap-1 mt-0.5">
                            <Clock className="w-3 h-3" />
                            {order.expected_date ? `Esperada: ${formatDate(order.expected_date)}` : 'Sin fecha estimada'}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-accent">{formatCurrency(order.total)}</p>
                          {order.expected_date && new Date(order.expected_date) < new Date() && (
                            <span className="badge badge-red flex items-center gap-0.5 mt-1"><AlertCircle className="w-3 h-3" />Vencida</span>
                          )}
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        {order.items.map((item) => (
                          <div key={item.id} className="flex items-center justify-between text-xs bg-surface-2 rounded-lg px-3 py-2">
                            <div>
                              <p className="text-text-primary font-medium">{item.product?.name}</p>
                              <p className="text-text-tertiary font-mono">{item.product?.sku}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-text-primary">{item.quantity} uds</p>
                              <p className="text-text-tertiary">{formatCurrency(item.unit_cost)} c/u</p>
                            </div>
                          </div>
                        ))}
                      </div>
                      <button
                        onClick={() => handleReceiveOrder(order)}
                        disabled={receivingId === order.id}
                        className="btn-primary btn btn-sm w-full"
                      >
                        <PackageCheck className="w-3.5 h-3.5" />
                        {receivingId === order.id ? 'Procesando...' : 'Recibir orden completa (+stock)'}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Purchase Order modal */}
      {orderSupplier && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setOrderSupplier(null)}>
          <div className="modal w-full max-w-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
              <div>
                <h2 className="font-semibold text-text-primary">Nueva orden de compra</h2>
                <p className="text-xs text-text-tertiary mt-0.5">{orderSupplier.name}</p>
              </div>
              <button onClick={() => setOrderSupplier(null)} className="btn-ghost btn p-1.5"><X className="w-4 h-4" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              {/* Expected date */}
              <div>
                <label className="label">Fecha de entrega esperada</label>
                <input type="date" value={expectedDate} onChange={(e) => setExpectedDate(e.target.value)} className="input w-full" />
              </div>

              {/* Product search */}
              <div>
                <label className="label">Agregar productos</label>
                <input
                  type="text"
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  placeholder="Buscar producto..."
                  className="input mb-3"
                />
                {productSearch && (
                  <div className="bg-surface-2 border border-border rounded-xl max-h-40 overflow-y-auto">
                    {products
                      .filter((p) => p.name.toLowerCase().includes(productSearch.toLowerCase()) || p.sku.toLowerCase().includes(productSearch.toLowerCase()))
                      .slice(0, 8)
                      .map((p) => (
                        <button
                          key={p.id}
                          onClick={() => { addProductToOrder(p); setProductSearch('') }}
                          className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-surface-3 text-left border-b border-border/50 last:border-0"
                        >
                          <div>
                            <p className="text-sm text-text-primary">{p.name}</p>
                            <p className="text-xs text-text-tertiary font-mono">{p.sku}</p>
                          </div>
                          <span className="text-xs text-text-tertiary">{formatCurrency(p.cost_price)}</span>
                        </button>
                      ))}
                  </div>
                )}
              </div>

              {/* Order items */}
              {orderItems.length > 0 && (
                <div>
                  <p className="label mb-2">Productos en la orden ({orderItems.length})</p>
                  <div className="space-y-2">
                    {orderItems.map((item) => (
                      <div key={item.product.id} className="flex items-center gap-3 bg-surface-2 border border-border rounded-xl p-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-text-primary truncate">{item.product.name}</p>
                          <p className="text-xs text-text-tertiary font-mono">{item.product.sku}</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => setOrderItems((prev) => prev.map((i) => i.product.id === item.product.id ? { ...i, quantity: parseInt(e.target.value) || 1 } : i))}
                            className="input w-16 text-center text-sm py-1"
                          />
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.unit_cost}
                            onChange={(e) => setOrderItems((prev) => prev.map((i) => i.product.id === item.product.id ? { ...i, unit_cost: parseFloat(e.target.value) || 0 } : i))}
                            className="input w-24 text-right text-sm py-1"
                          />
                          <button
                            onClick={() => setOrderItems((prev) => prev.filter((i) => i.product.id !== item.product.id))}
                            className="btn-ghost btn p-1 text-red-400 hover:text-red-300"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Totals */}
                  <div className="mt-4 pt-4 border-t border-border space-y-1.5">
                    <div className="flex justify-between text-sm">
                      <span className="text-text-tertiary">Subtotal</span>
                      <span className="text-text-secondary">{formatCurrency(orderSubtotal)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-text-tertiary">IVA (16%)</span>
                      <span className="text-text-secondary">{formatCurrency(orderTax)}</span>
                    </div>
                    <div className="flex justify-between font-bold">
                      <span className="text-text-primary">Total orden</span>
                      <span className="text-accent">{formatCurrency(orderTotal)}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="px-6 py-4 border-t border-border flex gap-3 shrink-0">
              <button onClick={() => setOrderSupplier(null)} className="btn-secondary btn flex-1">Cancelar</button>
              <button
                onClick={handlePlaceOrder}
                disabled={placingOrder || orderItems.length === 0}
                className="btn-primary btn flex-1"
              >
                {placingOrder ? 'Creando...' : `Crear orden (${orderItems.length} productos)`}
              </button>
            </div>
          </div>
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
