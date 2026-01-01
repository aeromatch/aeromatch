'use client'

import { useState } from 'react'
import { useLanguage } from '@/lib/i18n/LanguageContext'
import { useSubscription } from '@/lib/billing/useSubscription'
import { getPlansByRole, formatPrice, Plan, PlanRole } from '@/lib/billing/plans'

interface SubscriptionSectionProps {
  userRole: PlanRole
  userEmail?: string
}

export function SubscriptionSection({ userRole, userEmail }: SubscriptionSectionProps) {
  const { language } = useLanguage()
  const { isLoading, isSubscribed, subscription, refresh } = useSubscription()
  const [showPlans, setShowPlans] = useState(false)
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const plans = getPlansByRole(userRole)

  const labels = {
    title: language === 'es' ? 'Suscripción' : 'Subscription',
    currentPlan: language === 'es' ? 'Plan actual' : 'Current Plan',
    status: language === 'es' ? 'Estado' : 'Status',
    renewsOn: language === 'es' ? 'Se renueva el' : 'Renews on',
    expiresOn: language === 'es' ? 'Expira el' : 'Expires on',
    upgrade: language === 'es' ? 'Mejorar plan' : 'Upgrade',
    managePlan: language === 'es' ? 'Gestionar plan' : 'Manage plan',
    selectPlan: language === 'es' ? 'Seleccionar plan' : 'Select plan',
    noPlan: language === 'es' ? 'Sin suscripción activa' : 'No active subscription',
    freePlan: language === 'es' ? 'Plan Gratuito' : 'Free Plan',
    active: language === 'es' ? 'Activo' : 'Active',
    trialing: language === 'es' ? 'Prueba' : 'Trialing',
    pastDue: language === 'es' ? 'Pago pendiente' : 'Past due',
    canceled: language === 'es' ? 'Cancelado' : 'Canceled',
    paused: language === 'es' ? 'Pausado' : 'Paused',
    cancelingAt: language === 'es' ? 'Cancela el' : 'Cancels on',
    loading: language === 'es' ? 'Cargando...' : 'Loading...',
    choosePlan: language === 'es' ? 'Elige tu plan' : 'Choose your plan',
    popular: language === 'es' ? 'Popular' : 'Popular',
    back: language === 'es' ? 'Volver' : 'Back',
  }

  const statusLabels: Record<string, string> = {
    active: labels.active,
    trialing: labels.trialing,
    past_due: labels.pastDue,
    canceled: labels.canceled,
    paused: labels.paused,
  }

  const handleSelectPlan = async (plan: Plan) => {
    setCheckoutLoading(plan.key)
    setError(null)

    try {
      const response = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planKey: plan.key }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout')
      }

      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl
      } else {
        throw new Error('No checkout URL received')
      }
    } catch (err: any) {
      setError(err.message)
      setCheckoutLoading(null)
    }
  }

  if (isLoading) {
    return (
      <div className="card p-6">
        <h3 className="text-lg font-semibold text-white mb-4">{labels.title}</h3>
        <div className="text-steel-400">{labels.loading}</div>
      </div>
    )
  }

  // Show plan selection
  if (showPlans) {
    return (
      <div className="card p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-white">{labels.choosePlan}</h3>
          <button 
            onClick={() => setShowPlans(false)}
            className="text-steel-400 hover:text-white text-sm"
          >
            {labels.back}
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-error-600/20 border border-error-500/30 text-error-400 text-sm">
            {error}
          </div>
        )}

        <div className="grid gap-4">
          {plans.map((plan) => (
            <div 
              key={plan.key}
              className={`p-4 rounded-xl border-2 transition-all ${
                plan.popular 
                  ? 'border-gold-500/50 bg-gold-500/5' 
                  : 'border-steel-700 hover:border-steel-600'
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold text-white">{plan.name[language]}</h4>
                    {plan.popular && (
                      <span className="text-xs bg-gold-500 text-navy-950 px-2 py-0.5 rounded-full font-medium">
                        {labels.popular}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-steel-400 mt-1">{plan.description[language]}</p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-gold-400">
                    {formatPrice(plan.price, plan.interval, language)}
                  </div>
                </div>
              </div>

              <ul className="space-y-2 mb-4">
                {plan.features[language].map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm text-steel-300">
                    <svg className="w-4 h-4 text-success-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    {feature}
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleSelectPlan(plan)}
                disabled={checkoutLoading !== null}
                className={`w-full ${plan.popular ? 'btn-primary-filled' : 'btn-secondary'} justify-center`}
              >
                {checkoutLoading === plan.key ? labels.loading : labels.selectPlan}
              </button>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // Show current subscription status
  return (
    <div className="card p-6">
      <h3 className="text-lg font-semibold text-white mb-4">{labels.title}</h3>

      {isSubscribed && subscription ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-navy-800/50 rounded-lg">
            <div>
              <p className="text-sm text-steel-400">{labels.currentPlan}</p>
              <p className="text-white font-medium">
                {subscription.plan?.name[language] || subscription.planId}
              </p>
            </div>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              subscription.status === 'active' ? 'bg-success-500/20 text-success-400' :
              subscription.status === 'trialing' ? 'bg-gold-500/20 text-gold-400' :
              subscription.status === 'past_due' ? 'bg-warning-500/20 text-warning-400' :
              'bg-steel-700/50 text-steel-400'
            }`}>
              {statusLabels[subscription.status] || subscription.status}
            </span>
          </div>

          {subscription.currentPeriodEnd && (
            <div className="text-sm text-steel-400">
              {subscription.cancelAtPeriodEnd ? labels.expiresOn : labels.renewsOn}:{' '}
              <span className="text-white">
                {new Date(subscription.currentPeriodEnd).toLocaleDateString(language === 'es' ? 'es-ES' : 'en-GB')}
              </span>
            </div>
          )}

          <button 
            onClick={() => setShowPlans(true)}
            className="btn-secondary w-full justify-center"
          >
            {labels.managePlan}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-navy-800/50 rounded-lg">
            <div>
              <p className="text-sm text-steel-400">{labels.currentPlan}</p>
              <p className="text-white font-medium">{labels.freePlan}</p>
            </div>
            <span className="px-3 py-1 rounded-full text-sm font-medium bg-steel-700/50 text-steel-400">
              {labels.noPlan}
            </span>
          </div>

          <button 
            onClick={() => setShowPlans(true)}
            className="btn-primary-filled w-full justify-center"
          >
            {labels.upgrade}
          </button>
        </div>
      )}
    </div>
  )
}
