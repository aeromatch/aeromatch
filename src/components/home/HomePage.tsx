'use client'

import Link from 'next/link'
import { useState } from 'react'
import '@/styles/infographic.css'
import { Logo, LogoGoldA } from '@/components/ui/Logo'
import { useLanguage, LanguageSwitch } from '@/lib/i18n/LanguageContext'
import { StorySection } from '@/components/home/StorySection'
import { HowItWorks } from '@/components/home/HowItWorks'
import { ShareProfile } from '@/components/home/ShareProfile'
import { Ecosystem } from '@/components/home/Ecosystem'
import { Stats } from '@/components/home/Stats'
import { FinalCTA } from '@/components/home/FinalCTA'
import { InfographicMotion } from '@/components/home/InfographicMotion'
import { 
  FEATURE_FLAGS, 
  PRELAUNCH_COPY, 
  COMPANY_PRESTEP 
} from '@/lib/config/features'
import { getLandingCopy } from '@/lib/i18n/landingCopy'

interface HomePageProps {
  isLoggedIn: boolean
}

export function HomePage({ isLoggedIn }: HomePageProps) {
  const { language } = useLanguage()
  const [showCompanyPrestep, setShowCompanyPrestep] = useState(false)
  const landing = getLandingCopy(language)

  // Get pre-launch copy
  const preLaunch = PRELAUNCH_COPY[language]
  const companyPrestep = COMPANY_PRESTEP[language]

  // All labels with ES/EN
  const content = {
    // Pre-Launch Banner (replaces expired "Jan 20" offer)
    preLaunchBanner: {
      badge: preLaunch.badge,
      message: preLaunch.banner,
    },
    // Header
    nav: {
      signIn: language === 'es' ? 'Iniciar sesión' : 'Sign in',
      dashboard: language === 'es' ? 'Ir al Panel' : 'Go to Dashboard',
    },
    // Hero Section
    hero: {
      headline1: language === 'es' ? 'Deja de enviar CVs que nadie lee.' : 'Stop sending CVs nobody reads.',
      headline2: language === 'es' ? 'Las empresas te buscan a ti.' : 'Companies search for you.',
      subheadline: language === 'es' 
        ? 'Regístrate una vez. Define tu disponibilidad. Recibe ofertas directas. Sin intermediarios.'
        : 'Register once. Set your availability. Receive direct offers. No middlemen.',
      ctaTechnician: preLaunch.ctaTechnician,
      ctaCompany: language === 'es' ? 'Buscar técnicos ahora →' : 'Search technicians now →',
    },
    // Trust Badges
    trust: {
      easa: language === 'es' ? 'Plataforma según normativa EASA Part-145' : 'Platform following EASA Part-145',
      gdpr: language === 'es' ? 'Datos protegidos bajo GDPR' : 'Data protected under GDPR',
      builtBy: language === 'es' ? 'Built by técnicos aeronáuticos activos' : 'Built by active aircraft technicians',
    },
    // Pre-launch pricing context
    pricingContext: language === 'es' 
      ? 'Gratis durante la fase Pre-Launch. Planes Premium y Recruiter próximamente.'
      : 'Free during Pre-Launch. Premium and Recruiter plans coming soon.',
    // Community Building Message (replaces counters during pre-launch)
    communityBuilding: {
      title: language === 'es' ? 'Únete a la comunidad' : 'Join the community',
      message: preLaunch.communityBuilding,
    },
    // How It Works
    howItWorks: {
      title: language === 'es' ? 'Cómo funciona' : 'How it works',
      forTechnicians: language === 'es' ? 'Para Técnicos' : 'For Technicians',
      forCompanies: language === 'es' ? 'Para Empresas' : 'For Companies',
      techSteps: [
        {
          num: '1',
          title: language === 'es' ? 'Crea tu perfil (2 min)' : 'Create your profile (2 min)',
          desc: language === 'es' ? 'Licencias + Experiencia' : 'Licenses + Experience',
        },
        {
          num: '2',
          title: language === 'es' ? 'Sube documentación' : 'Upload documents',
          desc: language === 'es' ? 'Verificamos tu perfil' : 'We verify your profile',
        },
        {
          num: '3',
          title: language === 'es' ? 'Define disponibilidad' : 'Set availability',
          desc: language === 'es' ? 'Cuándo estás libre' : 'When you\'re available',
        },
        {
          num: '4',
          title: language === 'es' ? 'Recibe ofertas' : 'Receive offers',
          desc: language === 'es' ? 'Empresas te contactan directamente' : 'Companies reach out directly',
        },
      ],
      companySteps: [
        {
          num: '1',
          title: language === 'es' ? '2 min · Datos de empresa' : '2 min · Company details',
          desc: language === 'es' ? 'Información de empresa + requisitos del proyecto' : 'Company info + project requirements',
        },
        {
          num: '2',
          title: language === 'es' ? 'Filtra candidatos' : 'Filter candidates',
          desc: language === 'es' ? 'Por licencia, experiencia, disponibilidad' : 'By license, experience, availability',
        },
        {
          num: '3',
          title: language === 'es' ? 'Contacta directamente' : 'Contact directly',
          desc: language === 'es' ? 'Sin intermediarios' : 'No middlemen',
        },
        {
          num: '4',
          title: language === 'es' ? 'Contrata' : 'Hire',
          desc: language === 'es' ? 'Acuerdo directo técnico-empresa' : 'Direct technician-company agreement',
        },
      ],
    },
    // Why AeroMatch - Storytelling
    whyAeroMatch: {
      title: language === 'es' ? 'Por qué AeroMatch' : 'Why AeroMatch',
      story: language === 'es' 
        ? `Soy Raúl, técnico B1, B2, C en Air Europa con 20 años de experiencia.

He visto compañeros con 15 años de experiencia enviar CVs durante semanas sin respuesta.

He visto empresas rechazar candidatos excelentes porque llegaron cuando ya habían contratado.

El problema nunca fue la falta de técnicos o trabajo.
El problema es cómo nos conectamos.

Por eso construí AeroMatch.

Un lugar donde técnicos y empresas se encuentran en tiempo real.
Sin papeleos. Sin intermediarios. Sin comisiones.`
        : `I'm Raúl, B1, B2, C technician at Air Europa with 20 years of experience.

I've seen colleagues with 15 years of experience sending CVs for weeks with no response.

I've seen companies reject excellent candidates because they arrived when they had already hired.

The problem was never the lack of technicians or jobs.
The problem is how we connect.

That's why I built AeroMatch.

A place where technicians and companies meet in real time.
No paperwork. No middlemen. No commissions.`,
      signature: language === 'es' ? 'Built by un técnico, para técnicos.' : 'Built by a technician, for technicians.',
    },
    // Testimonials Section
    testimonials: {
      title: language === 'es' ? 'Lo que dicen' : 'What they say',
    },
    // FAQ (updated without expired offer mention)
    faq: {
      title: language === 'es' ? 'Preguntas frecuentes' : 'Frequently asked questions',
      items: [
        {
          q: language === 'es' ? '¿Cuánto cuesta?' : 'How much does it cost?',
          a: language === 'es'
            ? 'Gratis. Tanto para técnicos como para empresas. Crea tu perfil, sube tus documentos y marca tu disponibilidad sin coste. Los planes premium con funcionalidades avanzadas se activarán más adelante.'
            : 'Free. For both technicians and companies. Create your profile, upload your documents and set your availability at no cost. Premium plans with advanced features will be activated later.',
        },
        {
          q: language === 'es' ? '¿Cómo verificáis las licencias?' : 'How do you verify licenses?',
          a: language === 'es'
            ? 'Revisamos manualmente cada documento subido contra las bases de datos oficiales de EASA/FAA/UK CAA. Los documentos verificados muestran un badge verde en el perfil. Los técnicos verificados aparecen primero en las búsquedas.'
            : 'We manually review each uploaded document against official EASA/FAA/UK CAA databases. Verified documents show a green badge on the profile. Verified technicians appear first in searches.',
        },
        {
          q: language === 'es' ? '¿Sois una agencia de colocación?' : 'Are you a recruitment agency?',
          a: language === 'es'
            ? 'NO. Somos una plataforma de conexión directa. Técnicos y empresas negocian contratos y condiciones directamente. Sin comisiones sobre contratos.'
            : 'NO. We are a direct connection platform. Technicians and companies negotiate contracts and conditions directly. No commissions on contracts.',
        },
        {
          q: language === 'es' ? '¿Qué beneficios tienen los registrados en pre-lanzamiento?' : 'What benefits do pre-launch users get?',
          a: language === 'es'
            ? 'Todos los perfiles que se registren durante la fase de pre-lanzamiento recibirán beneficios exclusivos cuando se activen los planes de pago. Además, los perfiles verificados tendrán prioridad en las búsquedas de empresas.'
            : 'All profiles registered during the pre-launch phase will receive exclusive benefits when paid plans are activated. Additionally, verified profiles will have priority in company searches.',
        },
        {
          q: language === 'es' ? '¿Puedo usar AeroMatch si no tengo Right to Work UK?' : 'Can I use AeroMatch without UK Right to Work?',
          a: language === 'es'
            ? 'Sí. AeroMatch opera en toda Europa y trabajos fuera de UK no requieren Right to Work UK. Para trabajos en UK sin RTW, te sugerimos Umbrella Partners que pueden gestionar visados o facturación mediante EoR (Employer of Record).'
            : 'Yes. AeroMatch operates across Europe and jobs outside the UK don\'t require UK Right to Work. For UK jobs without RTW, we suggest Umbrella Partners who can handle visas or billing through EoR (Employer of Record).',
        },
      ],
    },
    // CTA Final
    cta: {
      title: language === 'es' ? '¿Listo para conectar?' : 'Ready to connect?',
      subtitle: language === 'es' 
        ? 'Completa tu perfil y empieza a recibir ofertas directas.'
        : 'Complete your profile and start receiving direct offers.',
    },
    // Footer
    footer: {
      privacy: language === 'es' ? 'Privacidad' : 'Privacy',
      terms: language === 'es' ? 'Términos' : 'Terms',
      about: language === 'es' ? 'Acerca de aeroMatch' : 'About aeroMatch',
      copyright: '© 2025 AeroMatch. All rights reserved.',
    },
  }

  // Handle company CTA with optional pre-step
  const handleCompanyCta = () => {
    if (FEATURE_FLAGS.ENABLE_COMPANY_PRESTEP) {
      setShowCompanyPrestep(true)
    } else {
      window.location.href = '/auth?mode=signup&role=company'
    }
  }

  return (
    <div className="min-h-screen bg-navy-950">
      {/* Pre-Launch Banner (replaces expired Jan 20 offer) */}
      <div className="bg-gradient-to-r from-gold-600 to-gold-500 text-navy-950">
        <div className="max-w-6xl mx-auto px-4 py-2.5">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 text-sm font-medium">
            <span className="font-bold whitespace-nowrap">{content.preLaunchBanner.badge}</span>
            <span className="hidden sm:inline">→</span>
            <span className="text-center sm:text-left">{content.preLaunchBanner.message}</span>
          </div>
        </div>
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 bg-navy-950/95 backdrop-blur-md border-b border-steel-800/30">
        <nav className="max-w-6xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="inline-flex shrink-0" aria-label="aeroMatch inicio">
              <Logo size="md" />
            </Link>
            
            <div className="flex items-center gap-4">
              <LanguageSwitch />
              
              {isLoggedIn ? (
                <Link 
                  href="/dashboard" 
                  className="btn-cta group"
                >
                  {content.nav.dashboard}
                  <svg className="w-4 h-4 text-gold-500 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              ) : (
                <>
                  <Link
                    href="/auth"
                    className="btn-ghost hidden sm:inline-flex"
                  >
                    {content.nav.signIn}
                  </Link>
                  <Link 
                    href="/auth?mode=signup" 
                    className="btn-cta group"
                  >
                    {content.hero.ctaTechnician}
                  </Link>
                </>
              )}
            </div>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center">
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

        <div className="relative z-10 w-full max-w-6xl mx-auto px-6 lg:px-8 py-16">
          <div className="max-w-4xl mx-auto text-center">
            <div className="mb-12 flex w-full justify-center overflow-visible pt-2 sm:pt-4 -translate-x-3">
              <div className="inline-flex shrink-0 overflow-visible [filter:drop-shadow(0_8px_28px_rgba(201,162,77,0.22))]">
                <LogoGoldA size={128} />
              </div>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl tracking-tight mb-6 leading-[1.15]">
              <span className="block text-white font-semibold mb-2">{content.hero.headline1}</span>
              <span className="block text-gold-400 font-bold">{content.hero.headline2}</span>
            </h1>

            <p className="max-w-2xl mx-auto text-lg sm:text-xl text-steel-300 mb-10 leading-relaxed">
              {content.hero.subheadline}
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Link href="/auth?mode=signup&role=technician" className="btn-primary-filled-lg group">
                {content.hero.ctaTechnician}
                <svg className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
              <button onClick={handleCompanyCta} className="btn-secondary-lg">
                {content.hero.ctaCompany}
              </button>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8 text-sm text-steel-400">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span>{content.trust.easa}</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span>{content.trust.gdpr}</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span>{content.trust.builtBy}</span>
              </div>
            </div>

            <p className="mt-6 text-sm text-steel-500">{content.pricingContext}</p>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <svg className="w-6 h-6 text-steel-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </div>
      </section>

      <div id="am-infographic">
        <InfographicMotion />
        <StorySection copy={landing.story} />
        <div className="sep" />
        <HowItWorks copy={landing.how} />
        <div className="sep" />
        <ShareProfile copy={landing.share} />
        <div className="sep" />
        <Ecosystem copy={landing.ecosystem} />
        <div className="sep" />
        <Stats copy={landing.stats} />
        <div className="sep" />
        <FinalCTA copy={landing.finalCta} />
      </div>

      {/* Footer — mismo logo que la barra superior + enlace Acerca de */}
      <footer className="py-8 border-t border-steel-800/30">
        <div className="max-w-6xl mx-auto px-6 lg:px-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-wrap items-center gap-4 sm:gap-6">
              <Link href="/" className="inline-flex shrink-0" aria-label="aeroMatch inicio">
                <Logo size="md" />
              </Link>
              <LanguageSwitch />
              <Link
                href="/about"
                className="inline-flex items-center justify-center rounded-lg border border-gold-500/50 bg-gold-500/5 px-4 py-2 text-sm font-semibold text-gold-400 transition-colors hover:border-gold-400 hover:bg-gold-500/10 hover:text-gold-300"
              >
                {content.footer.about}
              </Link>
            </div>
            <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-sm text-steel-500">
              <Link href="/privacy" className="hover:text-white transition-colors">
                {content.footer.privacy}
              </Link>
              <Link href="/terms" className="hover:text-white transition-colors">
                {content.footer.terms}
              </Link>
              <span>{content.footer.copyright}</span>
            </div>
          </div>
        </div>
      </footer>

      {/* Company Pre-Step Modal */}
      {showCompanyPrestep && FEATURE_FLAGS.ENABLE_COMPANY_PRESTEP && (
        <div 
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setShowCompanyPrestep(false)}
        >
          <div 
            className="bg-navy-900 border border-steel-700/50 rounded-2xl max-w-lg w-full p-8 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Icon */}
            <div className="w-16 h-16 rounded-full bg-gold-500/10 border border-gold-500/30 flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-gold-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>

            <h3 className="text-2xl font-bold text-white text-center mb-2">
              {companyPrestep.title}
            </h3>
            <p className="text-steel-400 text-center mb-8">
              {companyPrestep.subtitle}
            </p>

            {/* Benefits */}
            <ul className="space-y-4 mb-8">
              {companyPrestep.benefits.map((benefit, idx) => (
                <li key={idx} className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-gold-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-steel-300">{benefit}</span>
                </li>
              ))}
            </ul>

            {/* Actions */}
            <div className="space-y-3">
              <Link
                href="/auth?mode=signup&role=company"
                className="btn-primary-filled w-full justify-center"
              >
                {companyPrestep.cta}
              </Link>
              <button
                onClick={() => setShowCompanyPrestep(false)}
                className="btn-ghost w-full justify-center text-steel-400"
              >
                {companyPrestep.back}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
