'use client'

import { useEffect, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency } from '@/lib/utils/format'

interface MonthData { month: string; ingresos: number; egresos: number }

export function FinanceMonthlyChart() {
  const [data, setData] = useState<MonthData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    const months: MonthData[] = []
    const now = new Date()

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      months.push({
        month: d.toLocaleDateString('es-MX', { month: 'short' }),
        ingresos: 0,
        egresos: 0,
      })
    }

    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1).toISOString()

    supabase
      .from('transactions')
      .select('type, amount, date')
      .gte('date', sixMonthsAgo.split('T')[0])
      .then(({ data: rows }) => {
        rows?.forEach((r) => {
          const d = new Date(r.date)
          const label = d.toLocaleDateString('es-MX', { month: 'short' })
          const idx = months.findIndex((m) => m.month === label)
          if (idx !== -1) {
            if (r.type === 'ingreso') months[idx].ingresos += r.amount
            else months[idx].egresos += r.amount
          }
        })
        setData([...months])
        setLoading(false)
      })
  }, [])

  if (loading) {
    return <div className="h-48 flex items-center justify-center"><span className="w-5 h-5 border-2 border-border border-t-accent rounded-full animate-spin" /></div>
  }

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
        <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9999B0' }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 11, fill: '#9999B0' }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
        <Tooltip
          contentStyle={{ background: '#1E1E24', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, fontSize: 12 }}
          labelStyle={{ color: '#9999B0', marginBottom: 4 }}
          formatter={(value: number, name: string) => [formatCurrency(value), name === 'ingresos' ? 'Ingresos' : 'Egresos']}
        />
        <Legend
          wrapperStyle={{ fontSize: 12, color: '#9999B0' }}
          formatter={(value) => value === 'ingresos' ? 'Ingresos' : 'Egresos'}
        />
        <Bar dataKey="ingresos" fill="#10b981" radius={[4, 4, 0, 0]} />
        <Bar dataKey="egresos" fill="#f87171" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
