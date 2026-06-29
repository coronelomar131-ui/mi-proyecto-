'use client'

const fmt = (n: number) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', minimumFractionDigits: 0 }).format(n)

const sales = [
  { folio: 'VTA-00247', cliente: 'Ferretería López', total: 18400, status: 'confirmada', pm: 'transferencia', fecha: '27/06/2025' },
  { folio: 'VTA-00246', cliente: 'Materiales Pérez SA', total: 6200, status: 'pendiente', pm: 'efectivo', fecha: '27/06/2025' },
  { folio: 'VTA-00245', cliente: 'Construcciones Mx', total: 34100, status: 'entregada', pm: 'crédito', fecha: '26/06/2025' },
  { folio: 'VTA-00244', cliente: 'Grupo Industrial SA', total: 9750, status: 'confirmada', pm: 'transferencia', fecha: '26/06/2025' },
  { folio: 'VTA-00243', cliente: 'Distribuidora Norte', total: 22300, status: 'entregada', pm: 'efectivo', fecha: '25/06/2025' },
  { folio: 'VTA-00242', cliente: 'Servicios Técnicos', total: 4800, status: 'cancelada', pm: 'efectivo', fecha: '25/06/2025' },
  { folio: 'VTA-00241', cliente: 'Herramientas Pro', total: 15600, status: 'confirmada', pm: 'cheque', fecha: '24/06/2025' },
  { folio: 'VTA-00240', cliente: 'Maquinaria Central', total: 48200, status: 'entregada', pm: 'transferencia', fecha: '24/06/2025' },
]

const statusColor: Record<string, string> = {
  pendiente: '#fbbf24', confirmada: '#00C4D4', entregada: '#34d399', cancelada: '#6b7280'
}

export default function VentasPreview() {
  return (
    <div style={{ fontFamily: 'Inter, system-ui, sans-serif', background: '#0A0A0B', minHeight: '100vh', color: '#F0F0F5', padding: '32px 40px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 700 }}>Ventas</div>
          <div style={{ fontSize: 12, color: '#555', marginTop: 4 }}>248 ventas este mes</div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <div style={{ background: '#1E1E24', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '8px 16px', fontSize: 13, color: '#888', cursor: 'pointer' }}>↓ Exportar CSV</div>
          <div style={{ background: '#00C4D4', borderRadius: 10, padding: '8px 18px', fontSize: 13, fontWeight: 600, color: '#000', cursor: 'pointer' }}>+ Nueva venta</div>
        </div>
      </div>

      {/* Filtros */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {['Todas', 'Pendiente', 'Confirmada', 'Entregada', 'Cancelada'].map((f, i) => (
          <div key={f} style={{ padding: '6px 14px', borderRadius: 8, background: i === 0 ? '#00C4D4' : '#1E1E24', color: i === 0 ? '#000' : '#888', fontSize: 12, fontWeight: i === 0 ? 600 : 400, cursor: 'pointer', border: '1px solid rgba(255,255,255,0.06)' }}>{f}</div>
        ))}
        <div style={{ marginLeft: 'auto', background: '#1E1E24', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '6px 12px', fontSize: 12, color: '#555', display: 'flex', alignItems: 'center', gap: 6 }}>
          🔍 Buscar folio...
        </div>
      </div>

      {/* Table */}
      <div style={{ background: '#111114', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
              {['Folio ↕', 'Cliente', 'Método pago', 'Total ↕', 'Estado ↕', 'Fecha', 'Acciones'].map((h) => (
                <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, color: '#555', fontWeight: 500, textTransform: 'uppercase', letterSpacing: 0.5 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sales.map((s, i) => (
              <tr key={s.folio} style={{ borderBottom: i < sales.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                <td style={{ padding: '13px 16px', fontFamily: 'monospace', fontSize: 13, color: '#00C4D4' }}>{s.folio}</td>
                <td style={{ padding: '13px 16px', fontSize: 13 }}>{s.cliente}</td>
                <td style={{ padding: '13px 16px', fontSize: 12, color: '#888', textTransform: 'capitalize' }}>{s.pm}</td>
                <td style={{ padding: '13px 16px', fontSize: 13, fontWeight: 600 }}>{fmt(s.total)}</td>
                <td style={{ padding: '13px 16px' }}>
                  <span style={{ background: statusColor[s.status] + '20', color: statusColor[s.status], padding: '3px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600, textTransform: 'capitalize' }}>{s.status}</span>
                </td>
                <td style={{ padding: '13px 16px', fontSize: 12, color: '#555' }}>{s.fecha}</td>
                <td style={{ padding: '13px 16px' }}>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <span style={{ background: '#1E1E24', padding: '4px 8px', borderRadius: 6, fontSize: 11, color: '#888', cursor: 'pointer' }}>👁 Ver</span>
                    <span style={{ background: '#1E1E24', padding: '4px 8px', borderRadius: 6, fontSize: 11, color: '#888', cursor: 'pointer' }}>🖨 PDF</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 }}>
        <div style={{ fontSize: 12, color: '#555' }}>Página <strong style={{ color: '#E0E0EA' }}>1</strong> de <strong style={{ color: '#E0E0EA' }}>10</strong> (248 ventas)</div>
        <div style={{ display: 'flex', gap: 8 }}>
          <div style={{ background: '#1E1E24', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '6px 14px', fontSize: 12, color: '#555' }}>← Anterior</div>
          <div style={{ background: '#1E1E24', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '6px 14px', fontSize: 12, color: '#E0E0EA' }}>Siguiente →</div>
        </div>
      </div>
    </div>
  )
}
