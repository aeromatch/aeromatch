'use client'

import Link from 'next/link'
import { Logo } from '@/components/ui/Logo'
import { useLanguage, LanguageSwitch } from '@/lib/i18n/LanguageContext'

interface HomePageProps {
  isLoggedIn: boolean
}

export function HomePage({ isLoggedIn }: HomePageProps) {
  const { t, language } = useLanguage()

  const labels = {
    preview: language === 'es' ? 'Ver Preview' : 'Preview',
    howItWorks: language === 'es' ? 'Cómo Funciona' : 'How It Works',
    forTechnicians: language === 'es' ? 'Para Técnicos' : 'For Technicians',
    forCompanies: language === 'es' ? 'Para Empresas' : 'For Companies',
    explorePreview: language === 'es' ? 'Explorar Vista Previa' : 'Explore Preview',
    seeProfile: language === 'es' ? 'Ver perfil de ejemplo' : 'See sample profile',
  }

  return (
    <div className="min-h-screen bg-navy-950">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-navy-950/95 backdrop-blur-md border-b border-steel-800/30">
        <nav className="max-w-6xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Logo size="md" />
            
            <div className="flex items-center gap-4">
              <LanguageSwitch />
              
              <Link href="/preview" className="btn-ghost text-sm">
                {labels.preview}
              </Link>
              
              {isLoggedIn ? (
                <Link 
                  href="/dashboard" 
                  className="btn-cta group"
                >
                  {t.nav.dashboard}
                  <svg className="w-4 h-4 text-gold-500 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              ) : (
                <>
                  <Link
                    href="/auth"
                    className="btn-ghost"
                  >
                    {t.nav.signIn}
                  </Link>
                  <Link 
                    href="/auth?mode=signup" 
                    className="btn-cta group"
                  >
                    {t.nav.createAccount}
                    <svg className="w-4 h-4 text-gold-500 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                </>
              )}
            </div>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center">
        {/* Background */}
        <div 
          className="absolute inset-0"
          style={{
            background: `
              radial-gradient(ellipse 90% 70% at 50% 30%, rgba(26, 38, 66, 0.5) 0%, transparent 55%),
              radial-gradient(ellipse 50% 40% at 20% 80%, rgba(38, 54, 102, 0.35) 0%, transparent 50%),
              radial-gradient(ellipse 40% 35% at 85% 20%, rgba(26, 38, 66, 0.4) 0%, transparent 50%),
              linear-gradient(180deg, #0B132B 0%, #0D1530 40%, #0B132B 100%)
            `
          }}
        />

        <div className="relative z-10 w-full max-w-6xl mx-auto px-6 lg:px-8 pt-24 pb-16">
          <div className="max-w-4xl mx-auto text-center">
            {/* Logo as brand anchor - Hero size for maximum impact */}
            <div className="flex justify-center mb-14">
              <Logo size="hero" />
            </div>

            {/* Badge */}
            <div className="inline-flex items-center gap-3 mb-10">
              <span className="w-8 h-px bg-gold-500/60" />
              <span className="text-[11px] font-semibold text-gold-400/80 uppercase tracking-[0.2em]">
                {t.hero.badge}
              </span>
              <span className="w-8 h-px bg-gold-500/60" />
            </div>

            {/* Main headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl tracking-tight mb-8 leading-[1.1]">
              <span className="block text-white font-semibold mb-2">{t.hero.headline1}</span>
              <span className="block text-gold-400 font-bold">{t.hero.headline2}</span>
            </h1>

            {/* Subheadline */}
            <p className="max-w-2xl mx-auto text-lg sm:text-xl text-steel-300 mb-12 leading-relaxed">
              {t.hero.subheadline}
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
              <Link
                href="/auth?mode=signup"
                className="btn-primary-filled-lg group"
              >
                {t.hero.ctaCreate}
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
              <Link
                href="/preview"
                className="btn-secondary-lg"
              >
                {labels.explorePreview}
              </Link>
            </div>

            {/* Trust indicators */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
              {[
                { value: t.stats.licenses, label: t.stats.easaB1B2 },
                { value: t.stats.certifications, label: t.stats.faaAP },
                { value: t.stats.companies, label: t.stats.mroLine },
                { value: t.stats.coverage, label: t.stats.europeGlobal },
              ].map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="text-2xl sm:text-3xl font-bold text-gold-400 mb-1">{stat.value}</div>
                  <div className="text-xs sm:text-sm text-steel-400">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <svg className="w-6 h-6 text-steel-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </div>
      </section>

      {/* Premium Preview Cards Section */}
      <section id="features" className="py-24 bg-navy-900/50">
        <div className="max-w-6xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              {t.features.title}
            </h2>
            <p className="max-w-2xl mx-auto text-steel-400 text-lg">
              {t.features.subtitle}
            </p>
          </div>

          {/* 4 Premium Feature Cards - Clickable, leading to preview */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Availability Card */}
            <Link href="/preview" className="feature-card group cursor-pointer">
              <div className="feature-icon">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-gold-400 transition-colors">
                {t.features.availabilityFirst.title}
              </h3>
              <p className="text-sm text-steel-400 leading-relaxed mb-4">
                {t.features.availabilityFirst.description}
              </p>
              <span className="text-xs text-gold-500 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {labels.seeProfile}
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </span>
            </Link>

            {/* Anonymity Card */}
            <Link href="/preview" className="feature-card group cursor-pointer">
              <div className="feature-icon">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-gold-400 transition-colors">
                {t.features.anonymousUntilMatch.title}
              </h3>
              <p className="text-sm text-steel-400 leading-relaxed mb-4">
                {t.features.anonymousUntilMatch.description}
              </p>
              <span className="text-xs text-gold-500 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {labels.seeProfile}
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </span>
            </Link>

            {/* Verified Docs Card */}
            <Link href="/preview" className="feature-card group cursor-pointer">
              <div className="feature-icon">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-gold-400 transition-colors">
                {t.features.verifiedDocs.title}
              </h3>
              <p className="text-sm text-steel-400 leading-relaxed mb-4">
                {t.features.verifiedDocs.description}
              </p>
              <span className="text-xs text-gold-500 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {labels.seeProfile}
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </span>
            </Link>

            {/* Fast Connection Card */}
            <Link href="/preview" className="feature-card group cursor-pointer">
              <div className="feature-icon">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-gold-400 transition-colors">
                {t.features.fastConnection.title}
              </h3>
              <p className="text-sm text-steel-400 leading-relaxed mb-4">
                {t.features.fastConnection.description}
              </p>
              <span className="text-xs text-gold-500 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {labels.seeProfile}
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </span>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24">
        <div className="max-w-4xl mx-auto px-6 lg:px-8">
          <div className="cta-card text-center">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-4">
              {t.cta.title}
            </h2>
            <p className="max-w-xl mx-auto text-steel-300 mb-8">
              {t.cta.subtitle}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/auth?mode=signup&role=technician"
                className="btn-primary-filled-lg"
              >
                {t.hero.ctaTechnician}
              </Link>
              <Link
                href="/auth?mode=signup&role=company"
                className="btn-secondary-lg"
              >
                {t.hero.ctaCompany}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-steel-800/30">
        <div className="max-w-6xl mx-auto px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-6">
              <Logo size="sm" />
              <LanguageSwitch />
            </div>
            <div className="flex items-center gap-6 text-sm text-steel-500">
              <a href="#" className="hover:text-white transition-colors">{t.footer.privacy}</a>
              <a href="#" className="hover:text-white transition-colors">{t.footer.terms}</a>
              <span>{t.footer.copyright}</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
