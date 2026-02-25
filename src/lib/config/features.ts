/**
 * Feature Flags Configuration
 * 
 * Toggle features on/off for safe rollouts and A/B testing.
 * All flags default to safe values for pre-launch phase.
 * 
 * IMPORTANT: Changes here can be reverted instantly.
 */

export const FEATURE_FLAGS = {
  /**
   * Show public counters (technicians/companies counts) on homepage
   * Set to false during pre-launch to avoid low numbers hurting conversion
   */
  SHOW_PUBLIC_COUNTERS: false,

  /**
   * Enable company pre-step landing before signup
   * Shows benefits/value prop before redirecting to auth
   */
  ENABLE_COMPANY_PRESTEP: true,

  /**
   * Hide pricing section and redirect /pricing
   * During pre-launch, we don't want to show prices
   */
  HIDE_PRICING: true,

  /**
   * Show testimonials section on homepage
   * Anonymous placeholder quotes
   */
  SHOW_TESTIMONIALS: true,

  /**
   * Show "Community in progress" messaging instead of counters
   */
  SHOW_COMMUNITY_BUILDING_MESSAGE: true,
} as const

/**
 * Pre-Launch Copy Configuration
 * 
 * Centralized messaging for the pre-launch phase.
 * Easy to update when transitioning to full launch.
 */
export const PRELAUNCH_COPY = {
  es: {
    banner: 'Pre-Launch: estamos incorporando perfiles verificados. Todos los perfiles que entran en esta fase tendrán beneficios cuando comiencen los planes de pago.',
    badge: '🚀 Pre-Lanzamiento',
    communityBuilding: 'Comunidad en construcción. Sé de los primeros en completar tu perfil.',
    ctaTechnician: 'Completar perfil técnico',
    ctaDocuments: 'Subir documentación',
    ctaAvailability: 'Marcar disponibilidad',
    pricingComingSoon: 'Los planes de pago se activarán pronto. Mientras tanto, completa tu perfil para asegurar beneficios de pre-lanzamiento.',
  },
  en: {
    banner: 'Pre-Launch: onboarding verified profiles. All profiles joining in this phase will receive benefits when paid plans begin.',
    badge: '🚀 Pre-Launch',
    communityBuilding: 'Community in progress. Be among the first to complete your profile.',
    ctaTechnician: 'Complete technician profile',
    ctaDocuments: 'Upload documentation',
    ctaAvailability: 'Set availability',
    pricingComingSoon: 'Paid plans will activate soon. Meanwhile, complete your profile to secure pre-launch benefits.',
  },
} as const

/**
 * Testimonials Configuration
 * 
 * Anonymous testimonials for social proof.
 * No fake names or fabricated numbers.
 */
export const TESTIMONIALS = {
  es: [
    {
      quote: 'Me parece una herramienta perfecta para aprovechar los días libres y vivir una experiencia diferente sin dejar tu puesto fijo. Tener el perfil preparado y la documentación organizada te permite reaccionar rápido si surge algo interesante, y además es una forma realista de ganar experiencia y generar ingresos extra.',
      role: 'José María — B1.1 A320/B737 — España',
      icon: '✈️',
    },
    {
      quote: 'Ahora es mucho más fácil tener todo preparado según mi disponibilidad. Desde la plataforma puedo organizar mi perfil y la documentación sin líos de correos ni archivos sueltos. Es cómodo y ordenado, que al final es lo que necesitamos.',
      role: 'Leo — B2 Aviónica — España',
      icon: '✈️',
    },
    {
      quote: 'Tener el perfil técnico preparado y la documentación organizada en un solo lugar me da tranquilidad. Si algún día surge una oportunidad interesante, sé que puedo reaccionar rápido sin empezar desde cero.',
      role: 'B1.1 — A320/B737 — España',
      icon: '✈️',
    },
    {
      quote: 'La posibilidad de ver técnicos disponibles por fechas y con documentación estructurada facilita mucho el proceso. Poder centralizar disponibilidad y requisitos técnicos en una sola plataforma tiene sentido para proyectos puntuales.',
      role: 'MRO Maintenance Manager — EU',
      icon: '🏢',
    },
  ],
  en: [
    {
      quote: 'It seems like a perfect tool to make the most of days off and have a different experience without leaving your permanent position. Having your profile ready and documentation organized allows you to react quickly if something interesting comes up, plus it\'s a realistic way to gain experience and generate extra income.',
      role: 'José María — B1.1 A320/B737 — Spain',
      icon: '✈️',
    },
    {
      quote: 'It\'s now much easier to have everything ready according to my availability. From the platform I can organize my profile and documentation without email chaos or scattered files. It\'s convenient and organized, which is what we ultimately need.',
      role: 'Leo — B2 Avionics — Spain',
      icon: '✈️',
    },
    {
      quote: 'Having my technical profile ready and documentation organized in one place gives me peace of mind. If an interesting opportunity ever comes up, I know I can react quickly without starting from scratch.',
      role: 'B1.1 — A320/B737 — Spain',
      icon: '✈️',
    },
    {
      quote: 'The ability to see available technicians by dates and with structured documentation makes the process much easier. Being able to centralize availability and technical requirements on a single platform makes sense for specific projects.',
      role: 'MRO Maintenance Manager — EU',
      icon: '🏢',
    },
  ],
} as const

/**
 * Verification Status Types
 */
export type VerificationStatus = 'unverified' | 'pending' | 'verified' | 'rejected'
export type AvailabilityStatus = 'hidden' | 'available_unverified' | 'available_verified'

/**
 * Verification Badge Labels
 */
export const VERIFICATION_BADGES = {
  es: {
    unverified: 'Sin verificar',
    pending: 'Pendiente de verificación',
    verified: 'Verificado AMX',
    rejected: 'Verificación rechazada',
  },
  en: {
    unverified: 'Unverified',
    pending: 'Verification pending',
    verified: 'AMX Verified',
    rejected: 'Verification rejected',
  },
} as const

/**
 * Company Pre-Step Content
 */
export const COMPANY_PRESTEP = {
  es: {
    title: 'Busca técnicos cualificados',
    subtitle: 'Accede a una red de profesionales verificados de aviación',
    benefits: [
      'Perfiles verificados con documentación comprobada',
      'Disponibilidad en tiempo real de técnicos activos',
      'Contacto directo sin intermediarios ni comisiones',
    ],
    cta: 'Crear cuenta de empresa',
    back: 'Volver',
  },
  en: {
    title: 'Find qualified technicians',
    subtitle: 'Access a network of verified aviation professionals',
    benefits: [
      'Verified profiles with checked documentation',
      'Real-time availability of active technicians',
      'Direct contact without middlemen or commissions',
    ],
    cta: 'Create company account',
    back: 'Back',
  },
} as const

