'use client'

const fmt = (n: number) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', minimumFractionDigits: 0 }).format(n)

const products = [
  { sku: 'TRN-001', name: 'Tornillo Hexagonal 1/2"', cat: 'Ferretería', cost: 8, price: 12.5, stock: 0, min: 50, status: 'Agotado', sc: '#f87171' },
  { sku: 'CAB-012', name: 'Cable THW Calibre 12', cat: 'Eléctrico', cost: 12, price: 18, stock: 8, min: 25, status: 'Stock bajo', sc: '#fbbf24' },
  { sku: 'CEM-050', name: 'Cemento Portland 50kg', cat: 'Construcción', cost: 220, price: 285, stock: 3, min: 20, status: 'Stock bajo', sc: '#fbbf24' },
  { sku: 'VAL-034', name: 'Válvula de Bola 3/4"', cat: 'Plomería', cost: 65, price: 95, stock: 42, min: 15, status: 'Normal', sc: '#34d399' },
  { sku: 'PVC-406', name: 'Tubo PVC 4" x 6m', cat: 'Plomería', cost: 120, price: 168, stock: 5, min: 15, status: 'Stock bajo', sc: '#fbbf24' },
  { sku: 'HER-112', name: 'Llave inglesa 12"', cat: 'Herramienta', cost: 95, price: 145, stock: 21, min: 10, status: 'Normal', sc: '#34d399' },
  { sku: 'ALA-025', name: 'Alambre Galvanizado Rollo', cat: 'Ferretería', cost: 260, price: 380, stock: 14, min: 10, status: 'Normal', sc: '#34d399' },
  { sku: 'VAR-038', name: 'Varilla Corrugada 3/8"', cat: 'Construcción', cost: 55, price: 78, stock: 60, min: 30, status: 'Normal', sc: '#34d399' },
]

export default function InventarioPreview() {
  return (
    <div style={{ fontFamily: 'Inter, system-ui, sans-serif', background: '#0A0A0B', minHeight: '100vh', color: '#F0F0F5', padding: '32px 40px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 700 }}>Inventario</div>
          <div style={{ fontSize: 12, color: '#555', marginTop: 4 }}>182 productos activos</div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <div style={{ background: '#1E1E24', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '8px 14px', fontSize: 13, color: '#888' }}>↑ Importar</div>
          <div style={{ background: '#1E1E24', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '8px 14px', fontSize: 13, color: '#888' }}>% Actualizar precios</div>
          <div style={{ background: '#00C4D4', borderRadius: 10, padding: '8px 18px', fontSize: 13, fontWeight: 600, color: '#000' }}>+ Nuevo producto</div>
        </div>
      </div>

      {/* Alert banner */}
      <div style={{ background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)', borderRadius: 12, padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 16 }}>⚠️</span>
          <span style={{ fontSize: 13, color: '#f87171', fontWeight: 500 }}>4 productos con stock crítico — requieren reabasto urgente</span>
        </div>
        <div style={{ background: 'rgba(248,113,113,0.15)', color: '#f87171', padding: '5px 12px', borderRadius: 7, fontSize: 12, cursor: 'pointer' }}>↓ Exportar lista</div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, alignItems: 'center' }}>
        <div style={{ background: '#1E1E24', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '7px 14px', fontSize: 12, color: '#555' }}>🔍 Buscar nombre o SKU...</div>
        <div style={{ background: '#1E1E24', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '7px 14px', fontSize: 12, color: '#555' }}>Categoría ▾</div>
        <div style={{ background: '#fbbf2415', border: '1px solid rgba(251,191,36,0.25)', borderRadius: 8, padding: '7px 14px', fontSize: 12, color: '#fbbf24' }}>⚠ Stock bajo</div>
      </div>

      <div style={{ background: '#111114', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
              {['SKU', 'Nombre', 'Categoría', 'Costo', 'Precio venta', 'Stock', 'Mínimo', 'Estado', 'Acciones'].map((h) => (
                <th key={h} style={{ padding: '11px 14px', textAlign: 'left', fontSize: 11, color: '#555', fontWeight: 500, textTransform: 'uppercase', letterSpacing: 0.5 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {products.map((p, i) => (
              <tr key={p.sku} style={{ borderBottom: i < products.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                <td style={{ padding: '12px 14px', fontFamily: 'monospace', fontSize: 12, color: '#00C4D4' }}>{p.sku}</td>
                <td style={{ padding: '12px 14px', fontSize: 13, fontWeight: 500 }}>{p.name}</td>
                <td style={{ padding: '12px 14px', fontSize: 12, color: '#888' }}>{p.cat}</td>
                <td style={{ padding: '12px 14px', fontSize: 12, color: '#555' }}>{fmt(p.cost)}</td>
                <td style={{ padding: '12px 14px', fontSize: 13, fontWeight: 600 }}>{fmt(p.price)}</td>
                <td style={{ padding: '12px 14px', fontSize: 13, fontWeight: 700, color: p.stock === 0 ? '#f87171' : p.stock <= p.min ? '#fbbf24' : '#E0E0EA' }}>{p.stock}</td>
                <td style={{ padding: '12px 14px', fontSize: 12, color: '#555' }}>{p.min}</td>
                <td style={{ padding: '12px 14px' }}>
                  <span style={{ background: p.sc + '20', color: p.sc, padding: '3px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600 }}>{p.status}</span>
                </td>
                <td style={{ padding: '12px 14px' }}>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <span style={{ background: '#1E1E24', padding: '3px 8px', borderRadius: 5, fontSize: 11, color: '#888', cursor: 'pointer' }}>✏️</span>
                    <span style={{ background: '#1E1E24', padding: '3px 8px', borderRadius: 5, fontSize: 11, color: '#888', cursor: 'pointer' }}>📦</span>
                    {p.stock <= p.min && <span style={{ background: 'rgba(251,191,36,0.1)', padding: '3px 8px', borderRadius: 5, fontSize: 11, color: '#fbbf24', cursor: 'pointer' }}>🛒</span>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 }}>
        <div style={{ fontSize: 12, color: '#555' }}>Página <strong style={{ color: '#E0E0EA' }}>1</strong> de <strong style={{ color: '#E0E0EA' }}>7</strong> (182 productos)</div>
        <div style={{ display: 'flex', gap: 8 }}>
          <div style={{ background: '#1E1E24', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '6px 14px', fontSize: 12, color: '#555' }}>← Anterior</div>
          <div style={{ background: '#1E1E24', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '6px 14px', fontSize: 12, color: '#E0E0EA' }}>Siguiente →</div>
        </div>
      </div>
    </div>
  )
}
