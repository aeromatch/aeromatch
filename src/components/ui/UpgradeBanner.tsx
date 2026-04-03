'use client'

import Link from 'next/link'
import { useLanguage } from '@/lib/i18n/LanguageContext'
import type { FeatureKey } from '@/lib/plans'

export function UpgradeBanner({
  feature,
  showContinue = false,
  onContinue,
  continueLabel,
  showTopRightContinue = false,
}: {
  feature: FeatureKey
  showContinue?: boolean
  onContinue?: () => void
  continueLabel?: string
  showTopRightContinue?: boolean
}) {
  const { language } = useLanguage()

  const title =
    language === 'es'
      ? 'Función Premium (beta)'
      : 'Premium feature (beta)'

  return (
    <div className="p-5 rounded-xl border bg-[#0B132B] border-[#C9A24D]/50">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-white">{title}</p>
          <p className="text-xs text-steel-400 mt-1">
            {language === 'es' ? `Feature: ${feature}` : `Feature: ${feature}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {showTopRightContinue && showContinue && (
            <button
              onClick={onContinue}
              className="text-[11px] px-2 py-0.5 rounded-full bg-navy-900/60 border border-steel-700/40 text-steel-200 hover:border-[#C9A24D]/40 hover:text-white transition-colors"
            >
              {language === 'es' ? 'Seguir a Training' : 'Continue to Training'}
            </button>
          )}
          <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#C9A24D]/10 border border-[#C9A24D]/30 text-[#C9A24D]">
            Beta
          </span>
        </div>
      </div>

      <div className="mt-4 space-y-3 text-sm">
        <div className="p-3 rounded-lg bg-navy-900/40 border border-[#C9A24D]/20">
          <p className="text-white/90 whitespace-pre-line">
            Enjoy all Premium advantages in this phase. 
            Payment processes will be activated soon with a special 
            price for technicians already registered with a complete 
            profile available.
          </p>
          <p className="text-[#C9A24D] font-semibold mt-2">—</p>
          <p className="text-white/90 whitespace-pre-line">
            Disfruta de todas las ventajas Premium en esta fase. 
            Próximamente se activarán los procesos de pago con un precio 
            especial para los técnicos ya registrados con perfil completo 
            y disponible.
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-3">
        <Link href="/profile" className="btn-primary-filled">
          {language === 'es' ? 'Completar mi perfil' : 'Complete your profile'}
        </Link>
        {showContinue && (
          <button onClick={onContinue} className="btn-secondary">
            {continueLabel || (language === 'es' ? 'Continuar' : 'Continue')}
          </button>
        )}
        <button className="btn-secondary opacity-60 cursor-not-allowed" disabled>
          {language === 'es' ? 'Ver planes (próximamente)' : 'View plans (soon)'}
        </button>
      </div>
    </div>
  )
}

