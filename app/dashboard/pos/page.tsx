'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency } from '@/lib/utils/format'
import { Search, X, Plus, Minus, ShoppingCart, Printer, CheckCircle, CreditCard, Banknote, Building2, Trash2 } from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { cn } from '@/lib/utils/cn'
import type { Product, Customer } from '@/types'

interface CartItem {
  product: Product
  quantity: number
  unit_price: number
  discount: number
}

const PAYMENT_METHODS = [
  { id: 'efectivo', label: 'Efectivo', icon: Banknote },
  { id: 'transferencia', label: 'Transferencia', icon: Building2 },
  { id: 'credito', label: 'Crédito', icon: CreditCard },
]

export default function PosPage() {
  const supabase = createClient()
  const [products, setProducts] = useState<Product[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [cart, setCart] = useState<CartItem[]>([])
  const [search, setSearch] = useState('')
  const [customerSearch, setCustomerSearch] = useState('')
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [paymentMethod, setPaymentMethod] = useState<'efectivo' | 'transferencia' | 'credito'>('efectivo')
  const [saving, setSaving] = useState(false)
  const [lastSale, setLastSale] = useState<{ folio: string; total: number; id: string } | null>(null)
  const [orgId, setOrgId] = useState('')
  const [userId, setUserId] = useState('')
  const searchRef = useRef<HTMLInputElement>(null)

  const fetchData = useCallback(async () => {
    const [{ data: prods }, { data: custs }] = await Promise.all([
      supabase.from('products').select('*').eq('is_active', true).order('name'),
      supabase.from('customers').select('id, name, credit_limit, balance').eq('is_active', true).order('name'),
    ])
    setProducts((prods as Product[]) ?? [])
    setCustomers((custs as Customer[]) ?? [])
  }, [])

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) return
      setUserId(session.user.id)
      const { data } = await supabase.from('profiles').select('organization_id').eq('id', session.user.id).single()
      if (data) setOrgId(data.organization_id)
    })
  }, [])
  useEffect(() => { fetchData() }, [fetchData])
  useEffect(() => { searchRef.current?.focus() }, [])

  const filteredProducts = products.filter((p) =>
    search.trim() === '' ||
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.sku.toLowerCase().includes(search.toLowerCase())
  )

  const filteredCustomers = customers.filter((c) =>
    customerSearch.trim() === '' ? false :
    c.name.toLowerCase().includes(customerSearch.toLowerCase())
  )

  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.product.id === product.id)
      if (existing) return prev.map((c) => c.product.id === product.id ? { ...c, quantity: c.quantity + 1 } : c)
      return [...prev, { product, quantity: 1, unit_price: product.sale_price, discount: 0 }]
    })
    setSearch('')
    searchRef.current?.focus()
  }

  const updateQty = (productId: string, delta: number) => {
    setCart((prev) =>
      prev.map((c) => c.product.id === productId ? { ...c, quantity: Math.max(1, c.quantity + delta) } : c)
    )
  }

  const removeItem = (productId: string) => {
    setCart((prev) => prev.filter((c) => c.product.id !== productId))
  }

  const cartSubtotal = cart.reduce((s, i) => s + i.unit_price * i.quantity * (1 - i.discount / 100), 0)
  const cartTax = cartSubtotal * 0.16
  const cartTotal = cartSubtotal + cartTax

  const handleCheckout = async () => {
    if (cart.length === 0) { toast.error('Agrega productos al carrito'); return }
    if (!selectedCustomer) { toast.error('Selecciona un cliente'); return }
    setSaving(true)

    const { count: saleCount } = await supabase.from('sales').select('id', { count: 'exact' })
    const folio = `VTA-${String((saleCount ?? 0) + 1).padStart(5, '0')}`

    const { data: saleData, error } = await supabase.from('sales').insert({
      organization_id: orgId,
      user_id: userId,
      customer_id: selectedCustomer.id,
      status: 'confirmada',
      payment_method: paymentMethod,
      subtotal: cartSubtotal,
      discount: 0,
      tax: cartTax,
      total: cartTotal,
      folio,
    }).select().single()

    if (error) { toast.error('Error al procesar venta'); setSaving(false); return }

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

    setLastSale({ folio, total: cartTotal, id: saleData.id })
    setCart([])
    setSelectedCustomer(null)
    setCustomerSearch('')
    setPaymentMethod('efectivo')
    setSaving(false)
  }

  const clearSale = () => {
    setLastSale(null)
    searchRef.current?.focus()
  }

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Punto de Venta</h1>
          <p className="text-xs text-text-tertiary mt-0.5">Venta rápida · {products.length} productos disponibles</p>
        </div>
        <Link href="/dashboard/ventas" className="btn-secondary btn btn-sm">
          Ver todas las ventas
        </Link>
      </div>

      {/* Success overlay */}
      {lastSale && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-surface-1 border border-border rounded-2xl p-8 max-w-sm w-full mx-4 text-center shadow-modal">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-emerald-400" />
            </div>
            <h3 className="text-xl font-bold text-text-primary mb-1">¡Venta completada!</h3>
            <p className="font-mono text-accent text-lg mb-1">{lastSale.folio}</p>
            <p className="text-2xl font-bold text-text-primary mb-6">{formatCurrency(lastSale.total)}</p>
            <div className="flex gap-3">
              <Link
                href={`/dashboard/ventas/${lastSale.id}/print`}
                target="_blank"
                className="btn-secondary btn flex-1 gap-2"
              >
                <Printer className="w-4 h-4" />
                Imprimir
              </Link>
              <button onClick={clearSale} className="btn-primary btn flex-1">
                Nueva venta
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-5 gap-6 h-[calc(100vh-200px)] min-h-[500px]">
        {/* Left: Product search + grid */}
        <div className="lg:col-span-3 flex flex-col gap-4 overflow-hidden">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
            <input
              ref={searchRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar producto por nombre o SKU... (o escanea código)"
              className="input pl-9 text-sm"
              autoComplete="off"
            />
            {search && (
              <button onClick={() => { setSearch(''); searchRef.current?.focus() }} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-primary">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Product grid */}
          <div className="flex-1 overflow-y-auto">
            {filteredProducts.length === 0 ? (
              <div className="flex items-center justify-center h-32 text-text-tertiary text-sm">
                {search ? `Sin resultados para "${search}"` : 'Cargando productos...'}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {(search ? filteredProducts : filteredProducts.slice(0, 30)).map((p) => (
                  <button
                    key={p.id}
                    onClick={() => addToCart(p)}
                    disabled={p.stock === 0}
                    className={cn(
                      'text-left p-3 rounded-xl border transition-all active:scale-95',
                      p.stock === 0
                        ? 'bg-surface-2 border-border opacity-50 cursor-not-allowed'
                        : 'bg-surface-1 border-border hover:border-accent/40 hover:bg-surface-2 cursor-pointer'
                    )}
                  >
                    <p className="text-sm font-medium text-text-primary line-clamp-2 mb-1">{p.name}</p>
                    <p className="text-xs text-text-tertiary font-mono mb-2">{p.sku}</p>
                    <div className="flex items-center justify-between">
                      <p className="text-accent font-bold text-sm">{formatCurrency(p.sale_price)}</p>
                      <span className={cn('text-2xs px-1.5 py-0.5 rounded-full font-medium', p.stock === 0 ? 'bg-red-500/10 text-red-400' : p.stock <= p.min_stock ? 'bg-amber-500/10 text-amber-400' : 'bg-emerald-500/10 text-emerald-400')}>
                        {p.stock === 0 ? 'Agotado' : `${p.stock} uds`}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: Cart + checkout */}
        <div className="lg:col-span-2 flex flex-col gap-4 overflow-hidden">
          {/* Customer selector */}
          <div className="relative">
            <input
              type="text"
              value={selectedCustomer ? selectedCustomer.name : customerSearch}
              onChange={(e) => {
                if (selectedCustomer) { setSelectedCustomer(null); setCustomerSearch(e.target.value) }
                else setCustomerSearch(e.target.value)
              }}
              placeholder="Buscar cliente..."
              className="input text-sm pr-8"
            />
            {selectedCustomer && (
              <button onClick={() => { setSelectedCustomer(null); setCustomerSearch('') }} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-primary">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
            {!selectedCustomer && filteredCustomers.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-surface-2 border border-border rounded-lg shadow-card z-10 max-h-40 overflow-y-auto">
                {filteredCustomers.slice(0, 5).map((c) => (
                  <button
                    key={c.id}
                    onClick={() => { setSelectedCustomer(c); setCustomerSearch('') }}
                    className="w-full text-left px-3 py-2.5 hover:bg-surface-3 transition-colors text-sm border-b border-border/50 last:border-0"
                  >
                    <p className="font-medium text-text-primary">{c.name}</p>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Cart items */}
          <div className="flex-1 overflow-y-auto card p-3">
            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full py-8 text-center">
                <ShoppingCart className="w-10 h-10 text-text-tertiary opacity-30 mb-2" />
                <p className="text-sm text-text-tertiary">Carrito vacío</p>
                <p className="text-xs text-text-tertiary mt-1">Busca y agrega productos</p>
              </div>
            ) : (
              <div className="space-y-2">
                {cart.map((item) => (
                  <div key={item.product.id} className="flex items-center gap-2 p-2.5 bg-surface-2 rounded-lg">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-text-primary truncate">{item.product.name}</p>
                      <p className="text-xs text-accent">{formatCurrency(item.unit_price)}</p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button onClick={() => item.quantity === 1 ? removeItem(item.product.id) : updateQty(item.product.id, -1)} className="w-6 h-6 rounded-md bg-surface-3 hover:bg-surface-0 text-text-secondary hover:text-text-primary flex items-center justify-center transition-colors">
                        {item.quantity === 1 ? <Trash2 className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
                      </button>
                      <span className="text-sm font-bold text-text-primary w-6 text-center">{item.quantity}</span>
                      <button onClick={() => updateQty(item.product.id, 1)} className="w-6 h-6 rounded-md bg-surface-3 hover:bg-accent hover:text-surface-0 text-text-secondary flex items-center justify-center transition-colors">
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                    <p className="text-xs font-semibold text-text-primary w-16 text-right shrink-0">
                      {formatCurrency(item.unit_price * item.quantity)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Payment method */}
          <div className="flex gap-2">
            {PAYMENT_METHODS.map((pm) => (
              <button
                key={pm.id}
                onClick={() => setPaymentMethod(pm.id as typeof paymentMethod)}
                className={cn(
                  'flex-1 flex flex-col items-center gap-1 py-2 rounded-xl border text-xs font-medium transition-all',
                  paymentMethod === pm.id
                    ? 'bg-accent/10 border-accent/40 text-accent'
                    : 'bg-surface-2 border-border text-text-secondary hover:text-text-primary hover:border-border/70'
                )}
              >
                <pm.icon className="w-4 h-4" />
                {pm.label}
              </button>
            ))}
          </div>

          {/* Totals + checkout */}
          <div className="card p-4 space-y-2">
            <div className="flex justify-between text-xs text-text-secondary">
              <span>Subtotal</span>
              <span>{formatCurrency(cartSubtotal)}</span>
            </div>
            <div className="flex justify-between text-xs text-text-secondary">
              <span>IVA (16%)</span>
              <span>{formatCurrency(cartTax)}</span>
            </div>
            <div className="flex justify-between font-bold text-base border-t border-border pt-2">
              <span className="text-text-primary">Total</span>
              <span className="text-accent">{formatCurrency(cartTotal)}</span>
            </div>
            <button
              onClick={handleCheckout}
              disabled={saving || cart.length === 0 || !selectedCustomer}
              className="btn-primary btn w-full mt-2 text-base py-3"
            >
              {saving ? 'Procesando...' : `Cobrar ${formatCurrency(cartTotal)}`}
            </button>
            {cart.length > 0 && (
              <button onClick={() => setCart([])} className="w-full text-xs text-text-tertiary hover:text-red-400 transition-colors py-1">
                Limpiar carrito
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
