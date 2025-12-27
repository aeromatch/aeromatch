'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { translations, Language, TranslationKeys } from './translations'

interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: TranslationKeys
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

const STORAGE_KEY = 'aeromatch-language'

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>('en')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    // Load from localStorage on mount
    const stored = localStorage.getItem(STORAGE_KEY) as Language
    if (stored && (stored === 'en' || stored === 'es')) {
      setLanguageState(stored)
    } else {
      // Detect browser language
      const browserLang = navigator.language.startsWith('es') ? 'es' : 'en'
      setLanguageState(browserLang)
    }
    setMounted(true)
  }, [])

  const setLanguage = (lang: Language) => {
    setLanguageState(lang)
    localStorage.setItem(STORAGE_KEY, lang)
  }

  // Prevent hydration mismatch
  if (!mounted) {
    return (
      <LanguageContext.Provider value={{ language: 'en', setLanguage, t: translations.en }}>
        {children}
      </LanguageContext.Provider>
    )
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t: translations[language] as TranslationKeys }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
}

// Language switch component
export function LanguageSwitch({ className = '' }: { className?: string }) {
  const { language, setLanguage } = useLanguage()

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <button
        onClick={() => setLanguage('en')}
        className={`px-2 py-1 text-xs font-medium rounded transition-all ${
          language === 'en'
            ? 'bg-gold-500/20 text-gold-400 border border-gold-500/40'
            : 'text-steel-400 hover:text-white'
        }`}
      >
        EN
      </button>
      <button
        onClick={() => setLanguage('es')}
        className={`px-2 py-1 text-xs font-medium rounded transition-all ${
          language === 'es'
            ? 'bg-gold-500/20 text-gold-400 border border-gold-500/40'
            : 'text-steel-400 hover:text-white'
        }`}
      >
        ES
      </button>
    </div>
  )
}

