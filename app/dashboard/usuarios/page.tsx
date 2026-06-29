'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatDate, formatCurrency, initials } from '@/lib/utils/format'
import { UserPlus, X, Shield, ShoppingCart, Package, Crown, Users, TrendingUp } from 'lucide-react'
import { EmptyState } from '@/components/ui/empty-state'
import { TableSkeleton } from '@/components/ui/skeleton'
import toast from 'react-hot-toast'
import { cn } from '@/lib/utils/cn'
import type { Profile, UserRole } from '@/types'

const ROLE_CONFIG: Record<UserRole, { label: string; icon: React.ElementType; badge: string; description: string }> = {
  admin: { label: 'Administrador', icon: Crown, badge: 'badge-accent', description: 'Acceso total al sistema' },
  vendedor: { label: 'Vendedor', icon: ShoppingCart, badge: 'badge-blue', description: 'Ventas, clientes y cotizaciones' },
  almacen: { label: 'Almacén', icon: Package, badge: 'badge-green', description: 'Inventario y entregas' },
}

interface UserStats {
  userId: string
  salesCount: number
  salesTotal: number
}

export default function UsuariosPage() {
  const supabase = createClient()
  const [users, setUsers] = useState<Profile[]>([])
  const [userStats, setUserStats] = useState<UserStats[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ email: '', full_name: '', role: 'vendedor' as UserRole })

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    const since = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()
    const [{ data: profiles }, { data: salesData }] = await Promise.all([
      supabase.from('profiles').select('*').order('created_at', { ascending: false }),
      supabase.from('sales').select('user_id, total').gte('created_at', since).neq('status', 'cancelada'),
    ])
    setUsers((profiles as Profile[]) ?? [])

    const statsMap: Record<string, UserStats> = {}
    salesData?.forEach((s) => {
      const uid = s.user_id as string
      if (!uid) return
      if (!statsMap[uid]) statsMap[uid] = { userId: uid, salesCount: 0, salesTotal: 0 }
      statsMap[uid].salesCount += 1
      statsMap[uid].salesTotal += s.total ?? 0
    })
    setUserStats(Object.values(statsMap))
    setLoading(false)
  }, [])

  useEffect(() => { fetchUsers() }, [fetchUsers])

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.email || !form.full_name) { toast.error('Completa todos los campos'); return }
    setSaving(true)

    const res = await fetch('/api/users/invite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const data = await res.json()

    if (!res.ok) {
      toast.error(data.error ?? 'Error al enviar invitación')
    } else {
      toast.success(`Invitación enviada a ${form.email}`)
      setShowModal(false)
      setForm({ email: '', full_name: '', role: 'vendedor' })
    }
    setSaving(false)
  }

  const handleUpdateRole = async (userId: string, role: UserRole) => {
    const { error } = await supabase.from('profiles').update({ role }).eq('id', userId)
    if (error) { toast.error('Error al actualizar rol'); return }
    toast.success('Rol actualizado')
    fetchUsers()
  }

  const handleToggleActive = async (userId: string, isActive: boolean) => {
    const { error } = await supabase.from('profiles').update({ is_active: !isActive }).eq('id', userId)
    if (error) { toast.error('Error'); return }
    toast.success(isActive ? 'Usuario desactivado' : 'Usuario activado')
    fetchUsers()
  }

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Usuarios</h1>
          <p className="text-xs text-text-tertiary mt-0.5">{users.length} miembros del equipo</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary btn">
          <UserPlus className="w-4 h-4" /> Invitar usuario
        </button>
      </div>

      {/* Role info */}
      <div className="grid sm:grid-cols-3 gap-3 mb-6">
        {Object.entries(ROLE_CONFIG).map(([role, config]) => (
          <div key={role} className="card p-4 flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-surface-3 flex items-center justify-center shrink-0">
              <config.icon className="w-4 h-4 text-text-secondary" />
            </div>
            <div>
              <p className="text-sm font-medium text-text-primary">{config.label}</p>
              <p className="text-xs text-text-tertiary mt-0.5">{config.description}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Monthly leaderboard */}
      {!loading && userStats.length > 0 && (
        <div className="card p-5 mb-6">
          <h3 className="text-sm font-semibold text-text-primary mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-accent" />
            Ventas del mes actual — ranking del equipo
          </h3>
          <div className="space-y-3">
            {[...userStats].sort((a, b) => b.salesTotal - a.salesTotal).map((stat, i) => {
              const user = users.find((u) => u.id === stat.userId)
              if (!user) return null
              const maxTotal = userStats[0]?.salesTotal ?? 1
              const pct = maxTotal > 0 ? (stat.salesTotal / maxTotal) * 100 : 0
              return (
                <div key={stat.userId} className="flex items-center gap-3">
                  <span className={cn('w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0', i === 0 ? 'bg-amber-400/20 text-amber-400' : i === 1 ? 'bg-surface-3 text-text-secondary' : 'bg-surface-3 text-text-tertiary')}>
                    {i + 1}
                  </span>
                  <div className="w-7 h-7 rounded-full bg-accent/20 border border-accent/30 flex items-center justify-center text-xs font-semibold text-accent shrink-0">
                    {initials(user.full_name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-text-primary font-medium">{user.full_name}</span>
                      <div className="flex items-center gap-2 text-right">
                        <span className="text-text-tertiary">{stat.salesCount} venta{stat.salesCount !== 1 ? 's' : ''}</span>
                        <span className="font-semibold text-text-primary">{formatCurrency(stat.salesTotal)}</span>
                      </div>
                    </div>
                    <div className="h-1.5 bg-surface-3 rounded-full overflow-hidden">
                      <div className={cn('h-full rounded-full transition-all', i === 0 ? 'bg-amber-400' : 'bg-accent')} style={{ width: `${pct.toFixed(0)}%` }} />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Usuario</th>
              <th>Email</th>
              <th>Rol</th>
              <th>Estado</th>
              <th>Ventas este mes</th>
              <th>Miembro desde</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <TableSkeleton rows={4} cols={7} />
            ) : users.length === 0 ? (
              <tr><td colSpan={7}>
                <EmptyState
                  icon={<Users className="w-6 h-6" />}
                  title="Sin usuarios aún"
                  description="Invita a tu equipo para que puedan usar GestorPro."
                  action={{ label: 'Invitar usuario', onClick: () => setShowModal(true) }}
                />
              </td></tr>
            ) : (
              users.map((user) => {
                const roleConfig = ROLE_CONFIG[user.role]
                const stats = userStats.find((s) => s.userId === user.id)
                return (
                  <tr key={user.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-accent/20 border border-accent/30 flex items-center justify-center text-xs font-semibold text-accent">
                          {initials(user.full_name)}
                        </div>
                        <div>
                          <p className="font-medium text-text-primary text-sm">{user.full_name}</p>
                          <span className={cn('badge text-2xs', roleConfig?.badge)}>{roleConfig?.label}</span>
                        </div>
                      </div>
                    </td>
                    <td className="text-text-secondary text-sm">{user.email}</td>
                    <td>
                      <select
                        className="bg-surface-2 border border-border rounded-lg px-2 py-1 text-xs text-text-secondary focus:outline-none focus:ring-1 focus:ring-accent/50"
                        value={user.role}
                        onChange={(e) => handleUpdateRole(user.id, e.target.value as UserRole)}
                      >
                        <option value="admin">Admin</option>
                        <option value="vendedor">Vendedor</option>
                        <option value="almacen">Almacén</option>
                      </select>
                    </td>
                    <td>
                      <span className={cn('badge', user.is_active ? 'badge-green' : 'badge-gray')}>
                        {user.is_active ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td>
                      {stats ? (
                        <div>
                          <p className="text-sm font-semibold text-text-primary">{formatCurrency(stats.salesTotal)}</p>
                          <p className="text-xs text-text-tertiary">{stats.salesCount} pedidos</p>
                        </div>
                      ) : (
                        <span className="text-xs text-text-tertiary">Sin ventas</span>
                      )}
                    </td>
                    <td className="text-text-tertiary text-xs">{formatDate(user.created_at)}</td>
                    <td>
                      <button
                        onClick={() => handleToggleActive(user.id, user.is_active)}
                        className={cn('btn btn-sm', user.is_active ? 'btn-danger' : 'btn-secondary')}
                      >
                        {user.is_active ? 'Desactivar' : 'Activar'}
                      </button>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h2 className="font-semibold text-text-primary">Invitar usuario</h2>
              <button onClick={() => setShowModal(false)} className="btn-ghost btn p-1.5"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleInvite} className="p-6 space-y-4">
              <div className="bg-surface-2 border border-border rounded-xl p-4 flex items-start gap-3">
                <Shield className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                <p className="text-xs text-text-secondary">
                  El usuario recibirá un email para configurar su contraseña y acceder a GestorPro con el rol asignado.
                </p>
              </div>
              <div>
                <label className="label">Nombre completo *</label>
                <input type="text" value={form.full_name} onChange={(e) => setForm(p => ({ ...p, full_name: e.target.value }))} className="input" placeholder="Juan Pérez" required />
              </div>
              <div>
                <label className="label">Email *</label>
                <input type="email" value={form.email} onChange={(e) => setForm(p => ({ ...p, email: e.target.value }))} className="input" placeholder="usuario@empresa.com" required />
              </div>
              <div>
                <label className="label">Rol</label>
                <select className="input" value={form.role} onChange={(e) => setForm(p => ({ ...p, role: e.target.value as UserRole }))}>
                  <option value="admin">Administrador — acceso total</option>
                  <option value="vendedor">Vendedor — ventas y clientes</option>
                  <option value="almacen">Almacén — inventario y entregas</option>
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary btn flex-1">Cancelar</button>
                <button type="submit" disabled={saving} className="btn-primary btn flex-1">
                  {saving ? 'Enviando...' : 'Enviar invitación'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
