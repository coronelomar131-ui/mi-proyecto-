import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  // Only admins can invite
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, organization_id')
    .eq('id', session.user.id)
    .single()

  if (!profile || profile.role !== 'admin') {
    return NextResponse.json({ error: 'Se requiere rol de administrador' }, { status: 403 })
  }

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceKey) {
    return NextResponse.json({
      error: 'Configura SUPABASE_SERVICE_ROLE_KEY en las variables de entorno de Vercel para poder invitar usuarios.',
    }, { status: 422 })
  }

  const { email, full_name, role } = await req.json()
  if (!email || !full_name) {
    return NextResponse.json({ error: 'Email y nombre son requeridos' }, { status: 400 })
  }

  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceKey,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  const { data, error } = await admin.auth.admin.inviteUserByEmail(email, {
    data: {
      full_name,
      organization_id: profile.organization_id,
      role: role ?? 'vendedor',
    },
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ userId: data.user?.id })
}
