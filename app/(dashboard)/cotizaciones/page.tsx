'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency, formatDate } from '@/lib/utils/format'
import { Plus, Search, X, FileText, Package, Send, Download, ShoppingCart, CheckCheck, Printer, MessageCircle, CreditCard } from 'lucide-react'
import toast from 'react-hot-toast'
import { cn } from '@/lib/utils/cn'
import { EmptyState } from '@/components/ui/empty-state'
import { TableSkeleton } from '@/components/ui/skeleton'
import type { Quote, Customer, Product, QuoteStatus } from '@/types'

const STATUS_BADGE: Record<QuoteStatus, string> = {
  borrador: 'badge-gray',
  enviada: 'badge-accent',
  aceptada: 'badge-green',
  rechazada: 'badge-red',
  vencida: 'badge-yellow',
}

const STATUS_LABELS: Record<QuoteStatus, string> = {
  borrador: 'Borrador',
  enviada: 'Enviada',
  aceptada: 'Aceptada',
  rechazada: 'Rechazada',
  vencida: 'Vencida',
}

interface CartItem { product: Product; quantity: number; unit_price: number; discount: number }

export default function CotizacionesPage() {
  const supabase = createClient()
  const [quotes, setQuotes] = useState<Quote[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [cart, setCart] = useState<CartItem[]>([])
  const [productSearch, setProductSearch] = useState('')
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [validUntil, setValidUntil] = useState('')
  const [quoteNotes, setQuoteNotes] = useState('')
  const [generatingLink, setGeneratingLink] = useState<string | null>(null)

  const searchParams = useSearchParams()

  const fetchData = useCallback(async () => {
    setLoading(true)
    const today = new Date().toISOString().split('T')[0]
    const [{ data: qData }, { data: cData }, { data: pData }] = await Promise.all([
      supabase.from('quotes').select('*, customer:customers(name, phone)').order('created_at', { ascending: false }).limit(50),
      supabase.from('customers').select('*').eq('is_active', true).order('name'),
      supabase.from('products').select('*').eq('is_active', true).order('name'),
    ])
    setQuotes((qData as Quote[]) ?? [])
    setCustomers((cData as Customer[]) ?? [])
    setProducts((pData as Product[]) ?? [])
    setLoading(false)

    // Auto-expire quotes past their valid_until date
    const toExpire = (qData ?? []).filter(
      (q: Quote) => q.valid_until && q.valid_until < today && (q.status === 'borrador' || q.status === 'enviada')
    )
    if (toExpire.length > 0) {
      await supabase.from('quotes').update({ status: 'vencida' }).in('id', toExpire.map((q: Quote) => q.id))
      setQuotes((prev) => prev.map((q) => toExpire.find((e: Quote) => e.id === q.id) ? { ...q, status: 'vencida' as const } : q))
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])
  useEffect(() => { if (searchParams.get('new') === '1') setShowModal(true) }, [searchParams])

  const filtered = quotes.filter(
    (q) =>
      q.folio?.toLowerCase().includes(search.toLowerCase()) ||
      (q.customer as unknown as { name: string })?.name?.toLowerCase().includes(search.toLowerCase())
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
      if (existing) return prev.map((c) => c.product.id === product.id ? { ...c, quantity: c.quantity + 1 } : c)
      return [...prev, { product, quantity: 1, unit_price: product.sale_price, discount: 0 }]
    })
  }

  const cartTotal = cart.reduce((sum, i) => sum + i.unit_price * i.quantity * (1 - i.discount / 100), 0)

  const handleCreate = async () => {
    if (!selectedCustomer || cart.length === 0) { toast.error('Completa todos los campos'); return }
    setSaving(true)

    const subtotal = cartTotal
    const tax = subtotal * 0.16
    const total = subtotal + tax

    const { count: quoteCount } = await supabase.from('quotes').select('id', { count: 'exact' })
    const folio = `COT-${String((quoteCount ?? 0) + 1).padStart(5, '0')}`
    const { data: quoteData, error } = await supabase.from('quotes').insert({
      customer_id: selectedCustomer.id,
      status: 'borrador',
      folio,
      valid_until: validUntil || new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      subtotal, discount: 0, tax, total,
      notes: quoteNotes.trim() || null,
    }).select().single()

    if (error) { toast.error('Error al crear cotización'); setSaving(false); return }

    if (quoteData) {
      await supabase.from('quote_items').insert(
        cart.map((i) => ({
          quote_id: quoteData.id,
          product_id: i.product.id,
          quantity: i.quantity,
          unit_price: i.unit_price,
          discount: i.discount,
          subtotal: i.unit_price * i.quantity * (1 - i.discount / 100),
        }))
      )
    }

    toast.success('Cotización creada')
    setShowModal(false)
    setCart([])
    setSelectedCustomer(null)
    setQuoteNotes('')
    fetchData()
    setSaving(false)
  }

  const handleUpdateStatus = async (id: string, status: QuoteStatus) => {
    const { error } = await supabase.from('quotes').update({ status }).eq('id', id)
    if (error) { toast.error('Error al actualizar'); return }
    toast.success('Estado actualizado')
    fetchData()
  }

  const handleGeneratePaymentLink = async (quoteId: string) => {
    setGeneratingLink(quoteId)
    try {
      const res = await fetch('/api/payments/link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quoteId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      // Update local quote with link
      setQuotes((prev) =>
        prev.map((q) => q.id === quoteId ? { ...q, payment_link_url: data.url } : q)
      )
      toast.success('Enlace de pago generado')
      window.open(data.url, '_blank')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al generar enlace')
    } finally {
      setGeneratingLink(null)
    }
  }

  const handleConvertToSale = async (quote: Quote) => {
    setSaving(true)
    const { data: items, error: itemsErr } = await supabase
      .from('quote_items')
      .select('*, product:products(id,sale_price)')
      .eq('quote_id', quote.id)

    if (itemsErr || !items) { toast.error('Error al obtener productos'); setSaving(false); return }

    const { count: saleCount } = await supabase.from('sales').select('id', { count: 'exact' })
    const saleFolio = `VTA-${String((saleCount ?? 0) + 1).padStart(5, '0')}`
    const { data: saleData, error: saleErr } = await supabase.from('sales').insert({
      customer_id: quote.customer_id,
      status: 'pendiente',
      payment_method: 'efectivo',
      subtotal: quote.subtotal,
      discount: quote.discount,
      tax: quote.tax,
      total: quote.total,
      folio: saleFolio,
    }).select().single()

    if (saleErr || !saleData) { toast.error('Error al crear venta'); setSaving(false); return }

    await supabase.from('sale_items').insert(
      items.map((i) => ({
        sale_id: saleData.id,
        product_id: i.product_id,
        quantity: i.quantity,
        unit_price: i.unit_price,
        discount: i.discount,
        subtotal: i.subtotal,
      }))
    )

    toast.success('¡Cotización convertida a venta!')
    fetchData()
    setSaving(false)
  }

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Cotizaciones</h1>
          <p className="text-xs text-text-tertiary mt-0.5">{quotes.length} registros</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              const csv = ['Folio,Cliente,Total,Vigencia,Estado']
              filtered.forEach((q) => {
                csv.push(`${q.folio},"${(q.customer as unknown as { name: string })?.name ?? ''}",${q.total},${formatDate(q.valid_until)},${STATUS_LABELS[q.status]}`)
              })
              const blob = new Blob([csv.join('\n')], { type: 'text/csv' })
              const a = document.createElement('a')
              a.href = URL.createObjectURL(blob)
              a.download = `cotizaciones-${new Date().toISOString().split('T')[0]}.csv`
              a.click()
            }}
            className="btn-secondary btn btn-sm"
          >
            <Download className="w-3.5 h-3.5" /> Exportar
          </button>
          <button onClick={() => setShowModal(true)} className="btn-primary btn">
            <Plus className="w-4 h-4" /> Nueva cotización
          </button>
        </div>
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar cotización..." className="input pl-9" />
      </div>

      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Folio</th>
              <th>Cliente</th>
              <th>Total</th>
              <th>Vigencia</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <TableSkeleton rows={6} cols={6} />
            ) : filtered.length === 0 ? (
              <tr><td colSpan={6}>
                <EmptyState
                  icon={<FileText className="w-6 h-6" />}
                  title={search ? 'Sin resultados' : 'Sin cotizaciones aún'}
                  description={search ? `No encontramos cotizaciones con "${search}"` : 'Crea cotizaciones profesionales y conviértelas en ventas fácilmente.'}
                  action={!search ? { label: 'Nueva cotización', onClick: () => setShowModal(true) } : undefined}
                />
              </td></tr>
            ) : (
              filtered.map((q) => (
                <tr key={q.id}>
                  <td className="font-mono text-xs text-accent">{q.folio}</td>
                  <td className="font-medium text-text-primary">{(q.customer as unknown as { name: string })?.name ?? '—'}</td>
                  <td className="font-semibold text-text-primary">{formatCurrency(q.total)}</td>
                  <td className="text-text-secondary">{formatDate(q.valid_until)}</td>
                  <td><span className={cn('badge', STATUS_BADGE[q.status])}>{STATUS_LABELS[q.status]}</span></td>
                  <td>
                    <div className="flex items-center gap-1">
                      {q.status === 'borrador' && (
                        <button onClick={() => handleUpdateStatus(q.id, 'enviada')} className="btn-ghost btn btn-sm text-accent">
                          <Send className="w-3.5 h-3.5" /> Enviar
                        </button>
                      )}
                      {q.status === 'enviada' && (
                        <>
                          <button onClick={() => handleUpdateStatus(q.id, 'aceptada')} className="btn btn-sm bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            <CheckCheck className="w-3.5 h-3.5" /> Aceptar
                          </button>
                          <button onClick={() => handleUpdateStatus(q.id, 'rechazada')} className="btn-danger btn btn-sm">Rechazar</button>
                        </>
                      )}
                      {q.status === 'aceptada' && (
                        <button
                          onClick={() => handleConvertToSale(q)}
                          disabled={saving}
                          className="btn btn-sm bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 hover:bg-emerald-500/25 transition-colors"
                        >
                          <ShoppingCart className="w-3.5 h-3.5" />
                          Convertir a venta
                        </button>
                      )}
                      <a
                        href={`/dashboard/cotizaciones/${q.id}/print`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-ghost btn btn-sm p-1.5 text-text-tertiary hover:text-accent"
                        title="Imprimir / PDF"
                      >
                        <Printer className="w-3.5 h-3.5" />
                      </a>
                      {(() => {
                        const customer = q.customer as unknown as { name: string; phone?: string }
                        const phone = customer?.phone?.replace(/\D/g, '')
                        if (!phone) return null
                        const msg = encodeURIComponent(`Hola ${customer.name}, te comparto la cotización *${q.folio}* por *${formatCurrency(q.total)}* (válida hasta ${formatDate(q.valid_until)}). Para más detalles, comunícate con nosotros.`)
                        return (
                          <a
                            href={`https://wa.me/${phone.startsWith('52') ? phone : `52${phone}`}?text=${msg}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn-ghost btn btn-sm p-1.5 text-text-tertiary hover:text-emerald-400"
                            title="Enviar por WhatsApp"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                          </a>
                        )
                      })()}
                      {(q.status === 'enviada' || q.status === 'borrador') && (
                        (q as Quote & { payment_link_url?: string }).payment_link_url ? (
                          <a
                            href={(q as Quote & { payment_link_url?: string }).payment_link_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn-ghost btn btn-sm p-1.5 text-text-tertiary hover:text-accent"
                            title="Ver enlace de pago"
                          >
                            <CreditCard className="w-3.5 h-3.5" />
                          </a>
                        ) : (
                          <button
                            onClick={() => handleGeneratePaymentLink(q.id)}
                            disabled={generatingLink === q.id}
                            className="btn-ghost btn btn-sm p-1.5 text-text-tertiary hover:text-accent"
                            title="Generar enlace de pago (Conekta)"
                          >
                            <CreditCard className="w-3.5 h-3.5" />
                          </button>
                        )
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal w-full max-w-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h2 className="font-semibold text-text-primary">Nueva cotización</h2>
              <button onClick={() => setShowModal(false)} className="btn-ghost btn p-1.5"><X className="w-4 h-4" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              <div>
                <label className="label">Cliente *</label>
                <select className="input" value={selectedCustomer?.id ?? ''} onChange={(e) => setSelectedCustomer(customers.find((c) => c.id === e.target.value) ?? null)}>
                  <option value="">Seleccionar cliente</option>
                  {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Válida hasta</label>
                <input type="date" value={validUntil} onChange={(e) => setValidUntil(e.target.value)} className="input" />
              </div>
              <div>
                <label className="label">Buscar producto</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
                  <input type="text" value={productSearch} onChange={(e) => setProductSearch(e.target.value)} placeholder="Nombre o SKU..." className="input pl-9" />
                </div>
                {productSearch && (
                  <div className="mt-2 bg-surface-2 border border-border rounded-lg max-h-40 overflow-y-auto">
                    {filteredProducts.slice(0, 8).map((p) => (
                      <button key={p.id} onClick={() => { addToCart(p); setProductSearch('') }} className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-surface-3 transition-colors text-left border-b border-border/50 last:border-0">
                        <div>
                          <p className="text-sm text-text-primary">{p.name}</p>
                          <p className="text-xs text-text-tertiary">{p.sku}</p>
                        </div>
                        <span className="text-sm font-medium text-accent">{formatCurrency(p.sale_price)}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {cart.length > 0 && (
                <div className="space-y-2">
                  {cart.map((item) => {
                    const lineTotal = item.unit_price * item.quantity * (1 - item.discount / 100)
                    return (
                      <div key={item.product.id} className="bg-surface-2 rounded-lg p-3 space-y-2">
                        <div className="flex items-center gap-2">
                          <Package className="w-4 h-4 text-text-tertiary shrink-0" />
                          <p className="text-sm text-text-primary truncate flex-1">{item.product.name}</p>
                          <button onClick={() => setCart(prev => prev.filter(c => c.product.id !== item.product.id))} className="text-text-tertiary hover:text-red-400 shrink-0"><X className="w-4 h-4" /></button>
                        </div>
                        <div className="flex items-center gap-2 pl-6">
                          <div className="flex items-center gap-1 shrink-0">
                            <button onClick={() => setCart(prev => prev.map(c => c.product.id === item.product.id ? { ...c, quantity: Math.max(1, c.quantity - 1) } : c))} className="w-6 h-6 rounded bg-surface-3 text-text-secondary hover:text-text-primary flex items-center justify-center text-sm">−</button>
                            <span className="text-sm font-medium w-7 text-center">{item.quantity}</span>
                            <button onClick={() => setCart(prev => prev.map(c => c.product.id === item.product.id ? { ...c, quantity: c.quantity + 1 } : c))} className="w-6 h-6 rounded bg-surface-3 text-text-secondary hover:text-text-primary flex items-center justify-center text-sm">+</button>
                          </div>
                          <input
                            type="number" min="0" step="0.01" value={item.unit_price}
                            onChange={(e) => setCart(prev => prev.map(c => c.product.id === item.product.id ? { ...c, unit_price: parseFloat(e.target.value) || 0 } : c))}
                            className="input text-xs py-1 w-24 text-right" title="Precio unitario"
                          />
                          <div className="flex items-center gap-1">
                            <input
                              type="number" min="0" max="100" step="1" value={item.discount}
                              onChange={(e) => setCart(prev => prev.map(c => c.product.id === item.product.id ? { ...c, discount: Math.min(100, parseFloat(e.target.value) || 0) } : c))}
                              className="input text-xs py-1 w-14 text-center" title="Descuento %"
                            />
                            <span className="text-xs text-text-tertiary shrink-0">%</span>
                          </div>
                          <span className="text-sm font-semibold text-text-primary ml-auto shrink-0">{formatCurrency(lineTotal)}</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Notas */}
              <div>
                <label className="label">Notas internas (opcional)</label>
                <textarea value={quoteNotes} onChange={(e) => setQuoteNotes(e.target.value)} className="input resize-none" rows={2} placeholder="Condiciones especiales, comentarios..." />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-border bg-surface-2/50 rounded-b-2xl">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm text-text-secondary">Total: <span className="text-text-primary font-semibold">{formatCurrency(cartTotal)}</span></span>
                <span className="text-lg font-bold text-text-primary">Con IVA: {formatCurrency(cartTotal * 1.16)}</span>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setShowModal(false)} className="btn-secondary btn flex-1">Cancelar</button>
                <button onClick={handleCreate} disabled={saving || !selectedCustomer || cart.length === 0} className="btn-primary btn flex-1">
                  {saving ? 'Guardando...' : 'Crear cotización'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
