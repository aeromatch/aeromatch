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
    banner: 'Pre-Launch: estamos incorporando perfiles verificados. Activaremos planes cuando haya masa crítica. Los early adopters tendrán beneficios cuando se activen.',
    badge: '🚀 Pre-Lanzamiento',
    communityBuilding: 'Comunidad en construcción. Sé de los primeros en completar tu perfil.',
    ctaTechnician: 'Completar perfil técnico',
    ctaDocuments: 'Subir documentación',
    ctaAvailability: 'Marcar disponibilidad',
    pricingComingSoon: 'Los planes de pago se activarán pronto. Mientras tanto, completa tu perfil para asegurar beneficios de early adopter.',
  },
  en: {
    banner: 'Pre-Launch: onboarding verified profiles. Plans activate once the network reaches operational scale. Early adopters will receive benefits when plans go live.',
    badge: '🚀 Pre-Launch',
    communityBuilding: 'Community in progress. Be among the first to complete your profile.',
    ctaTechnician: 'Complete technician profile',
    ctaDocuments: 'Upload documentation',
    ctaAvailability: 'Set availability',
    pricingComingSoon: 'Paid plans will activate soon. Meanwhile, complete your profile to secure early adopter benefits.',
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
      quote: 'Por fin una plataforma donde las empresas me contactan directamente. Sin intermediarios, sin esperar semanas.',
      role: 'Técnico B1 (España)',
      icon: '✈️',
    },
    {
      quote: 'Buscábamos técnicos cualificados urgentemente. En AeroMatch encontramos perfiles verificados y disponibles al instante.',
      role: 'Recruiter MRO (EU)',
      icon: '🏢',
    },
  ],
  en: [
    {
      quote: 'Finally a platform where companies contact me directly. No middlemen, no waiting weeks.',
      role: 'B1 Technician (Spain)',
      icon: '✈️',
    },
    {
      quote: 'We urgently needed qualified technicians. On AeroMatch we found verified and instantly available profiles.',
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

