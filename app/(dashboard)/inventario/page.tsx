'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import { useDebounce } from '@/lib/hooks/use-debounce'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency, formatNumber } from '@/lib/utils/format'
import { Plus, Search, X, AlertTriangle, Package, Download, Edit2, TrendingUp, TrendingDown, Upload, FileSpreadsheet } from 'lucide-react'
import toast from 'react-hot-toast'
import { cn } from '@/lib/utils/cn'
import { EmptyState } from '@/components/ui/empty-state'
import { TableSkeleton } from '@/components/ui/skeleton'
import type { Product, Category } from '@/types'

export default function InventarioPage() {
  const supabase = createClient()
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [filterLow, setFilterLow] = useState(false)
  const [filterCategory, setFilterCategory] = useState<string>('')
  const [editProduct, setEditProduct] = useState<Product | null>(null)
  const [showStockModal, setShowStockModal] = useState(false)
  const [stockTarget, setStockTarget] = useState<Product | null>(null)
  const [stockAdjust, setStockAdjust] = useState('')
  const [stockType, setStockType] = useState<'add' | 'subtract' | 'set'>('add')
  const [form, setForm] = useState({
    sku: '', name: '', description: '', unit: 'pieza',
    cost_price: '', sale_price: '', stock: '0', min_stock: '5', category_id: '',
  })
  const [editForm, setEditForm] = useState({
    name: '', description: '', unit: 'pieza',
    cost_price: '', sale_price: '', min_stock: '', category_id: '',
  })
  const [showImport, setShowImport] = useState(false)
  const [importing, setImporting] = useState(false)
  const [importPreview, setImportPreview] = useState<{ sku: string; name: string; sale_price: number; stock: number }[]>([])

  const searchParams = useSearchParams()

  const fetchProducts = useCallback(async () => {
    setLoading(true)
    const [{ data: prods }, { data: cats }] = await Promise.all([
      supabase.from('products').select('*, category:categories(id, name)').order('name'),
      supabase.from('categories').select('*').order('name'),
    ])
    setProducts((prods as Product[]) ?? [])
    setCategories((cats as Category[]) ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { fetchProducts() }, [fetchProducts])
  useEffect(() => { if (searchParams.get('new') === '1') setShowModal(true) }, [searchParams])

  const debouncedSearch = useDebounce(search)
  const filtered = useMemo(() => products.filter((p) => {
    const matchSearch =
      p.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      p.sku.toLowerCase().includes(debouncedSearch.toLowerCase())
    const matchLow = !filterLow || p.stock <= p.min_stock
    const matchCat = !filterCategory || p.category_id === filterCategory
    return matchSearch && matchLow && matchCat
  }), [products, debouncedSearch, filterLow, filterCategory])

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
      category_id: form.category_id || null,
      is_active: true,
    })

    if (error) {
      toast.error(error.message.includes('duplicate') ? 'El SKU ya existe' : 'Error al crear producto')
    } else {
      toast.success('Producto creado')
      setShowModal(false)
      setForm({ sku: '', name: '', description: '', unit: 'pieza', cost_price: '', sale_price: '', stock: '0', min_stock: '5', category_id: '' })
      fetchProducts()
    }
    setSaving(false)
  }

  const openEdit = (p: Product) => {
    setEditProduct(p)
    setEditForm({
      name: p.name,
      description: p.description ?? '',
      unit: p.unit,
      cost_price: String(p.cost_price),
      sale_price: String(p.sale_price),
      min_stock: String(p.min_stock),
      category_id: p.category_id ?? '',
    })
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editProduct) return
    setSaving(true)
    const { error } = await supabase.from('products').update({
      name: editForm.name,
      description: editForm.description || null,
      unit: editForm.unit,
      cost_price: parseFloat(editForm.cost_price) || 0,
      sale_price: parseFloat(editForm.sale_price) || 0,
      min_stock: parseInt(editForm.min_stock) || 5,
      category_id: editForm.category_id || null,
    }).eq('id', editProduct.id)
    if (error) toast.error('Error al actualizar producto')
    else { toast.success('Producto actualizado'); setEditProduct(null); fetchProducts() }
    setSaving(false)
  }

  const handleStockAdjust = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!stockTarget) return
    setSaving(true)
    const qty = parseInt(stockAdjust) || 0
    let newStock = stockTarget.stock
    if (stockType === 'add') newStock += qty
    else if (stockType === 'subtract') newStock = Math.max(0, newStock - qty)
    else newStock = qty
    const { error } = await supabase.from('products').update({ stock: newStock }).eq('id', stockTarget.id)
    if (error) toast.error('Error al ajustar stock')
    else { toast.success(`Stock actualizado a ${newStock}`); setShowStockModal(false); setStockTarget(null); setStockAdjust(''); fetchProducts() }
    setSaving(false)
  }

  const handleCSVFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const text = ev.target?.result as string
      const lines = text.split('\n').map((l) => l.trim()).filter(Boolean)
      if (lines.length < 2) { toast.error('El archivo está vacío o no tiene datos'); return }
      // Try to detect header and parse
      const rows = lines.slice(1).map((line) => {
        const cols = line.split(',').map((c) => c.replace(/^"|"$/g, '').trim())
        return {
          sku: cols[0] ?? '',
          name: cols[1] ?? '',
          sale_price: parseFloat(cols[2]) || 0,
          stock: parseInt(cols[3]) || 0,
        }
      }).filter((r) => r.sku && r.name)
      setImportPreview(rows)
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  const handleImportProducts = async () => {
    if (importPreview.length === 0) return
    setImporting(true)
    let success = 0; let failed = 0
    for (const row of importPreview) {
      const { error } = await supabase.from('products').insert({
        sku: row.sku,
        name: row.name,
        sale_price: row.sale_price,
        stock: row.stock,
        cost_price: 0,
        unit: 'pieza',
        min_stock: 5,
        is_active: true,
      })
      if (error) failed++
      else success++
    }
    toast.success(`${success} productos importados${failed > 0 ? `, ${failed} con errores (SKU duplicado)` : ''}`)
    setShowImport(false)
    setImportPreview([])
    fetchProducts()
    setImporting(false)
  }

  const downloadTemplate = () => {
    const csv = 'SKU,Nombre,Precio de venta,Stock\nPROD-001,Ejemplo de producto,100.00,50'
    const blob = new Blob([csv], { type: 'text/csv' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = 'plantilla-productos.csv'
    a.click()
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
          <button onClick={() => setShowImport(true)} className="btn-secondary btn btn-sm">
            <Upload className="w-3.5 h-3.5" /> Importar CSV
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
      <div className="flex flex-col sm:flex-row gap-3 mb-2">
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

      {/* Category filter chips */}
      {categories.length > 0 && (
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          <button
            onClick={() => setFilterCategory('')}
            className={cn('px-3 py-1 rounded-full text-xs font-medium border transition-all', !filterCategory ? 'bg-accent text-surface-0 border-accent' : 'bg-surface-2 text-text-secondary border-border hover:border-accent/50')}
          >
            Todas
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setFilterCategory(filterCategory === cat.id ? '' : cat.id)}
              className={cn('px-3 py-1 rounded-full text-xs font-medium border transition-all', filterCategory === cat.id ? 'bg-accent text-surface-0 border-accent' : 'bg-surface-2 text-text-secondary border-border hover:border-accent/50')}
            >
              {cat.name}
            </button>
          ))}
        </div>
      )}

      {/* Table */}
      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>SKU</th>
              <th>Producto</th>
              <th>Categoría</th>
              <th>Costo</th>
              <th>Precio venta</th>
              <th>Stock</th>
              <th>Mínimo</th>
              <th>Estado</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <TableSkeleton rows={6} cols={9} />
            ) : filtered.length === 0 ? (
              <tr><td colSpan={9}>
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
                  <tr key={p.id} className="cursor-pointer hover:bg-surface-2/30" onClick={() => openEdit(p)}>
                    <td className="font-mono text-xs text-accent">{p.sku}</td>
                    <td>
                      <p className="font-medium text-text-primary text-sm">{p.name}</p>
                      {p.description && <p className="text-xs text-text-tertiary truncate max-w-[200px]">{p.description}</p>}
                    </td>
                    <td className="text-text-tertiary text-xs">{(p.category as unknown as { name: string })?.name ?? '—'}</td>
                    <td>{formatCurrency(p.cost_price)}</td>
                    <td className="font-semibold text-text-primary">{formatCurrency(p.sale_price)}</td>
                    <td>
                      <span className={cn('font-semibold', p.stock === 0 ? 'text-red-400' : p.stock <= p.min_stock ? 'text-amber-400' : 'text-text-primary')}>
                        {formatNumber(p.stock)}
                      </span>
                    </td>
                    <td className="text-text-tertiary">{formatNumber(p.min_stock)}</td>
                    <td><span className={cn('badge', status.class)}>{status.label}</span></td>
                    <td onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={(e) => { e.stopPropagation(); setStockTarget(p); setShowStockModal(true) }}
                          className="btn-ghost btn p-1.5 text-text-tertiary hover:text-accent"
                          title="Ajustar stock"
                        >
                          <TrendingUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); openEdit(p) }}
                          className="btn-ghost btn p-1.5 text-text-tertiary hover:text-text-primary"
                          title="Editar producto"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Edit modal */}
      {editProduct && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setEditProduct(null)}>
          <div className="modal">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <div>
                <h2 className="font-semibold text-text-primary">Editar producto</h2>
                <p className="text-xs text-text-tertiary mt-0.5 font-mono">{editProduct.sku} · Stock actual: {formatNumber(editProduct.stock)}</p>
              </div>
              <button onClick={() => setEditProduct(null)} className="btn-ghost btn p-1.5"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleUpdate} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="label">Nombre *</label>
                  <input type="text" value={editForm.name} onChange={(e) => setEditForm(f => ({ ...f, name: e.target.value }))} className="input" required />
                </div>
                <div className="col-span-2">
                  <label className="label">Descripción</label>
                  <input type="text" value={editForm.description} onChange={(e) => setEditForm(f => ({ ...f, description: e.target.value }))} className="input" placeholder="Descripción opcional" />
                </div>
                <div>
                  <label className="label">Unidad</label>
                  <select value={editForm.unit} onChange={(e) => setEditForm(f => ({ ...f, unit: e.target.value }))} className="input">
                    <option value="pieza">Pieza</option>
                    <option value="caja">Caja</option>
                    <option value="kg">Kilogramo</option>
                    <option value="litro">Litro</option>
                    <option value="metro">Metro</option>
                  </select>
                </div>
                <div>
                  <label className="label">Stock mínimo</label>
                  <input type="number" min="0" value={editForm.min_stock} onChange={(e) => setEditForm(f => ({ ...f, min_stock: e.target.value }))} className="input" />
                </div>
                <div>
                  <label className="label">Precio de costo</label>
                  <input type="number" min="0" step="0.01" value={editForm.cost_price} onChange={(e) => setEditForm(f => ({ ...f, cost_price: e.target.value }))} className="input" />
                </div>
                <div>
                  <label className="label">Precio de venta</label>
                  <input type="number" min="0" step="0.01" value={editForm.sale_price} onChange={(e) => setEditForm(f => ({ ...f, sale_price: e.target.value }))} className="input" />
                </div>
                {categories.length > 0 && (
                  <div className="col-span-2">
                    <label className="label">Categoría</label>
                    <select value={editForm.category_id} onChange={(e) => setEditForm(f => ({ ...f, category_id: e.target.value }))} className="input">
                      <option value="">Sin categoría</option>
                      {categories.map((cat) => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                    </select>
                  </div>
                )}
              </div>
              {editForm.cost_price && editForm.sale_price && (
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-4 py-2 text-sm">
                  <span className="text-text-tertiary">Margen: </span>
                  <span className="text-emerald-400 font-semibold">
                    {(((parseFloat(editForm.sale_price) - parseFloat(editForm.cost_price)) / parseFloat(editForm.sale_price)) * 100).toFixed(1)}%
                  </span>
                  <span className="text-text-tertiary ml-2">· Ganancia: </span>
                  <span className="text-emerald-400 font-semibold">
                    {formatCurrency(parseFloat(editForm.sale_price) - parseFloat(editForm.cost_price))}
                  </span>
                </div>
              )}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setEditProduct(null)} className="btn-secondary btn flex-1">Cancelar</button>
                <button type="submit" disabled={saving} className="btn-primary btn flex-1">
                  {saving ? 'Guardando...' : 'Guardar cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Stock adjustment modal */}
      {showStockModal && stockTarget && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowStockModal(false)}>
          <div className="modal max-w-sm">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <div>
                <h2 className="font-semibold text-text-primary">Ajustar stock</h2>
                <p className="text-xs text-text-tertiary mt-0.5">{stockTarget.name} · Actual: {formatNumber(stockTarget.stock)}</p>
              </div>
              <button onClick={() => setShowStockModal(false)} className="btn-ghost btn p-1.5"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleStockAdjust} className="p-6 space-y-4">
              <div className="grid grid-cols-3 gap-2">
                {(['add', 'subtract', 'set'] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setStockType(t)}
                    className={cn('btn text-sm py-2', stockType === t ? 'btn-primary' : 'btn-secondary')}
                  >
                    {t === 'add' ? <><TrendingUp className="w-3.5 h-3.5" /> Agregar</> : t === 'subtract' ? <><TrendingDown className="w-3.5 h-3.5" /> Restar</> : 'Fijar'}
                  </button>
                ))}
              </div>
              <div>
                <label className="label">{stockType === 'set' ? 'Nuevo stock' : 'Cantidad'}</label>
                <input
                  type="number" min="0" value={stockAdjust}
                  onChange={(e) => setStockAdjust(e.target.value)}
                  className="input text-center text-lg font-semibold"
                  placeholder="0" autoFocus
                />
              </div>
              {stockAdjust && (
                <p className="text-sm text-text-secondary text-center">
                  Stock resultante:{' '}
                  <span className="text-accent font-semibold">
                    {stockType === 'add' ? stockTarget.stock + (parseInt(stockAdjust) || 0)
                      : stockType === 'subtract' ? Math.max(0, stockTarget.stock - (parseInt(stockAdjust) || 0))
                      : (parseInt(stockAdjust) || 0)}
                  </span>
                </p>
              )}
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowStockModal(false)} className="btn-secondary btn flex-1">Cancelar</button>
                <button type="submit" disabled={saving || !stockAdjust} className="btn-primary btn flex-1">
                  {saving ? 'Guardando...' : 'Aplicar ajuste'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CSV Import modal */}
      {showImport && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowImport(false)}>
          <div className="modal w-full max-w-xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <div>
                <h2 className="font-semibold text-text-primary">Importar productos desde CSV</h2>
                <p className="text-xs text-text-tertiary mt-0.5">Columnas: SKU, Nombre, Precio de venta, Stock</p>
              </div>
              <button onClick={() => setShowImport(false)} className="btn-ghost btn p-1.5"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-surface-2 border border-dashed border-border rounded-xl p-6 flex flex-col items-center gap-3 text-center">
                <FileSpreadsheet className="w-8 h-8 text-text-tertiary opacity-50" />
                <div>
                  <p className="text-sm text-text-secondary">Arrastra tu archivo CSV o</p>
                  <label className="text-accent text-sm cursor-pointer hover:underline">
                    selecciona un archivo
                    <input type="file" accept=".csv" onChange={handleCSVFile} className="hidden" />
                  </label>
                </div>
                <button onClick={downloadTemplate} className="btn-secondary btn btn-sm text-xs">
                  <Download className="w-3 h-3" /> Descargar plantilla
                </button>
              </div>

              {importPreview.length > 0 && (
                <div>
                  <p className="text-xs text-text-tertiary mb-2">{importPreview.length} productos listos para importar:</p>
                  <div className="max-h-48 overflow-y-auto table-container">
                    <table className="table text-xs">
                      <thead><tr><th>SKU</th><th>Nombre</th><th>Precio</th><th>Stock</th></tr></thead>
                      <tbody>
                        {importPreview.slice(0, 20).map((r, i) => (
                          <tr key={i}>
                            <td className="font-mono text-accent">{r.sku}</td>
                            <td>{r.name}</td>
                            <td>{formatCurrency(r.sale_price)}</td>
                            <td>{formatNumber(r.stock)}</td>
                          </tr>
                        ))}
                        {importPreview.length > 20 && (
                          <tr><td colSpan={4} className="text-center text-text-tertiary py-2">...y {importPreview.length - 20} más</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <button type="button" onClick={() => { setShowImport(false); setImportPreview([]) }} className="btn-secondary btn flex-1">Cancelar</button>
                <button
                  onClick={handleImportProducts}
                  disabled={importing || importPreview.length === 0}
                  className="btn-primary btn flex-1"
                >
                  {importing ? 'Importando...' : `Importar ${importPreview.length} productos`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create modal */}
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
                {categories.length > 0 && (
                  <div className="col-span-2">
                    <label className="label">Categoría</label>
                    <select value={form.category_id} onChange={(e) => setForm(p => ({ ...p, category_id: e.target.value }))} className="input">
                      <option value="">Sin categoría</option>
                      {categories.map((cat) => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                    </select>
                  </div>
                )}
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
