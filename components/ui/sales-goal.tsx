'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency } from '@/lib/utils/format'
import { Target, Edit2, Check, X } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

const GOAL_KEY = 'gestorpro_monthly_goal'

export function SalesGoalWidget() {
  const supabase = createClient()
  const [goal, setGoal] = useState(0)
  const [current, setCurrent] = useState(0)
  const [editing, setEditing] = useState(false)
  const [inputGoal, setInputGoal] = useState('')
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const stored = localStorage.getItem(GOAL_KEY)
    setGoal(stored ? parseFloat(stored) : 50000)
  }, [])

  useEffect(() => {
    const fetchCurrentMonth = async () => {
      setLoading(true)
      const now = new Date()
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
      const { data } = await supabase
        .from('sales')
        .select('total')
        .gte('created_at', startOfMonth)
        .neq('status', 'cancelada')
      const total = data?.reduce((s, r) => s + (r.total ?? 0), 0) ?? 0
      setCurrent(total)
      setLoading(false)
    }
    fetchCurrentMonth()
  }, [])

  const pct = goal > 0 ? Math.min(100, (current / goal) * 100) : 0
  const remaining = Math.max(0, goal - current)
  const exceeded = current > goal && goal > 0

  const saveGoal = () => {
    const v = parseFloat(inputGoal)
    if (v > 0) {
      setGoal(v)
      localStorage.setItem(GOAL_KEY, String(v))
    }
    setEditing(false)
  }

  if (!mounted) return null

  return (
    <div className="card p-4 mb-6">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Target className="w-4 h-4 text-accent" />
          <span className="text-sm font-semibold text-text-primary">Meta mensual de ventas</span>
        </div>
        {!editing ? (
          <button
            onClick={() => { setEditing(true); setInputGoal(String(goal)) }}
            className="text-text-tertiary hover:text-text-primary transition-colors p-1 rounded"
            title="Editar meta"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
        ) : (
          <div className="flex items-center gap-1">
            <button onClick={saveGoal} className="text-emerald-400 hover:text-emerald-300 p-1 rounded">
              <Check className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => setEditing(false)} className="text-text-tertiary hover:text-text-secondary p-1 rounded">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {editing ? (
        <div className="flex items-center gap-2 mb-3">
          <span className="text-text-tertiary text-sm">$</span>
          <input
            type="number"
            min="0"
            step="1000"
            value={inputGoal}
            onChange={(e) => setInputGoal(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') saveGoal()
              if (e.key === 'Escape') setEditing(false)
            }}
            className="input h-8 text-sm flex-1"
            autoFocus
          />
          <span className="text-text-tertiary text-xs">MXN</span>
        </div>
      ) : (
        <div className="flex items-end justify-between mb-2">
          <div>
            {loading ? (
              <div className="w-28 h-6 bg-surface-3 rounded animate-pulse mb-1" />
            ) : (
              <p className="text-xl font-bold text-text-primary">{formatCurrency(current)}</p>
            )}
            <p className="text-xs text-text-tertiary">de {formatCurrency(goal)} este mes</p>
          </div>
          <div className="text-right">
            <p className={cn(
              'text-sm font-semibold',
              exceeded ? 'text-emerald-400' : pct >= 80 ? 'text-amber-400' : 'text-text-secondary'
            )}>
              {pct.toFixed(1)}%
            </p>
            {!exceeded && !loading && (
              <p className="text-2xs text-text-tertiary">Faltan {formatCurrency(remaining)}</p>
            )}
            {exceeded && (
              <p className="text-2xs text-emerald-400">¡Meta superada!</p>
            )}
          </div>
        </div>
      )}

      <div className="h-2 bg-surface-3 rounded-full overflow-hidden">
        <div
          className={cn(
            'h-full rounded-full transition-all duration-700',
            exceeded ? 'bg-emerald-400' : pct >= 80 ? 'bg-amber-400' : 'bg-accent'
          )}
          style={{ width: `${loading ? 0 : pct}%` }}
        />
      </div>
    </div>
  )
}
