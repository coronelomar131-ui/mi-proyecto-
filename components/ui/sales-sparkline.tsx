'use client'

import { useEffect, useState } from 'react'
import { AreaChart, Area, ResponsiveContainer, Tooltip } from 'recharts'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency } from '@/lib/utils/format'

interface DayData { day: string; total: number }

export function SalesSparkline() {
  const [data, setData] = useState<DayData[]>([])

  useEffect(() => {
    const supabase = createClient()
    const days: DayData[] = []
    const now = new Date()

    for (let i = 6; i >= 0; i--) {
      const d = new Date(now)
      d.setDate(d.getDate() - i)
      days.push({
        day: d.toLocaleDateString('es-MX', { weekday: 'short' }),
        total: 0,
      })
    }

    const since = new Date(now)
    since.setDate(since.getDate() - 6)
    since.setHours(0, 0, 0, 0)

    supabase
      .from('sales')
      .select('total, created_at')
      .gte('created_at', since.toISOString())
      .neq('status', 'cancelada')
      .then(({ data: sales }) => {
        sales?.forEach((s) => {
          const d = new Date(s.created_at)
          const label = d.toLocaleDateString('es-MX', { weekday: 'short' })
          const idx = days.findIndex((day) => day.day === label)
          if (idx !== -1) days[idx].total += s.total ?? 0
        })
        setData([...days])
      })
  }, [])

  if (data.length === 0) return null

  return (
    <div>
      <h3 className="text-sm font-semibold text-text-primary mb-4 flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-accent" />
        Tendencia — 7 días
      </h3>
      <ResponsiveContainer width="100%" height={96}>
        <AreaChart data={data} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#00C4D4" stopOpacity={0.25} />
              <stop offset="95%" stopColor="#00C4D4" stopOpacity={0} />
            </linearGradient>
          </defs>
          <Tooltip
            contentStyle={{ background: '#1E1E24', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, fontSize: 12 }}
            labelStyle={{ color: '#9999B0', marginBottom: 2 }}
            formatter={(value: number) => [formatCurrency(value), 'Ventas']}
          />
          <Area type="monotone" dataKey="total" stroke="#00C4D4" strokeWidth={2} fill="url(#salesGrad)" dot={false} activeDot={{ r: 4, fill: '#00C4D4' }} />
        </AreaChart>
      </ResponsiveContainer>
      <div className="flex justify-between mt-1 px-0.5">
        {data.map((d) => (
          <span key={d.day} className="text-2xs text-text-tertiary capitalize">{d.day}</span>
        ))}
      </div>
    </div>
  )
}
