'use client'

import { useState } from 'react'
import Link from 'next/link'
import { TrendingUp, Mail, ArrowRight, ArrowLeft, MailCheck } from 'lucide-react'
import toast from 'react-hot-toast'
import { createClient } from '@/lib/supabase/client'

export default function ForgotPasswordPage() {
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    setLoading(false)
    if (error) {
      toast.error(error.message)
      return
    }
    setSent(true)
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
          <h1 className="text-2xl font-bold text-text-primary">Recuperar contraseña</h1>
          <p className="text-text-tertiary text-sm mt-1">
            Te enviaremos un enlace para crear una nueva
          </p>
        </div>

        <div className="card p-6">
          {sent ? (
            <div className="text-center py-4">
              <div className="w-12 h-12 rounded-full bg-accent/20 border border-accent/30 flex items-center justify-center mx-auto mb-4">
                <MailCheck className="w-6 h-6 text-accent" />
              </div>
              <p className="text-sm font-medium text-text-primary mb-1">Revisa tu correo</p>
              <p className="text-xs text-text-tertiary">
                Si existe una cuenta con <span className="text-text-secondary">{email}</span>,
                recibirás un enlace para restablecer tu contraseña en unos minutos.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label" htmlFor="email">Email de tu cuenta</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="tu@empresa.com"
                    className="input pl-9"
                    required
                    autoComplete="email"
                    autoFocus
                  />
                </div>
              </div>
              <button type="submit" disabled={loading || !email} className="btn-primary btn w-full">
                {loading ? (
                  <span className="w-4 h-4 border-2 border-surface-0/30 border-t-surface-0 rounded-full animate-spin" />
                ) : (
                  <>
                    Enviar enlace
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}
        </div>

        <p className="text-center text-sm text-text-tertiary mt-4">
          <Link href="/login" className="text-accent hover:text-accent-400 transition-colors font-medium inline-flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" /> Volver a iniciar sesión
          </Link>
        </p>
      </div>
    </div>
  )
}
