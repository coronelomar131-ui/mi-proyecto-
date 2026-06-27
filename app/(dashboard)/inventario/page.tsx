'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useDebounce } from '@/lib/hooks/use-debounce'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency, formatNumber } from '@/lib/utils/format'
import { Plus, Search, X, AlertTriangle, Package, Download } from 'lucide-react'
import toast from 'react-hot-toast'
import { cn } from '@/lib/utils/cn'
import { EmptyState } from '@/components/ui/empty-state'
import { TableSkeleton } from '@/components/ui/skeleton'
import type { Product } from '@/types'

export default function InventarioPage() {
  const supabase = createClient()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [filterLow, setFilterLow] = useState(false)
  const [form, setForm] = useState({
    sku: '', name: '', description: '', unit: 'pieza',
    cost_price: '', sale_price: '', stock: '0', min_stock: '5',
  })

  const fetchProducts = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase.from('products').select('*').order('name')
    setProducts((data as Product[]) ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { fetchProducts() }, [fetchProducts])

  const debouncedSearch = useDebounce(search)
  const filtered = useMemo(() => products.filter((p) => {
    const matchSearch =
      p.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      p.sku.toLowerCase().includes(debouncedSearch.toLowerCase())
    const matchLow = !filterLow || p.stock <= p.min_stock
    return matchSearch && matchLow
  }), [products, debouncedSearch, filterLow])

  const lowStockCount = products.filter((p) => p.stock <= p.min_stock).length

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.sku || !form.name) { toast.error('SKU y nombre son requeridos'); return }
    setSaving(true)

    const { error } = await supabase.from('products').insert({
      sku: form.sku,
      name: form.name,
      description: form.description || null,
      unit: form.unit,
      cost_price: parseFloat(form.cost_price) || 0,
      sale_price: parseFloat(form.sale_price) || 0,
      stock: parseInt(form.stock) || 0,
      min_stock: parseInt(form.min_stock) || 5,
      is_active: true,
    })

    if (error) {
      toast.error(error.message.includes('duplicate') ? 'El SKU ya existe' : 'Error al crear producto')
    } else {
      toast.success('Producto creado')
      setShowModal(false)
      setForm({ sku: '', name: '', description: '', unit: 'pieza', cost_price: '', sale_price: '', stock: '0', min_stock: '5' })
      fetchProducts()
    }
    setSaving(false)
  }

  const getStockStatus = (p: Product) => {
    if (p.stock === 0) return { label: 'Agotado', class: 'badge-red' }
    if (p.stock <= p.min_stock) return { label: 'Stock bajo', class: 'badge-yellow' }
    return { label: 'En stock', class: 'badge-green' }
  }

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Inventario</h1>
          <p className="text-xs text-text-tertiary mt-0.5">{products.length} productos</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              const csv = ['SKU,Nombre,Unidad,Costo,Precio,Stock,Stock Mínimo,Estado']
              products.forEach((p) => {
                const status = p.stock === 0 ? 'Agotado' : p.stock <= p.min_stock ? 'Stock bajo' : 'En stock'
                csv.push(`${p.sku},"${p.name}",${p.unit},${p.cost_price},${p.sale_price},${p.stock},${p.min_stock},${status}`)
              })
              const blob = new Blob([csv.join('\n')], { type: 'text/csv' })
              const a = document.createElement('a')
              a.href = URL.createObjectURL(blob)
              a.download = `inventario-${new Date().toISOString().split('T')[0]}.csv`
              a.click()
            }}
            className="btn-secondary btn btn-sm"
          >
            <Download className="w-3.5 h-3.5" /> Exportar
          </button>
          <button onClick={() => setShowModal(true)} className="btn-primary btn">
            <Plus className="w-4 h-4" /> Nuevo producto
          </button>
        </div>
      </div>

      {/* Stats */}
      {lowStockCount > 0 && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 mb-5 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
          <p className="text-sm text-amber-300">
            <strong>{lowStockCount} productos</strong> con stock bajo o agotado. Revisa y repone.
          </p>
          <button onClick={() => setFilterLow(true)} className="ml-auto text-xs text-amber-400 hover:text-amber-300 underline">
            Ver solo estos
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre o SKU..."
            className="input pl-9"
          />
        </div>
        <button
          onClick={() => setFilterLow(!filterLow)}
          className={cn('btn text-sm', filterLow ? 'btn-primary' : 'btn-secondary')}
        >
          <AlertTriangle className="w-3.5 h-3.5" />
          {filterLow ? 'Todos los productos' : 'Solo stock bajo'}
        </button>
      </div>

      {/* Table */}
      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>SKU</th>
              <th>Producto</th>
              <th>Unidad</th>
              <th>Costo</th>
              <th>Precio venta</th>
              <th>Stock</th>
              <th>Mínimo</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <TableSkeleton rows={6} cols={8} />
            ) : filtered.length === 0 ? (
              <tr><td colSpan={8}>
                <EmptyState
                  icon={<Package className="w-6 h-6" />}
                  title={debouncedSearch || filterLow ? 'Sin resultados' : 'Sin productos aún'}
                  description={debouncedSearch ? `No hay productos con "${debouncedSearch}"` : filterLow ? 'No hay productos con stock bajo. ¡Bien surtido!' : 'Agrega tu primer producto al catálogo para empezar a vender.'}
                  action={!debouncedSearch && !filterLow ? { label: 'Agregar producto', onClick: () => setShowModal(true) } : undefined}
                />
              </td></tr>
            ) : (
              filtered.map((p) => {
                const status = getStockStatus(p)
                return (
                  <tr key={p.id}>
                    <td className="font-mono text-xs text-accent">{p.sku}</td>
                    <td>
                      <p className="font-medium text-text-primary text-sm">{p.name}</p>
                      {p.description && <p className="text-xs text-text-tertiary truncate max-w-[200px]">{p.description}</p>}
                    </td>
                    <td>{p.unit}</td>
                    <td>{formatCurrency(p.cost_price)}</td>
                    <td className="font-semibold text-text-primary">{formatCurrency(p.sale_price)}</td>
                    <td>
                      <span className={cn('font-semibold', p.stock === 0 ? 'text-red-400' : p.stock <= p.min_stock ? 'text-amber-400' : 'text-text-primary')}>
                        {formatNumber(p.stock)}
                      </span>
                    </td>
                    <td className="text-text-tertiary">{formatNumber(p.min_stock)}</td>
                    <td><span className={cn('badge', status.class)}>{status.label}</span></td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h2 className="font-semibold text-text-primary">Nuevo producto</h2>
              <button onClick={() => setShowModal(false)} className="btn-ghost btn p-1.5"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">SKU *</label>
                  <input type="text" value={form.sku} onChange={(e) => setForm(p => ({ ...p, sku: e.target.value }))} className="input" placeholder="PROD-001" required />
                </div>
                <div>
                  <label className="label">Unidad</label>
                  <select value={form.unit} onChange={(e) => setForm(p => ({ ...p, unit: e.target.value }))} className="input">
                    <option value="pieza">Pieza</option>
                    <option value="caja">Caja</option>
                    <option value="kg">Kilogramo</option>
                    <option value="litro">Litro</option>
                    <option value="metro">Metro</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="label">Nombre *</label>
                  <input type="text" value={form.name} onChange={(e) => setForm(p => ({ ...p, name: e.target.value }))} className="input" placeholder="Nombre del producto" required />
                </div>
                <div className="col-span-2">
                  <label className="label">Descripción</label>
                  <input type="text" value={form.description} onChange={(e) => setForm(p => ({ ...p, description: e.target.value }))} className="input" placeholder="Descripción opcional" />
                </div>
                <div>
                  <label className="label">Precio de costo</label>
                  <input type="number" min="0" step="0.01" value={form.cost_price} onChange={(e) => setForm(p => ({ ...p, cost_price: e.target.value }))} className="input" placeholder="0.00" />
                </div>
                <div>
                  <label className="label">Precio de venta</label>
                  <input type="number" min="0" step="0.01" value={form.sale_price} onChange={(e) => setForm(p => ({ ...p, sale_price: e.target.value }))} className="input" placeholder="0.00" />
                </div>
                <div>
                  <label className="label">Stock inicial</label>
                  <input type="number" min="0" value={form.stock} onChange={(e) => setForm(p => ({ ...p, stock: e.target.value }))} className="input" />
                </div>
                <div>
                  <label className="label">Stock mínimo</label>
                  <input type="number" min="0" value={form.min_stock} onChange={(e) => setForm(p => ({ ...p, min_stock: e.target.value }))} className="input" />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary btn flex-1">Cancelar</button>
                <button type="submit" disabled={saving} className="btn-primary btn flex-1">
                  {saving ? 'Guardando...' : 'Crear producto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
