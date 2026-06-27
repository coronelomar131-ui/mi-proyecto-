'use client'

import { useState } from 'react'
import { CheckCircle, Circle, ChevronDown, ChevronUp, X, Zap } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils/cn'

const STEPS = [
  { id: 'profile', label: 'Completa tu perfil', href: '/dashboard/configuracion', done: false },
  { id: 'product', label: 'Agrega tu primer producto', href: '/dashboard/inventario', done: false },
  { id: 'customer', label: 'Registra tu primer cliente', href: '/dashboard/clientes', done: false },
  { id: 'sale', label: 'Crea tu primera venta', href: '/dashboard/ventas', done: false },
  { id: 'invite', label: 'Invita a un compañero', href: '/dashboard/usuarios', done: false },
]

export function OnboardingChecklist() {
  const [expanded, setExpanded] = useState(true)
  const [dismissed, setDismissed] = useState(false)
  const [steps, setSteps] = useState(STEPS)

  if (dismissed) return null

  const completed = steps.filter((s) => s.done).length
  const total = steps.length
  const progress = Math.round((completed / total) * 100)

  if (completed === total) return null

  const toggleStep = (id: string) => {
    setSteps((prev) => prev.map((s) => s.id === id ? { ...s, done: !s.done } : s))
  }

  return (
    <div className="card border-accent/20 mb-6 overflow-hidden">
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-surface-2/30 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-accent/15 flex items-center justify-center">
            <Zap className="w-3.5 h-3.5 text-accent" />
          </div>
          <div>
            <p className="text-sm font-semibold text-text-primary">Empieza a usar GestorPro</p>
            <p className="text-xs text-text-tertiary">{completed} de {total} pasos completados</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-2">
            <div className="w-20 h-1.5 bg-surface-3 rounded-full overflow-hidden">
              <div
                className="h-full bg-accent rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="text-xs text-text-tertiary">{progress}%</span>
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); setDismissed(true) }}
            className="text-text-tertiary hover:text-text-secondary p-1"
          >
            <X className="w-3.5 h-3.5" />
          </button>
          {expanded ? <ChevronUp className="w-4 h-4 text-text-tertiary" /> : <ChevronDown className="w-4 h-4 text-text-tertiary" />}
        </div>
      </div>

      {/* Steps */}
      {expanded && (
        <div className="border-t border-border/50 divide-y divide-border/50">
          {steps.map((step, i) => (
            <div key={step.id} className="flex items-center gap-3 px-4 py-3 hover:bg-surface-2/20 transition-colors group">
              <button
                onClick={() => toggleStep(step.id)}
                className={cn(
                  'shrink-0 transition-colors',
                  step.done ? 'text-accent' : 'text-text-tertiary hover:text-text-secondary'
                )}
              >
                {step.done
                  ? <CheckCircle className="w-5 h-5" />
                  : <Circle className="w-5 h-5" />
                }
              </button>
              <span className={cn(
                'flex-1 text-sm transition-colors',
                step.done ? 'text-text-tertiary line-through' : 'text-text-secondary'
              )}>
                {i + 1}. {step.label}
              </span>
              {!step.done && (
                <Link
                  href={step.href}
                  className="opacity-0 group-hover:opacity-100 text-xs text-accent hover:text-accent-400 transition-all"
                >
                  Ir →
                </Link>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
