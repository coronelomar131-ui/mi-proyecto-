import { create } from 'xmlbuilder2'

export interface CfdiEmisor {
  rfc: string
  nombre: string
  regimenFiscal: string
}

export interface CfdiReceptor {
  rfc: string
  nombre: string
  domicilioFiscalReceptor: string
  regimenFiscalReceptor: string
  usoCFDI: string
}

export interface CfdiConcepto {
  claveProdServ: string
  claveUnidad: string
  descripcion: string
  cantidad: number
  valorUnitario: number
  descuento?: number
  noIdentificacion?: string
}

export interface CfdiData {
  serie?: string
  folio: string
  fecha: string              // ISO-8601 without timezone: "2025-01-15T10:30:00"
  lugarExpedicion: string    // Postal code of emisor
  metodoPago: 'PUE' | 'PPD'
  formaPago: string          // '01' cash, '03' transfer, '04' card
  moneda: 'MXN'
  tipoCambio?: string
  tipoDeComprobante: 'I' | 'E' | 'N' | 'P'  // Ingreso, Egreso, Nota, Pago
  emisor: CfdiEmisor
  receptor: CfdiReceptor
  conceptos: CfdiConcepto[]
  condicionesDePago?: string
}

const IVA_RATE = 0.16

function round2(n: number) {
  return Math.round(n * 100) / 100
}

export function buildCfdiXml(data: CfdiData): string {
  const conceptosNodes: object[] = []
  let subtotal = 0
  let totalIva = 0

  for (const c of data.conceptos) {
    const importe = round2(c.cantidad * c.valorUnitario)
    const descuento = round2(c.descuento ?? 0)
    const baseGrav = round2(importe - descuento)
    const iva = round2(baseGrav * IVA_RATE)
    subtotal += importe
    totalIva += iva

    const node: Record<string, unknown> = {
      '@ClaveProdServ': c.claveProdServ,
      '@ClaveUnidad': c.claveUnidad,
      '@Cantidad': c.cantidad,
      '@Descripcion': c.descripcion,
      '@ValorUnitario': c.valorUnitario.toFixed(2),
      '@Importe': importe.toFixed(2),
      '@ObjetoImp': '02',
      'cfdi:Impuestos': {
        'cfdi:Traslados': {
          'cfdi:Traslado': {
            '@Base': baseGrav.toFixed(2),
            '@Impuesto': '002',
            '@TipoFactor': 'Tasa',
            '@TasaOCuota': '0.160000',
            '@Importe': iva.toFixed(2),
          },
        },
      },
    }
    if (c.descuento) node['@Descuento'] = descuento.toFixed(2)
    if (c.noIdentificacion) node['@NoIdentificacion'] = c.noIdentificacion

    conceptosNodes.push({ 'cfdi:Concepto': node })
  }

  subtotal = round2(subtotal)
  totalIva = round2(totalIva)
  const total = round2(subtotal + totalIva)

  const doc = create({ version: '1.0', encoding: 'UTF-8' })
    .ele('cfdi:Comprobante', {
      'xmlns:cfdi': 'http://www.sat.gob.mx/cfd/4',
      'xmlns:xsi': 'http://www.w3.org/2001/XMLSchema-instance',
      'xsi:schemaLocation':
        'http://www.sat.gob.mx/cfd/4 http://www.sat.gob.mx/sitio_internet/cfd/4/cfdv40.xsd',
      Version: '4.0',
      Serie: data.serie ?? 'A',
      Folio: data.folio,
      Fecha: data.fecha,
      Sello: '',
      NoCertificado: '',
      Certificado: '',
      SubTotal: subtotal.toFixed(2),
      Total: total.toFixed(2),
      Moneda: data.moneda,
      TipoDeComprobante: data.tipoDeComprobante,
      MetodoPago: data.metodoPago,
      FormaPago: data.formaPago,
      LugarExpedicion: data.lugarExpedicion,
      ...(data.condicionesDePago ? { CondicionesDePago: data.condicionesDePago } : {}),
    })
    .ele('cfdi:Emisor', {
      Rfc: data.emisor.rfc,
      Nombre: data.emisor.nombre,
      RegimenFiscal: data.emisor.regimenFiscal,
    })
    .up()
    .ele('cfdi:Receptor', {
      Rfc: data.receptor.rfc,
      Nombre: data.receptor.nombre,
      DomicilioFiscalReceptor: data.receptor.domicilioFiscalReceptor,
      RegimenFiscalReceptor: data.receptor.regimenFiscalReceptor,
      UsoCFDI: data.receptor.usoCFDI,
    })
    .up()
    .ele('cfdi:Conceptos')

  for (const c of conceptosNodes) {
    doc.ele(c)
  }

  doc
    .up()
    .ele('cfdi:Impuestos', { TotalImpuestosTrasladados: totalIva.toFixed(2) })
    .ele('cfdi:Traslados')
    .ele('cfdi:Traslado', {
      Base: subtotal.toFixed(2),
      Impuesto: '002',
      TipoFactor: 'Tasa',
      TasaOCuota: '0.160000',
      Importe: totalIva.toFixed(2),
    })
    .up()
    .up()
    .up()

  return doc.end({ prettyPrint: false })
}
