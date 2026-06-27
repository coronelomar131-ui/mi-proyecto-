'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Building2, Bell, Shield, Palette, Save, TrendingUp } from 'lucide-react'
import toast from 'react-hot-toast'

interface OrgData {
  id: string
  name: string
  slug: string
  plan: string
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
          // Fetch stats
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
  }, [])

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

  const sections = [
    { icon: Building2, label: 'Empresa', active: true },
    { icon: Bell, label: 'Notificaciones', active: false },
    { icon: Shield, label: 'Seguridad', active: false },
    { icon: Palette, label: 'Apariencia', active: false },
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
              key={s.label}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                s.active
                  ? 'bg-surface-2 text-text-primary font-medium'
                  : 'text-text-secondary hover:text-text-primary hover:bg-surface-2/50'
              }`}
            >
              <s.icon className={`w-4 h-4 ${s.active ? 'text-accent' : 'text-text-tertiary'}`} />
              {s.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="lg:col-span-3 space-y-6">
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

          {/* Security */}
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

          {/* Danger zone */}
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
        </div>
      </div>
    </div>
  )
}
