export const PLANS = {
  free: {
    jobBoard: true,
    applyJobs: true,
    logbook: false,
    simulatorTrial: true, // 1 attempt total
    simulatorFull: false,
    customExam: false,
  },
  basic: {
    jobBoard: true,
    applyJobs: true,
    logbook: true,
    simulatorTrial: true,
    simulatorFull: false,
    customExam: false,
  },
  premium: {
    jobBoard: true,
    applyJobs: true,
    logbook: true,
    simulatorTrial: true,
    simulatorFull: true,
    customExam: true,
  },
} as const

export type PlanId = keyof typeof PLANS
export type FeatureKey = keyof typeof PLANS.free

export function normalizePlan(value: any): PlanId {
  const v = typeof value === 'string' ? value.toLowerCase().trim() : ''
  if (v === 'basic' || v === 'premium') return v
  return 'free'
}

export function planLabel(plan: PlanId): 'Free' | 'Basic' | 'Premium' {
  if (plan === 'premium') return 'Premium'
  if (plan === 'basic') return 'Basic'
  return 'Free'
}

export function featuresForPlan(plan: PlanId): { key: FeatureKey; enabled: boolean }[] {
  const p = PLANS[plan]
  return (Object.keys(PLANS.free) as FeatureKey[]).map((k) => ({ key: k, enabled: !!p[k] }))
}

