'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useLanguage } from '@/lib/i18n/LanguageContext'
import { useSubscription } from '@/lib/billing/useSubscription'
import { getPlanByKey } from '@/lib/billing/plans'
import { Logo } from '@/components/ui/Logo'
import { Suspense } from 'react'

function SuccessContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { language } = useLanguage()
  const { isSubscribed, subscription, refresh, isLoading } = useSubscription()
  const [checking, setChecking] = useState(true)
  const [attempts, setAttempts] = useState(0)

  const planKey = searchParams.get('plan')
  const plan = planKey ? getPlanByKey(planKey) : null

  const labels = {
    title: language === 'es' ? '¡Pago completado!' : 'Payment complete!',
    activating: language === 'es' ? 'Activando tu suscripción...' : 'Activating your subscription...',
    activated: language === 'es' ? '¡Suscripción activada!' : 'Subscription activated!',
    processing: language === 'es' 
      ? 'Tu pago se está procesando. La suscripción se activará en breve.'
      : 'Your payment is being processed. Subscription will activate shortly.',
    planActive: language === 'es' ? 'Plan activo' : 'Active plan',
    goToDashboard: language === 'es' ? 'Ir al Dashboard' : 'Go to Dashboard',
    goToProfile: language === 'es' ? 'Ir a mi Perfil' : 'Go to my Profile',
  }

  // Poll for subscription activation
  useEffect(() => {
    const checkSubscription = async () => {
      await refresh()
      setAttempts(prev => prev + 1)
    }

    // Check immediately and then every 3 seconds
    if (checking && attempts < 20) { // Max 20 attempts (1 minute)
      const timer = setTimeout(checkSubscription, attempts === 0 ? 0 : 3000)
      return () => clearTimeout(timer)
    } else if (attempts >= 20) {
      setChecking(false)
    }
  }, [checking, attempts, refresh])

  // Stop checking when subscription is active
  useEffect(() => {
    if (isSubscribed) {
      setChecking(false)
    }
  }, [isSubscribed])

  return (
    <div className="min-h-screen bg-navy-950 flex flex-col">
      <header className="flex items-center justify-center px-6 py-8">
        <Logo size="md" />
      </header>

      <main className="flex-1 flex items-center justify-center p-6">
        <div className="card p-8 max-w-md w-full text-center">
          {/* Success Icon */}
          <div className="w-16 h-16 rounded-full bg-success-500/20 flex items-center justify-center mx-auto mb-6">
            {checking || isLoading ? (
              <svg className="w-8 h-8 text-gold-500 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : (
              <svg className="w-8 h-8 text-success-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            )}
          </div>

          <h1 className="text-2xl font-bold text-white mb-4">
            {checking || isLoading ? labels.activating : labels.title}
          </h1>

          {isSubscribed && subscription ? (
            <>
              <p className="text-success-400 font-medium mb-2">
                {labels.activated}
              </p>
              <div className="bg-navy-800/50 rounded-lg p-4 mb-6">
                <p className="text-steel-400 text-sm mb-1">{labels.planActive}</p>
                <p className="text-gold-400 font-semibold">
                  {subscription.plan?.name[language] || subscription.planId}
                </p>
              </div>
            </>
          ) : (
            <p className="text-steel-300 mb-6">
              {labels.processing}
            </p>
          )}

          {plan && !isSubscribed && (
            <div className="bg-navy-800/50 rounded-lg p-4 mb-6">
              <p className="text-steel-400 text-sm mb-1">{labels.planActive}</p>
              <p className="text-gold-400 font-semibold">
                {plan.name[language]}
              </p>
            </div>
          )}

          <div className="flex flex-col gap-3">
            <Link href="/dashboard" className="btn-primary-filled w-full justify-center">
              {labels.goToDashboard}
            </Link>
            <Link href="/profile" className="btn-secondary w-full justify-center">
              {labels.goToProfile}
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}

export default function BillingSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-navy-950 flex items-center justify-center">
        <div className="text-steel-400">Loading...</div>
      </div>
    }>
      <SuccessContent />
    </Suspense>
  )
}

