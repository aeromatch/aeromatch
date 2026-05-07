'use client'

import { useState, useEffect } from 'react'
import { useLanguage } from '@/lib/i18n/LanguageContext'

interface AMXSummary {
  amxId: string
  generatedAt: string
  verificationStatus: string
  availabilityStatus: string
  verifiedAt: string | null
  isVerified: boolean
  licenses: string[]
  aircraftTypes: string[]
  specialties: string[]
  languages: string[]
  yearsExperience: number | null
  contractPreference: string
  ownTools: boolean
  rightToWorkUk: boolean
  ukLicense: boolean
  verificationChecklist: {
    license: {
      status: 'verified' | 'pending' | 'missing'
      label: string
    }
    aircraftRatings: {
      aircraft: string
      theory: string
      practical: string
    }[]
    documentsTotal: number
    documentsVerified: number
    documentsPending: number
  }
}

interface AMXSummaryModalProps {
  isOpen: boolean
  onClose: () => void
  technicianId: string
  techId: string
}

export function AMXSummaryModal({ isOpen, onClose, technicianId, techId }: AMXSummaryModalProps) {
  const { language } = useLanguage()
  const [summary, setSummary] = useState<AMXSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [downloading, setDownloading] = useState(false)

  const labels = {
    title: language === 'es' ? 'Resumen AMX' : 'AMX Summary',
    subtitle: language === 'es' ? 'Certificado de verificación técnica' : 'Technical verification certificate',
    verificationStatus: language === 'es' ? 'Estado de verificación' : 'Verification status',
    verified: language === 'es' ? 'Verificado AMX' : 'AMX Verified',
    pending: language === 'es' ? 'Pendiente de verificación' : 'Pending verification',
    unverified: language === 'es' ? 'No verificado' : 'Not verified',
    licenses: language === 'es' ? 'Licencias' : 'Licenses',
    aircraftTypes: language === 'es' ? 'Tipos de aeronave' : 'Aircraft types',
    specialties: language === 'es' ? 'Especialidades' : 'Specialties',
    languages: language === 'es' ? 'Idiomas' : 'Languages',
    experience: language === 'es' ? 'Experiencia' : 'Experience',
    years: language === 'es' ? 'años' : 'years',
    contractPreference: language === 'es' ? 'Preferencia de contrato' : 'Contract preference',
    shortTerm: language === 'es' ? 'Corto plazo' : 'Short-term',
    longTerm: language === 'es' ? 'Largo plazo' : 'Long-term',
    both: language === 'es' ? 'Ambos' : 'Both',
    operationalFlags: language === 'es' ? 'Indicadores operativos' : 'Operational flags',
    ownTools: language === 'es' ? 'Herramientas propias' : 'Own tools',
    rightToWorkUk: language === 'es' ? 'Right to Work UK' : 'UK Right to Work',
    ukLicense: language === 'es' ? 'Licencia UK CAA' : 'UK CAA License',
    verificationChecklist: language === 'es' ? 'Checklist de verificación' : 'Verification checklist',
    documentStatus: language === 'es' ? 'Estado de documentación' : 'Documentation status',
    documentsVerified: language === 'es' ? 'documentos verificados' : 'documents verified',
    documentsPending: language === 'es' ? 'pendientes de revisión' : 'pending review',
    close: language === 'es' ? 'Cerrar' : 'Close',
    loading: language === 'es' ? 'Cargando...' : 'Loading...',
    error: language === 'es' ? 'Error al cargar el resumen' : 'Error loading summary',
    generatedAt: language === 'es' ? 'Generado el' : 'Generated on',
    theory: language === 'es' ? 'Teórico' : 'Theory',
    practical: language === 'es' ? 'Práctico' : 'Practical',
    notSpecified: language === 'es' ? 'No especificado' : 'Not specified',
    downloadPdf: language === 'es' ? 'Descargar PDF' : 'Download PDF',
    downloading: language === 'es' ? 'Descargando...' : 'Downloading...',
  }

  const handleDownloadPdf = async () => {
    setDownloading(true)
    try {
      const response = await fetch(`/api/technicians/${technicianId}/amx-summary/download`)
      
      if (!response.ok) {
        const contentType = response.headers.get('content-type')
        if (contentType && contentType.includes('application/json')) {
          const errorData = await response.json()
          alert(language === 'es' 
            ? `Error al descargar: ${errorData.error || 'Error desconocido'}` 
            : `Download error: ${errorData.error || 'Unknown error'}`)
        } else {
          alert(language === 'es' ? 'Error al descargar el PDF' : 'Failed to download PDF')
        }
        return
      }
      
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `AMX-${techId}-summary.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (err: any) {
      console.error('Download error:', err)
      alert(language === 'es' 
        ? `Error: ${err.message || 'No se pudo descargar'}` 
        : `Error: ${err.message || 'Could not download'}`)
    } finally {
      setDownloading(false)
    }
  }

  useEffect(() => {
    if (isOpen && technicianId) {
      loadSummary()
    }
  }, [isOpen, technicianId])

  const loadSummary = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/technicians/${technicianId}/amx-summary`)
      const data = await response.json()
      
      if (!response.ok) throw new Error(data.error)
      
      setSummary(data.summary)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'verified':
        return <span className="text-green-400">✓</span>
      case 'pending':
        return <span className="text-yellow-400">◐</span>
      case 'missing':
        return <span className="text-steel-500">○</span>
      default:
        return null
    }
  }

  const getContractLabel = (pref: string) => {
    switch (pref) {
      case 'short-term': return labels.shortTerm
      case 'long-term': return labels.longTerm
      default: return labels.both
    }
  }

  if (!isOpen) return null

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="sticky top-0 bg-navy-800 p-6 border-b border-steel-700/30 -mx-6 -mt-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-gold-500/20 to-gold-600/10 border-2 border-gold-500/50 flex items-center justify-center">
                <svg className="w-7 h-7 text-gold-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">{labels.title}</h2>
                <p className="text-sm text-steel-400">{labels.subtitle}</p>
              </div>
            </div>
            <button onClick={onClose} className="text-steel-400 hover:text-white transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-steel-400">{labels.loading}</div>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-error-400">{labels.error}</p>
            <p className="text-sm text-steel-500 mt-2">{error}</p>
          </div>
        ) : summary ? (
          <div className="space-y-6 px-6 pb-6">
            {/* AMX ID & Verification Badge */}
            <div className="flex items-center justify-between p-4 bg-navy-900/50 rounded-xl border border-steel-700/30">
              <div>
                <p className="text-xs text-steel-500 uppercase tracking-wider">AMX ID</p>
                <p className="text-xl font-mono font-bold text-gold-400">{summary.amxId}</p>
              </div>
              <div className={`px-4 py-2 rounded-lg ${
                summary.isVerified 
                  ? 'bg-green-500/10 border border-green-500/30'
                  : 'bg-yellow-500/10 border border-yellow-500/30'
              }`}>
                <span className={`font-medium ${summary.isVerified ? 'text-green-400' : 'text-yellow-400'}`}>
                  {summary.isVerified ? '✓ ' : ''}{summary.isVerified ? labels.verified : labels.pending}
                </span>
              </div>
            </div>

            {/* Capabilities Grid */}
            <div className="grid grid-cols-2 gap-4">
              {/* Licenses */}
              <div className="p-4 bg-navy-800/50 rounded-lg border border-steel-700/30">
                <p className="text-xs text-steel-500 uppercase tracking-wider mb-2">{labels.licenses}</p>
                <div className="flex flex-wrap gap-1">
                  {summary.licenses.length > 0 ? (
                    summary.licenses.map(lic => (
                      <span key={lic} className="chip-blue text-xs">{lic}</span>
                    ))
                  ) : (
                    <span className="text-steel-500 text-sm">{labels.notSpecified}</span>
                  )}
                </div>
              </div>

              {/* Experience */}
              <div className="p-4 bg-navy-800/50 rounded-lg border border-steel-700/30">
                <p className="text-xs text-steel-500 uppercase tracking-wider mb-2">{labels.experience}</p>
                <p className="text-xl font-bold text-white">
                  {summary.yearsExperience ? `${summary.yearsExperience} ${labels.years}` : labels.notSpecified}
                </p>
              </div>
            </div>

            {/* Aircraft Types */}
            <div className="p-4 bg-navy-800/50 rounded-lg border border-steel-700/30">
              <p className="text-xs text-steel-500 uppercase tracking-wider mb-2">{labels.aircraftTypes}</p>
              <div className="flex flex-wrap gap-2">
                {summary.aircraftTypes.length > 0 ? (
                  summary.aircraftTypes.map(ac => (
                    <span key={ac} className="chip-blue">{ac}</span>
                  ))
                ) : (
                  <span className="text-steel-500 text-sm">{labels.notSpecified}</span>
                )}
              </div>
            </div>

            {/* Specialties */}
            <div className="p-4 bg-navy-800/50 rounded-lg border border-steel-700/30">
              <p className="text-xs text-steel-500 uppercase tracking-wider mb-2">{labels.specialties}</p>
              <div className="flex flex-wrap gap-2">
                {summary.specialties.length > 0 ? (
                  summary.specialties.map(spec => (
                    <span key={spec} className="chip-blue">{spec}</span>
                  ))
                ) : (
                  <span className="text-steel-500 text-sm">{labels.notSpecified}</span>
                )}
              </div>
            </div>

            {/* Languages & Contract Preference */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-navy-800/50 rounded-lg border border-steel-700/30">
                <p className="text-xs text-steel-500 uppercase tracking-wider mb-2">{labels.languages}</p>
                <div className="flex flex-wrap gap-1">
                  {summary.languages.length > 0 ? (
                    summary.languages.map(lang => (
                      <span key={lang} className="chip text-xs">{lang}</span>
                    ))
                  ) : (
                    <span className="text-steel-500 text-sm">{labels.notSpecified}</span>
                  )}
                </div>
              </div>

              <div className="p-4 bg-navy-800/50 rounded-lg border border-steel-700/30">
                <p className="text-xs text-steel-500 uppercase tracking-wider mb-2">{labels.contractPreference}</p>
                <p className="text-white font-medium">{getContractLabel(summary.contractPreference)}</p>
              </div>
            </div>

            {/* Operational Flags */}
            <div className="p-4 bg-navy-800/50 rounded-lg border border-steel-700/30">
              <p className="text-xs text-steel-500 uppercase tracking-wider mb-3">{labels.operationalFlags}</p>
              <div className="flex flex-wrap gap-3">
                {summary.ownTools && (
                  <span className="chip-success text-xs">🛠️ {labels.ownTools}</span>
                )}
                {summary.rightToWorkUk && (
                  <span className="chip-success text-xs">🇬🇧 {labels.rightToWorkUk}</span>
                )}
                {summary.ukLicense && (
                  <span className="chip-success text-xs">🎫 {labels.ukLicense}</span>
                )}
                {!summary.ownTools && !summary.rightToWorkUk && !summary.ukLicense && (
                  <span className="text-steel-500 text-sm">{labels.notSpecified}</span>
                )}
              </div>
            </div>

            {/* Verification Checklist */}
            <div className="p-4 bg-navy-800/50 rounded-lg border border-steel-700/30">
              <p className="text-xs text-steel-500 uppercase tracking-wider mb-3">{labels.verificationChecklist}</p>
              
              {/* License Status */}
              <div className="flex items-center justify-between p-2 bg-navy-900/50 rounded mb-2">
                <span className="text-sm text-white">{summary.verificationChecklist.license.label}</span>
                {getStatusIcon(summary.verificationChecklist.license.status)}
              </div>

              {/* Aircraft Ratings */}
              {summary.verificationChecklist.aircraftRatings.length > 0 && (
                <div className="space-y-2 mt-3">
                  {summary.verificationChecklist.aircraftRatings.map(rating => (
                    <div key={rating.aircraft} className="p-2 bg-navy-900/50 rounded">
                      <p className="text-sm font-medium text-white mb-1">{rating.aircraft}</p>
                      <div className="flex gap-4 text-xs">
                        <span className="text-steel-400">
                          {labels.theory}: {getStatusIcon(rating.theory)}
                        </span>
                        <span className="text-steel-400">
                          {labels.practical}: {getStatusIcon(rating.practical)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Document Summary */}
              <div className="mt-4 pt-3 border-t border-steel-700/30">
                <p className="text-sm text-steel-400">
                  <span className="text-green-400 font-medium">{summary.verificationChecklist.documentsVerified}</span> {labels.documentsVerified}
                  {summary.verificationChecklist.documentsPending > 0 && (
                    <span> · <span className="text-yellow-400 font-medium">{summary.verificationChecklist.documentsPending}</span> {labels.documentsPending}</span>
                  )}
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="pt-4 border-t border-steel-700/30">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-xs text-steel-500">
                    {labels.generatedAt} {new Date(summary.generatedAt).toLocaleString(language === 'es' ? 'es-ES' : 'en-GB')}
                  </p>
                  <p className="text-xs text-steel-600 mt-1">AeroMatch · aeromatch.eu</p>
                </div>
                <button
                  onClick={handleDownloadPdf}
                  disabled={downloading}
                  className="btn-primary flex items-center gap-2"
                >
                  {downloading ? (
                    <>
                      <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      {labels.downloading}
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      {labels.downloadPdf}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}


