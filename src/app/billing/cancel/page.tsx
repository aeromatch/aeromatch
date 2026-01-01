'use client'

import Link from 'next/link'
import { useLanguage } from '@/lib/i18n/LanguageContext'
import { Logo } from '@/components/ui/Logo'

export default function BillingCancelPage() {
  const { language } = useLanguage()

  const labels = {
    title: language === 'es' ? 'Pago cancelado' : 'Payment cancelled',
    subtitle: language === 'es' 
      ? 'No te preocupes, no se ha realizado ningún cargo.'
      : 'Don\'t worry, no charges have been made.',
    tryAgain: language === 'es' ? 'Intentar de nuevo' : 'Try again',
    goBack: language === 'es' ? 'Volver al Dashboard' : 'Go to Dashboard',
    help: language === 'es' 
      ? '¿Tienes alguna pregunta? Contáctanos en support@aeromatch.eu'
      : 'Have questions? Contact us at support@aeromatch.eu',
  }

  return (
    <div className="min-h-screen bg-navy-950 flex flex-col">
      <header className="flex items-center justify-center px-6 py-8">
        <Logo size="md" />
      </header>

      <main className="flex-1 flex items-center justify-center p-6">
        <div className="card p-8 max-w-md w-full text-center">
          {/* Cancel Icon */}
          <div className="w-16 h-16 rounded-full bg-steel-700/30 flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-steel-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>

          <h1 className="text-2xl font-bold text-white mb-2">
            {labels.title}
          </h1>

          <p className="text-steel-300 mb-8">
            {labels.subtitle}
          </p>

          <div className="flex flex-col gap-3 mb-6">
            <Link href="/profile" className="btn-primary-filled w-full justify-center">
              {labels.tryAgain}
            </Link>
            <Link href="/dashboard" className="btn-secondary w-full justify-center">
              {labels.goBack}
            </Link>
          </div>

          <p className="text-sm text-steel-500">
            {labels.help}
          </p>
        </div>
      </main>
    </div>
  )
}

