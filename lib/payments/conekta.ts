/**
 * Conekta API v2 client — payment links (checkout sessions) via direct fetch.
 * Docs: https://developers.conekta.com/reference/createcheckoutsession
 */

const CONEKTA_API_BASE = 'https://api.conekta.io'

function headers(apiKey: string) {
  const encoded = Buffer.from(`${apiKey}:`).toString('base64')
  return {
    'Content-Type': 'application/json',
    Accept: 'application/vnd.conekta-v2.1.0+json',
    Authorization: `Basic ${encoded}`,
    'Accept-Language': 'es',
  }
}

export interface ConektaLineItem {
  name: string
  unit_price: number  // cents MXN (e.g. 10000 = $100 MXN)
  quantity: number
}

export interface PaymentLinkOptions {
  name: string          // Order name / description shown to customer
  currency?: string     // default 'MXN'
  lineItems: ConektaLineItem[]
  expiresAt?: number    // Unix timestamp. Default: now + 24h
  customerInfo?: {
    name: string
    email: string
    phone?: string
  }
  metadata?: Record<string, string>
  successUrl?: string
  failureUrl?: string
}

export interface PaymentLinkResult {
  id: string
  url: string
  expiresAt: number
  status: string
}

export interface ConektaOrderResponse {
  id: string
  checkout?: {
    id: string
    url: string
    expires_at: number
    status: string
  }
  [key: string]: unknown
}

/**
 * Create a Conekta checkout session / payment link.
 */
export async function createPaymentLink(
  options: PaymentLinkOptions,
  apiKey: string
): Promise<PaymentLinkResult> {
  const expiresAt = options.expiresAt ?? Math.floor(Date.now() / 1000) + 86400

  const body: Record<string, unknown> = {
    currency: options.currency ?? 'MXN',
    line_items: options.lineItems,
    checkout: {
      allowed_payment_methods: ['card', 'cash', 'bank_transfer'],
      expires_at: expiresAt,
      success_url: options.successUrl,
      failure_url: options.failureUrl,
      monthly_installments_enabled: false,
    },
  }

  if (options.customerInfo) {
    body.customer_info = {
      name: options.customerInfo.name,
      email: options.customerInfo.email,
      phone: options.customerInfo.phone ?? '+5200000000000',
    }
  }

  if (options.metadata) {
    body.metadata = options.metadata
  }

  const res = await fetch(`${CONEKTA_API_BASE}/orders`, {
    method: 'POST',
    headers: headers(apiKey),
    body: JSON.stringify(body),
  })

  const data: ConektaOrderResponse = await res.json()

  if (!res.ok || !data.checkout?.url) {
    throw new Error(
      `Conekta error ${res.status}: ${JSON.stringify((data as Record<string, unknown>).details ?? data)}`
    )
  }

  return {
    id: data.checkout.id,
    url: data.checkout.url,
    expiresAt: data.checkout.expires_at,
    status: data.checkout.status,
  }
}

/**
 * Retrieve an existing order to check payment status.
 */
export async function getOrder(orderId: string, apiKey: string) {
  const res = await fetch(`${CONEKTA_API_BASE}/orders/${orderId}`, {
    headers: headers(apiKey),
  })

  if (!res.ok) throw new Error(`Conekta getOrder error ${res.status}`)
  return res.json() as Promise<ConektaOrderResponse>
}

/**
 * Verify a Conekta webhook signature.
 * https://developers.conekta.com/docs/webhook-security
 */
export function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const { createHmac } = require('crypto') as typeof import('crypto')
  const expected = createHmac('sha256', secret).update(payload).digest('hex')
  return expected === signature
}
