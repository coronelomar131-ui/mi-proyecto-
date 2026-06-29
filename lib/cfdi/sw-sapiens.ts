/**
 * SW SapienS PAC client — stamps (timbre) and cancels CFDI 4.0 via REST.
 * Docs: https://developers.sw.com.mx/
 */

const SW_BASE_URL = 'https://services.sw.com.mx'
const SW_AUTH_URL = 'https://services.sw.com.mx/security/authenticate'

interface SwAuthResponse {
  status: 'success' | 'error'
  data: { token: string }
  message?: string
}

interface SwStampResponse {
  status: 'success' | 'error'
  data: {
    cadenaOriginalSAT?: string
    noCertificadoSAT?: string
    noCertificadoCFDI?: string
    uuid?: string
    selloCFDI?: string
    selloSAT?: string
    fechaTimbrado?: string
    qrCode?: string
    cfdi?: string
  }
  message?: string
  messageDetail?: string
}

interface SwCancelResponse {
  status: 'success' | 'error'
  data?: { acuse?: string; estatusUUID?: string }
  message?: string
}

export interface StampResult {
  uuid: string
  xmlTimbrado: string
  fechaTimbrado: string
  qrCode: string
}

export interface SwConfig {
  username: string
  password: string
}

async function getToken(config: SwConfig): Promise<string> {
  const res = await fetch(SW_AUTH_URL, {
    method: 'GET',
    headers: {
      user: config.username,
      password: config.password,
    },
  })

  if (!res.ok) throw new Error(`SW SapienS auth failed: ${res.status}`)
  const body: SwAuthResponse = await res.json()
  if (body.status !== 'success') throw new Error(`SW auth error: ${body.message}`)
  return body.data.token
}

/**
 * Stamp a CFDI XML. Returns stamped XML with UUID and QR code.
 */
export async function stampCfdi(xml: string, config: SwConfig): Promise<StampResult> {
  const token = await getToken(config)

  const xmlB64 = Buffer.from(xml, 'utf-8').toString('base64')

  const res = await fetch(`${SW_BASE_URL}/cfdi33/stamp/v4/b64`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `bearer ${token}`,
    },
    body: JSON.stringify({ xml: xmlB64 }),
  })

  const body: SwStampResponse = await res.json()

  if (body.status !== 'success' || !body.data.uuid || !body.data.cfdi) {
    throw new Error(
      `SW stamp error: ${body.message ?? ''} — ${body.messageDetail ?? ''}`
    )
  }

  return {
    uuid: body.data.uuid,
    xmlTimbrado: Buffer.from(body.data.cfdi, 'base64').toString('utf-8'),
    fechaTimbrado: body.data.fechaTimbrado ?? new Date().toISOString(),
    qrCode: body.data.qrCode ?? '',
  }
}

/**
 * Cancel a previously stamped CFDI.
 * motivo: '01' = invoice error, '02' = invoice not issued, '03' = not required, '04' = change
 */
export async function cancelCfdi(
  uuid: string,
  rfcEmisor: string,
  rfcReceptor: string,
  total: string,
  motivo: '01' | '02' | '03' | '04',
  config: SwConfig,
  uuidSustitucion?: string
): Promise<string> {
  const token = await getToken(config)

  const body: Record<string, string> = {
    uuid,
    rfcEmisor,
    rfcReceptor,
    total,
    motivo,
  }
  if (uuidSustitucion) body.folioSustitucion = uuidSustitucion

  const res = await fetch(`${SW_BASE_URL}/cfdi33/cancel/csd/${uuid}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `bearer ${token}`,
    },
    body: JSON.stringify(body),
  })

  const resp: SwCancelResponse = await res.json()
  if (resp.status !== 'success') {
    throw new Error(`SW cancel error: ${resp.message}`)
  }

  return resp.data?.acuse ?? ''
}
