'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { TrendingUp, RefreshCw, Home } from 'lucide-react'

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="min-h-screen bg-surface-0 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-grid pointer-events-none" />

      <div className="relative text-center max-w-md">
        <Link href="/" className="inline-flex items-center gap-2 mb-10">
          <div className="w-9 h-9 rounded-xl bg-accent flex items-center justify-center">
            <TrendingUp className="w-4.5 h-4.5 text-surface-0" strokeWidth={2.5} />
          </div>
          <span className="font-semibold">GestorPro</span>
        </Link>

        <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-6">
          <span className="text-3xl">⚠️</span>
        </div>

        <h1 className="text-2xl font-bold text-text-primary mb-3">Algo salió mal</h1>
        <p className="text-text-secondary text-sm mb-2 leading-relaxed">
          Ocurrió un error inesperado. Intenta recargar la página.
        </p>
        {error.digest && (
          <p className="text-xs font-mono text-text-tertiary mb-8">Error ID: {error.digest}</p>
        )}

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button onClick={reset} className="btn-primary btn">
            <RefreshCw className="w-4 h-4" />
            Intentar de nuevo
          </button>
          <Link href="/dashboard" className="btn-secondary btn">
            <Home className="w-4 h-4" />
            Ir al dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}
