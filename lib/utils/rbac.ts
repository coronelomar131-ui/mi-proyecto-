import type { Profile, UserRole } from '@/types'

const ROLE_HIERARCHY: Record<UserRole, number> = {
  admin: 3,
  vendedor: 2,
  almacen: 1,
}

export function canAccess(profile: Profile | null, roles: UserRole[]): boolean {
  return !!profile && roles.includes(profile.role)
}

export function isAtLeast(profile: Profile | null, role: UserRole): boolean {
  if (!profile) return false
  return ROLE_HIERARCHY[profile.role] >= ROLE_HIERARCHY[role]
}

export function isAdmin(profile: Profile | null): boolean {
  return profile?.role === 'admin'
}

export function requireRole(profile: Profile | null, required: UserRole): void {
  if (!profile || profile.role !== required) {
    throw new Error(`Acceso denegado. Se requiere rol: ${required}`)
  }
}
