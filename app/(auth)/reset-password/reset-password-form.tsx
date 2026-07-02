'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { TrendingUp, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react'
import toast from 'react-hot-toast'
import { createClient } from '@/lib/supabase/client'

export function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [ready, setReady] = useState(false)
  const [linkError, setLinkError] = useState(false)

  useEffect(() => {
    const code = searchParams.get('code')
    const init = async () => {
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code)
        if (error) { setLinkError(true); return }
        setReady(true)
        return
      }
      // Hash-based recovery links (#access_token=...) are handled automatically
      // by the Supabase client; just confirm we have a session.
      const { data: { session } } = await supabase.auth.getSession()
      if (session) setReady(true)
      else setLinkError(true)
    }
    init()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== confirm) { toast.error('Las contraseñas no coinciden'); return }
    if (password.length < 8) { toast.error('Mínimo 8 caracteres'); return }
    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password })
    setLoading(false)
    if (error) { toast.error(error.message); return }
    toast.success('Contraseña actualizada')
    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-surface-0 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-grid opacity-100 pointer-events-none" />
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-accent/5 rounded-full blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-sm">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center shadow-glow-accent">
              <TrendingUp className="w-5 h-5 text-surface-0" strokeWidth={2.5} />
            </div>
            <span className="font-semibold text-lg">GestorPro</span>
          </Link>
          <h1 className="text-2xl font-bold text-text-primary">Nueva contraseña</h1>
          <p className="text-text-tertiary text-sm mt-1">Elige una contraseña segura</p>
        </div>

        <div className="card p-6">
          {linkError ? (
            <div className="text-center py-4">
              <p className="text-sm text-text-secondary mb-4">
                El enlace expiró o no es válido. Solicita uno nuevo.
              </p>
              <Link href="/forgot-password" className="btn-primary btn w-full">
                Solicitar nuevo enlace
              </Link>
            </div>
          ) : !ready ? (
            <div className="py-8 flex justify-center">
              <span className="w-5 h-5 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label" htmlFor="password">Nueva contraseña</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Mínimo 8 caracteres"
                    className="input pl-9 pr-9"
                    required
                    minLength={8}
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-secondary"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="label" htmlFor="confirm">Confirmar contraseña</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
                  <input
                    id="confirm"
                    type="password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    placeholder="••••••••"
                    className="input pl-9"
                    required
                  />
                </div>
              </div>
              <button type="submit" disabled={loading || !password || !confirm} className="btn-primary btn w-full">
                {loading ? (
                  <span className="w-4 h-4 border-2 border-surface-0/30 border-t-surface-0 rounded-full animate-spin" />
                ) : (
                  <>
                    Guardar contraseña
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
