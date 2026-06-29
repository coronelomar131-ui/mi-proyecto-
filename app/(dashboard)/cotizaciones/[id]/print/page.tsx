'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency, formatDate } from '@/lib/utils/format'
import { TrendingUp, Printer } from 'lucide-react'
import type { Quote, QuoteItem, Product } from '@/types'

type QuoteItemWithProduct = QuoteItem & { product: Product }

const STATUS_LABEL: Record<string, string> = {
  borrador: 'BORRADOR',
  enviada: 'ENVIADA',
  aceptada: 'ACEPTADA',
  rechazada: 'RECHAZADA',
  vencida: 'VENCIDA',
}

const STATUS_COLOR: Record<string, string> = {
  borrador: 'bg-gray-100 text-gray-600',
  enviada: 'bg-cyan-100 text-cyan-700',
  aceptada: 'bg-emerald-100 text-emerald-700',
  rechazada: 'bg-red-100 text-red-600',
  vencida: 'bg-amber-100 text-amber-700',
}

export default function PrintQuotePage({ params }: { params: { id: string } }) {
  const supabase = createClient()
  const [quote, setQuote] = useState<Quote | null>(null)
  const [items, setItems] = useState<QuoteItemWithProduct[]>([])
  const [org, setOrg] = useState<{ name: string; slug: string } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const { data: profile } = await supabase
        .from('profiles')
        .select('*, organizations(name, slug)')
        .eq('id', session.user.id)
        .single()

      setOrg((profile?.organizations as { name: string; slug: string }) ?? null)

      const [{ data: quoteData }, { data: itemsData }] = await Promise.all([
        supabase
          .from('quotes')
          .select('*, customer:customers(name, email, phone, address, city, rfc)')
          .eq('id', params.id)
          .single(),
        supabase
          .from('quote_items')
          .select('*, product:products(name, sku, unit)')
          .eq('quote_id', params.id),
      ])

      setQuote(quoteData as Quote)
      setItems((itemsData as QuoteItemWithProduct[]) ?? [])
      setLoading(false)
    }
    load()
  }, [params.id])

  useEffect(() => {
    if (!loading && quote) {
      setTimeout(() => window.print(), 500)
    }
  }, [loading, quote])

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-gray-200 border-t-cyan-500 rounded-full animate-spin" />
      </div>
    )
  }

  if (!quote) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-gray-500">Cotización no encontrada</p>
      </div>
    )
  }

  const customer = quote.customer as unknown as {
    name: string; email?: string; phone?: string; address?: string; city?: string; rfc?: string
  }

  return (
    <div className="min-h-screen bg-white text-gray-900 p-10 max-w-3xl mx-auto print:p-6">
      {/* Print button (hidden in print) */}
      <div className="print:hidden mb-8 flex items-center justify-between">
        <div className="flex items-center gap-2 text-gray-500 text-sm">
          <TrendingUp className="w-4 h-4 text-cyan-500" />
          <span>Vista de impresión — {quote.folio}</span>
        </div>
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 bg-cyan-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-cyan-600 transition-colors"
        >
          <Printer className="w-4 h-4" />
          Imprimir / Guardar PDF
        </button>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-6 h-6 text-cyan-500" />
            <span className="text-xl font-bold text-gray-900">{org?.name ?? 'GestorPro'}</span>
          </div>
          <p className="text-gray-400 text-xs">{org?.slug}</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-gray-900">{quote.folio}</p>
          <p className="text-sm text-gray-500 mt-1">COTIZACIÓN</p>
          <p className="text-xs text-gray-400 mt-1">Emitida: {formatDate(quote.created_at)}</p>
          {quote.valid_until && (
            <p className="text-xs text-gray-400">Válida hasta: {formatDate(quote.valid_until)}</p>
          )}
          <span className={`inline-block mt-1 text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_COLOR[quote.status] ?? 'bg-gray-100 text-gray-600'}`}>
            {STATUS_LABEL[quote.status] ?? quote.status.toUpperCase()}
          </span>
        </div>
      </div>

      {/* Customer + conditions */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="border border-gray-100 rounded-xl p-5 bg-gray-50">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Cliente</p>
          <p className="font-semibold text-gray-900 text-base">{customer?.name}</p>
          {customer?.rfc && <p className="text-sm text-gray-500 mt-0.5">RFC: {customer.rfc}</p>}
          {customer?.email && <p className="text-sm text-gray-500">{customer.email}</p>}
          {customer?.phone && <p className="text-sm text-gray-500">{customer.phone}</p>}
          {customer?.address && (
            <p className="text-sm text-gray-500">{customer.address}{customer.city ? `, ${customer.city}` : ''}</p>
          )}
        </div>
        <div className="border border-gray-100 rounded-xl p-5 bg-gray-50">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Condiciones</p>
          <p className="text-sm text-gray-700">Esta cotización es válida hasta</p>
          <p className="font-semibold text-gray-900 text-base mt-0.5">
            {quote.valid_until ? formatDate(quote.valid_until) : 'Sin fecha límite'}
          </p>
          <p className="text-xs text-gray-400 mt-2">Precios en MXN + IVA (16%)</p>
        </div>
      </div>

      {/* Items table */}
      <table className="w-full mb-8 text-sm">
        <thead>
          <tr className="border-b-2 border-gray-200">
            <th className="text-left py-3 text-gray-500 font-medium">Descripción</th>
            <th className="text-center py-3 text-gray-500 font-medium w-16">Cant.</th>
            <th className="text-right py-3 text-gray-500 font-medium w-28">Precio unit.</th>
            <th className="text-right py-3 text-gray-500 font-medium w-16">Desc.</th>
            <th className="text-right py-3 text-gray-500 font-medium w-28">Subtotal</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, i) => (
            <tr key={item.id} className={`border-b border-gray-100 ${i % 2 === 0 ? '' : 'bg-gray-50/50'}`}>
              <td className="py-3">
                <p className="font-medium text-gray-900">{item.product?.name}</p>
                <p className="text-xs text-gray-400">{item.product?.sku} · {item.product?.unit}</p>
              </td>
              <td className="py-3 text-center text-gray-700">{item.quantity}</td>
              <td className="py-3 text-right text-gray-700">{formatCurrency(item.unit_price)}</td>
              <td className="py-3 text-right text-gray-500">{item.discount > 0 ? `${item.discount}%` : '—'}</td>
              <td className="py-3 text-right font-medium text-gray-900">{formatCurrency(item.subtotal)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Totals */}
      <div className="flex justify-end mb-10">
        <div className="w-64 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Subtotal</span>
            <span className="text-gray-700">{formatCurrency(quote.subtotal)}</span>
          </div>
          {quote.discount > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Descuento</span>
              <span className="text-gray-700">-{formatCurrency(quote.discount)}</span>
            </div>
          )}
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">IVA (16%)</span>
            <span className="text-gray-700">{formatCurrency(quote.tax)}</span>
          </div>
          <div className="flex justify-between font-bold text-base border-t border-gray-200 pt-2">
            <span className="text-gray-900">Total</span>
            <span className="text-cyan-600">{formatCurrency(quote.total)}</span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-gray-100 pt-6 flex items-center justify-between text-xs text-gray-400">
        <p>Cotización generada el {formatDate(quote.created_at)}</p>
        <p>Generada con GestorPro · gestorpro.mx</p>
      </div>
    </div>
  )
}
