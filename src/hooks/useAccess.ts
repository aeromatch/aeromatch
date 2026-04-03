'use client'

import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { normalizePlan, PLANS, type FeatureKey, type PlanId } from '@/lib/plans'

export function useAccess(feature: FeatureKey): { hasAccess: boolean; userPlan: PlanId } {
  const supabase = useMemo(() => createClient(), [])
  const [userPlan, setUserPlan] = useState<PlanId>('free')

  useEffect(() => {
    const run = async () => {
      const { data } = await supabase.auth.getUser()
      if (!data.user) {
        setUserPlan('free')
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('plan')
        .eq('id', data.user.id)
        .single()

      setUserPlan(normalizePlan(profile?.plan))
    }
    run()
  }, [supabase])

  const betaAllPremium = process.env.NEXT_PUBLIC_BETA_ALL_PREMIUM === 'true'
  const hasAccess = betaAllPremium ? true : !!PLANS[userPlan]?.[feature]
  return { hasAccess, userPlan }
}

