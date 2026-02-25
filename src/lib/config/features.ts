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
      quote: 'Me gusta porque solo me contactan cuando marco disponibilidad. Tengo la documentación organizada y a disposición de la empresa que me solicite, y el tema de las umbrellas me da tranquilidad si sale algo fuera.',
      role: 'Técnico B1 (España)',
      icon: '✈️',
    },
    {
      quote: 'Nos facilita encontrar técnicos disponibles en fechas concretas sin empezar el proceso desde cero. La documentación organizada y el filtro por disponibilidad nos ahorra tiempo en cada proyecto.',
      role: 'Recruiter MRO (EU)',
      icon: '🏢',
    },
  ],
  en: [
    {
      quote: 'I like it because I only get contacted when I mark availability. My documentation is organized and ready for any company that requests it, and the umbrella options give me peace of mind for jobs abroad.',
      role: 'B1 Technician (Spain)',
      icon: '✈️',
    },
    {
      quote: 'It helps us find available technicians for specific dates without starting from scratch. Organized documentation and availability filters save us time on every project.',
      role: 'MRO Recruiter (EU)',
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

