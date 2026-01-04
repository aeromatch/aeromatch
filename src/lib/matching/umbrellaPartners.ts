// Umbrella Partners matching logic
// Based on existing partner table with visa/EOR capabilities

export interface UmbrellaPartner {
  id: string
  name: string
  contactEmail: string
  countries: string[]
  hasInsuranceCoverage: boolean
  canSponsorVisaUK: boolean
  website?: string
}

// Partner data from existing table
export const UMBRELLA_PARTNERS: UmbrellaPartner[] = [
  {
    id: 'deel',
    name: 'Deel',
    contactEmail: 'support@deel.com',
    countries: ['UK', 'ES', 'FR', 'DE', 'IT', 'PT', 'NL', 'BE', 'IE', 'CH', 'PL', 'CZ', 'AT', 'SE', 'NO', 'DK', 'FI', 'GR', 'RO'],
    hasInsuranceCoverage: true,
    canSponsorVisaUK: true,
    website: 'https://www.deel.com'
  },
  {
    id: 'remote',
    name: 'Remote.com',
    contactEmail: 'hello@remote.com',
    countries: ['UK', 'ES', 'FR', 'DE', 'IT', 'PT', 'NL', 'BE', 'IE', 'CH', 'PL', 'CZ', 'AT', 'SE', 'NO', 'DK', 'FI', 'GR', 'RO'],
    hasInsuranceCoverage: true,
    canSponsorVisaUK: true,
    website: 'https://www.remote.com'
  },
  {
    id: 'oyster',
    name: 'Oyster HR',
    contactEmail: 'hello@oysterhr.com',
    countries: ['UK', 'ES', 'FR', 'DE', 'IT', 'PT', 'NL', 'BE', 'IE', 'CH', 'PL', 'CZ', 'AT', 'SE', 'NO', 'DK', 'FI', 'GR', 'RO'],
    hasInsuranceCoverage: true,
    canSponsorVisaUK: true,
    website: 'https://www.oysterhr.com'
  },
  {
    id: 'giant',
    name: 'Giant Group',
    contactEmail: 'info@giantgroup.com',
    countries: ['UK'],
    hasInsuranceCoverage: true,
    canSponsorVisaUK: false,
    website: 'https://www.giantgroup.com'
  },
  {
    id: 'umbrella_uk',
    name: 'Umbrella Company UK',
    contactEmail: 'info@umbrellacompany.co.uk',
    countries: ['UK'],
    hasInsuranceCoverage: true,
    canSponsorVisaUK: false,
    website: 'https://www.umbrellacompany.co.uk'
  },
  {
    id: 'parasol',
    name: 'Parasol Group',
    contactEmail: 'enquiries@parasol.co.uk',
    countries: ['UK'],
    hasInsuranceCoverage: true,
    canSponsorVisaUK: false,
    website: 'https://www.parasolgroup.co.uk'
  },
  {
    id: 'payfit',
    name: 'PayFit',
    contactEmail: 'contact@payfit.com',
    countries: ['UK', 'ES', 'FR', 'DE'],
    hasInsuranceCoverage: false,
    canSponsorVisaUK: false,
    website: 'https://www.payfit.com'
  },
  {
    id: 'papaya',
    name: 'Papaya Global',
    contactEmail: 'info@papayaglobal.com',
    countries: ['UK', 'ES', 'FR', 'DE', 'IT', 'NL', 'IE'],
    hasInsuranceCoverage: true,
    canSponsorVisaUK: false, // limited/depends - treat as false for UK visa
    website: 'https://www.papayaglobal.com'
  },
  {
    id: 'velocity',
    name: 'Velocity Global',
    contactEmail: 'info@velocityglobal.com',
    countries: ['UK', 'ES', 'FR', 'DE', 'IT', 'NL', 'IE', 'CH'],
    hasInsuranceCoverage: true,
    canSponsorVisaUK: false, // limited/depends - treat as false for UK visa
    website: 'https://www.velocityglobal.com'
  }
]

export type MatchStatus = 'DIRECT' | 'CONDITIONAL'

export interface MatchEvaluation {
  status: MatchStatus
  legend: string
}

export interface Candidate {
  hasRightToWorkUK: boolean
}

export interface Job {
  country: string
  requiresRightToWork: boolean
}

/**
 * Evaluates match status based on candidate and job requirements
 */
export function evaluateMatchStatus(candidate: Candidate, job: Job): MatchEvaluation {
  // Country ≠ UK: no RTW evaluation needed
  if (job.country !== 'UK') {
    return {
      status: 'DIRECT',
      legend: ''
    }
  }

  // UK job but doesn't require Right to Work
  if (!job.requiresRightToWork) {
    return {
      status: 'DIRECT',
      legend: ''
    }
  }

  // UK job requires RTW and candidate has it
  if (candidate.hasRightToWorkUK) {
    return {
      status: 'DIRECT',
      legend: ''
    }
  }

  // UK job requires RTW but candidate doesn't have it
  return {
    status: 'CONDITIONAL',
    legend: 'Requires Right to Work UK (visa/EOR option available)'
  }
}

/**
 * Gets suggested umbrella partners for a conditional match
 * Only returns partners that can sponsor UK visa when needed
 */
export function getSuggestedPartners(candidate: Candidate, job: Job): UmbrellaPartner[] {
  // Only suggest partners for UK jobs where RTW is required but candidate lacks it
  if (job.country !== 'UK') return []
  if (!job.requiresRightToWork) return []
  if (candidate.hasRightToWorkUK) return []

  // Return only partners that can sponsor UK visa
  // Order: Deel, Remote.com, Oyster HR
  return UMBRELLA_PARTNERS
    .filter(p => p.canSponsorVisaUK)
    .sort((a, b) => {
      const order = ['deel', 'remote', 'oyster']
      return order.indexOf(a.id) - order.indexOf(b.id)
    })
}

/**
 * Gets all partners available for a specific country
 */
export function getPartnersForCountry(country: string): UmbrellaPartner[] {
  return UMBRELLA_PARTNERS.filter(p => p.countries.includes(country))
}

