'use client'

import Link from 'next/link'
import { TrendingUp, ArrowLeft, Home } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-surface-0 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-grid pointer-events-none" />
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-accent/5 rounded-full blur-3xl pointer-events-none" />

      <div className="relative text-center max-w-md">
        <Link href="/" className="inline-flex items-center gap-2 mb-10">
          <div className="w-9 h-9 rounded-xl bg-accent flex items-center justify-center shadow-glow-accent">
            <TrendingUp className="w-4.5 h-4.5 text-surface-0" strokeWidth={2.5} />
          </div>
          <span className="font-semibold">GestorPro</span>
        </Link>

        <div className="font-mono text-8xl font-bold text-surface-3 mb-4 select-none">404</div>

        <h1 className="text-2xl font-bold text-text-primary mb-3">Página no encontrada</h1>
        <p className="text-text-secondary text-sm mb-8 leading-relaxed">
          La página que buscas no existe o fue movida. Verifica la URL o regresa al dashboard.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/dashboard" className="btn-primary btn">
            <Home className="w-4 h-4" />
            Ir al dashboard
          </Link>
          <button onClick={() => history.back()} className="btn-secondary btn">
            <ArrowLeft className="w-4 h-4" />
            Regresar
          </button>
        </div>
      </div>
    </div>
  )
}
