import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'GestorPro — ERP para Distribuidores',
    short_name: 'GestorPro',
    description: 'Plataforma ERP SaaS completa para distribuidores',
    start_url: '/dashboard',
    display: 'standalone',
    background_color: '#0A0A0B',
    theme_color: '#00C4D4',
    orientation: 'portrait-primary',
    icons: [
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
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
