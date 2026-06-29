import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendText, sendDocument, sendSaleConfirmation, sendPaymentLink } from '@/lib/whatsapp'

type MessageType = 'text' | 'document' | 'sale_confirmation' | 'payment_link'

interface SendBody {
  type: MessageType
  to: string
  // text
  body?: string
  // document
  documentUrl?: string
  filename?: string
  caption?: string
  // sale_confirmation
  folio?: string
  total?: string
  // payment_link
  customerName?: string
  paymentUrl?: string
}

function getWaConfig() {
  const token = process.env.WHATSAPP_TOKEN
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID
  if (!token || !phoneNumberId) {
    throw new Error('WhatsApp no configurado. Agrega WHATSAPP_TOKEN y WHATSAPP_PHONE_NUMBER_ID a tu .env')
  }
  return { token, phoneNumberId }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body: SendBody = await request.json()

    if (!body.to || !body.type) {
      return NextResponse.json({ error: 'to y type son requeridos' }, { status: 400 })
    }

    const config = getWaConfig()
    let result

    switch (body.type) {
      case 'text':
        if (!body.body) return NextResponse.json({ error: 'body requerido' }, { status: 400 })
        result = await sendText({ to: body.to, body: body.body }, config)
        break

      case 'document':
        if (!body.documentUrl || !body.filename) {
          return NextResponse.json({ error: 'documentUrl y filename requeridos' }, { status: 400 })
        }
        result = await sendDocument(
          { to: body.to, documentUrl: body.documentUrl, filename: body.filename, caption: body.caption },
          config
        )
        break

      case 'sale_confirmation':
        if (!body.folio || !body.total) {
          return NextResponse.json({ error: 'folio y total requeridos' }, { status: 400 })
        }
        result = await sendSaleConfirmation(body.to, body.folio, body.total, config)
        break

      case 'payment_link':
        if (!body.customerName || !body.folio || !body.total || !body.paymentUrl) {
          return NextResponse.json({ error: 'customerName, folio, total, paymentUrl requeridos' }, { status: 400 })
        }
        result = await sendPaymentLink(
          body.to,
          body.customerName,
          body.folio,
          body.total,
          body.paymentUrl,
          config
        )
        break

      default:
        return NextResponse.json({ error: 'type inválido' }, { status: 400 })
    }

    return NextResponse.json({ ok: true, result })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error desconocido'
    console.error('[WhatsApp send]', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
