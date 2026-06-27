'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency, formatDate } from '@/lib/utils/format'
import { Plus, Search, X, ShoppingCart, Package, ArrowUpDown, ArrowUp, ArrowDown, Download, Eye, ChevronRight, Printer, Truck } from 'lucide-react'
import Link from 'next/link'
import { EmptyState } from '@/components/ui/empty-state'
import { TableSkeleton } from '@/components/ui/skeleton'
import toast from 'react-hot-toast'
import { cn } from '@/lib/utils/cn'
import type { Sale, Customer, Product, SaleItem, SaleStatus } from '@/types'

const STATUS_BADGE: Record<SaleStatus, string> = {
  pendiente: 'badge-yellow',
  confirmada: 'badge-accent',
  entregada: 'badge-green',
  cancelada: 'badge-gray',
}

const STATUS_LABELS: Record<SaleStatus, string> = {
  pendiente: 'Pendiente',
  confirmada: 'Confirmada',
  entregada: 'Entregada',
  cancelada: 'Cancelada',
}

interface CartItem {
  product: Product
  quantity: number
  unit_price: number
  discount: number
}

export default function VentasPage() {
  const supabase = createClient()
  const searchParams = useSearchParams()
  const [sales, setSales] = useState<Sale[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [search, setSearch] = useState('')
  const [productSearch, setProductSearch] = useState('')
  const [sortField, setSortField] = useState<'created_at' | 'total' | 'status'>('created_at')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [cart, setCart] = useState<CartItem[]>([])
  const [paymentMethod, setPaymentMethod] = useState<'efectivo' | 'transferencia' | 'credito'>('efectivo')
  const [saleNotes, setSaleNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [filterStatus, setFilterStatus] = useState<SaleStatus | 'all'>('all')
  const [viewSale, setViewSale] = useState<Sale | null>(null)
  const [saleItems, setSaleItems] = useState<(SaleItem & { product: { name: string; sku: string } })[]>([])
  const [loadingItems, setLoadingItems] = useState(false)

  const fetchData = useCallback(async () => {
    setLoading(true)
    const [{ data: salesData }, { data: customersData }, { data: productsData }] = await Promise.all([
      supabase.from('sales').select('*, customer:customers(name)').order('created_at', { ascending: false }).limit(50),
      supabase.from('customers').select('*').eq('is_active', true).order('name'),
      supabase.from('products').select('*').eq('is_active', true).order('name'),
    ])
    setSales((salesData as Sale[]) ?? [])
    setCustomers((customersData as Customer[]) ?? [])
    setProducts((productsData as Product[]) ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { fetchData() }, [fetchData])
  useEffect(() => { if (searchParams.get('new') === '1') setShowModal(true) }, [searchParams])

  const toggleSort = (field: typeof sortField) => {
    if (sortField === field) setSortDir((d) => d === 'asc' ? 'desc' : 'asc')
    else { setSortField(field); setSortDir('desc') }
  }

  const SortIcon = ({ field }: { field: typeof sortField }) => {
    if (sortField !== field) return <ArrowUpDown className="w-3 h-3 text-text-tertiary" />
    return sortDir === 'asc' ? <ArrowUp className="w-3 h-3 text-accent" /> : <ArrowDown className="w-3 h-3 text-accent" />
  }

  const filteredSales = sales
    .filter(
      (s) =>
        (filterStatus === 'all' || s.status === filterStatus) &&
        (s.folio?.toLowerCase().includes(search.toLowerCase()) ||
        (s.customer as unknown as { name: string })?.name?.toLowerCase().includes(search.toLowerCase()))
    )
    .sort((a, b) => {
      const dir = sortDir === 'asc' ? 1 : -1
      if (sortField === 'total') return (a.total - b.total) * dir
      if (sortField === 'status') return a.status.localeCompare(b.status) * dir
      return (new Date(a.created_at).getTime() - new Date(b.created_at).getTime()) * dir
    })

  const filteredProducts = products.filter(
    (p) =>
      productSearch.trim() === '' ||
      p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
      p.sku.toLowerCase().includes(productSearch.toLowerCase())
  )

  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.product.id === product.id)
      if (existing) {
        return prev.map((c) =>
          c.product.id === product.id ? { ...c, quantity: c.quantity + 1 } : c
        )
      }
      return [...prev, { product, quantity: 1, unit_price: product.sale_price, discount: 0 }]
    })
  }

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((c) => c.product.id !== productId))
  }

  const cartTotal = cart.reduce(
    (sum, item) => sum + item.unit_price * item.quantity * (1 - item.discount / 100),
    0
  )

  const handleCreateSale = async () => {
    if (!selectedCustomer) { toast.error('Selecciona un cliente'); return }
    if (cart.length === 0) { toast.error('Agrega al menos un producto'); return }
    setSaving(true)

    const subtotal = cartTotal
    const tax = subtotal * 0.16
    const total = subtotal + tax

    // Generate sequential folio
    const { count: saleCount } = await supabase.from('sales').select('id', { count: 'exact' })
    const folio = `VTA-${String((saleCount ?? 0) + 1).padStart(5, '0')}`

    const { data: saleData, error } = await supabase.from('sales').insert({
      customer_id: selectedCustomer.id,
      status: 'pendiente',
      payment_method: paymentMethod,
      subtotal,
      discount: 0,
      tax,
      total,
      folio,
      notes: saleNotes.trim() || null,
    }).select().single()

    if (error) {
      toast.error('Error al crear la venta')
      setSaving(false)
      return
    }

    if (saleData) {
      await supabase.from('sale_items').insert(
        cart.map((item) => ({
          sale_id: saleData.id,
          product_id: item.product.id,
          quantity: item.quantity,
          unit_price: item.unit_price,
          discount: item.discount,
          subtotal: item.unit_price * item.quantity * (1 - item.discount / 100),
        }))
      )
    }

    toast.success('Venta creada exitosamente')
    setShowModal(false)
    setCart([])
    setSelectedCustomer(null)
    setSaleNotes('')
    fetchData()
    setSaving(false)
  }

  const openSaleDetail = async (sale: Sale) => {
    setViewSale(sale)
    setLoadingItems(true)
    const { data } = await supabase
      .from('sale_items')
      .select('*, product:products(name, sku)')
      .eq('sale_id', sale.id)
    setSaleItems((data as (SaleItem & { product: { name: string; sku: string } })[]) ?? [])
    setLoadingItems(false)
  }

  const handleCreateDelivery = async (sale: Sale) => {
    const customer = sale.customer as unknown as { address?: string; city?: string }
    const address = [customer?.address, customer?.city].filter(Boolean).join(', ') || 'Dirección por definir'
    const { error } = await supabase.from('deliveries').insert({
      sale_id: sale.id,
      status: 'pendiente',
      address,
      scheduled_date: new Date().toISOString().split('T')[0],
    })
    if (error) toast.error('Error al crear entrega')
    else toast.success('Entrega creada. Puedes verla en el módulo de Entregas.')
  }

  const handleUpdateSaleStatus = async (saleId: string, status: SaleStatus) => {
    const { error } = await supabase.from('sales').update({ status }).eq('id', saleId)
    if (error) { toast.error('Error al actualizar'); return }
    toast.success('Estado actualizado')
    setViewSale(prev => prev ? { ...prev, status } : null)
    fetchData()
  }

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Ventas</h1>
          <p className="text-xs text-text-tertiary mt-0.5">{sales.length} registros · {filteredSales.length} visibles</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              const csv = ['Folio,Cliente,Total,Pago,Estado,Fecha']
              filteredSales.forEach((s) => {
                csv.push(`${s.folio},"${(s.customer as unknown as { name: string })?.name ?? ''}",${s.total},${s.payment_method},${s.status},${formatDate(s.created_at)}`)
              })
              const blob = new Blob([csv.join('\n')], { type: 'text/csv' })
              const a = document.createElement('a')
              a.href = URL.createObjectURL(blob)
              a.download = `ventas-${new Date().toISOString().split('T')[0]}.csv`
              a.click()
            }}
            className="btn-secondary btn btn-sm"
          >
            <Download className="w-3.5 h-3.5" /> Exportar
          </button>
          <button onClick={() => setShowModal(true)} className="btn-primary btn">
            <Plus className="w-4 h-4" /> Nueva venta
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por folio o cliente..."
          className="input pl-9"
        />
      </div>

      {/* Status filter tabs */}
      <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-1">
        {(['all', 'pendiente', 'confirmada', 'entregada', 'cancelada'] as const).map((status) => {
          const count = status === 'all' ? sales.length : sales.filter(s => s.status === status).length
          return (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={cn(
                'flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all shrink-0',
                filterStatus === status
                  ? 'bg-accent text-surface-0'
                  : 'bg-surface-2 text-text-secondary hover:text-text-primary hover:bg-surface-3'
              )}
            >
              {status === 'all' ? 'Todas' : STATUS_LABELS[status]}
              <span className={cn('text-xs px-1.5 py-0.5 rounded-full', filterStatus === status ? 'bg-surface-0/20' : 'bg-surface-3')}>
                {count}
              </span>
            </button>
          )
        })}
      </div>

      {/* Table */}
      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Folio</th>
              <th>Cliente</th>
              <th>
                <button onClick={() => toggleSort('total')} className="flex items-center gap-1 hover:text-text-primary transition-colors">
                  Total <SortIcon field="total" />
                </button>
              </th>
              <th>Pago</th>
              <th>
                <button onClick={() => toggleSort('status')} className="flex items-center gap-1 hover:text-text-primary transition-colors">
                  Estado <SortIcon field="status" />
                </button>
              </th>
              <th>
                <button onClick={() => toggleSort('created_at')} className="flex items-center gap-1 hover:text-text-primary transition-colors">
                  Fecha <SortIcon field="created_at" />
                </button>
              </th>
              <th className="w-8"></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <TableSkeleton rows={6} cols={7} />
            ) : filteredSales.length === 0 ? (
              <tr>
                <td colSpan={7}>
                  <EmptyState
                    icon={<ShoppingCart className="w-6 h-6" />}
                    title={search ? 'Sin resultados' : 'Aún no hay ventas'}
                    description={search ? `No encontramos ventas con "${search}"` : 'Registra tu primera venta y empieza a gestionar tus pedidos.'}
                    action={!search ? { label: 'Nueva venta', onClick: () => setShowModal(true) } : undefined}
                  />
                </td>
              </tr>
            ) : (
              filteredSales.map((sale) => (
                <tr key={sale.id} className="cursor-pointer hover:bg-surface-2/50" onClick={() => openSaleDetail(sale)}>
                  <td className="font-mono text-xs text-accent">{sale.folio}</td>
                  <td className="font-medium text-text-primary">
                    {(sale.customer as unknown as { name: string })?.name ?? '—'}
                  </td>
                  <td className="font-semibold text-text-primary">{formatCurrency(sale.total)}</td>
                  <td className="capitalize">{sale.payment_method}</td>
                  <td>
                    <span className={cn('badge', STATUS_BADGE[sale.status])}>
                      {STATUS_LABELS[sale.status]}
                    </span>
                  </td>
                  <td>{formatDate(sale.created_at)}</td>
                  <td onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center gap-1">
                      <Link
                        href={`/dashboard/ventas/${sale.id}/print`}
                        target="_blank"
                        className="p-1.5 rounded-lg hover:bg-surface-3 text-text-tertiary hover:text-accent transition-colors"
                        title="Imprimir nota de venta"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Printer className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal nueva venta */}
      {showModal && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal w-full max-w-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h2 className="font-semibold text-text-primary">Nueva venta</h2>
              <button onClick={() => setShowModal(false)} className="btn-ghost btn p-1.5">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              {/* Cliente */}
              <div>
                <label className="label">Cliente *</label>
                <select
                  className="input"
                  value={selectedCustomer?.id ?? ''}
                  onChange={(e) => setSelectedCustomer(customers.find((c) => c.id === e.target.value) ?? null)}
                >
                  <option value="">Seleccionar cliente</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              {/* Buscar productos */}
              <div>
                <label className="label">Buscar producto</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
                  <input
                    type="text"
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    placeholder="Nombre o SKU..."
                    className="input pl-9"
                  />
                </div>
                {productSearch && (
                  <div className="mt-2 bg-surface-2 border border-border rounded-lg max-h-40 overflow-y-auto">
                    {filteredProducts.slice(0, 8).map((p) => (
                      <button
                        key={p.id}
                        onClick={() => { addToCart(p); setProductSearch('') }}
                        className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-surface-3 transition-colors text-left border-b border-border/50 last:border-0"
                      >
                        <div>
                          <p className="text-sm text-text-primary">{p.name}</p>
                          <p className="text-xs text-text-tertiary">{p.sku} · Stock: {p.stock}</p>
                        </div>
                        <span className="text-sm font-medium text-accent">{formatCurrency(p.sale_price)}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Cart */}
              {cart.length > 0 && (
                <div>
                  <label className="label">Productos en la orden</label>
                  <div className="space-y-2">
                    {cart.map((item) => {
                      const lineTotal = item.unit_price * item.quantity * (1 - item.discount / 100)
                      return (
                        <div key={item.product.id} className="bg-surface-2 rounded-lg p-3 space-y-2">
                          <div className="flex items-center gap-2">
                            <Package className="w-4 h-4 text-text-tertiary shrink-0" />
                            <p className="text-sm text-text-primary truncate flex-1">{item.product.name}</p>
                            <button onClick={() => removeFromCart(item.product.id)} className="text-text-tertiary hover:text-red-400 transition-colors shrink-0">
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                          <div className="flex items-center gap-2 pl-6">
                            <div className="flex items-center gap-1 shrink-0">
                              <button onClick={() => setCart(prev => prev.map(c => c.product.id === item.product.id ? { ...c, quantity: Math.max(1, c.quantity - 1) } : c))} className="w-6 h-6 rounded bg-surface-3 text-text-secondary hover:text-text-primary flex items-center justify-center text-sm">−</button>
                              <span className="text-sm font-medium w-7 text-center">{item.quantity}</span>
                              <button onClick={() => setCart(prev => prev.map(c => c.product.id === item.product.id ? { ...c, quantity: c.quantity + 1 } : c))} className="w-6 h-6 rounded bg-surface-3 text-text-secondary hover:text-text-primary flex items-center justify-center text-sm">+</button>
                            </div>
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={item.unit_price}
                              onChange={(e) => setCart(prev => prev.map(c => c.product.id === item.product.id ? { ...c, unit_price: parseFloat(e.target.value) || 0 } : c))}
                              className="input text-xs py-1 w-24 text-right"
                              title="Precio unitario"
                            />
                            <div className="flex items-center gap-1">
                              <input
                                type="number"
                                min="0"
                                max="100"
                                step="1"
                                value={item.discount}
                                onChange={(e) => setCart(prev => prev.map(c => c.product.id === item.product.id ? { ...c, discount: Math.min(100, parseFloat(e.target.value) || 0) } : c))}
                                className="input text-xs py-1 w-14 text-center"
                                title="Descuento %"
                              />
                              <span className="text-xs text-text-tertiary shrink-0">%</span>
                            </div>
                            <span className="text-sm font-semibold text-text-primary ml-auto shrink-0">
                              {formatCurrency(lineTotal)}
                            </span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Método de pago */}
              <div>
                <label className="label">Método de pago</label>
                <select
                  className="input"
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as typeof paymentMethod)}
                >
                  <option value="efectivo">Efectivo</option>
                  <option value="transferencia">Transferencia</option>
                  <option value="credito">Crédito</option>
                </select>
              </div>

              {/* Notas */}
              <div>
                <label className="label">Notas (opcional)</label>
                <textarea
                  value={saleNotes}
                  onChange={(e) => setSaleNotes(e.target.value)}
                  className="input resize-none"
                  rows={2}
                  placeholder="Instrucciones de entrega, observaciones..."
                />
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-border bg-surface-2/50 rounded-b-2xl">
              <div className="flex items-center justify-between mb-4">
                <div className="text-sm text-text-secondary">
                  Subtotal: <span className="text-text-primary font-medium">{formatCurrency(cartTotal)}</span>
                  <span className="ml-3">IVA (16%): <span className="text-text-primary font-medium">{formatCurrency(cartTotal * 0.16)}</span></span>
                </div>
                <div className="text-lg font-bold text-text-primary">
                  Total: {formatCurrency(cartTotal * 1.16)}
                </div>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setShowModal(false)} className="btn-secondary btn flex-1">Cancelar</button>
                <button onClick={handleCreateSale} disabled={saving || !selectedCustomer || cart.length === 0} className="btn-primary btn flex-1">
                  {saving ? 'Guardando...' : 'Crear venta'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sale detail modal */}
      {viewSale && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setViewSale(null)}>
          <div className="modal w-full max-w-lg max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <div>
                <h2 className="font-semibold text-text-primary font-mono text-sm">{viewSale.folio}</h2>
                <p className="text-xs text-text-tertiary">{formatDate(viewSale.created_at)}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className={cn('badge', STATUS_BADGE[viewSale.status])}>{STATUS_LABELS[viewSale.status]}</span>
                <Link
                  href={`/dashboard/ventas/${viewSale.id}/print`}
                  target="_blank"
                  className="btn-ghost btn p-1.5 text-text-tertiary hover:text-text-primary"
                  title="Imprimir / PDF"
                >
                  <Printer className="w-4 h-4" />
                </Link>
                <button onClick={() => setViewSale(null)} className="btn-ghost btn p-1.5"><X className="w-4 h-4" /></button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              {/* Customer info */}
              <div className="flex items-center justify-between text-sm">
                <span className="text-text-tertiary">Cliente</span>
                <span className="font-medium text-text-primary">
                  {(viewSale.customer as unknown as { name: string })?.name ?? '—'}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-text-tertiary">Método de pago</span>
                <span className="capitalize text-text-primary">{viewSale.payment_method}</span>
              </div>

              {/* Items */}
              <div>
                <p className="text-xs font-medium text-text-tertiary uppercase tracking-wider mb-3">Productos</p>
                {loadingItems ? (
                  <div className="flex items-center justify-center py-8">
                    <span className="w-5 h-5 border-2 border-border border-t-accent rounded-full animate-spin" />
                  </div>
                ) : saleItems.length === 0 ? (
                  <p className="text-sm text-text-tertiary text-center py-4">Sin productos registrados</p>
                ) : (
                  <div className="space-y-2">
                    {saleItems.map((item) => (
                      <div key={item.id} className="flex items-center gap-3 bg-surface-2 rounded-lg p-3">
                        <Package className="w-4 h-4 text-text-tertiary shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-text-primary truncate">{item.product?.name ?? 'Producto'}</p>
                          <p className="text-xs text-text-tertiary">{item.product?.sku} · {formatCurrency(item.unit_price)} c/u</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-text-primary">{formatCurrency(item.subtotal)}</p>
                          <p className="text-xs text-text-tertiary">×{item.quantity}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Notes */}
              {viewSale.notes && (
                <div className="bg-surface-2 rounded-xl p-4">
                  <p className="text-xs font-medium text-text-tertiary uppercase tracking-wider mb-1.5">Notas</p>
                  <p className="text-sm text-text-secondary">{viewSale.notes}</p>
                </div>
              )}

              {/* Totals */}
              <div className="border-t border-border pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-text-tertiary">Subtotal</span>
                  <span className="text-text-secondary">{formatCurrency(viewSale.subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-text-tertiary">IVA (16%)</span>
                  <span className="text-text-secondary">{formatCurrency(viewSale.tax)}</span>
                </div>
                <div className="flex justify-between text-base font-bold">
                  <span className="text-text-primary">Total</span>
                  <span className="text-accent">{formatCurrency(viewSale.total)}</span>
                </div>
              </div>

              {/* Status progression */}
              {viewSale.status !== 'cancelada' && viewSale.status !== 'entregada' && (
                <div className="border-t border-border pt-4">
                  <p className="text-xs font-medium text-text-tertiary uppercase tracking-wider mb-3">Avanzar estado</p>
                  <div className="flex gap-2 flex-wrap">
                    {viewSale.status === 'pendiente' && (
                      <button onClick={() => handleUpdateSaleStatus(viewSale.id, 'confirmada')} className="btn-primary btn btn-sm flex-1">
                        <ChevronRight className="w-3.5 h-3.5" /> Confirmar
                      </button>
                    )}
                    {viewSale.status === 'confirmada' && (
                      <>
                        <button onClick={() => handleUpdateSaleStatus(viewSale.id, 'entregada')} className="btn-primary btn btn-sm flex-1">
                          <ChevronRight className="w-3.5 h-3.5" /> Marcar entregada
                        </button>
                        <button
                          onClick={() => handleCreateDelivery(viewSale)}
                          className="btn btn-sm bg-purple-500/10 text-purple-400 border border-purple-500/20 hover:bg-purple-500/20"
                          title="Crear entrega en el módulo de entregas"
                        >
                          <Truck className="w-3.5 h-3.5" /> Crear entrega
                        </button>
                      </>
                    )}
                    <button onClick={() => handleUpdateSaleStatus(viewSale.id, 'cancelada')} className="btn-danger btn btn-sm">
                      Cancelar
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
