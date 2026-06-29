'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRealtime } from '@/lib/hooks/use-realtime'
import { createClient } from '@/lib/supabase/client'
import { formatDate } from '@/lib/utils/format'
import { Truck, MapPin, Clock, CheckCircle, XCircle, Navigation, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { cn } from '@/lib/utils/cn'
import { EmptyState } from '@/components/ui/empty-state'
import { CardSkeleton } from '@/components/ui/skeleton'
import type { Delivery, DeliveryStatus } from '@/types'

const STATUS_CONFIG: Record<DeliveryStatus, { label: string; badge: string; icon: React.ElementType }> = {
  pendiente: { label: 'Pendiente', badge: 'badge-yellow', icon: Clock },
  en_ruta: { label: 'En ruta', badge: 'badge-accent', icon: Navigation },
  entregado: { label: 'Entregado', badge: 'badge-green', icon: CheckCircle },
  fallido: { label: 'Fallido', badge: 'badge-red', icon: XCircle },
}

const STATUS_TRANSITIONS: Record<DeliveryStatus, DeliveryStatus | null> = {
  pendiente: 'en_ruta',
  en_ruta: 'entregado',
  entregado: null,
  fallido: null,
}

export default function EntregasPage() {
  const supabase = createClient()
  const [orgId, setOrgId] = useState('')
  const [deliveries, setDeliveries] = useState<Delivery[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState<DeliveryStatus | 'all'>('all')
  const [failingDelivery, setFailingDelivery] = useState<Delivery | null>(null)
  const [failureReason, setFailureReason] = useState('')
  const [savingFail, setSavingFail] = useState(false)

  const fetchDeliveries = useCallback(async (currentOrgId?: string) => {
    setLoading(true)
    const { data } = await supabase
      .from('deliveries')
      .select('*, sale:sales(folio, customer:customers(name))')
      .eq('organization_id', currentOrgId ?? orgId)
      .order('created_at', { ascending: false })
      .limit(100)
    setDeliveries((data as Delivery[]) ?? [])
    setLoading(false)
  }, [orgId])

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) return
      const { data } = await supabase.from('profiles').select('organization_id').eq('id', session.user.id).single()
      if (data) {
        setOrgId(data.organization_id)
        fetchDeliveries(data.organization_id)
      }
    })
  }, [])
  useRealtime(['deliveries'], () => fetchDeliveries())

  const filtered = deliveries.filter((d) => filterStatus === 'all' || d.status === filterStatus)

  const counts = {
    all: deliveries.length,
    pendiente: deliveries.filter((d) => d.status === 'pendiente').length,
    en_ruta: deliveries.filter((d) => d.status === 'en_ruta').length,
    entregado: deliveries.filter((d) => d.status === 'entregado').length,
    fallido: deliveries.filter((d) => d.status === 'fallido').length,
  }

  const handleAdvanceStatus = async (delivery: Delivery) => {
    const next = STATUS_TRANSITIONS[delivery.status]
    if (!next) return

    const update: Record<string, unknown> = { status: next }
    if (next === 'entregado') update.delivered_at = new Date().toISOString()

    const { error } = await supabase.from('deliveries').update(update).eq('id', delivery.id)
    if (error) { toast.error('Error al actualizar'); return }
    toast.success(`Entrega marcada como: ${STATUS_CONFIG[next].label}`)
    fetchDeliveries()
  }

  const handleMarkFailed = async () => {
    if (!failingDelivery) return
    setSavingFail(true)
    const { error } = await supabase.from('deliveries').update({
      status: 'fallido',
      notes: failureReason.trim() || null,
    }).eq('id', failingDelivery.id)
    if (error) { toast.error('Error al marcar entrega'); setSavingFail(false); return }
    toast.success('Entrega marcada como fallida')
    setFailingDelivery(null)
    setFailureReason('')
    setSavingFail(false)
    fetchDeliveries()
  }

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Entregas</h1>
          <p className="text-xs text-text-tertiary mt-0.5">{deliveries.length} registros</p>
        </div>
      </div>

      {/* Status filter tabs */}
      <div className="flex items-center gap-2 mb-5 overflow-x-auto pb-1">
        {(['all', 'pendiente', 'en_ruta', 'entregado', 'fallido'] as const).map((status) => (
          <button
            key={status}
            onClick={() => setFilterStatus(status)}
            className={cn(
              'flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all',
              filterStatus === status
                ? 'bg-accent text-surface-0'
                : 'bg-surface-2 text-text-secondary hover:text-text-primary hover:bg-surface-3'
            )}
          >
            {status === 'all' ? 'Todas' : STATUS_CONFIG[status].label}
            <span className={cn(
              'text-xs px-1.5 py-0.5 rounded-full',
              filterStatus === status ? 'bg-surface-0/20' : 'bg-surface-3'
            )}>
              {counts[status]}
            </span>
          </button>
        ))}
      </div>

      {/* Cards */}
      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<Truck className="w-6 h-6" />}
          title={filterStatus === 'all' ? 'Sin entregas aún' : `Sin entregas ${STATUS_CONFIG[filterStatus]?.label?.toLowerCase()}`}
          description={filterStatus === 'all' ? 'Las entregas aparecerán aquí cuando se creen ventas con envío.' : 'No hay entregas en este estado en este momento.'}
        />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((delivery) => {
            const config = STATUS_CONFIG[delivery.status]
            const StatusIcon = config.icon
            const nextStatus = STATUS_TRANSITIONS[delivery.status]
            const saleInfo = delivery.sale as unknown as { folio: string; customer?: { name: string } }

            return (
              <div key={delivery.id} className="card-hover p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className={cn(
                      'w-8 h-8 rounded-lg flex items-center justify-center',
                      delivery.status === 'en_ruta' ? 'bg-accent/20' :
                      delivery.status === 'entregado' ? 'bg-emerald-500/20' :
                      delivery.status === 'fallido' ? 'bg-red-500/20' : 'bg-amber-500/20'
                    )}>
                      <StatusIcon className={cn(
                        'w-4 h-4',
                        delivery.status === 'en_ruta' ? 'text-accent' :
                        delivery.status === 'entregado' ? 'text-emerald-400' :
                        delivery.status === 'fallido' ? 'text-red-400' : 'text-amber-400'
                      )} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-text-primary">
                        {saleInfo?.folio ?? 'Entrega sin folio'}
                      </p>
                      <p className="text-xs text-text-tertiary">{saleInfo?.customer?.name ?? '—'}</p>
                    </div>
                  </div>
                  <span className={cn('badge', config.badge)}>{config.label}</span>
                </div>

                {delivery.address && (
                  <a
                    href={`https://maps.google.com/?q=${encodeURIComponent(delivery.address)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-start gap-2 text-xs text-text-tertiary mb-3 hover:text-accent transition-colors group/map"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <MapPin className="w-3.5 h-3.5 shrink-0 mt-0.5 group-hover/map:text-accent" />
                    <span className="line-clamp-2 group-hover/map:underline">{delivery.address}</span>
                  </a>
                )}

                {delivery.scheduled_date && (
                  <div className="flex items-center gap-2 text-xs text-text-tertiary mb-4">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Programada: {formatDate(delivery.scheduled_date)}</span>
                  </div>
                )}

                {delivery.delivered_at && (
                  <div className="flex items-center gap-2 text-xs text-emerald-400 mb-4">
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>Entregada: {formatDate(delivery.delivered_at)}</span>
                  </div>
                )}

                {(nextStatus || delivery.status === 'en_ruta') && (
                  <div className="flex gap-2">
                    {nextStatus && (
                      <button
                        onClick={() => handleAdvanceStatus(delivery)}
                        className={cn(
                          'btn btn-sm flex-1',
                          nextStatus === 'en_ruta' ? 'btn-secondary' : 'btn-primary'
                        )}
                      >
                        <StatusIcon className="w-3.5 h-3.5" />
                        {nextStatus === 'en_ruta' ? 'Iniciar entrega' : 'Marcar entregada'}
                      </button>
                    )}
                    {delivery.status === 'en_ruta' && (
                      <button onClick={() => { setFailingDelivery(delivery); setFailureReason('') }} className="btn-danger btn btn-sm px-3" title="Marcar como fallida">
                        <XCircle className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Failure reason modal */}
      {failingDelivery && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setFailingDelivery(null)}>
          <div className="modal max-w-sm">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <div className="flex items-center gap-2">
                <XCircle className="w-4 h-4 text-red-400" />
                <h2 className="font-semibold text-text-primary">Marcar entrega fallida</h2>
              </div>
              <button onClick={() => setFailingDelivery(null)} className="btn-ghost btn p-1.5">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-text-secondary">
                ¿Por qué falló la entrega? (opcional)
              </p>
              <textarea
                value={failureReason}
                onChange={(e) => setFailureReason(e.target.value)}
                placeholder="Ej: Cliente ausente, dirección incorrecta, acceso restringido..."
                className="input resize-none text-sm"
                rows={3}
                autoFocus
              />
              <div className="flex gap-3">
                <button onClick={() => setFailingDelivery(null)} className="btn-secondary btn flex-1">
                  Cancelar
                </button>
                <button
                  onClick={handleMarkFailed}
                  disabled={savingFail}
                  className="btn-danger btn flex-1"
                >
                  {savingFail ? 'Guardando...' : 'Confirmar falla'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
