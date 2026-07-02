export interface PlanLimits {
  users: number
  products: number
}

export const PLAN_LIMITS: Record<string, PlanLimits> = {
  starter: { users: 3, products: 500 },
  pro: { users: 10, products: Infinity },
  enterprise: { users: Infinity, products: Infinity },
}

export function getPlanLimits(plan?: string | null): PlanLimits {
  return PLAN_LIMITS[plan ?? 'starter'] ?? PLAN_LIMITS.starter
}
