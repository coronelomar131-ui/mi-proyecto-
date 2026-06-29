import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'GestorPro — ERP para Distribuidores',
    short_name: 'GestorPro',
    description: 'Plataforma ERP SaaS completa para distribuidores',
    start_url: '/dashboard',
    display: 'standalone',
    background_color: '#0A0A0B',
    theme_color: '#00C878',
    orientation: 'portrait-primary',
    icons: [
      {
        src: '/logo-gestorpro-icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'any',
      },
    ],
    shortcuts: [
      {
        name: 'Nueva venta',
        url: '/dashboard/ventas',
        description: 'Crear una nueva venta',
      },
      {
        name: 'Inventario',
        url: '/dashboard/inventario',
        description: 'Ver inventario',
      },
    ],
    categories: ['business', 'productivity'],
    lang: 'es',
  }
}
