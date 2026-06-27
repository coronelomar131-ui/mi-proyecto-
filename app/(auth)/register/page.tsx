'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { TrendingUp, Mail, Lock, Eye, EyeOff, User, Building2, ArrowRight } from 'lucide-react'
import toast from 'react-hot-toast'
import { createClient } from '@/lib/supabase/client'
import { slugify } from '@/lib/utils/format'

export default function RegisterPage() {
  const router = useRouter()
  const [step, setStep] = useState<1 | 2>(1)
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const [formData, setFormData] = useState({
    fullName: '',
    orgName: '',
    email: '',
    password: '',
    confirmPassword: '',
  })

  const supabase = createClient()

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    if (formData.password !== formData.confirmPassword) {
      toast.error('Las contraseñas no coinciden')
      return
    }
    if (formData.password.length < 8) {
      toast.error('La contraseña debe tener al menos 8 caracteres')
      return
    }

    setLoading(true)

    const { data, error } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
      options: {
        data: {
          full_name: formData.fullName,
          org_name: formData.orgName,
          org_slug: slugify(formData.orgName),
        },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) {
      toast.error(error.message)
      setLoading(false)
      return
    }

    if (data.user?.identities?.length === 0) {
      toast.error('Este email ya está registrado')
      setLoading(false)
      return
    }

    toast.success('¡Cuenta creada! Revisa tu correo para confirmar.')
    router.push('/login')
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
          <h1 className="text-2xl font-bold text-text-primary">Crear cuenta gratis</h1>
          <p className="text-text-tertiary text-sm mt-1">14 días sin costo, sin tarjeta</p>
        </div>

        {/* Progress */}
        <div className="flex items-center gap-2 mb-6">
          {[1, 2].map((s) => (
            <div
              key={s}
              className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
                s <= step ? 'bg-accent' : 'bg-surface-3'
              }`}
            />
          ))}
        </div>

        <div className="card p-6">
          <form onSubmit={step === 1 ? (e) => { e.preventDefault(); setStep(2) } : handleRegister} className="space-y-4">
            {step === 1 ? (
              <>
                <div>
                  <label className="label" htmlFor="fullName">Tu nombre completo</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
                    <input
                      id="fullName"
                      type="text"
                      value={formData.fullName}
                      onChange={(e) => handleChange('fullName', e.target.value)}
                      placeholder="Juan Pérez"
                      className="input pl-9"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="label" htmlFor="orgName">Nombre de tu empresa</label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
                    <input
                      id="orgName"
                      type="text"
                      value={formData.orgName}
                      onChange={(e) => handleChange('orgName', e.target.value)}
                      placeholder="Distribuidora El Sol"
                      className="input pl-9"
                      required
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={!formData.fullName || !formData.orgName}
                  className="btn-primary btn w-full"
                >
                  Continuar
                  <ArrowRight className="w-4 h-4" />
                </button>
              </>
            ) : (
              <>
                <div>
                  <label className="label" htmlFor="email">Email de trabajo</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
                    <input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleChange('email', e.target.value)}
                      placeholder="juan@empresa.com"
                      className="input pl-9"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="label" htmlFor="password">Contraseña</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={(e) => handleChange('password', e.target.value)}
                      placeholder="Mínimo 8 caracteres"
                      className="input pl-9 pr-9"
                      required
                      minLength={8}
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
                  <label className="label" htmlFor="confirmPassword">Confirmar contraseña</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
                    <input
                      id="confirmPassword"
                      type="password"
                      value={formData.confirmPassword}
                      onChange={(e) => handleChange('confirmPassword', e.target.value)}
                      placeholder="••••••••"
                      className="input pl-9"
                      required
                    />
                  </div>
                </div>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="btn-secondary btn flex-1"
                  >
                    Atrás
                  </button>
                  <button
                    type="submit"
                    disabled={loading || !formData.email || !formData.password || !formData.confirmPassword}
                    className="btn-primary btn flex-1"
                  >
                    {loading ? (
                      <span className="w-4 h-4 border-2 border-surface-0/30 border-t-surface-0 rounded-full animate-spin" />
                    ) : (
                      'Crear cuenta'
                    )}
                  </button>
                </div>
              </>
            )}
          </form>
        </div>

        <p className="text-center text-sm text-text-tertiary mt-4">
          ¿Ya tienes cuenta?{' '}
          <Link href="/login" className="text-accent hover:text-accent-400 transition-colors font-medium">
            Iniciar sesión
          </Link>
        </p>

        <p className="text-center text-xs text-text-tertiary mt-3">
          Al crear una cuenta aceptas nuestros{' '}
          <a href="#" className="text-text-secondary hover:text-text-primary">Términos</a>{' '}
          y{' '}
          <a href="#" className="text-text-secondary hover:text-text-primary">Política de privacidad</a>.
        </p>
      </div>
    </div>
  )
}
