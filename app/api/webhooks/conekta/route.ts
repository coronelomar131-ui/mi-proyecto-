import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { verifyWebhookSignature } from '@/lib/payments/conekta'

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text()
    const signature = request.headers.get('Digest') ?? ''

    const webhookSecret = process.env.CONEKTA_WEBHOOK_SECRET
    if (webhookSecret) {
      const sig = signature.replace('SHA-256=', '')
      if (!verifyWebhookSignature(rawBody, sig, webhookSecret)) {
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
      }
    }

    const event = JSON.parse(rawBody)
    const type: string = event.type ?? ''
    const order = event.data?.object

    if (!order) {
      return NextResponse.json({ ok: true })
    }

    const supabase = createClient()
    const quoteId: string | undefined = order.metadata?.quote_id

    // Handle paid order
    if (type === 'order.paid' && quoteId) {
      await supabase
        .from('quotes')
        .update({ status: 'aceptada' })
        .eq('id', quoteId)
        .eq('status', 'enviada')
    }

    // Handle expired checkout
    if (type === 'checkout.expired' && quoteId) {
      await supabase
        .from('quotes')
        .update({
          payment_link_id: null,
          payment_link_url: null,
          payment_link_exp: null,
        })
        .eq('id', quoteId)
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[Conekta webhook]', err)
    return NextResponse.json({ error: 'Webhook error' }, { status: 500 })
  }
}
