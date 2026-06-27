'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency, formatDate } from '@/lib/utils/format'
import { Plus, Search, X, ChevronDown, ShoppingCart, Package } from 'lucide-react'
import toast from 'react-hot-toast'
import { cn } from '@/lib/utils/cn'
import type { Sale, Customer, Product, SaleStatus } from '@/types'

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
  const [sales, setSales] = useState<Sale[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [search, setSearch] = useState('')
  const [productSearch, setProductSearch] = useState('')
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [cart, setCart] = useState<CartItem[]>([])
  const [paymentMethod, setPaymentMethod] = useState<'efectivo' | 'transferencia' | 'credito'>('efectivo')
  const [saving, setSaving] = useState(false)

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

  const filteredSales = sales.filter(
    (s) =>
      s.folio?.toLowerCase().includes(search.toLowerCase()) ||
      (s.customer as unknown as { name: string })?.name?.toLowerCase().includes(search.toLowerCase())
  )

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

    const { data: saleData, error } = await supabase.from('sales').insert({
      customer_id: selectedCustomer.id,
      status: 'pendiente',
      payment_method: paymentMethod,
      subtotal,
      discount: 0,
      tax,
      total,
      folio: `VTA-${Date.now()}`,
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
    fetchData()
    setSaving(false)
  }

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Ventas</h1>
          <p className="text-xs text-text-tertiary mt-0.5">{sales.length} registros totales</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary btn">
          <Plus className="w-4 h-4" /> Nueva venta
        </button>
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

      {/* Table */}
      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Folio</th>
              <th>Cliente</th>
              <th>Total</th>
              <th>Pago</th>
              <th>Estado</th>
              <th>Fecha</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="text-center py-12 text-text-tertiary">
                  <span className="inline-block w-5 h-5 border-2 border-border border-t-accent rounded-full animate-spin" />
                </td>
              </tr>
            ) : filteredSales.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-12 text-text-tertiary text-sm">
                  <ShoppingCart className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  No hay ventas registradas
                </td>
              </tr>
            ) : (
              filteredSales.map((sale) => (
                <tr key={sale.id}>
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
                    {cart.map((item) => (
                      <div key={item.product.id} className="flex items-center gap-3 bg-surface-2 rounded-lg p-3">
                        <Package className="w-4 h-4 text-text-tertiary shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-text-primary truncate">{item.product.name}</p>
                          <p className="text-xs text-text-tertiary">{formatCurrency(item.unit_price)} c/u</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button onClick={() => setCart(prev => prev.map(c => c.product.id === item.product.id ? { ...c, quantity: Math.max(1, c.quantity - 1) } : c))} className="w-6 h-6 rounded bg-surface-3 text-text-secondary hover:text-text-primary flex items-center justify-center text-sm">−</button>
                          <span className="text-sm font-medium w-6 text-center">{item.quantity}</span>
                          <button onClick={() => setCart(prev => prev.map(c => c.product.id === item.product.id ? { ...c, quantity: c.quantity + 1 } : c))} className="w-6 h-6 rounded bg-surface-3 text-text-secondary hover:text-text-primary flex items-center justify-center text-sm">+</button>
                        </div>
                        <span className="text-sm font-semibold text-text-primary w-20 text-right">
                          {formatCurrency(item.unit_price * item.quantity)}
                        </span>
                        <button onClick={() => removeFromCart(item.product.id)} className="text-text-tertiary hover:text-red-400 transition-colors">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
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
    </div>
  )
}
