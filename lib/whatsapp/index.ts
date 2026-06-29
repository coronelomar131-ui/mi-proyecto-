/**
 * WhatsApp Business Cloud API (Meta) client.
 * Docs: https://developers.facebook.com/docs/whatsapp/cloud-api
 */

const WA_API_VERSION = 'v20.0'

function waUrl(phoneNumberId: string, endpoint: string) {
  return `https://graph.facebook.com/${WA_API_VERSION}/${phoneNumberId}/${endpoint}`
}

function headers(token: string) {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  }
}

export interface WaConfig {
  token: string         // System user access token
  phoneNumberId: string // WhatsApp phone number ID
}

export interface TextMessage {
  to: string   // E.164 format: "+525512345678"
  body: string
}

export interface TemplateMessage {
  to: string
  templateName: string
  languageCode?: string
  components?: unknown[]
}

export interface DocumentMessage {
  to: string
  documentUrl: string
  filename: string
  caption?: string
}

async function postWa(url: string, body: object, token: string) {
  const res = await fetch(url, {
    method: 'POST',
    headers: headers(token),
    body: JSON.stringify(body),
  })
  const data = await res.json()
  if (!res.ok) {
    throw new Error(`WhatsApp API error ${res.status}: ${JSON.stringify(data?.error)}`)
  }
  return data
}

/** Send a plain text message */
export async function sendText(msg: TextMessage, config: WaConfig) {
  return postWa(
    waUrl(config.phoneNumberId, 'messages'),
    {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: msg.to,
      type: 'text',
      text: { preview_url: false, body: msg.body },
    },
    config.token
  )
}

/** Send a document (PDF invoice, quote, etc.) */
export async function sendDocument(msg: DocumentMessage, config: WaConfig) {
  return postWa(
    waUrl(config.phoneNumberId, 'messages'),
    {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: msg.to,
      type: 'document',
      document: {
        link: msg.documentUrl,
        filename: msg.filename,
        caption: msg.caption ?? '',
      },
    },
    config.token
  )
}

/** Send a template message (for non-24h window outreach) */
export async function sendTemplate(msg: TemplateMessage, config: WaConfig) {
  return postWa(
    waUrl(config.phoneNumberId, 'messages'),
    {
      messaging_product: 'whatsapp',
      to: msg.to,
      type: 'template',
      template: {
        name: msg.templateName,
        language: { code: msg.languageCode ?? 'es_MX' },
        components: msg.components ?? [],
      },
    },
    config.token
  )
}

/**
 * Send sale/quote notification with a payment link.
 * Uses the 'cotizacion_pago' approved template (must be created in Meta Business Manager).
 */
export async function sendPaymentLink(
  to: string,
  customerName: string,
  folio: string,
  total: string,
  paymentUrl: string,
  config: WaConfig
) {
  return sendTemplate(
    {
      to,
      templateName: 'cotizacion_pago',
      languageCode: 'es_MX',
      components: [
        {
          type: 'body',
          parameters: [
            { type: 'text', text: customerName },
            { type: 'text', text: folio },
            { type: 'text', text: total },
            { type: 'text', text: paymentUrl },
          ],
        },
      ],
    },
    config
  )
}

/**
 * Send a quick sale confirmation text message.
 */
export async function sendSaleConfirmation(
  to: string,
  folio: string,
  total: string,
  config: WaConfig
) {
  return sendText(
    {
      to,
      body:
        `✅ *Venta confirmada*\n\nFolio: ${folio}\nTotal: ${total}\n\n` +
        `Gracias por su compra. En breve recibirá su factura electrónica.`,
    },
    config
  )
}
