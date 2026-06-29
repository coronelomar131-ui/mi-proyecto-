import type { Metadata, Viewport } from 'next'
import { Toaster } from 'react-hot-toast'
import { KeyboardShortcutsModal } from '@/components/ui/keyboard-shortcuts'
import { UserProvider } from '@/lib/context/user-context'
import './globals.css'

export const metadata: Metadata = {
  title: {
    default: 'GestorPro — ERP para Distribuidores',
    template: '%s | GestorPro',
  },
  description:
    'Plataforma ERP SaaS completa para distribuidores: ventas, inventario, clientes, entregas y más.',
  keywords: ['ERP', 'distribuidores', 'inventario', 'ventas', 'CRM', 'SaaS'],
  authors: [{ name: 'GestorPro' }],
  robots: 'index, follow',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'GestorPro',
  },
  applicationName: 'GestorPro',
  formatDetection: { telephone: false },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0A0A0B',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className="dark">
      <body>
        <UserProvider>
          {children}
          <KeyboardShortcutsModal />
        <Toaster
          position="top-right"
          gutter={8}
          toastOptions={{
            duration: 4000,
            style: {
              background: '#1E1E24',
              color: '#F0F0F5',
              border: '1px solid rgba(255,255,255,0.10)',
              borderRadius: '10px',
              fontSize: '14px',
              padding: '12px 16px',
              boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
            },
            success: {
              iconTheme: { primary: '#00C4D4', secondary: '#0A0A0B' },
            },
            error: {
              iconTheme: { primary: '#f87171', secondary: '#0A0A0B' },
            },
          }}
        />
        </UserProvider>
      </body>
    </html>
  )
}
