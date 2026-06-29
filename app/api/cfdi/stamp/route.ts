import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { buildCfdiXml, type CfdiConcepto } from '@/lib/cfdi/xml'
import { stampCfdi } from '@/lib/cfdi/sw-sapiens'

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()

    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { saleId } = await request.json()
    if (!saleId) {
      return NextResponse.json({ error: 'saleId requerido' }, { status: 400 })
    }

    // Load sale with items and customer
    const { data: sale, error: saleErr } = await supabase
      .from('sales')
      .select(`
        *,
        customer:customers(*),
        items:sale_items(*, product:products(*))
      `)
      .eq('id', saleId)
      .single()

    if (saleErr || !sale) {
      return NextResponse.json({ error: 'Venta no encontrada' }, { status: 404 })
    }

    if (sale.cfdi_status === 'timbrado') {
      return NextResponse.json({ error: 'Esta venta ya fue timbrada' }, { status: 409 })
    }

    // Load organization fiscal data
    const { data: profile } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', session.user.id)
      .single()

    const { data: org } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', profile?.organization_id)
      .single()

    if (!org?.rfc || !org?.pac_username || !org?.pac_password) {
      return NextResponse.json(
        { error: 'Configuración fiscal incompleta. Ve a Configuración > Fiscal.' },
        { status: 422 }
      )
    }

    if (!sale.customer?.rfc) {
      return NextResponse.json(
        { error: 'El cliente no tiene RFC configurado.' },
        { status: 422 }
      )
    }

    // Map payment method to SAT forma de pago
    const formaMap: Record<string, string> = {
      efectivo: '01',
      transferencia: '03',
      tarjeta: '04',
      cheque: '02',
      credito: '99',
    }

    const formaPago = formaMap[sale.payment_method] ?? '99'
    const metodoPago = sale.payment_method === 'credito' ? 'PPD' : 'PUE'

    const fecha = new Date(sale.created_at)
      .toISOString()
      .replace('Z', '')
      .slice(0, 19)

    const conceptos: CfdiConcepto[] = sale.items.map((item: {
      quantity: number
      unit_price: number
      product: {
        name: string
        sat_product_key?: string
        sat_unit_key?: string
        sku?: string
      }
    }) => ({
      claveProdServ: item.product.sat_product_key ?? '01010101',
      claveUnidad: item.product.sat_unit_key ?? 'H87',
      descripcion: item.product.name,
      cantidad: item.quantity,
      valorUnitario: item.unit_price,
      noIdentificacion: item.product.sku,
    }))

    const xml = buildCfdiXml({
      folio: sale.folio,
      fecha,
      lugarExpedicion: org.fiscal_zip ?? '06600',
      metodoPago,
      formaPago,
      moneda: 'MXN',
      tipoDeComprobante: 'I',
      emisor: {
        rfc: org.rfc,
        nombre: org.razon_social ?? org.name,
        regimenFiscal: org.regimen_fiscal ?? '601',
      },
      receptor: {
        rfc: sale.customer.rfc,
        nombre: sale.customer.razon_social ?? sale.customer.name,
        domicilioFiscalReceptor: sale.customer.fiscal_zip ?? '06600',
        regimenFiscalReceptor: sale.customer.regimen_fiscal ?? '616',
        usoCFDI: sale.customer.uso_cfdi ?? 'G03',
      },
      conceptos,
    })

    const result = await stampCfdi(xml, {
      username: org.pac_username,
      password: org.pac_password,
    })

    // Persist stamped data
    await supabase
      .from('sales')
      .update({
        cfdi_uuid: result.uuid,
        cfdi_xml: result.xmlTimbrado,
        cfdi_status: 'timbrado',
      })
      .eq('id', saleId)

    return NextResponse.json({
      uuid: result.uuid,
      fechaTimbrado: result.fechaTimbrado,
      qrCode: result.qrCode,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error desconocido'
    console.error('[CFDI stamp]', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
