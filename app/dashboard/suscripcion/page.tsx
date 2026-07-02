'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatDate } from '@/lib/utils/format'
import { CreditCard, Check, Zap, Crown, Rocket, Clock, ShieldCheck, Users, Package, FileText, BarChart3 } from 'lucide-react'
import toast from 'react-hot-toast'
import { cn } from '@/lib/utils/cn'
import type { Organization } from '@/types'

type PlanId = 'starter' | 'pro' | 'enterprise'

const PLANS: {
  id: PlanId
  name: string
  price: number
  icon: React.ElementType
  tagline: string
  features: string[]
  highlight?: boolean
}[] = [
  {
    id: 'starter',
    name: 'Starter',
    price: 249,
    icon: Zap,
    tagline: 'Para empezar a vender',
    features: [
      'Hasta 3 usuarios',
      'Hasta 500 productos',
      'Ventas y punto de venta',
      'Clientes y cotizaciones',
      'Reportes básicos',
      'Soporte por email',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 499,
    icon: Crown,
    tagline: 'El más popular para PyMEs',
    highlight: true,
    features: [
      'Hasta 10 usuarios',
      'Productos ilimitados',
      'Todo lo de Starter',
      'Facturación CFDI 4.0',
      'Links de pago (Conekta)',
      'WhatsApp integrado',
      'Reportes avanzados',
      'Soporte prioritario',
    ],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 999,
    icon: Rocket,
    tagline: 'Para operaciones grandes',
    features: [
      'Usuarios ilimitados',
      'Todo lo de Pro',
      'Multi-sucursal (próximamente)',
      'API de integraciones',
      'Onboarding personalizado',
      'Soporte dedicado 24/7',
    ],
  },
]

const STATUS_LABELS: Record<string, { label: string; badge: string }> = {
  trial: { label: 'Periodo de prueba', badge: 'badge-yellow' },
  active: { label: 'Activa', badge: 'badge-green' },
  past_due: { label: 'Pago pendiente', badge: 'badge-red' },
  canceled: { label: 'Cancelada', badge: 'badge-gray' },
}

export default function SuscripcionPage() {
  const supabase = createClient()
  const [org, setOrg] = useState<Organization | null>(null)
  const [loading, setLoading] = useState(true)
  const [changingTo, setChangingTo] = useState<PlanId | null>(null)

  const fetchOrg = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return
    const { data: profile } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', session.user.id)
      .single()
    if (!profile) { setLoading(false); return }
    const { data } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', profile.organization_id)
      .single()
    setOrg(data as Organization)
    setLoading(false)
  }, [])

  useEffect(() => { fetchOrg() }, [fetchOrg])

  const handleSelectPlan = async (planId: PlanId) => {
    if (!org || planId === org.plan) return
    setChangingTo(planId)
    const { error } = await supabase
      .from('organizations')
      .update({ plan: planId })
      .eq('id', org.id)
    if (error) {
      toast.error('Solo un administrador puede cambiar el plan')
      setChangingTo(null)
      return
    }
    toast.success(`Plan cambiado a ${PLANS.find(p => p.id === planId)?.name}`)
    setChangingTo(null)
    fetchOrg()
  }

  const trialDaysLeft = org?.trial_ends_at
    ? Math.max(0, Math.ceil((new Date(org.trial_ends_at).getTime() - Date.now()) / 86400000))
    : null

  const status = STATUS_LABELS[org?.subscription_status ?? 'trial']
  const currentPlan = PLANS.find(p => p.id === org?.plan)

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Suscripción</h1>
          <p className="text-xs text-text-tertiary mt-0.5">Administra el plan de tu empresa</p>
        </div>
      </div>

      {loading ? (
        <div className="card p-8 text-center text-sm text-text-tertiary">Cargando...</div>
      ) : (
        <>
          {/* Current plan summary */}
          <div className="card p-5 mb-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-accent/20 border border-accent/30 flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-text-primary">
                      Plan {currentPlan?.name ?? org?.plan}
                    </p>
                    {status && <span className={cn('badge', status.badge)}>{status.label}</span>}
                  </div>
                  <p className="text-xs text-text-tertiary mt-0.5">{org?.name}</p>
                </div>
              </div>
              {org?.subscription_status === 'trial' && trialDaysLeft !== null && (
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="w-4 h-4 text-amber-400" />
                  <span className="text-text-secondary">
                    {trialDaysLeft > 0
                      ? <>Te quedan <strong className="text-text-primary">{trialDaysLeft} día{trialDaysLeft !== 1 ? 's' : ''}</strong> de prueba gratis</>
                      : 'Tu periodo de prueba terminó'}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Plans grid */}
          <div className="grid md:grid-cols-3 gap-4 mb-6">
            {PLANS.map((plan) => {
              const isCurrent = org?.plan === plan.id
              const PlanIcon = plan.icon
              return (
                <div
                  key={plan.id}
                  className={cn(
                    'card p-6 flex flex-col relative',
                    plan.highlight && 'border-accent/50 shadow-glow-accent',
                    isCurrent && 'ring-1 ring-accent'
                  )}
                >
                  {plan.highlight && (
                    <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 badge badge-accent text-2xs px-2">
                      Más popular
                    </span>
                  )}
                  <div className="flex items-center gap-2 mb-1">
                    <PlanIcon className={cn('w-4 h-4', plan.highlight ? 'text-accent' : 'text-text-secondary')} />
                    <h3 className="font-semibold text-text-primary">{plan.name}</h3>
                  </div>
                  <p className="text-xs text-text-tertiary mb-4">{plan.tagline}</p>
                  <div className="mb-5">
                    <span className="text-3xl font-bold text-text-primary">${plan.price}</span>
                    <span className="text-sm text-text-tertiary"> MXN/mes</span>
                  </div>
                  <ul className="space-y-2 mb-6 flex-1">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-sm text-text-secondary">
                        <Check className="w-3.5 h-3.5 text-accent shrink-0 mt-0.5" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <button
                    onClick={() => handleSelectPlan(plan.id)}
                    disabled={isCurrent || changingTo !== null}
                    className={cn(
                      'btn w-full',
                      isCurrent ? 'btn-secondary' : plan.highlight ? 'btn-primary' : 'btn-secondary'
                    )}
                  >
                    {isCurrent ? 'Plan actual' : changingTo === plan.id ? 'Cambiando...' : `Cambiar a ${plan.name}`}
                  </button>
                </div>
              )
            })}
          </div>

          {/* Info */}
          <div className="card p-4 flex items-start gap-3">
            <ShieldCheck className="w-4 h-4 text-accent shrink-0 mt-0.5" />
            <div className="text-xs text-text-secondary space-y-1">
              <p>
                Durante el periodo de lanzamiento puedes cambiar de plan sin costo. El cobro en línea
                (tarjeta, transferencia y OXXO vía Conekta) se activará al finalizar tu prueba
                {org?.trial_ends_at ? ` el ${formatDate(org.trial_ends_at)}` : ''}.
              </p>
              <p className="text-text-tertiary">
                ¿Dudas o necesitas un plan a la medida? Escríbenos y con gusto te ayudamos.
              </p>
            </div>
          </div>

          {/* Usage quick stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
            {[
              { icon: Users, label: 'Usuarios', hint: currentPlan?.id === 'enterprise' ? 'Ilimitados' : currentPlan?.id === 'pro' ? 'Hasta 10' : 'Hasta 3' },
              { icon: Package, label: 'Productos', hint: currentPlan?.id === 'starter' ? 'Hasta 500' : 'Ilimitados' },
              { icon: FileText, label: 'CFDI 4.0', hint: currentPlan?.id === 'starter' ? 'No incluido' : 'Incluido' },
              { icon: BarChart3, label: 'Reportes', hint: currentPlan?.id === 'starter' ? 'Básicos' : 'Avanzados' },
            ].map(({ icon: Icon, label, hint }) => (
              <div key={label} className="card p-4">
                <Icon className="w-4 h-4 text-text-tertiary mb-2" />
                <p className="text-xs font-medium text-text-primary">{label}</p>
                <p className="text-2xs text-text-tertiary mt-0.5">{hint}</p>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
