'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Logo } from '@/components/ui/Logo'
import { useLanguage, LanguageSwitch } from '@/lib/i18n/LanguageContext'

interface HomePageProps {
  isLoggedIn: boolean
}

export function HomePage({ isLoggedIn }: HomePageProps) {
  const { language } = useLanguage()
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  // All labels with ES/EN
  const content = {
    // Early Access Banner
    earlyAccess: {
      badge: language === 'es' ? '🎁 Oferta Lanzamiento' : '🎁 Launch Offer',
      benefit: language === 'es' ? 'Premium 12 meses GRATIS por perfil completo antes del 20 de enero (perfil técnico + documentos + disponibilidad)' : 'FREE 12 months Premium for complete profile before January 20 (technician profile + documents + availability)',
      counter: language === 'es' ? '24 técnicos ya registrados' : '24 technicians already registered',
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
      ctaTechnician: language === 'es' ? 'Crear mi perfil gratis →' : 'Create my free profile →',
      ctaCompany: language === 'es' ? 'Buscar técnicos ahora →' : 'Search technicians now →',
    },
    // Trust Badges
    trust: {
      easa: language === 'es' ? 'Plataforma según normativa EASA Part-145' : 'Platform following EASA Part-145',
      gdpr: language === 'es' ? 'Datos protegidos bajo GDPR' : 'Data protected under GDPR',
      builtBy: language === 'es' ? 'Built by técnicos aeronáuticos activos' : 'Built by active aircraft technicians',
    },
    // Social Proof
    socialProof: {
      title: language === 'es' ? 'La comunidad crece' : 'The community grows',
      technicians: language === 'es' ? 'técnicos aeronáuticos registrados' : 'registered aircraft technicians',
      profileComplete: language === 'es' ? 'con perfil completado' : 'with completed profile',
      companies: language === 'es' ? 'empresas registradas' : 'registered companies',
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
          title: language === 'es' ? 'Define disponibilidad' : 'Set availability',
          desc: language === 'es' ? 'Cuándo estás libre' : 'When you\'re available',
        },
        {
          num: '3',
          title: language === 'es' ? 'Recibe contactos' : 'Receive contacts',
          desc: language === 'es' ? 'Empresas te escriben directamente' : 'Companies reach out directly',
        },
        {
          num: '4',
          title: language === 'es' ? 'Tú decides' : 'You decide',
          desc: language === 'es' ? 'Aceptas o rechazas según te convenga' : 'Accept or decline as suits you',
        },
      ],
      companySteps: [
        {
          num: '1',
          title: language === 'es' ? 'Publica tu necesidad' : 'Post your need',
          desc: language === 'es' ? 'Tipo de técnico + Fechas' : 'Technician type + Dates',
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
    // Pricing
    pricing: {
      title: language === 'es' ? 'Precios transparentes' : 'Transparent pricing',
      subtitle: language === 'es' ? 'Sin sorpresas. Sin comisiones ocultas.' : 'No surprises. No hidden fees.',
      forTechnicians: language === 'es' ? 'Para Técnicos' : 'For Technicians',
      forCompanies: language === 'es' ? 'Para Empresas' : 'For Companies',
      free: language === 'es' ? 'GRATIS' : 'FREE',
      month: language === 'es' ? '/mes' : '/month',
      mostPopular: language === 'es' ? 'Más popular' : 'Most popular',
      techPlans: {
        basic: {
          name: language === 'es' ? 'Plan Básico' : 'Basic Plan',
          price: language === 'es' ? 'GRATIS' : 'FREE',
          features: language === 'es' 
            ? ['Perfil completo', '10 documentos verificados', 'Búsquedas ilimitadas', 'Contacto directo con empresas']
            : ['Complete profile', '10 verified documents', 'Unlimited searches', 'Direct contact with companies'],
        },
        premium: {
          name: language === 'es' ? 'Plan Premium' : 'Premium Plan',
          price: '3,99€',
          features: language === 'es'
            ? ['Todo lo de básico +', 'Documentos ilimitados', 'Verificación prioritaria (24h)', 'Personalización avanzada', 'Badge "Verificado Premium"', 'Soporte prioritario']
            : ['Everything in basic +', 'Unlimited documents', 'Priority verification (24h)', 'Advanced customization', '"Verified Premium" badge', 'Priority support'],
        },
      },
      companyPlans: [
        {
          name: 'Starter',
          price: '49,99€',
          features: language === 'es'
            ? ['Hasta 5 contactos/mes', 'Búsqueda básica', 'Perfil de empresa básico']
            : ['Up to 5 contacts/month', 'Basic search', 'Basic company profile'],
        },
        {
          name: 'Professional',
          price: '139,99€',
          popular: true,
          features: language === 'es'
            ? ['Hasta 20 contactos/mes', 'Filtros avanzados', 'Perfil destacado', 'Soporte prioritario']
            : ['Up to 20 contacts/month', 'Advanced filters', 'Featured profile', 'Priority support'],
        },
        {
          name: 'Enterprise',
          price: '199,99€',
          features: language === 'es'
            ? ['Contactos ilimitados', 'API access', 'Gestor de cuenta dedicado', 'Onboarding personalizado']
            : ['Unlimited contacts', 'API access', 'Dedicated account manager', 'Personalized onboarding'],
        },
      ],
      freeLimit: language === 'es' 
        ? 'Sin plan de pago: máximo 5 contrataciones totales (lifetime limit)'
        : 'Without paid plan: maximum 5 total hires (lifetime limit)',
    },
    // FAQ
    faq: {
      title: language === 'es' ? 'Preguntas frecuentes' : 'Frequently asked questions',
      items: [
        {
          q: language === 'es' ? '¿Cuánto cuesta?' : 'How much does it cost?',
          a: language === 'es'
            ? 'Técnicos: Gratis (perfil + 10 primeros documentos). Premium opcional: 3,99€/mes. Empresas: Desde 49,99€/mes según necesidades.'
            : 'Technicians: Free (profile + first 10 documents). Optional premium: €3.99/month. Companies: From €49.99/month depending on needs.',
        },
        {
          q: language === 'es' ? '¿Cómo verificáis las licencias?' : 'How do you verify licenses?',
          a: language === 'es'
            ? 'Revisamos manualmente cada documento subido contra las bases de datos oficiales de EASA/FAA/UK CAA. Los documentos verificados muestran un badge verde en el perfil.'
            : 'We manually review each uploaded document against official EASA/FAA/UK CAA databases. Verified documents show a green badge on the profile.',
        },
        {
          q: language === 'es' ? '¿Sois una agencia de colocación?' : 'Are you a recruitment agency?',
          a: language === 'es'
            ? 'NO. Somos una plataforma de conexión directa. Vosotros negociáis contratos y condiciones directamente. Sin comisiones sobre contratos.'
            : 'NO. We are a direct connection platform. You negotiate contracts and conditions directly. No commissions on contracts.',
        },
        {
          q: language === 'es' ? '¿Qué pasa si no encuentro trabajo/técnicos?' : 'What if I don\'t find work/technicians?',
          a: language === 'es'
            ? 'Puedes estar registrado sin coste hasta que encuentres match. Solo pagas por funcionalidades premium.'
            : 'You can stay registered at no cost until you find a match. You only pay for premium features.',
        },
        {
          q: language === 'es' ? '¿Qué incluye la oferta de lanzamiento?' : 'What does the launch offer include?',
          a: language === 'es'
            ? 'Perfil completo antes del 20 enero → 12 meses de Premium GRATIS (valor 47,88€). Incluye documentos ilimitados, verificación prioritaria y badge Premium.'
            : 'Complete profile before January 20 → 12 months of FREE Premium (value €47.88). Includes unlimited documents, priority verification and Premium badge.',
        },
      ],
    },
    // CTA Final
    cta: {
      title: language === 'es' ? '¿Listo para conectar?' : 'Ready to connect?',
      subtitle: language === 'es' 
        ? 'Únete a la comunidad de profesionales que ya usan AeroMatch.'
        : 'Join the community of professionals already using AeroMatch.',
    },
    // Footer
    footer: {
      privacy: language === 'es' ? 'Privacidad' : 'Privacy',
      terms: language === 'es' ? 'Términos' : 'Terms',
      copyright: '© 2025 AeroMatch. All rights reserved.',
    },
  }

  return (
    <div className="min-h-screen bg-navy-950">
      {/* Early Access Banner */}
      <div className="bg-gradient-to-r from-gold-600 to-gold-500 text-navy-950">
        <div className="max-w-6xl mx-auto px-4 py-2.5">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 text-sm font-medium">
            <span className="font-bold">{content.earlyAccess.badge}</span>
            <span className="hidden sm:inline">→</span>
            <span>{content.earlyAccess.benefit}</span>
            <span className="hidden md:inline text-navy-950/70">|</span>
            <span className="hidden md:inline text-navy-950/90">{content.earlyAccess.counter}</span>
          </div>
        </div>
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 bg-navy-950/95 backdrop-blur-md border-b border-steel-800/30">
        <nav className="max-w-6xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Logo size="md" />
            
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
            {/* Logo */}
            <div className="flex justify-center mb-12">
              <Logo size="hero" />
            </div>

            {/* Main headline */}
            <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl tracking-tight mb-6 leading-[1.15]">
              <span className="block text-white font-semibold mb-2">{content.hero.headline1}</span>
              <span className="block text-gold-400 font-bold">{content.hero.headline2}</span>
            </h1>

            {/* Subheadline */}
            <p className="max-w-2xl mx-auto text-lg sm:text-xl text-steel-300 mb-10 leading-relaxed">
              {content.hero.subheadline}
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Link
                href="/auth?mode=signup&role=technician"
                className="btn-primary-filled-lg group"
              >
                {content.hero.ctaTechnician}
              </Link>
              <Link
                href="/auth?mode=signup&role=company"
                className="btn-secondary-lg"
              >
                {content.hero.ctaCompany}
              </Link>
            </div>

            {/* Trust Badges */}
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
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <svg className="w-6 h-6 text-steel-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </div>
      </section>

      {/* Social Proof Section */}
      <section className="py-16 bg-navy-900/50 border-y border-steel-800/30">
        <div className="max-w-6xl mx-auto px-6 lg:px-8">
          <h2 className="text-center text-sm font-semibold text-steel-500 uppercase tracking-wider mb-10">
            {content.socialProof.title}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
            <div className="text-center">
              <div className="text-4xl sm:text-5xl font-bold text-gold-400 mb-2">24</div>
              <div className="text-steel-400">{content.socialProof.technicians}</div>
            </div>
            <div className="text-center">
              <div className="text-4xl sm:text-5xl font-bold text-gold-400 mb-2">5</div>
              <div className="text-steel-400">{content.socialProof.profileComplete}</div>
            </div>
            <div className="text-center">
              <div className="text-4xl sm:text-5xl font-bold text-gold-400 mb-2">2</div>
              <div className="text-steel-400">{content.socialProof.companies}</div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-24">
        <div className="max-w-6xl mx-auto px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl font-bold text-white text-center mb-16">
            {content.howItWorks.title}
          </h2>

          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16">
            {/* For Technicians */}
            <div>
              <h3 className="text-xl font-semibold text-gold-400 mb-8 flex items-center gap-3">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                {content.howItWorks.forTechnicians}
              </h3>
              <div className="space-y-6">
                {content.howItWorks.techSteps.map((step, idx) => (
                  <div key={idx} className="flex gap-4">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gold-500/20 border border-gold-500/40 flex items-center justify-center text-gold-400 font-bold">
                      {step.num}
                    </div>
                    <div>
                      <h4 className="text-white font-medium mb-1">{step.title}</h4>
                      <p className="text-steel-400 text-sm">{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              <Link
                href="/auth?mode=signup&role=technician"
                className="inline-flex items-center gap-2 mt-8 text-gold-400 hover:text-gold-300 font-medium transition-colors"
              >
                {content.hero.ctaTechnician}
              </Link>
            </div>

            {/* For Companies */}
            <div>
              <h3 className="text-xl font-semibold text-gold-400 mb-8 flex items-center gap-3">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                {content.howItWorks.forCompanies}
              </h3>
              <div className="space-y-6">
                {content.howItWorks.companySteps.map((step, idx) => (
                  <div key={idx} className="flex gap-4">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gold-500/20 border border-gold-500/40 flex items-center justify-center text-gold-400 font-bold">
                      {step.num}
                    </div>
                    <div>
                      <h4 className="text-white font-medium mb-1">{step.title}</h4>
                      <p className="text-steel-400 text-sm">{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              <Link
                href="/auth?mode=signup&role=company"
                className="inline-flex items-center gap-2 mt-8 text-gold-400 hover:text-gold-300 font-medium transition-colors"
              >
                {content.hero.ctaCompany}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Why AeroMatch - Storytelling */}
      <section className="py-24 bg-navy-900/30">
        <div className="max-w-3xl mx-auto px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl font-bold text-white text-center mb-12">
            {content.whyAeroMatch.title}
          </h2>
          
          <div className="relative">
            {/* Quote mark */}
            <svg className="absolute -top-4 -left-4 w-12 h-12 text-gold-500/20" fill="currentColor" viewBox="0 0 24 24">
              <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
            </svg>
            
            <div className="bg-navy-800/50 border border-steel-700/30 rounded-2xl p-8 sm:p-10">
              <div className="prose prose-invert max-w-none">
                {content.whyAeroMatch.story.split('\n\n').map((paragraph, idx) => (
                  <p key={idx} className="text-steel-300 leading-relaxed mb-4 last:mb-0">
                    {paragraph}
                  </p>
                ))}
              </div>
              
              <div className="mt-8 pt-6 border-t border-steel-700/30">
                <p className="text-gold-400 font-semibold italic">
                  {content.whyAeroMatch.signature}
                </p>
                <p className="text-steel-500 text-sm mt-1">— Raúl, Founder</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-24">
        <div className="max-w-6xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              {content.pricing.title}
            </h2>
            <p className="text-steel-400 text-lg">
              {content.pricing.subtitle}
            </p>
          </div>

          {/* Technician Pricing */}
          <div className="mb-16">
            <h3 className="text-xl font-semibold text-gold-400 mb-8 text-center">
              {content.pricing.forTechnicians}
            </h3>
            <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
              {/* Basic Plan */}
              <div className="bg-navy-800/50 border border-steel-700/30 rounded-2xl p-6">
                <h4 className="text-lg font-semibold text-white mb-2">{content.pricing.techPlans.basic.name}</h4>
                <div className="text-3xl font-bold text-gold-400 mb-6">{content.pricing.techPlans.basic.price}</div>
                <ul className="space-y-3">
                  {content.pricing.techPlans.basic.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-3 text-steel-300">
                      <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      {feature}
                    </li>
                  ))}
                </ul>
                <Link href="/auth?mode=signup&role=technician" className="btn-secondary w-full mt-6 justify-center">
                  {content.hero.ctaTechnician}
                </Link>
              </div>

              {/* Premium Plan */}
              <div className="bg-gradient-to-b from-gold-500/10 to-transparent border border-gold-500/30 rounded-2xl p-6 relative">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gold-500 text-navy-950 text-xs font-bold px-3 py-1 rounded-full">
                  {content.pricing.mostPopular}
                </div>
                <h4 className="text-lg font-semibold text-white mb-2">{content.pricing.techPlans.premium.name}</h4>
                <div className="text-3xl font-bold text-gold-400 mb-6">
                  {content.pricing.techPlans.premium.price}
                  <span className="text-base font-normal text-steel-400">{content.pricing.month}</span>
                </div>
                <ul className="space-y-3">
                  {content.pricing.techPlans.premium.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-3 text-steel-300">
                      <svg className="w-5 h-5 text-gold-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      {feature}
                    </li>
                  ))}
                </ul>
                <Link href="/auth?mode=signup&role=technician" className="btn-primary-filled w-full mt-6 justify-center">
                  {content.hero.ctaTechnician}
                </Link>
              </div>
            </div>
          </div>

          {/* Company Pricing */}
          <div>
            <h3 className="text-xl font-semibold text-gold-400 mb-8 text-center">
              {content.pricing.forCompanies}
            </h3>
            <div className="grid md:grid-cols-3 gap-6">
              {content.pricing.companyPlans.map((plan, idx) => (
                <div 
                  key={idx} 
                  className={`rounded-2xl p-6 relative ${
                    plan.popular 
                      ? 'bg-gradient-to-b from-gold-500/10 to-transparent border border-gold-500/30' 
                      : 'bg-navy-800/50 border border-steel-700/30'
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gold-500 text-navy-950 text-xs font-bold px-3 py-1 rounded-full">
                      {content.pricing.mostPopular}
                    </div>
                  )}
                  <h4 className="text-lg font-semibold text-white mb-2">{plan.name}</h4>
                  <div className="text-3xl font-bold text-gold-400 mb-6">
                    {plan.price}
                    <span className="text-base font-normal text-steel-400">{content.pricing.month}</span>
                  </div>
                  <ul className="space-y-3">
                    {plan.features.map((feature, fidx) => (
                      <li key={fidx} className="flex items-start gap-3 text-steel-300">
                        <svg className={`w-5 h-5 flex-shrink-0 mt-0.5 ${plan.popular ? 'text-gold-500' : 'text-green-500'}`} fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Link 
                    href="/auth?mode=signup&role=company" 
                    className={`w-full mt-6 justify-center ${plan.popular ? 'btn-primary-filled' : 'btn-secondary'}`}
                  >
                    {content.hero.ctaCompany}
                  </Link>
                </div>
              ))}
            </div>
            <p className="text-center text-steel-500 text-sm mt-6">
              {content.pricing.freeLimit}
            </p>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-24 bg-navy-900/30">
        <div className="max-w-3xl mx-auto px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl font-bold text-white text-center mb-12">
            {content.faq.title}
          </h2>
          
          <div className="space-y-4">
            {content.faq.items.map((item, idx) => (
              <div 
                key={idx}
                className="bg-navy-800/50 border border-steel-700/30 rounded-xl overflow-hidden"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="w-full px-6 py-4 text-left flex items-center justify-between gap-4 hover:bg-navy-800/70 transition-colors"
                >
                  <span className="font-medium text-white">{item.q}</span>
                  <svg 
                    className={`w-5 h-5 text-gold-500 flex-shrink-0 transition-transform ${openFaq === idx ? 'rotate-180' : ''}`} 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {openFaq === idx && (
                  <div className="px-6 pb-4">
                    <p className="text-steel-300 leading-relaxed">{item.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24">
        <div className="max-w-4xl mx-auto px-6 lg:px-8">
          <div className="cta-card text-center">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-4">
              {content.cta.title}
            </h2>
            <p className="max-w-xl mx-auto text-steel-300 mb-8">
              {content.cta.subtitle}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/auth?mode=signup&role=technician"
                className="btn-primary-filled-lg"
              >
                {content.hero.ctaTechnician}
              </Link>
              <Link
                href="/auth?mode=signup&role=company"
                className="btn-secondary-lg"
              >
                {content.hero.ctaCompany}
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
              <a href="#" className="hover:text-white transition-colors">{content.footer.privacy}</a>
              <a href="#" className="hover:text-white transition-colors">{content.footer.terms}</a>
              <span>{content.footer.copyright}</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
