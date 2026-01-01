// ============================================
// AEROMATCH BILLING PLANS - SINGLE SOURCE OF TRUTH
// All plan definitions and Paddle price mappings
// ============================================

export type PlanRole = 'technician' | 'company'
export type PlanInterval = 'monthly' | 'yearly'

export interface Plan {
  key: string
  role: PlanRole
  name: {
    en: string
    es: string
  }
  description: {
    en: string
    es: string
  }
  price: number // in EUR
  interval: PlanInterval
  features: {
    en: string[]
    es: string[]
  }
  paddlePriceId: {
    sandbox: string
    production: string
  }
  popular?: boolean
}

// ============================================
// TECHNICIAN PLANS
// ============================================

export const TECHNICIAN_PLANS: Plan[] = [
  {
    key: 'TECH_MONTHLY',
    role: 'technician',
    name: {
      en: 'Premium Monthly',
      es: 'Premium Mensual',
    },
    description: {
      en: 'Full access to all premium features',
      es: 'Acceso completo a todas las funciones premium',
    },
    price: 3.99,
    interval: 'monthly',
    features: {
      en: [
        'Unlimited document verification',
        'Priority verification (24h)',
        'Advanced profile customization',
        '"Verified Premium" badge',
        'Priority support',
      ],
      es: [
        'Verificación de documentos ilimitada',
        'Verificación prioritaria (24h)',
        'Personalización avanzada de perfil',
        'Badge "Verificado Premium"',
        'Soporte prioritario',
      ],
    },
    paddlePriceId: {
      sandbox: 'pri_01kdp7a96zcn7ynzvmpj0720t0',
      production: 'pri_01kdp7a96zcn7ynzvmpj0720t0', // Update when going live
    },
    popular: true,
  },
  {
    key: 'TECH_YEARLY',
    role: 'technician',
    name: {
      en: 'Premium Yearly',
      es: 'Premium Anual',
    },
    description: {
      en: 'Save 20% with annual billing',
      es: 'Ahorra 20% con facturación anual',
    },
    price: 38.30, // ~20% discount
    interval: 'yearly',
    features: {
      en: [
        'Everything in monthly +',
        '2 months free',
        'Priority listing in searches',
      ],
      es: [
        'Todo lo del mensual +',
        '2 meses gratis',
        'Prioridad en búsquedas',
      ],
    },
    paddlePriceId: {
      sandbox: 'pri_01XXXXXXXXXXXXXXXXXXXXXX',
      production: 'pri_01YYYYYYYYYYYYYYYYYYYYYY',
    },
  },
]

// ============================================
// COMPANY PLANS
// ============================================

export const COMPANY_PLANS: Plan[] = [
  {
    key: 'COMP_STARTER',
    role: 'company',
    name: {
      en: 'Starter',
      es: 'Starter',
    },
    description: {
      en: 'Perfect for small teams',
      es: 'Perfecto para equipos pequeños',
    },
    price: 49.99,
    interval: 'monthly',
    features: {
      en: [
        'Up to 5 contacts/month',
        'Basic search',
        'Basic company profile',
      ],
      es: [
        'Hasta 5 contactos/mes',
        'Búsqueda básica',
        'Perfil de empresa básico',
      ],
    },
    paddlePriceId: {
      sandbox: 'pri_01XXXXXXXXXXXXXXXXXXXXXX',
      production: 'pri_01YYYYYYYYYYYYYYYYYYYYYY',
    },
  },
  {
    key: 'COMP_PROFESSIONAL',
    role: 'company',
    name: {
      en: 'Professional',
      es: 'Professional',
    },
    description: {
      en: 'Most popular for growing companies',
      es: 'El más popular para empresas en crecimiento',
    },
    price: 139.99,
    interval: 'monthly',
    features: {
      en: [
        'Up to 20 contacts/month',
        'Advanced filters',
        'Featured profile',
        'Priority support',
      ],
      es: [
        'Hasta 20 contactos/mes',
        'Filtros avanzados',
        'Perfil destacado',
        'Soporte prioritario',
      ],
    },
    paddlePriceId: {
      sandbox: 'pri_01XXXXXXXXXXXXXXXXXXXXXX',
      production: 'pri_01YYYYYYYYYYYYYYYYYYYYYY',
    },
    popular: true,
  },
  {
    key: 'COMP_ENTERPRISE',
    role: 'company',
    name: {
      en: 'Enterprise',
      es: 'Enterprise',
    },
    description: {
      en: 'Unlimited access for large operations',
      es: 'Acceso ilimitado para grandes operaciones',
    },
    price: 199.99,
    interval: 'monthly',
    features: {
      en: [
        'Unlimited contacts',
        'API access',
        'Dedicated account manager',
        'Personalized onboarding',
      ],
      es: [
        'Contactos ilimitados',
        'Acceso API',
        'Gestor de cuenta dedicado',
        'Onboarding personalizado',
      ],
    },
    paddlePriceId: {
      sandbox: 'pri_01XXXXXXXXXXXXXXXXXXXXXX',
      production: 'pri_01YYYYYYYYYYYYYYYYYYYYYY',
    },
  },
]

// ============================================
// HELPERS
// ============================================

export const ALL_PLANS = [...TECHNICIAN_PLANS, ...COMPANY_PLANS]

export function getPlanByKey(key: string): Plan | undefined {
  return ALL_PLANS.find(p => p.key === key)
}

export function getPlansByRole(role: PlanRole): Plan[] {
  return ALL_PLANS.filter(p => p.role === role)
}

export function getPaddlePriceId(planKey: string): string | null {
  const plan = getPlanByKey(planKey)
  if (!plan) return null
  
  const env = process.env.PADDLE_ENV || process.env.NEXT_PUBLIC_PADDLE_ENV || 'sandbox'
  return env === 'production' 
    ? plan.paddlePriceId.production 
    : plan.paddlePriceId.sandbox
}

export function getPlanByPaddlePriceId(priceId: string): Plan | undefined {
  const env = process.env.PADDLE_ENV || 'sandbox'
  return ALL_PLANS.find(p => 
    env === 'production' 
      ? p.paddlePriceId.production === priceId
      : p.paddlePriceId.sandbox === priceId
  )
}

// Format price for display
export function formatPrice(price: number, interval: PlanInterval, language: 'en' | 'es' = 'en'): string {
  const formatted = price.toFixed(2).replace('.', ',')
  const suffix = interval === 'monthly' 
    ? (language === 'es' ? '/mes' : '/mo')
    : (language === 'es' ? '/año' : '/yr')
  return `€${formatted}${suffix}`
}

