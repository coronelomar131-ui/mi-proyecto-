'use client'

/**
 * Tiny inline SVG sparkline — no recharts needed.
 * Renders a 7-day trend line inside each KPI card, Stripe-style.
 */

interface KpiSparklineProps {
  data: number[]          // array of values (e.g. daily sales last 7 days)
  color?: string          // stroke color
  height?: number
  width?: number
}

export function KpiSparkline({ data, color = '#00C4D4', height = 32, width = 80 }: KpiSparklineProps) {
  if (data.length < 2) return null

  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1

  const pad = 2
  const w = width - pad * 2
  const h = height - pad * 2

  const points = data.map((v, i) => {
    const x = pad + (i / (data.length - 1)) * w
    const y = pad + h - ((v - min) / range) * h
    return `${x.toFixed(1)},${y.toFixed(1)}`
  })

  const polyline = points.join(' ')

  // Area fill path
  const firstX = pad
  const lastX = pad + w
  const baseY = pad + h
  const areaPath = `M${firstX},${baseY} L${points[0]} L${points.slice(1).map((p) => `L${p}`).join(' ')} L${lastX},${baseY} Z`

  // Trend: positive if last > first
  const isUp = data[data.length - 1] >= data[0]
  const lineColor = isUp ? color : '#f87171'
  const fillColor = isUp ? color : '#f87171'

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
      <defs>
        <linearGradient id={`spark-fill-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={fillColor} stopOpacity={0.2} />
          <stop offset="100%" stopColor={fillColor} stopOpacity={0} />
        </linearGradient>
      </defs>
      {/* Area fill */}
      <path
        d={areaPath}
        fill={`url(#spark-fill-${color.replace('#', '')})`}
      />
      {/* Line */}
      <polyline
        points={polyline}
        fill="none"
        stroke={lineColor}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Last point dot */}
      <circle
        cx={points[points.length - 1].split(',')[0]}
        cy={points[points.length - 1].split(',')[1]}
        r={2.5}
        fill={lineColor}
      />
    </svg>
  )
}
