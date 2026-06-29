'use client'

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'

export type ThemeBackground = 'dark' | 'warm' | 'cool' | 'aurora'
export type ThemeRadius = 'compact' | 'default' | 'rounded' | 'pill'

export interface AppTheme {
  accent: string          // hex e.g. '#00C4D4'
  glassMode: boolean
  glassBlur: number       // 8 | 16 | 24 | 32 | 48
  radius: ThemeRadius
  background: ThemeBackground
}

const DEFAULT_THEME: AppTheme = {
  accent: '#00C4D4',
  glassMode: false,
  glassBlur: 20,
  radius: 'default',
  background: 'dark',
}

function hexToHsl(hex: string): [number, number, number] {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  if (!m) return [185, 100, 41]
  let r = parseInt(m[1], 16) / 255
  let g = parseInt(m[2], 16) / 255
  let b = parseInt(m[3], 16) / 255
  const max = Math.max(r, g, b), min = Math.min(r, g, b)
  let h = 0, s = 0
  const l = (max + min) / 2
  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break
      case g: h = ((b - r) / d + 2) / 6; break
      case b: h = ((r - g) / d + 4) / 6; break
    }
  }
  return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)]
}

interface ThemeContextValue {
  theme: AppTheme
  setTheme: (partial: Partial<AppTheme>) => void
  accentHsl: [number, number, number]
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: DEFAULT_THEME,
  setTheme: () => {},
  accentHsl: [185, 100, 41],
})

export function useTheme() {
  return useContext(ThemeContext)
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<AppTheme>(DEFAULT_THEME)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    try {
      const stored = localStorage.getItem('gestorpro_theme')
      if (stored) setThemeState({ ...DEFAULT_THEME, ...JSON.parse(stored) })
    } catch {}
    setMounted(true)
  }, [])

  const applyTheme = useCallback((t: AppTheme) => {
    const root = document.documentElement
    const [h, s, l] = hexToHsl(t.accent)
    root.style.setProperty('--accent-h', String(h))
    root.style.setProperty('--accent-s', `${s}%`)
    root.style.setProperty('--accent-l', `${l}%`)
    root.style.setProperty('--glass-blur', `${t.glassBlur}px`)

    document.body.classList.toggle('glass-mode', t.glassMode)
    document.body.setAttribute('data-bg', t.background)
    if (t.radius === 'default') {
      document.body.removeAttribute('data-radius')
    } else {
      document.body.setAttribute('data-radius', t.radius)
    }
  }, [])

  useEffect(() => {
    if (!mounted) return
    applyTheme(theme)
    localStorage.setItem('gestorpro_theme', JSON.stringify(theme))
  }, [theme, mounted, applyTheme])

  const setTheme = useCallback((partial: Partial<AppTheme>) => {
    setThemeState(prev => ({ ...prev, ...partial }))
  }, [])

  const accentHsl = hexToHsl(theme.accent)

  return (
    <ThemeContext.Provider value={{ theme, setTheme, accentHsl }}>
      {/* Ambient background blobs for glass mode */}
      {mounted && theme.glassMode && (
        <div className="glass-ambient" aria-hidden>
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: `
                radial-gradient(ellipse 65% 45% at 8% 18%, hsl(${accentHsl[0]} 55% 28% / 0.18) 0%, transparent 68%),
                radial-gradient(ellipse 55% 65% at 88% 80%, hsl(${(accentHsl[0] + 55) % 360} 45% 22% / 0.14) 0%, transparent 68%),
                radial-gradient(ellipse 50% 50% at 50% 45%, hsl(${(accentHsl[0] + 170) % 360} 35% 18% / 0.09) 0%, transparent 68%)
              `,
            }}
          />
        </div>
      )}
      {children}
    </ThemeContext.Provider>
  )
}
