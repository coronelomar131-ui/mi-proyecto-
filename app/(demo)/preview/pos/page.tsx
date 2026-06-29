'use client'

const fmt = (n: number) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', minimumFractionDigits: 0 }).format(n)

const products = [
  { name: 'Tornillo Hex 1/2"', sku: 'TRN-001', price: 12.5, stock: 480 },
  { name: 'Cable THW Cal. 12', sku: 'CAB-012', price: 18.0, stock: 8 },
  { name: 'Cemento Portland 50kg', sku: 'CEM-050', price: 285, stock: 3 },
  { name: 'Válvula Bola 3/4"', sku: 'VAL-034', price: 95, stock: 42 },
  { name: 'Tubo PVC 4"', sku: 'PVC-406', price: 168, stock: 5 },
  { name: 'Llave inglesa 12"', sku: 'HER-112', price: 145, stock: 21 },
  { name: 'Cinta Teflón', sku: 'CIN-001', price: 8, stock: 320 },
  { name: 'Copla Galv. 1"', sku: 'COP-100', price: 42, stock: 95 },
  { name: 'Alambre Galv. Rollo', sku: 'ALA-025', price: 380, stock: 14 },
  { name: 'Codo PVC 90° 2"', sku: 'COD-902', price: 28, stock: 130 },
  { name: 'Varilla Corr. 3/8"', sku: 'VAR-038', price: 78, stock: 60 },
  { name: 'Pija Autoperf. 1"', sku: 'PIJ-100', price: 0.8, stock: 2400 },
]

const cart = [
  { name: 'Cemento Portland 50kg', qty: 5, price: 285 },
  { name: 'Tornillo Hex 1/2"', qty: 100, price: 12.5 },
  { name: 'Válvula Bola 3/4"', qty: 3, price: 95 },
]
const subtotal = cart.reduce((s, i) => s + i.qty * i.price, 0)
const tax = subtotal * 0.16
const total = subtotal + tax

export default function POSPreview() {
  return (
    <div style={{ fontFamily: 'Inter, system-ui, sans-serif', background: '#0A0A0B', minHeight: '100vh', color: '#F0F0F5', display: 'flex', gap: 0 }}>
      {/* Left: products */}
      <div style={{ flex: 1, padding: '24px', borderRight: '1px solid rgba(255,255,255,0.07)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ fontSize: 18, fontWeight: 700 }}>Punto de Venta</div>
          <div style={{ background: '#1E1E24', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '8px 14px', fontSize: 13, color: '#555', display: 'flex', alignItems: 'center', gap: 8, width: 240 }}>
            🔍 Buscar producto o SKU...
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
          {products.map((p) => (
            <div key={p.sku} style={{ background: '#111114', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: '14px', cursor: 'pointer', position: 'relative', overflow: 'hidden' }}>
              {p.stock <= 10 && <div style={{ position: 'absolute', top: 8, right: 8, background: '#fbbf2420', color: '#fbbf24', fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 4 }}>BAJO</div>}
              <div style={{ fontSize: 12, color: '#E0E0EA', fontWeight: 500, lineHeight: 1.3, marginBottom: 8 }}>{p.name}</div>
              <div style={{ fontSize: 10, color: '#555', fontFamily: 'monospace', marginBottom: 10 }}>{p.sku}</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#00C4D4' }}>{fmt(p.price)}</div>
                <div style={{ background: 'rgba(0,196,212,0.15)', color: '#00C4D4', borderRadius: 8, padding: '4px 10px', fontSize: 18, fontWeight: 700, cursor: 'pointer' }}>+</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right: cart */}
      <div style={{ width: 340, padding: '24px', display: 'flex', flexDirection: 'column', background: '#0D0D10' }}>
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16, color: '#E0E0EA' }}>Carrito</div>

        {/* Customer */}
        <div style={{ background: '#1E1E24', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#555', marginBottom: 14 }}>
          🔍 Buscar cliente...
        </div>

        {/* Items */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {cart.map((item) => (
            <div key={item.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, color: '#E0E0EA', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</div>
                <div style={{ fontSize: 11, color: '#555', marginTop: 2 }}>{fmt(item.price)} c/u</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 10 }}>
                <div style={{ background: '#111114', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 6, padding: '2px 8px', fontSize: 12, cursor: 'pointer', color: '#888' }}>−</div>
                <span style={{ fontSize: 13, fontWeight: 600, minWidth: 20, textAlign: 'center' }}>{item.qty}</span>
                <div style={{ background: '#111114', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 6, padding: '2px 8px', fontSize: 12, cursor: 'pointer', color: '#888' }}>+</div>
              </div>
            </div>
          ))}
        </div>

        {/* Payment method */}
        <div style={{ marginTop: 16, marginBottom: 14 }}>
          <div style={{ fontSize: 11, color: '#555', marginBottom: 8 }}>MÉTODO DE PAGO</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
            {[
              { label: '💵 Efectivo', active: true },
              { label: '🏦 Transferencia', active: false },
              { label: '📄 Crédito', active: false },
            ].map((m) => (
              <div key={m.label} style={{ background: m.active ? 'rgba(0,196,212,0.15)' : '#1E1E24', border: `1px solid ${m.active ? 'rgba(0,196,212,0.4)' : 'rgba(255,255,255,0.07)'}`, borderRadius: 8, padding: '8px', textAlign: 'center', fontSize: 11, color: m.active ? '#00C4D4' : '#555', cursor: 'pointer', fontWeight: m.active ? 600 : 400 }}>{m.label}</div>
            ))}
          </div>
        </div>

        {/* Totals */}
        <div style={{ background: '#111114', borderRadius: 10, padding: '14px', marginBottom: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#555', marginBottom: 6 }}>
            <span>Subtotal</span><span>{fmt(subtotal)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#555', marginBottom: 8 }}>
            <span>IVA 16%</span><span>{fmt(tax)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 18, fontWeight: 700 }}>
            <span>Total</span><span style={{ color: '#00C4D4' }}>{fmt(total)}</span>
          </div>
        </div>

        <div style={{ background: '#00C4D4', borderRadius: 12, padding: '14px', textAlign: 'center', fontSize: 15, fontWeight: 700, color: '#000', cursor: 'pointer' }}>
          Cobrar {fmt(total)}
        </div>
      </div>
    </div>
  )
}
