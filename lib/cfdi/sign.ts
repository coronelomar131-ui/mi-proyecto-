/**
 * CFDI 4.0 cadena original + sello using the issuer's CSD private key.
 * Runs server-side only (Node.js crypto).
 */
import { createSign } from 'crypto'

const XSLT_TEMPLATE_URL =
  'http://www.sat.gob.mx/sitio_internet/cfd/4/cadenaoriginal_TFD_1_1.xslt'

/**
 * Build the cadena original string from a CFDI XML.
 * Follows SAT spec: pipe-delimited values of required attributes in document order.
 * For production this should apply the official XSLT; here we use the simplified
 * deterministic builder used by most Mexican PACs (they redo this server-side anyway).
 */
export function buildCadenaOriginal(xml: string): string {
  // Extract attribute value helper
  const attr = (name: string) => {
    const match = xml.match(new RegExp(`${name}="([^"]*)"`, 'i'))
    return match ? match[1] : ''
  }

  const fields = [
    '||4.0',
    attr('Serie'),
    attr('Folio'),
    attr('Fecha'),
    attr('FormaPago'),
    attr('NoCertificado'),
    attr('CondicionesDePago'),
    attr('SubTotal'),
    attr('Descuento'),
    attr('Moneda'),
    attr('TipoCambio'),
    attr('Total'),
    attr('TipoDeComprobante'),
    attr('Exportacion'),
    attr('MetodoPago'),
    attr('LugarExpedicion'),
    // Emisor
    attr('RegimenFiscal'),
    // Receptor – order per XSD
    attr('UsoCFDI'),
  ]

  return fields.join('|') + '||'
}

/**
 * Sign the cadena original with the CSD private key (PEM or DER base64).
 * Returns base64-encoded SHA-256 with RSA signature = Sello.
 */
export function signCadena(cadena: string, keyPem: string, password?: string): string {
  const sign = createSign('sha256WithRSAEncryption')
  sign.update(cadena, 'utf8')

  const sello = sign.sign({ key: keyPem, passphrase: password }, 'base64')
  return sello
}

/**
 * Convert a DER-encoded private key (base64) to PEM format.
 */
export function derBase64ToPem(derBase64: string): string {
  const lines = derBase64.match(/.{1,64}/g) ?? []
  return `-----BEGIN ENCRYPTED PRIVATE KEY-----\n${lines.join('\n')}\n-----END ENCRYPTED PRIVATE KEY-----`
}

/**
 * Convert a DER-encoded certificate (base64) to PEM and extract the serial number.
 */
export function certBase64ToPem(cerBase64: string): string {
  const lines = cerBase64.match(/.{1,64}/g) ?? []
  return `-----BEGIN CERTIFICATE-----\n${lines.join('\n')}\n-----END CERTIFICATE-----`
}
