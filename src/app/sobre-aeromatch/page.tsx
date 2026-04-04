'use client'

import Link from 'next/link'
import { Logo } from '@/components/ui/Logo'
import { AboutContent } from '@/components/about/AboutContent'
import { getAboutCopy } from '@/lib/i18n/aboutCopy'
import { LanguageSwitch, useLanguage } from '@/lib/i18n/LanguageContext'

export default function SobreAeromatchPage() {
  const { language } = useLanguage()
  const copy = getAboutCopy(language)

  return (
    <div className="min-h-screen bg-navy-950">
      <header className="sticky top-0 z-50 border-b border-steel-800/30 bg-navy-950/95 backdrop-blur-md">
        <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6 lg:px-8">
          <Link href="/" className="inline-flex" aria-label="aeroMatch inicio">
            <Logo size="md" />
          </Link>
          <div className="flex items-center gap-4">
            <LanguageSwitch />
            <Link href="/" className="btn-ghost hidden text-sm sm:inline-flex">
              {copy.navBack}
            </Link>
          </div>
        </nav>
      </header>

      <AboutContent copy={copy} />
    </div>
  )
}
