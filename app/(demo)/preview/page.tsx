'use client'
import { TrendingUp, ShoppingCart, Users, Package, Truck, FileText, AlertTriangle, ArrowUpRight, ArrowDownRight, DollarSign, CheckCircle2, ArrowRight, Monitor, BarChart2 } from 'lucide-react'

const fmt = (n: number) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', minimumFractionDigits: 0 }).format(n)

export default function PreviewPage() {
  return (
    <div style={{ fontFamily: 'Inter, system-ui, sans-serif', background: '#0A0A0B', minHeight: '100vh', color: '#F0F0F5' }}>

      {/* SIDEBAR */}
      <div style={{ position: 'fixed', top: 0, left: 0, bottom: 0, width: 220, background: '#111114', borderRight: '1px solid rgba(255,255,255,0.07)', padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: 4 }}>
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#00C4D4', letterSpacing: '-0.5px' }}>GestorPro</div>
          <div style={{ fontSize: 11, color: '#555', marginTop: 2 }}>ERP para Distribuidores</div>
        </div>
        {[
          { label: 'Dashboard', active: true },
          { label: 'Punto de Venta' },
          { label: 'Ventas' },
          { label: 'Clientes' },
          { label: 'Inventario' },
          { label: 'Cotizaciones' },
          { label: 'Entregas' },
          { label: 'Finanzas' },
          { label: 'Reportes' },
          { label: 'Proveedores' },
          { label: 'Usuarios' },
          { label: 'Configuración' },
        ].map((item) => (
          <div key={item.label} style={{ padding: '8px 12px', borderRadius: 8, background: item.active ? 'rgba(0,196,212,0.12)' : 'transparent', color: item.active ? '#00C4D4' : '#888', fontSize: 13, fontWeight: item.active ? 600 : 400, cursor: 'pointer' }}>
            {item.label}
          </div>
        ))}
        <div style={{ marginTop: 'auto', padding: '12px', borderRadius: 10, background: 'rgba(0,196,212,0.06)', border: '1px solid rgba(0,196,212,0.15)' }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#F0F0F5' }}>Carlos Distribuidora</div>
          <div style={{ fontSize: 11, color: '#555', marginTop: 2 }}>Plan Pro · 14 días</div>
        </div>
      </div>

      {/* MAIN */}
      <div style={{ marginLeft: 220, padding: '32px 40px', maxWidth: 1200 }}>
        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ fontSize: 22, fontWeight: 700 }}>Buenos días, Carlos</div>
          <div style={{ fontSize: 13, color: '#555', marginTop: 4 }}>viernes, 27 de junio de 2025</div>
        </div>

        {/* KPI Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 32 }}>
          {[
            { label: 'Ventas de hoy', value: fmt(48200), sub: '+12.4% vs ayer', subUp: true, color: '#00C4D4', bg: 'rgba(0,196,212,0.1)' },
            { label: 'Ventas del mes', value: fmt(1284000), sub: null, color: '#34d399', bg: 'rgba(52,211,153,0.1)' },
            { label: 'Clientes activos', value: '247', sub: null, color: '#60a5fa', bg: 'rgba(96,165,250,0.1)' },
            { label: 'Entregas activas', value: '14', sub: null, color: '#a78bfa', bg: 'rgba(167,139,250,0.1)' },
            { label: 'Cotizaciones activas', value: '31', sub: null, color: '#fbbf24', bg: 'rgba(251,191,36,0.1)' },
            { label: 'Productos stock bajo', value: '8', sub: null, color: '#f87171', bg: 'rgba(248,113,113,0.1)' },
          ].map((kpi) => (
            <div key={kpi.label} style={{ background: '#111114', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '20px', cursor: 'pointer' }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: kpi.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
                <div style={{ width: 16, height: 16, background: kpi.color, borderRadius: 3 }} />
              </div>
              <div style={{ fontSize: 26, fontWeight: 700 }}>{kpi.value}</div>
              <div style={{ fontSize: 12, color: '#555', marginTop: 4 }}>{kpi.label}</div>
              {kpi.sub && <div style={{ fontSize: 11, color: kpi.subUp ? '#34d399' : '#f87171', marginTop: 6 }}>▲ {kpi.sub}</div>}
            </div>
          ))}
        </div>

        {/* Meta de ventas */}
        <div style={{ background: '#111114', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '20px', marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 600 }}>Meta mensual de ventas</div>
            <div style={{ fontSize: 13, color: '#555' }}>{fmt(1284000)} / {fmt(1500000)}</div>
          </div>
          <div style={{ height: 8, background: '#1E1E24', borderRadius: 99 }}>
            <div style={{ height: '100%', width: '85.6%', background: 'linear-gradient(90deg, #00C4D4, #34d399)', borderRadius: 99 }} />
          </div>
          <div style={{ fontSize: 11, color: '#34d399', marginTop: 8 }}>85.6% alcanzado — faltan {fmt(216000)} para la meta</div>
        </div>

        {/* Acciones rápidas */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ fontSize: 12, fontWeight: 500, color: '#555', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 }}>Acciones rápidas</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
            {[
              { label: 'Nueva venta', color: 'rgba(0,196,212,0.1)', border: 'rgba(0,196,212,0.2)', text: '#00C4D4' },
              { label: 'Nueva cotización', color: 'rgba(96,165,250,0.1)', border: 'rgba(96,165,250,0.2)', text: '#60a5fa' },
              { label: 'Ver entregas', color: 'rgba(167,139,250,0.1)', border: 'rgba(167,139,250,0.2)', text: '#a78bfa' },
              { label: 'Ver inventario', color: 'rgba(52,211,153,0.1)', border: 'rgba(52,211,153,0.2)', text: '#34d399' },
            ].map((a) => (
              <div key={a.label} style={{ background: a.color, border: `1px solid ${a.border}`, borderRadius: 12, padding: '12px 16px', color: a.text, fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>{a.label}</div>
            ))}
          </div>
        </div>

        {/* Bottom grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          {/* Ventas recientes */}
          <div style={{ background: '#111114', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 16 }}>Ventas recientes</div>
            {[
              { folio: 'VTA-00247', cliente: 'Ferretería López', total: 18400, status: 'confirmada', color: '#00C4D4' },
              { folio: 'VTA-00246', cliente: 'Materiales Pérez', total: 6200, status: 'pendiente', color: '#fbbf24' },
              { folio: 'VTA-00245', cliente: 'Construcciones Mx', total: 34100, status: 'entregada', color: '#34d399' },
              { folio: 'VTA-00244', cliente: 'Grupo Industrial SA', total: 9750, status: 'confirmada', color: '#00C4D4' },
              { folio: 'VTA-00243', cliente: 'Distribuidora Norte', total: 22300, status: 'entregada', color: '#34d399' },
            ].map((s) => (
              <div key={s.folio} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <div>
                  <div style={{ fontSize: 13, fontFamily: 'monospace', color: '#E0E0EA' }}>{s.folio}</div>
                  <div style={{ fontSize: 11, color: '#555', marginTop: 2 }}>{s.cliente}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{fmt(s.total)}</div>
                  <div style={{ fontSize: 11, color: s.color, marginTop: 2 }}>{s.status}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Alertas inventario */}
          <div style={{ background: '#111114', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 16 }}>Alertas de inventario</div>
            {[
              { name: 'Tornillo Hexagonal 1/2"', sku: 'TRN-001', stock: 0, min: 50, color: '#f87171' },
              { name: 'Cable THW Cal. 12', sku: 'CAB-012', stock: 8, min: 25, color: '#fbbf24' },
              { name: 'Cemento Portland 50kg', sku: 'CEM-050', stock: 3, min: 20, color: '#fbbf24' },
              { name: 'Válvula de Bola 3/4"', sku: 'VAL-034', stock: 12, min: 30, color: '#fbbf24' },
              { name: 'Tubo PVC 4" x 6m', sku: 'PVC-406', stock: 5, min: 15, color: '#fbbf24' },
            ].map((p) => (
              <div key={p.sku} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <div>
                  <div style={{ fontSize: 13, color: '#E0E0EA' }}>{p.name}</div>
                  <div style={{ fontSize: 11, color: '#555', fontFamily: 'monospace', marginTop: 2 }}>{p.sku}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: p.color }}>{p.stock === 0 ? 'Agotado' : `${p.stock} uds`}</div>
                  <div style={{ fontSize: 11, color: '#555', marginTop: 2 }}>mín {p.min}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
