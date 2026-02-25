'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { FEATURE_FLAGS, PRELAUNCH_COPY } from '@/lib/config/features'
import { useLanguage } from '@/lib/i18n/LanguageContext'
import { AppLayout } from '@/components/ui/AppLayout'
import Link from 'next/link'

/**
 * Pricing Page
 * 
 * During pre-launch (HIDE_PRICING=true), shows a "coming soon" message
 * and encourages profile completion instead.
 * 
 * When HIDE_PRICING=false, would show full pricing (not implemented yet).
 */
export default function PricingPage() {
  const router = useRouter()
  const { language } = useLanguage()
  const preLaunch = PRELAUNCH_COPY[language]

  // If pricing is hidden, we could redirect OR show coming soon message
  // Showing message is better UX than redirect (user wanted to see pricing)
  
  if (FEATURE_FLAGS.HIDE_PRICING) {
    return (
      <div className="min-h-screen bg-navy-950 flex items-center justify-center p-6">
        <div className="max-w-lg text-center">
          {/* Icon */}
          <div className="w-20 h-20 rounded-full bg-gold-500/10 border border-gold-500/30 flex items-center justify-center mx-auto mb-8">
            <svg className="w-10 h-10 text-gold-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>

          <h1 className="text-3xl font-bold text-white mb-4">
            {language === 'es' ? 'Planes próximamente' : 'Plans coming soon'}
          </h1>
          
          <p className="text-steel-400 mb-8 leading-relaxed">
            {preLaunch.pricingComingSoon}
          </p>

          {/* Pre-launch badge */}
          <div className="inline-flex items-center gap-2 bg-gold-500/10 border border-gold-500/30 rounded-full px-4 py-2 mb-8">
            <span className="text-gold-400">🚀</span>
            <span className="text-gold-400 font-medium text-sm">
              {preLaunch.badge}
            </span>
          </div>

          {/* Actions */}
          <div className="space-y-4">
            <Link
              href="/auth?mode=signup&role=technician"
              className="btn-primary-filled w-full justify-center"
            >
              {preLaunch.ctaTechnician}
            </Link>
            <Link
              href="/"
              className="btn-ghost w-full justify-center text-steel-400"
            >
              {language === 'es' ? '← Volver al inicio' : '← Back to home'}
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // TODO: Full pricing page when HIDE_PRICING is false
  // For now, redirect to home
  useEffect(() => {
    router.push('/')
  }, [router])

  return null
}

