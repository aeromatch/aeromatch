'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getPlanByKey, Plan } from './plans'

export interface Subscription {
  id: string
  planId: string
  status: 'pending' | 'active' | 'trialing' | 'past_due' | 'paused' | 'canceled' | 'expired'
  currentPeriodEnd: string | null
  cancelAtPeriodEnd: boolean
  plan: Plan | null
}

export interface SubscriptionState {
  isLoading: boolean
  isSubscribed: boolean
  subscription: Subscription | null
  error: string | null
}

export function useSubscription() {
  const [state, setState] = useState<SubscriptionState>({
    isLoading: true,
    isSubscribed: false,
    subscription: null,
    error: null,
  })

  const supabase = createClient()

  const fetchSubscription = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setState({
          isLoading: false,
          isSubscribed: false,
          subscription: null,
          error: null,
        })
        return
      }

      // Get active subscription
      const { data: subscriptionData, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .in('status', ['active', 'trialing'])
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        throw error
      }

      if (subscriptionData) {
        const plan = getPlanByKey(subscriptionData.plan_id)
        setState({
          isLoading: false,
          isSubscribed: true,
          subscription: {
            id: subscriptionData.id,
            planId: subscriptionData.plan_id,
            status: subscriptionData.status,
            currentPeriodEnd: subscriptionData.current_period_end,
            cancelAtPeriodEnd: subscriptionData.cancel_at_period_end,
            plan,
          },
          error: null,
        })
      } else {
        setState({
          isLoading: false,
          isSubscribed: false,
          subscription: null,
          error: null,
        })
      }
    } catch (err: any) {
      console.error('Error fetching subscription:', err)
      setState({
        isLoading: false,
        isSubscribed: false,
        subscription: null,
        error: err.message,
      })
    }
  }

  useEffect(() => {
    fetchSubscription()
  }, [])

  return {
    ...state,
    refresh: fetchSubscription,
  }
}

// Helper to check if user has active subscription
export async function getActiveSubscription(userId: string) {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', userId)
    .in('status', ['active', 'trialing'])
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching subscription:', error)
    return { isSubscribed: false, subscription: null }
  }

  if (data) {
    return {
      isSubscribed: true,
      subscription: {
        planKey: data.plan_id,
        status: data.status,
        currentPeriodEnd: data.current_period_end,
      },
    }
  }

  return { isSubscribed: false, subscription: null }
}

