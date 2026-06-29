'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Building2, Bell, Shield, Palette, Save, TrendingUp, Tag, Plus, Trash2, FileText, Sparkles, Check } from 'lucide-react'
import toast from 'react-hot-toast'
import { useTheme } from '@/lib/context/theme-context'
import type { AppTheme, ThemeRadius, ThemeBackground } from '@/lib/context/theme-context'
import type { Category } from '@/types'

interface OrgData {
  id: string
  name: string
  slug: string
  plan: string
  rfc?: string
  razon_social?: string
  regimen_fiscal?: string
  fiscal_zip?: string
  pac_username?: string
  pac_password?: string
}

export default function ConfiguracionPage() {
  const supabase = createClient()
  const [saving, setSaving] = useState(false)
  const [savingOrg, setSavingOrg] = useState(false)
  const [org, setOrg] = useState<OrgData | null>(null)
  const [stats, setStats] = useState({ users: 0, products: 0, salesMonth: 0 })
  const [form, setForm] = useState({ full_name: '', email: '' })
  const [orgForm, setOrgForm] = useState({ name: '' })
  const [userId, setUserId] = useState('')
  const [categories, setCategories] = useState<Category[]>([])
  const [newCatName, setNewCatName] = useState('')
  const [savingCat, setSavingCat] = useState(false)
  const [fiscalForm, setFiscalForm] = useState({
    rfc: '', razon_social: '', regimen_fiscal: '', fiscal_zip: '', pac_username: '', pac_password: '',
  })
  const [savingFiscal, setSavingFiscal] = useState(false)
  const [activeSection, setActiveSection] = useState<'empresa' | 'apariencia' | 'seguridad'>('empresa')
  const { theme, setTheme } = useTheme()

  const fetchCategories = async () => {
    const { data } = await supabase.from('categories').select('*').order('name')
    setCategories((data as Category[]) ?? [])
  }

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return
      setUserId(session.user.id)
      const { data } = await supabase
        .from('profiles')
        .select('*, organizations(*)')
        .eq('id', session.user.id)
        .single()
      if (data) {
        setForm({ full_name: data.full_name ?? '', email: data.email ?? '' })
        const o = data.organizations as OrgData
        if (o) {
          setOrg(o)
          setOrgForm({ name: o.name })
          setFiscalForm({
            rfc: o.rfc ?? '',
            razon_social: o.razon_social ?? '',
            regimen_fiscal: o.regimen_fiscal ?? '',
            fiscal_zip: o.fiscal_zip ?? '',
            pac_username: o.pac_username ?? '',
            pac_password: o.pac_password ?? '',
          })
          const [{ count: userCount }, { count: productCount }, { data: salesData }] = await Promise.all([
            supabase.from('profiles').select('id', { count: 'exact' }).eq('organization_id', o.id).eq('is_active', true),
            supabase.from('products').select('id', { count: 'exact' }).eq('organization_id', o.id).eq('is_active', true),
            supabase.from('sales').select('total').eq('organization_id', o.id)
              .gte('created_at', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString())
              .neq('status', 'cancelada'),
          ])
          const salesMonth = salesData?.reduce((s, r) => s + (r.total ?? 0), 0) ?? 0
          setStats({ users: userCount ?? 0, products: productCount ?? 0, salesMonth })
        }
      }
    }
    fetchProfile()
    fetchCategories()
  }, [])

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newCatName.trim()) return
    setSavingCat(true)
    const { error } = await supabase.from('categories').insert({ organization_id: org?.id, name: newCatName.trim() })
    if (error) {
      toast.error(error.message.includes('duplicate') ? 'Esa categoría ya existe' : 'Error al crear categoría')
    } else {
      toast.success('Categoría creada')
      setNewCatName('')
      fetchCategories()
    }
    setSavingCat(false)
  }

  const handleDeleteCategory = async (id: string) => {
    const { error } = await supabase.from('categories').delete().eq('id', id)
    if (error) { toast.error('No se puede eliminar — tiene productos asignados'); return }
    toast.success('Categoría eliminada')
    fetchCategories()
  }

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!userId) return
    setSaving(true)
    const { error } = await supabase.from('profiles').update({ full_name: form.full_name }).eq('id', userId)
    if (error) toast.error('Error al guardar')
    else toast.success('Perfil actualizado')
    setSaving(false)
  }

  const handleSaveOrg = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!org) return
    setSavingOrg(true)
    const { error } = await supabase.from('organizations').update({ name: orgForm.name }).eq('id', org.id)
    if (error) toast.error('Error al actualizar empresa')
    else { toast.success('Nombre de empresa actualizado'); setOrg({ ...org, name: orgForm.name }) }
    setSavingOrg(false)
  }

  const handleSaveFiscal = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!org) return
    setSavingFiscal(true)
    const { error } = await supabase.from('organizations').update({
      rfc: fiscalForm.rfc || null,
      razon_social: fiscalForm.razon_social || null,
      regimen_fiscal: fiscalForm.regimen_fiscal || null,
      fiscal_zip: fiscalForm.fiscal_zip || null,
      pac_username: fiscalForm.pac_username || null,
      pac_password: fiscalForm.pac_password || null,
    }).eq('id', org.id)
    if (error) toast.error('Error al guardar datos fiscales')
    else toast.success('Datos fiscales guardados')
    setSavingFiscal(false)
  }

  const sections = [
    { id: 'empresa', icon: Building2, label: 'Empresa' },
    { id: 'apariencia', icon: Sparkles, label: 'Apariencia' },
    { id: 'seguridad', icon: Shield, label: 'Seguridad' },
  ] as const

  const ACCENT_PRESETS = [
    { label: 'Cyan',    hex: '#00C4D4' },
    { label: 'Violeta', hex: '#8B5CF6' },
    { label: 'Verde',   hex: '#10B981' },
    { label: 'Azul',    hex: '#3B82F6' },
    { label: 'Rosa',    hex: '#EC4899' },
    { label: 'Naranja', hex: '#F97316' },
    { label: 'Dorado',  hex: '#F59E0B' },
    { label: 'Rojo',    hex: '#EF4444' },
  ]

  const BACKGROUNDS: { id: ThemeBackground; label: string; desc: string; preview: string }[] = [
    { id: 'dark',   label: 'Negro puro',  desc: 'Oscuro absoluto', preview: '#0A0A0B' },
    { id: 'warm',   label: 'Cálido',      desc: 'Tono café oscuro', preview: '#1A100A' },
    { id: 'cool',   label: 'Frío',        desc: 'Tono azul oscuro', preview: '#080A0F' },
    { id: 'aurora', label: 'Aurora',      desc: 'Con gradiente', preview: '#07080F' },
  ]

  const RADIUS_OPTIONS: { id: ThemeRadius; label: string; preview: string }[] = [
    { id: 'compact', label: 'Compacto',    preview: '6px' },
    { id: 'default', label: 'Normal',      preview: '12px' },
    { id: 'rounded', label: 'Redondeado',  preview: '16px' },
    { id: 'pill',    label: 'Pill',        preview: '24px' },
  ]

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Configuración</h1>
          <p className="text-xs text-text-tertiary mt-0.5">Gestiona tu cuenta y empresa</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-4 gap-6">
        {/* Sidebar nav */}
        <div className="card p-3 h-fit space-y-0.5">
          {sections.map((s) => (
            <button
              key={s.id}
              onClick={() => setActiveSection(s.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                activeSection === s.id
                  ? 'bg-surface-2 text-text-primary font-medium'
                  : 'text-text-secondary hover:text-text-primary hover:bg-surface-2/50'
              }`}
            >
              <s.icon className={`w-4 h-4 ${activeSection === s.id ? 'text-accent' : 'text-text-tertiary'}`} />
              {s.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="lg:col-span-3 space-y-6">
          {/* ── APARIENCIA ── */}
          {activeSection === 'apariencia' && (
            <div className="space-y-6">
              {/* Accent color */}
              <div className="card p-6">
                <h3 className="text-sm font-semibold text-text-primary mb-5 pb-3 border-b border-border flex items-center gap-2">
                  <Palette className="w-4 h-4 text-accent" />
                  Color de acento
                </h3>
                <div className="grid grid-cols-4 sm:grid-cols-8 gap-2 mb-4">
                  {ACCENT_PRESETS.map((p) => (
                    <button
                      key={p.hex}
                      onClick={() => setTheme({ accent: p.hex })}
                      title={p.label}
                      className="relative flex flex-col items-center gap-1.5 group"
                    >
                      <div
                        className="w-9 h-9 rounded-xl border-2 transition-all duration-150 group-hover:scale-110"
                        style={{
                          background: p.hex,
                          borderColor: theme.accent === p.hex ? '#fff' : 'transparent',
                          boxShadow: theme.accent === p.hex ? `0 0 16px ${p.hex}80` : 'none',
                        }}
                      >
                        {theme.accent === p.hex && (
                          <Check className="w-4 h-4 text-white absolute inset-0 m-auto" />
                        )}
                      </div>
                      <span className="text-2xs text-text-tertiary">{p.label}</span>
                    </button>
                  ))}
                </div>
                <div>
                  <label className="label">Color personalizado</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={theme.accent}
                      onChange={(e) => setTheme({ accent: e.target.value })}
                      className="w-10 h-10 rounded-lg border border-border cursor-pointer bg-surface-2 p-0.5"
                    />
                    <input
                      type="text"
                      value={theme.accent}
                      onChange={(e) => {
                        if (/^#[0-9a-fA-F]{0,6}$/.test(e.target.value)) setTheme({ accent: e.target.value })
                      }}
                      className="input w-32 font-mono text-sm"
                      placeholder="#00C4D4"
                    />
                    <div
                      className="flex-1 h-9 rounded-lg border border-border flex items-center justify-center text-xs font-medium transition-all"
                      style={{ background: `${theme.accent}18`, color: theme.accent, borderColor: `${theme.accent}30` }}
                    >
                      Vista previa del acento
                    </div>
                  </div>
                </div>
              </div>

              {/* Liquid Glass */}
              <div className="card p-6">
                <div className="flex items-start justify-between mb-5 pb-3 border-b border-border">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-accent" />
                    <h3 className="text-sm font-semibold text-text-primary">Liquid Glass</h3>
                    {theme.glassMode && <span className="badge badge-accent text-2xs">ON</span>}
                  </div>
                  <button
                    onClick={() => setTheme({ glassMode: !theme.glassMode })}
                    className={`relative w-12 h-6 rounded-full transition-all duration-300 focus:outline-none ${
                      theme.glassMode ? 'bg-accent' : 'bg-surface-4'
                    }`}
                  >
                    <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all duration-300 ${
                      theme.glassMode ? 'left-7' : 'left-1'
                    }`} />
                  </button>
                </div>
                <p className="text-xs text-text-secondary mb-5">
                  Efecto de vidrio esmerilado en toda la interfaz — cards, sidebar, modales y tablas. Inspirado en el diseño Liquid Glass de Apple.
                </p>
                <div className={`transition-all duration-300 ${theme.glassMode ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
                  <label className="label">Intensidad del cristal</label>
                  <div className="flex items-center gap-4">
                    <input
                      type="range"
                      min={4}
                      max={48}
                      step={4}
                      value={theme.glassBlur}
                      onChange={(e) => setTheme({ glassBlur: Number(e.target.value) })}
                      className="flex-1 accent-current"
                      style={{ accentColor: theme.accent }}
                    />
                    <span className="text-xs font-mono text-text-secondary w-12 text-right">
                      {theme.glassBlur}px blur
                    </span>
                  </div>
                  <div className="flex justify-between text-2xs text-text-tertiary mt-1 px-0.5">
                    <span>Sutil</span><span>Medio</span><span>Intenso</span><span>Máximo</span>
                  </div>
                </div>
              </div>

              {/* Corner radius */}
              <div className="card p-6">
                <h3 className="text-sm font-semibold text-text-primary mb-5 pb-3 border-b border-border">
                  Esquinas
                </h3>
                <div className="grid grid-cols-4 gap-3">
                  {RADIUS_OPTIONS.map((r) => (
                    <button
                      key={r.id}
                      onClick={() => setTheme({ radius: r.id })}
                      className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition-all ${
                        theme.radius === r.id
                          ? 'border-accent/50 bg-accent/10 text-accent'
                          : 'border-border bg-surface-2 text-text-secondary hover:border-border-strong'
                      }`}
                    >
                      <div
                        className="w-10 h-8 bg-current opacity-20 border-2 border-current"
                        style={{ borderRadius: r.preview }}
                      />
                      <span className="text-xs font-medium">{r.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Background */}
              <div className="card p-6">
                <h3 className="text-sm font-semibold text-text-primary mb-5 pb-3 border-b border-border">
                  Fondo
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {BACKGROUNDS.map((bg) => (
                    <button
                      key={bg.id}
                      onClick={() => setTheme({ background: bg.id })}
                      className={`flex flex-col gap-2 p-3 rounded-xl border transition-all ${
                        theme.background === bg.id
                          ? 'border-accent/50 bg-accent/10'
                          : 'border-border bg-surface-2 hover:border-border-strong'
                      }`}
                    >
                      <div
                        className="w-full h-10 rounded-lg border border-white/10"
                        style={{ background: bg.preview }}
                      />
                      <div className="text-left">
                        <p className={`text-xs font-medium ${theme.background === bg.id ? 'text-accent' : 'text-text-primary'}`}>{bg.label}</p>
                        <p className="text-2xs text-text-tertiary">{bg.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Live preview */}
              <div className="card p-6">
                <h3 className="text-sm font-semibold text-text-primary mb-5 pb-3 border-b border-border flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-accent" />
                  Vista previa en tiempo real
                </h3>
                <div className="rounded-xl overflow-hidden border border-border" style={{ background: theme.background === 'dark' ? '#0A0A0B' : theme.background === 'warm' ? '#0D0908' : theme.background === 'cool' ? '#080A0F' : '#07080F' }}>
                  <div className="p-4 grid grid-cols-3 gap-3">
                    {['Ventas del mes', 'Clientes activos', 'Cotizaciones'].map((label, i) => (
                      <div
                        key={label}
                        className="p-3 rounded-xl border"
                        style={theme.glassMode ? {
                          background: 'linear-gradient(155deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 100%)',
                          backdropFilter: `blur(${theme.glassBlur}px) saturate(180%)`,
                          borderColor: 'rgba(255,255,255,0.13)',
                          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.15)',
                        } : {
                          background: '#111113',
                          borderColor: 'rgba(255,255,255,0.10)',
                        }}
                      >
                        <p className="text-2xs mb-1" style={{ color: 'rgba(255,255,255,0.5)' }}>{label}</p>
                        <p className="text-sm font-bold text-white">{['$248,500', '142', '38'][i]}</p>
                        <div className="mt-2 h-1 rounded-full" style={{ background: 'rgba(255,255,255,0.08)' }}>
                          <div className="h-full rounded-full transition-all" style={{ width: ['75%','55%','40%'][i], background: theme.accent }} />
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="px-4 pb-4 flex items-center gap-2">
                    <div
                      className="px-3 py-1.5 rounded-lg text-xs font-medium text-white"
                      style={{ background: theme.accent, boxShadow: `0 0 16px ${theme.accent}40` }}
                    >
                      Botón primario
                    </div>
                    <div
                      className="px-3 py-1.5 rounded-lg text-xs font-medium border"
                      style={theme.glassMode ? {
                        background: 'rgba(255,255,255,0.07)',
                        backdropFilter: 'blur(8px)',
                        borderColor: 'rgba(255,255,255,0.13)',
                        color: '#ddd',
                      } : {
                        background: '#1E1E24',
                        borderColor: 'rgba(255,255,255,0.1)',
                        color: '#ddd',
                      }}
                    >
                      Botón secundario
                    </div>
                    <span className="text-2xs px-2 py-0.5 rounded-full font-medium" style={{ background: `${theme.accent}20`, color: theme.accent, border: `1px solid ${theme.accent}30` }}>
                      Badge activo
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 rounded-xl bg-surface-2 border border-border">
                <div>
                  <p className="text-sm font-medium text-text-primary">Restablecer tema</p>
                  <p className="text-xs text-text-tertiary">Vuelve al diseño original</p>
                </div>
                <button
                  onClick={() => setTheme({ accent: '#00C4D4', glassMode: false, glassBlur: 20, radius: 'default', background: 'dark' })}
                  className="btn-secondary btn btn-sm"
                >
                  Restablecer
                </button>
              </div>
            </div>
          )}

          {/* ── EMPRESA ── */}
          {activeSection === 'empresa' && <>
          {/* Profile */}
          <div className="card p-6">
            <h3 className="text-sm font-semibold text-text-primary mb-5 pb-3 border-b border-border">
              Perfil personal
            </h3>
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 rounded-2xl bg-accent/20 border border-accent/30 flex items-center justify-center text-xl font-bold text-accent">
                  {form.full_name.slice(0, 2).toUpperCase() || 'U'}
                </div>
                <div>
                  <p className="text-sm font-medium text-text-primary">{form.full_name || 'Tu nombre'}</p>
                  <p className="text-xs text-text-tertiary">{form.email}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Nombre completo</label>
                  <input type="text" value={form.full_name} onChange={(e) => setForm(p => ({ ...p, full_name: e.target.value }))} className="input" />
                </div>
                <div>
                  <label className="label">Email</label>
                  <input type="email" value={form.email} disabled className="input opacity-50 cursor-not-allowed" />
                </div>
              </div>

              <div className="flex justify-end">
                <button type="submit" disabled={saving} className="btn-primary btn">
                  <Save className="w-4 h-4" />
                  {saving ? 'Guardando...' : 'Guardar cambios'}
                </button>
              </div>
            </form>
          </div>

          {/* Org info */}
          <div className="card p-6">
            <h3 className="text-sm font-semibold text-text-primary mb-5 pb-3 border-b border-border flex items-center gap-2">
              <Building2 className="w-4 h-4 text-accent" />
              Información de empresa
            </h3>
            <form onSubmit={handleSaveOrg} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Nombre de empresa</label>
                  <input type="text" value={orgForm.name} onChange={(e) => setOrgForm({ name: e.target.value })} className="input" />
                </div>
                <div>
                  <label className="label">Identificador (slug)</label>
                  <input type="text" value={org?.slug ?? ''} disabled className="input opacity-50 cursor-not-allowed" />
                </div>
              </div>
              <div className="flex justify-end">
                <button type="submit" disabled={savingOrg} className="btn-primary btn">
                  <Save className="w-4 h-4" />
                  {savingOrg ? 'Guardando...' : 'Guardar empresa'}
                </button>
              </div>
            </form>
          </div>

          {/* Plan info */}
          <div className="card p-6">
            <h3 className="text-sm font-semibold text-text-primary mb-5 pb-3 border-b border-border flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-accent" />
              Plan actual
            </h3>
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg font-bold text-text-primary capitalize">Plan {org?.plan ?? 'Pro'}</span>
                  <span className="badge badge-accent">Activo</span>
                </div>
                <p className="text-sm text-text-secondary">Usuarios ilimitados · Productos ilimitados · Todos los módulos</p>
              </div>
              <button className="btn-secondary btn btn-sm">Cambiar plan</button>
            </div>
            <div className="mt-4 pt-4 border-t border-border/50">
              <div className="grid grid-cols-3 gap-4 text-center">
                {[
                  { label: 'Usuarios activos', value: stats.users || '—' },
                  { label: 'Productos', value: stats.products || '—' },
                  { label: 'Ventas este mes', value: stats.salesMonth ? new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(stats.salesMonth) : '—' },
                ].map((stat) => (
                  <div key={stat.label}>
                    <p className="text-lg font-bold text-text-primary">{stat.value}</p>
                    <p className="text-xs text-text-tertiary">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Categories */}
          <div className="card p-6">
            <h3 className="text-sm font-semibold text-text-primary mb-5 pb-3 border-b border-border flex items-center gap-2">
              <Tag className="w-4 h-4 text-accent" />
              Categorías de productos
            </h3>
            <div className="space-y-2 mb-4">
              {categories.length === 0 && (
                <p className="text-sm text-text-tertiary text-center py-4">Sin categorías — agrega la primera</p>
              )}
              {categories.map((cat) => (
                <div key={cat.id} className="flex items-center justify-between px-3 py-2 rounded-lg bg-surface-2 group">
                  <div className="flex items-center gap-2">
                    <Tag className="w-3.5 h-3.5 text-text-tertiary" />
                    <span className="text-sm text-text-primary">{cat.name}</span>
                  </div>
                  <button
                    onClick={() => handleDeleteCategory(cat.id)}
                    className="opacity-0 group-hover:opacity-100 p-1 rounded text-text-tertiary hover:text-red-400 transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
            <form onSubmit={handleAddCategory} className="flex gap-2">
              <input
                type="text"
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                placeholder="Nueva categoría..."
                className="input flex-1"
              />
              <button type="submit" disabled={savingCat || !newCatName.trim()} className="btn-primary btn">
                <Plus className="w-4 h-4" />
                {savingCat ? 'Guardando...' : 'Agregar'}
              </button>
            </form>
          </div>

          {/* CFDI / Fiscal */}
          <div className="card p-6">
            <h3 className="text-sm font-semibold text-text-primary mb-5 pb-3 border-b border-border flex items-center gap-2">
              <FileText className="w-4 h-4 text-accent" />
              Datos fiscales / CFDI
            </h3>
            <form onSubmit={handleSaveFiscal} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">RFC del emisor</label>
                  <input
                    type="text"
                    value={fiscalForm.rfc}
                    onChange={(e) => setFiscalForm(p => ({ ...p, rfc: e.target.value.toUpperCase() }))}
                    className="input"
                    placeholder="XAXX010101000"
                    maxLength={13}
                  />
                </div>
                <div>
                  <label className="label">Razón social</label>
                  <input
                    type="text"
                    value={fiscalForm.razon_social}
                    onChange={(e) => setFiscalForm(p => ({ ...p, razon_social: e.target.value }))}
                    className="input"
                    placeholder="Mi Empresa S.A. de C.V."
                  />
                </div>
                <div>
                  <label className="label">Régimen fiscal</label>
                  <select
                    value={fiscalForm.regimen_fiscal}
                    onChange={(e) => setFiscalForm(p => ({ ...p, regimen_fiscal: e.target.value }))}
                    className="input"
                  >
                    <option value="">Seleccionar régimen</option>
                    <option value="601">601 – General de Ley Personas Morales</option>
                    <option value="603">603 – Personas Morales con Fines no Lucrativos</option>
                    <option value="605">605 – Sueldos y Salarios</option>
                    <option value="606">606 – Arrendamiento</option>
                    <option value="608">608 – Demás ingresos</option>
                    <option value="612">612 – Personas Físicas con Actividades Empresariales</option>
                    <option value="616">616 – Sin obligaciones fiscales</option>
                    <option value="621">621 – Incorporación Fiscal</option>
                    <option value="625">625 – Régimen de las Actividades Empresariales con ingresos a través de Plataformas Tecnológicas</option>
                    <option value="626">626 – Régimen Simplificado de Confianza</option>
                  </select>
                </div>
                <div>
                  <label className="label">Código postal fiscal</label>
                  <input
                    type="text"
                    value={fiscalForm.fiscal_zip}
                    onChange={(e) => setFiscalForm(p => ({ ...p, fiscal_zip: e.target.value }))}
                    className="input"
                    placeholder="06600"
                    maxLength={5}
                  />
                </div>
              </div>
              <div className="pt-2 border-t border-border/50">
                <p className="text-xs font-medium text-text-secondary mb-3">Credenciales PAC (SW SapienS)</p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">Usuario PAC</label>
                    <input
                      type="text"
                      value={fiscalForm.pac_username}
                      onChange={(e) => setFiscalForm(p => ({ ...p, pac_username: e.target.value }))}
                      className="input"
                      placeholder="usuario@empresa.com"
                    />
                  </div>
                  <div>
                    <label className="label">Contraseña PAC</label>
                    <input
                      type="password"
                      value={fiscalForm.pac_password}
                      onChange={(e) => setFiscalForm(p => ({ ...p, pac_password: e.target.value }))}
                      className="input"
                      placeholder="••••••••"
                    />
                  </div>
                </div>
              </div>
              <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                <p className="text-xs text-blue-400">
                  Para timbrar CFDIs necesitas: RFC, razón social, régimen fiscal, código postal y credenciales PAC activas con SW SapienS.
                  Las variables de entorno <code className="font-mono bg-blue-500/20 px-1 rounded">CONEKTA_PRIVATE_KEY</code>, <code className="font-mono bg-blue-500/20 px-1 rounded">WHATSAPP_TOKEN</code> y <code className="font-mono bg-blue-500/20 px-1 rounded">WHATSAPP_PHONE_NUMBER_ID</code> se configuran en Vercel.
                </p>
              </div>
              <div className="flex justify-end">
                <button type="submit" disabled={savingFiscal} className="btn-primary btn">
                  <Save className="w-4 h-4" />
                  {savingFiscal ? 'Guardando...' : 'Guardar datos fiscales'}
                </button>
              </div>
            </form>
          </div>

          </>}

          {/* ── SEGURIDAD ── */}
          {activeSection === 'seguridad' && <>
          <div className="card p-6">
            <h3 className="text-sm font-semibold text-text-primary mb-5 pb-3 border-b border-border flex items-center gap-2">
              <Shield className="w-4 h-4 text-accent" />
              Seguridad
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between py-3 border-b border-border/50">
                <div>
                  <p className="text-sm text-text-primary">Contraseña</p>
                  <p className="text-xs text-text-tertiary">Última actualización: nunca</p>
                </div>
                <button className="btn-secondary btn btn-sm">Cambiar contraseña</button>
              </div>
              <div className="flex items-center justify-between py-3">
                <div>
                  <p className="text-sm text-text-primary">Autenticación de dos factores</p>
                  <p className="text-xs text-text-tertiary">Agrega una capa extra de seguridad</p>
                </div>
                <button className="btn-secondary btn btn-sm">Activar 2FA</button>
              </div>
            </div>
          </div>

          <div className="card p-6 border-red-500/20">
            <h3 className="text-sm font-semibold text-red-400 mb-4">Zona de peligro</h3>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-text-primary">Eliminar cuenta</p>
                <p className="text-xs text-text-tertiary">Esta acción es irreversible</p>
              </div>
              <button className="btn-danger btn btn-sm">Eliminar cuenta</button>
            </div>
          </div>
          </>}
        </div>
      </div>
    </div>
  )
}
