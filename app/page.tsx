import Link from 'next/link'
import {
  BarChart3,
  Package,
  Users,
  Truck,
  FileText,
  Shield,
  Zap,
  Globe,
  Check,
  X,
  ArrowRight,
  TrendingUp,
  Star,
  Minus,
} from 'lucide-react'

const features = [
  {
    icon: BarChart3,
    title: 'Dashboard en tiempo real',
    description: 'KPIs, gráficas y métricas clave de tu negocio actualizados al instante.',
  },
  {
    icon: Package,
    title: 'Control de inventario',
    description: 'Gestiona stock, alertas de mínimo, entradas y salidas por almacén.',
  },
  {
    icon: Users,
    title: 'CRM de clientes',
    description: 'Historial completo, crédito, saldos y seguimiento de cada cliente.',
  },
  {
    icon: FileText,
    title: 'Ventas y cotizaciones',
    description: 'Crea órdenes y cotizaciones en segundos con búsqueda rápida de productos.',
  },
  {
    icon: Truck,
    title: 'Control de entregas',
    description: 'Asigna repartidores, cambia estados y rastrea cada entrega en campo.',
  },
  {
    icon: Shield,
    title: 'Multi-tenant seguro',
    description: 'Cada empresa aislada con Row Level Security. Tus datos, solo tuyos.',
  },
  {
    icon: Zap,
    title: 'Roles y permisos',
    description: 'Admin, vendedor y almacén con acceso granular a cada módulo.',
  },
  {
    icon: Globe,
    title: 'Acceso desde cualquier lugar',
    description: 'Web-first, responsive. Funciona en tablet, móvil y escritorio.',
  },
]

const comparison = {
  features: [
    'Diseño moderno y oscuro',
    'Funciona en móvil',
    'Sin instalación (SaaS)',
    'Listo en 5 minutos',
    'Precio en MXN accesible',
    'Ventas + Inventario + CRM',
    'Control de entregas',
    'Reportes con gráficas',
    'Multi-usuario con roles',
    'Búsqueda global (Cmd+K)',
    'Soporte en español',
  ],
  competitors: [
    {
      name: 'GestorPro',
      highlight: true,
      values: [true, true, true, true, true, true, true, true, true, true, true],
    },
    {
      name: 'Aspel SAE',
      highlight: false,
      values: [false, false, false, false, false, true, false, false, true, false, true],
    },
    {
      name: 'Microsip',
      highlight: false,
      values: [false, false, false, false, true, true, false, false, false, false, true],
    },
    {
      name: 'Bind ERP',
      highlight: false,
      values: [null, null, true, null, false, true, false, true, true, false, true],
    },
  ],
}

const plans = [
  {
    name: 'Starter',
    price: 499,
    description: 'Para distribuidores que inician su digitalización.',
    features: [
      '3 usuarios',
      'Hasta 500 productos',
      'Ventas e inventario',
      'Clientes y cotizaciones',
      'Soporte por email',
    ],
    cta: 'Empezar gratis',
    highlight: false,
  },
  {
    name: 'Pro',
    price: 1299,
    description: 'El plan favorito de distribuidores en crecimiento.',
    features: [
      'Usuarios ilimitados',
      'Productos ilimitados',
      'Todo en Starter',
      'Control de entregas',
      'Reportes avanzados',
      'Módulo de finanzas',
      'Soporte prioritario',
    ],
    cta: 'Comenzar con Pro',
    highlight: true,
  },
  {
    name: 'Enterprise',
    price: 2999,
    description: 'Para grupos distribuidores con múltiples sucursales.',
    features: [
      'Todo en Pro',
      'Multi-sucursal',
      'API personalizada',
      'Integraciones a medida',
      'SLA garantizado',
      'Gerente de cuenta dedicado',
      'Capacitación presencial',
    ],
    cta: 'Hablar con ventas',
    highlight: false,
  },
]

const testimonials = [
  {
    name: 'Carlos Mendoza',
    role: 'Director, Distribuidora El Águila',
    avatar: 'CM',
    quote:
      'En 3 semanas ya teníamos todo migrado. El módulo de entregas nos ahorró 2 horas diarias de coordinación. GestorPro es exactamente lo que necesitábamos.',
    stars: 5,
  },
  {
    name: 'Laura Ríos',
    role: 'Gerente de Ventas, Grupo Fresno',
    avatar: 'LR',
    quote:
      'Nuestro equipo de vendedores adoptó el sistema en un día. Las cotizaciones ahora salen en minutos, no en horas. Los clientes notan la diferencia.',
    stars: 5,
  },
  {
    name: 'Roberto Salas',
    role: 'Dueño, Salas Distribuciones',
    avatar: 'RS',
    quote:
      'Por fin tengo visibilidad real de mi negocio. El dashboard me dice exactamente cómo va el día sin tener que llamar a nadie.',
    stars: 5,
  },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-surface-0 text-text-primary">
      {/* Nav */}
      <nav className="fixed top-0 inset-x-0 z-50 border-b border-border/50 bg-surface-0/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-surface-0" strokeWidth={2.5} />
            </div>
            <span className="font-semibold text-text-primary">GestorPro</span>
          </div>

          <div className="hidden md:flex items-center gap-6 text-sm text-text-secondary">
            <a href="#features" className="hover:text-text-primary transition-colors">Funciones</a>
            <a href="#pricing" className="hover:text-text-primary transition-colors">Precios</a>
            <a href="#testimonials" className="hover:text-text-primary transition-colors">Testimonios</a>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/login" className="btn-ghost btn text-sm">
              Iniciar sesión
            </Link>
            <Link href="/register" className="btn-primary btn text-sm">
              Comenzar gratis
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-32 pb-20 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-grid opacity-100" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-accent/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-accent/30 bg-accent/10 text-accent text-xs font-medium mb-8 animate-fade-in">
            <Zap className="w-3 h-3" />
            ERP diseñado para distribuidores mexicanos
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight mb-6 animate-slide-up">
            Tu distribuidora,{' '}
            <span className="text-gradient-accent">bajo control</span>
          </h1>

          <p className="text-lg sm:text-xl text-text-secondary max-w-2xl mx-auto mb-10 animate-slide-up" style={{ animationDelay: '0.1s' }}>
            GestorPro centraliza ventas, inventario, clientes, entregas y finanzas en una plataforma
            elegante y segura. Sin papeles, sin Excel, sin caos.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-slide-up" style={{ animationDelay: '0.2s' }}>
            <Link href="/register" className="btn-primary btn btn-lg w-full sm:w-auto">
              Comenzar gratis — 14 días
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/login" className="btn-secondary btn btn-lg w-full sm:w-auto">
              Ver demo
            </Link>
          </div>

          <p className="text-xs text-text-tertiary mt-4">
            Sin tarjeta de crédito · Cancelar en cualquier momento
          </p>

          {/* Social proof mini-stats */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mt-10 pt-10 border-t border-border/40">
            {[
              { value: '150+', label: 'distribuidoras activas' },
              { value: '$2M+', label: 'MXN procesados' },
              { value: '4.9/5', label: 'satisfacción de usuarios' },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-2xl font-bold text-text-primary">{stat.value}</p>
                <p className="text-xs text-text-tertiary">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Hero visual */}
        <div className="relative max-w-5xl mx-auto mt-16 animate-slide-up" style={{ animationDelay: '0.3s' }}>
          <div className="card p-1 shadow-modal">
            <div className="bg-surface-2 rounded-lg p-6">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                {[
                  { label: 'Ventas hoy', value: '$48,230', change: '+12%', color: 'text-emerald-400' },
                  { label: 'Clientes activos', value: '284', change: '+8', color: 'text-accent' },
                  { label: 'Entregas pendientes', value: '17', change: '-3', color: 'text-amber-400' },
                  { label: 'Stock bajo', value: '5', change: 'productos', color: 'text-red-400' },
                ].map((kpi) => (
                  <div key={kpi.label} className="bg-surface-3 rounded-lg p-4">
                    <p className="text-xs text-text-tertiary mb-1">{kpi.label}</p>
                    <p className="text-xl font-semibold text-text-primary">{kpi.value}</p>
                    <p className={`text-xs ${kpi.color} mt-1`}>{kpi.change}</p>
                  </div>
                ))}
              </div>
              <div className="h-32 bg-surface-3 rounded-lg flex items-end gap-2 px-4 pb-4 overflow-hidden">
                {[40, 65, 45, 80, 55, 90, 70, 85, 60, 95, 75, 88].map((h, i) => (
                  <div
                    key={i}
                    className="flex-1 bg-accent/20 rounded-t hover:bg-accent/40 transition-colors"
                    style={{ height: `${h}%` }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Todo lo que necesita tu distribuidora
            </h2>
            <p className="text-text-secondary max-w-xl mx-auto">
              Módulos integrados que hablan entre sí. Sin integraciones complicadas, sin datos duplicados.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {features.map((feat) => (
              <div key={feat.title} className="card-hover p-5 group">
                <div className="w-10 h-10 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center mb-4 group-hover:bg-accent/20 transition-colors">
                  <feat.icon className="w-5 h-5 text-accent" />
                </div>
                <h3 className="font-semibold text-text-primary mb-2 text-sm">{feat.title}</h3>
                <p className="text-xs text-text-secondary leading-relaxed">{feat.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison table */}
      <section className="py-20 px-4 bg-surface-1/30">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-accent/30 bg-accent/10 text-accent text-xs font-medium mb-4">
              <Zap className="w-3 h-3" /> ¿Por qué GestorPro?
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              No somos uno más — somos lo que faltaba
            </h2>
            <p className="text-text-secondary max-w-xl mx-auto">
              Aspel y Microsip llevan 20 años sin actualizarse. Nosotros empezamos por donde ellos dejaron de mejorar.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="text-left px-4 py-3 text-text-tertiary font-medium text-xs w-1/3">Característica</th>
                  {comparison.competitors.map((c) => (
                    <th key={c.name} className={`px-4 py-3 text-center font-semibold text-sm ${c.highlight ? 'text-accent' : 'text-text-secondary'}`}>
                      {c.highlight && <div className="w-1.5 h-1.5 bg-accent rounded-full mx-auto mb-1" />}
                      {c.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {comparison.features.map((feat, fi) => (
                  <tr key={feat} className="border-t border-border/40 hover:bg-surface-2/20 transition-colors">
                    <td className="px-4 py-3 text-text-secondary">{feat}</td>
                    {comparison.competitors.map((c) => {
                      const val = c.values[fi]
                      return (
                        <td key={c.name} className="px-4 py-3 text-center">
                          {val === true
                            ? <Check className={`w-4 h-4 mx-auto ${c.highlight ? 'text-accent' : 'text-emerald-400'}`} />
                            : val === false
                            ? <X className="w-4 h-4 mx-auto text-red-400/60" />
                            : <Minus className="w-4 h-4 mx-auto text-text-tertiary/40" />
                          }
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-center text-xs text-text-tertiary mt-4">— sin información suficiente del competidor</p>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 px-4 bg-surface-1/50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Precios claros, sin sorpresas</h2>
            <p className="text-text-secondary">Planes en pesos mexicanos, IVA incluido.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`rounded-2xl border p-6 flex flex-col ${
                  plan.highlight
                    ? 'bg-accent/5 border-accent/40 shadow-glow-accent relative'
                    : 'bg-surface-1 border-border'
                }`}
              >
                {plan.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="badge-accent px-3 py-1 text-xs">Más popular</span>
                  </div>
                )}

                <div className="mb-6">
                  <h3 className="font-semibold text-lg mb-1">{plan.name}</h3>
                  <p className="text-text-tertiary text-sm mb-4">{plan.description}</p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold">${plan.price.toLocaleString('es-MX')}</span>
                    <span className="text-text-tertiary text-sm">/mes</span>
                  </div>
                </div>

                <ul className="flex-1 space-y-3 mb-6">
                  {plan.features.map((feat) => (
                    <li key={feat} className="flex items-center gap-2 text-sm text-text-secondary">
                      <Check className="w-4 h-4 text-accent shrink-0" />
                      {feat}
                    </li>
                  ))}
                </ul>

                <Link
                  href="/register"
                  className={plan.highlight ? 'btn-primary btn w-full justify-center' : 'btn-secondary btn w-full justify-center'}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Lo que dicen nuestros clientes</h2>
            <p className="text-text-secondary">Distribuidores reales, resultados reales.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t) => (
              <div key={t.name} className="card p-6">
                <div className="flex items-center gap-1 mb-4">
                  {Array.from({ length: t.stars }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-text-secondary text-sm leading-relaxed mb-6">&ldquo;{t.quote}&rdquo;</p>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-accent/20 border border-accent/30 flex items-center justify-center text-xs font-semibold text-accent">
                    {t.avatar}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-text-primary">{t.name}</p>
                    <p className="text-xs text-text-tertiary">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 bg-surface-1/50">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Empieza hoy, gratis por 14 días
          </h2>
          <p className="text-text-secondary mb-8">
            Sin tarjeta de crédito. Configura tu empresa en menos de 5 minutos y lleva el control total de tu distribuidora desde el primer día.
          </p>
          <Link href="/register" className="btn-primary btn btn-lg inline-flex">
            Crear cuenta gratis
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-accent flex items-center justify-center">
                <TrendingUp className="w-3.5 h-3.5 text-surface-0" strokeWidth={2.5} />
              </div>
              <span className="font-semibold text-sm">GestorPro</span>
            </div>
            <p className="text-text-tertiary text-xs">
              © {new Date().getFullYear()} GestorPro. ERP para distribuidores mexicanos.
            </p>
            <div className="flex items-center gap-6 text-xs text-text-tertiary">
              <a href="#" className="hover:text-text-secondary transition-colors">Privacidad</a>
              <a href="#" className="hover:text-text-secondary transition-colors">Términos</a>
              <a href="#" className="hover:text-text-secondary transition-colors">Contacto</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
