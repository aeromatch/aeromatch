'use client'

import { useState } from 'react'
import { UmbrellaPartner } from '@/lib/matching/umbrellaPartners'
import { useLanguage } from '@/lib/i18n/LanguageContext'

interface UmbrellaPartnersSuggestionProps {
  partners: UmbrellaPartner[]
  legend: string
}

export function UmbrellaPartnersSuggestion({ partners, legend }: UmbrellaPartnersSuggestionProps) {
  const [expanded, setExpanded] = useState(false)
  const { language } = useLanguage()

  if (partners.length === 0) return null

  const labels = {
    viewOptions: language === 'es' ? 'Ver opciones visa/EOR' : 'View visa/EOR options',
    hideOptions: language === 'es' ? 'Ocultar opciones' : 'Hide options',
    partnersTitle: language === 'es' ? 'Visa/EOR Partners (opcional)' : 'Visa/EOR Partners (optional)',
    contact: language === 'es' ? 'Contactar' : 'Contact',
  }

  return (
    <div className="mt-3">
      {/* Legend pill */}
      <div className="flex items-center gap-2 mb-2">
        <span className="chip-warning text-xs">CONDITIONAL</span>
        <span className="text-xs text-steel-400">{legend}</span>
      </div>

      {/* Expand button */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="text-xs text-gold-400 hover:text-gold-300 flex items-center gap-1 transition-colors"
      >
        {expanded ? labels.hideOptions : labels.viewOptions}
        <svg 
          className={`w-3 h-3 transition-transform ${expanded ? 'rotate-180' : ''}`} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Partners list */}
      {expanded && (
        <div className="mt-3 p-3 bg-navy-800/50 rounded-lg border border-steel-700/30">
          <p className="text-xs text-steel-400 mb-3">{labels.partnersTitle}</p>
          <div className="space-y-2">
            {partners.map((partner) => (
              <div 
                key={partner.id}
                className="flex items-center justify-between p-2 bg-navy-900/50 rounded-lg"
              >
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-gold-500/10 flex items-center justify-center">
                    <span className="text-sm">🏢</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">{partner.name}</p>
                    <p className="text-xs text-steel-500">{partner.contactEmail}</p>
                  </div>
                </div>
                <a
                  href={`mailto:${partner.contactEmail}`}
                  className="text-xs text-gold-400 hover:text-gold-300 px-2 py-1 rounded border border-gold-500/30 hover:border-gold-500/50 transition-colors"
                >
                  {labels.contact}
                </a>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

/**
 * Match status badge component
 */
export function MatchStatusBadge({ status }: { status: 'DIRECT' | 'CONDITIONAL' }) {
  if (status === 'DIRECT') {
    return (
      <span className="chip-success text-xs">DIRECT</span>
    )
  }
  
  return (
    <span className="chip-warning text-xs">CONDITIONAL</span>
  )
}

