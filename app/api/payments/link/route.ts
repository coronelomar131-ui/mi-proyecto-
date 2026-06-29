import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createPaymentLink } from '@/lib/payments/conekta'

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const apiKey = process.env.CONEKTA_PRIVATE_KEY
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Conekta no configurado. Agrega CONEKTA_PRIVATE_KEY a tu .env' },
        { status: 500 }
      )
    }

    const { quoteId } = await request.json()
    if (!quoteId) {
      return NextResponse.json({ error: 'quoteId requerido' }, { status: 400 })
    }

    const { data: quote, error } = await supabase
      .from('quotes')
      .select(`*, customer:customers(*), items:quote_items(*, product:products(*))`)
      .eq('id', quoteId)
      .single()

    if (error || !quote) {
      return NextResponse.json({ error: 'Cotización no encontrada' }, { status: 404 })
    }

    const lineItems = quote.items.map((item: {
      quantity: number
      unit_price: number
      product: { name: string }
    }) => ({
      name: item.product.name,
      unit_price: Math.round(item.unit_price * 100), // cents
      quantity: item.quantity,
    }))

    const expiresAt = Math.floor(
      new Date(quote.valid_until ?? Date.now() + 7 * 86400 * 1000).getTime() / 1000
    )

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://gestorpro.app'

    const link = await createPaymentLink(
      {
        name: `Cotización ${quote.folio}`,
        lineItems,
        expiresAt,
        customerInfo: quote.customer
          ? {
              name: quote.customer.name,
              email: quote.customer.email ?? 'cliente@email.com',
              phone: quote.customer.phone,
            }
          : undefined,
        metadata: { quote_id: quoteId, folio: quote.folio },
        successUrl: `${appUrl}/dashboard/cotizaciones?pago=exitoso`,
        failureUrl: `${appUrl}/dashboard/cotizaciones?pago=fallido`,
      },
      apiKey
    )

    // Persist link on quote
    await supabase
      .from('quotes')
      .update({
        payment_link_id: link.id,
        payment_link_url: link.url,
        payment_link_exp: new Date(link.expiresAt * 1000).toISOString(),
      })
      .eq('id', quoteId)

    return NextResponse.json({ url: link.url, expiresAt: link.expiresAt })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error desconocido'
    console.error('[Conekta createLink]', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
