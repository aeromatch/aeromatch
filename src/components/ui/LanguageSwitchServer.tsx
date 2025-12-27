'use client'

import { useLanguage } from '@/lib/i18n/LanguageContext'

export function LanguageSwitchServer() {
  const { language, setLanguage } = useLanguage()

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => setLanguage('en')}
        className={`px-3 py-1.5 rounded text-xs font-medium transition-all ${
          language === 'en'
            ? 'bg-gold-500/20 text-gold-300 border border-gold-500/50'
            : 'text-steel-400 hover:text-white'
        }`}
      >
        EN
      </button>
      <button
        onClick={() => setLanguage('es')}
        className={`px-3 py-1.5 rounded text-xs font-medium transition-all ${
          language === 'es'
            ? 'bg-gold-500/20 text-gold-300 border border-gold-500/50'
            : 'text-steel-400 hover:text-white'
        }`}
      >
        ES
      </button>
    </div>
  )
}

