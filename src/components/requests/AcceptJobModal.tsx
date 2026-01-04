'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useLanguage } from '@/lib/i18n/LanguageContext'

interface UmbrellaProvider {
  id: string
  name: string
  website_url: string | null
  contact_email: string | null
  description: string | null
}

interface JobRequest {
  id: string
  company_id: string
  technician_id: string
  final_client_name: string
  work_location: string
  contract_type: string
  start_date: string
  end_date: string
  notes: string | null
  status: string
  country_code?: string
  daily_rate_gross?: number
  requires_right_to_work_uk?: boolean
}

interface AcceptJobModalProps {
  isOpen: boolean
  onClose: () => void
  jobRequest: JobRequest
  onAccepted: () => void
  technicianHasRightToWorkUK?: boolean
}

type WorkMode = 'self_employed' | 'umbrella' | 'umbrella_with_insurance'
type UkEligibilityMode = 'not_required' | 'umbrella' | 'self_arranged'

export function AcceptJobModal({ isOpen, onClose, jobRequest, onAccepted, technicianHasRightToWorkUK }: AcceptJobModalProps) {
  const { language } = useLanguage()
  const supabase = createClient()
  
  // Check if UK eligibility step is needed
  const needsUkEligibility = jobRequest.requires_right_to_work_uk && technicianHasRightToWorkUK !== true
  
  const [step, setStep] = useState<'uk_eligibility' | 'work_mode' | 'umbrella_selection' | 'confirmation'>(
    needsUkEligibility ? 'uk_eligibility' : 'work_mode'
  )
  const [workMode, setWorkMode] = useState<WorkMode>('self_employed')
  const [ukEligibilityMode, setUkEligibilityMode] = useState<UkEligibilityMode>('umbrella')
  const [ukSelfArrangedAcknowledged, setUkSelfArrangedAcknowledged] = useState(false)
  const [umbrellaProviders, setUmbrellaProviders] = useState<UmbrellaProvider[]>([])
  const [selectedUmbrella, setSelectedUmbrella] = useState<UmbrellaProvider | null>(null)
  const [bankAccount, setBankAccount] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingProviders, setLoadingProviders] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const labels = {
    title: language === 'es' ? 'Aceptar Trabajo' : 'Accept Job',
    workModeTitle: language === 'es' ? '¿Cómo quieres trabajar?' : 'How do you want to work?',
    selfEmployed: language === 'es' ? 'Soy autónomo' : 'I am self-employed',
    selfEmployedDesc: language === 'es' ? 'Facturaré directamente a la empresa' : 'I will invoice the company directly',
    umbrella: language === 'es' ? 'Quiero Umbrella' : 'I want Umbrella',
    umbrellaDesc: language === 'es' ? 'Una empresa umbrella gestionará mi nómina' : 'An umbrella company will manage my payroll',
    umbrellaInsurance: language === 'es' ? 'Umbrella + seguro de accidentes (según términos del proveedor)' : 'Umbrella + accident insurance (via provider terms)',
    umbrellaInsuranceDesc: language === 'es' ? 'Cobertura gestionada por el proveedor seleccionado' : 'Coverage arranged through selected provider',
    umbrellaNote: language === 'es' 
      ? 'Nota: El seguro de accidentes, si está disponible, es gestionado por el proveedor seleccionado y sujeto a sus términos y condiciones.'
      : 'Note: Accident insurance, if available, is arranged through the selected provider and subject to their terms.',
    selectUmbrella: language === 'es' ? 'Selecciona un proveedor Umbrella' : 'Select an Umbrella Provider',
    recommendedFor: language === 'es' ? 'Recomendados para' : 'Recommended for',
    bankAccount: language === 'es' ? 'Cuenta bancaria / IBAN (opcional)' : 'Bank account / IBAN (optional)',
    bankAccountHint: language === 'es' ? 'Para compartir con el proveedor umbrella' : 'To share with the umbrella provider',
    confirmation: language === 'es' ? 'Confirmar aceptación' : 'Confirm acceptance',
    summaryTitle: language === 'es' ? 'Resumen del trabajo' : 'Job Summary',
    workArrangement: language === 'es' ? 'Modalidad de trabajo' : 'Work Arrangement',
    umbrellaProvider: language === 'es' ? 'Proveedor Umbrella' : 'Umbrella Provider',
    copyDetails: language === 'es' ? 'Copiar detalles para Umbrella' : 'Copy details for Umbrella',
    copied: language === 'es' ? '¡Copiado!' : 'Copied!',
    back: language === 'es' ? 'Atrás' : 'Back',
    next: language === 'es' ? 'Siguiente' : 'Next',
    confirm: language === 'es' ? 'Confirmar y Aceptar' : 'Confirm & Accept',
    cancel: language === 'es' ? 'Cancelar' : 'Cancel',
    processing: language === 'es' ? 'Procesando...' : 'Processing...',
    note: language === 'es' 
      ? 'Por ahora, AeroMatch proporciona contactos. Integraciones con partners próximamente.'
      : 'For now, AeroMatch provides contacts. Partner integrations coming soon.',
    visitWebsite: language === 'es' ? 'Visitar web' : 'Visit website',
    contactEmail: language === 'es' ? 'Enviar email' : 'Send email',
    noProviders: language === 'es' ? 'No hay proveedores disponibles' : 'No providers available',
    ukEligibilityTitle: language === 'es' ? 'Elegibilidad laboral en UK' : 'UK Work Eligibility',
    ukEligibilityDesc: language === 'es' 
      ? 'Este trabajo requiere Right to Work legal en UK. AeroMatch no sponsoriza visados ni ofrece seguro directamente en esta fase.'
      : 'This job requires legal Right to Work in the UK. AeroMatch does NOT sponsor VISAs or provide insurance directly at this stage.',
    ukUmbrellaOption: language === 'es' ? 'Usar proveedor Umbrella/EoR recomendado' : 'Use recommended Umbrella/EoR provider',
    ukUmbrellaDesc: language === 'es' 
      ? 'Una umbrella gestionará facturación MoR y seguro (bajo sus términos)'
      : 'An umbrella will handle MoR billing and insurance (under their terms)',
    ukSelfOption: language === 'es' ? 'Gestionaré la elegibilidad UK por mi cuenta' : 'I will arrange UK eligibility myself',
    ukSelfDesc: language === 'es' 
      ? 'Tengo o conseguiré Right to Work UK / sponsorship de visado independientemente'
      : 'I have or will arrange Right to Work UK / VISA sponsorship independently',
    ukSelfAcknowledge: language === 'es' 
      ? 'Confirmo que gestionaré Right to Work UK / sponsorship de visado de forma independiente.'
      : 'I confirm I will arrange Right to Work UK / VISA sponsorship independently.',
  }

  const workModeLabels: Record<WorkMode, string> = {
    self_employed: labels.selfEmployed,
    umbrella: labels.umbrella,
    umbrella_with_insurance: labels.umbrellaInsurance,
  }

  // Load umbrella providers when modal opens or work mode changes to umbrella
  useEffect(() => {
    if (isOpen && (workMode === 'umbrella' || workMode === 'umbrella_with_insurance')) {
      loadUmbrellaProviders()
    }
  }, [isOpen, workMode])

  const loadUmbrellaProviders = async () => {
    setLoadingProviders(true)
    const countryCode = jobRequest.country_code || 'ES'
    
    try {
      // First try to get country-specific recommendations
      let { data: recommendations } = await supabase
        .from('umbrella_country_recommendations')
        .select(`
          umbrella_provider_id,
          priority,
          umbrella_providers (
            id,
            name,
            website_url,
            contact_email,
            description
          )
        `)
        .eq('country_code', countryCode)
        .eq('is_active', true)
        .order('priority', { ascending: true })

      // If no country-specific, get global fallback
      if (!recommendations || recommendations.length === 0) {
        const { data: globalRecs } = await supabase
          .from('umbrella_country_recommendations')
          .select(`
            umbrella_provider_id,
            priority,
            umbrella_providers (
              id,
              name,
              website_url,
              contact_email,
              description
            )
          `)
          .eq('country_code', 'GLOBAL')
          .eq('is_active', true)
          .order('priority', { ascending: true })
        
        recommendations = globalRecs
      }

      if (recommendations) {
        const providers = recommendations
          .map((r: any) => r.umbrella_providers)
          .filter(Boolean) as UmbrellaProvider[]
        setUmbrellaProviders(providers)
      }
    } catch (err) {
      console.error('Error loading umbrella providers:', err)
    } finally {
      setLoadingProviders(false)
    }
  }

  const handleNext = () => {
    if (step === 'uk_eligibility') {
      if (ukEligibilityMode === 'self_arranged' && !ukSelfArrangedAcknowledged) {
        setError(language === 'es' ? 'Debes confirmar que gestionarás la elegibilidad UK' : 'You must acknowledge UK eligibility arrangement')
        return
      }
      // If using umbrella for UK eligibility, go to umbrella selection
      if (ukEligibilityMode === 'umbrella') {
        setWorkMode('umbrella') // Force umbrella mode
        setStep('umbrella_selection')
      } else {
        setStep('work_mode')
      }
    } else if (step === 'work_mode') {
      if (workMode === 'self_employed') {
        setStep('confirmation')
      } else {
        setStep('umbrella_selection')
      }
    } else if (step === 'umbrella_selection') {
      if (!selectedUmbrella) {
        setError(language === 'es' ? 'Selecciona un proveedor umbrella' : 'Select an umbrella provider')
        return
      }
      // If came from UK eligibility with umbrella mode, skip work_mode and go to confirmation
      if (needsUkEligibility && ukEligibilityMode === 'umbrella') {
        setStep('confirmation')
      } else {
        setStep('confirmation')
      }
    }
    setError(null)
  }

  const handleBack = () => {
    if (step === 'umbrella_selection') {
      if (needsUkEligibility && ukEligibilityMode === 'umbrella') {
        setStep('uk_eligibility')
      } else {
        setStep('work_mode')
      }
    } else if (step === 'work_mode') {
      if (needsUkEligibility) {
        setStep('uk_eligibility')
      }
    } else if (step === 'confirmation') {
      if (workMode === 'self_employed') {
        if (needsUkEligibility) {
          setStep('work_mode')
        } else {
          setStep('work_mode')
        }
      } else {
        setStep('umbrella_selection')
      }
    }
    setError(null)
  }

  const handleConfirm = async () => {
    setLoading(true)
    setError(null)

    try {
      // 1. Update job request status
      const response = await fetch(`/api/job-requests/${jobRequest.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'accepted' })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to accept job')
      }

      // 2. Create acceptance workflow record
      const { error: workflowError } = await supabase
        .from('job_acceptance_workflow')
        .insert({
          job_request_id: jobRequest.id,
          technician_user_id: jobRequest.technician_id,
          company_user_id: jobRequest.company_id,
          work_mode: workMode,
          umbrella_provider_id: selectedUmbrella?.id || null,
          payout_bank_account: bankAccount || null,
          uk_eligibility_mode: needsUkEligibility ? ukEligibilityMode : 'not_required',
          uk_eligibility_acknowledged: ukEligibilityMode === 'self_arranged' ? ukSelfArrangedAcknowledged : null,
        })

      if (workflowError) {
        console.error('Workflow error:', workflowError)
        // Don't fail the whole operation if workflow insert fails
      }

      onAccepted()
      onClose()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const copyDetailsToClipboard = () => {
    const ukNote = needsUkEligibility 
      ? `\nUK Eligibility: ${ukEligibilityMode === 'umbrella' ? 'Via Umbrella/EoR provider' : 'Self-arranged by technician'}` 
      : ''
    
    const details = `Job details for Umbrella Provider
Job: ${jobRequest.final_client_name}
Country: ${jobRequest.country_code || 'ES'}
Location: ${jobRequest.work_location}
Dates: ${new Date(jobRequest.start_date).toLocaleDateString()} to ${new Date(jobRequest.end_date).toLocaleDateString()}
Contract Type: ${jobRequest.contract_type === 'short-term' ? 'Short-term' : 'Long-term'}
${jobRequest.daily_rate_gross ? `Agreed Rate (Gross): €${jobRequest.daily_rate_gross}/day` : ''}
${bankAccount ? `Technician IBAN: ${bankAccount}` : ''}
Umbrella Selected: ${selectedUmbrella?.name} (${selectedUmbrella?.website_url || 'N/A'})
Umbrella Contact: ${selectedUmbrella?.contact_email || 'N/A'}${ukNote}

Note: MoR billing and any insurance are handled by the provider under their own policy terms.`

    navigator.clipboard.writeText(details)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (!isOpen) return null

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-white">{labels.title}</h2>
          <button onClick={onClose} className="text-steel-500 hover:text-white transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-6">
          {needsUkEligibility && (
            <>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step === 'uk_eligibility' ? 'bg-warning-500 text-navy-950' : 'bg-warning-500/50 text-white'
              }`}>🇬🇧</div>
              <div className={`flex-1 h-1 ${step !== 'uk_eligibility' ? 'bg-gold-500' : 'bg-navy-700'}`} />
            </>
          )}
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
            step === 'work_mode' ? 'bg-gold-500 text-navy-950' : 
            (step === 'umbrella_selection' || step === 'confirmation') ? 'bg-gold-500/50 text-white' : 'bg-navy-700 text-steel-400'
          }`}>1</div>
          <div className={`flex-1 h-1 ${step === 'umbrella_selection' || step === 'confirmation' ? 'bg-gold-500' : 'bg-navy-700'}`} />
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
            step === 'umbrella_selection' ? 'bg-gold-500 text-navy-950' : 
            step === 'confirmation' && workMode !== 'self_employed' ? 'bg-gold-500/50 text-white' : 'bg-navy-700 text-steel-400'
          }`}>2</div>
          <div className={`flex-1 h-1 ${step === 'confirmation' ? 'bg-gold-500' : 'bg-navy-700'}`} />
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
            step === 'confirmation' ? 'bg-gold-500 text-navy-950' : 'bg-navy-700 text-steel-400'
          }`}>3</div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-error-600/20 border border-error-500/30 text-error-400 text-sm">
            {error}
          </div>
        )}

        {/* Step UK Eligibility (only shown if job requires RTW and tech doesn't have it) */}
        {step === 'uk_eligibility' && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-warning-500/10 border border-warning-500/30">
              <div className="flex items-start gap-3">
                <span className="text-xl">⚠️</span>
                <div>
                  <h3 className="text-lg font-medium text-white mb-2">{labels.ukEligibilityTitle}</h3>
                  <p className="text-sm text-steel-300">{labels.ukEligibilityDesc}</p>
                </div>
              </div>
            </div>

            <p className="text-sm text-steel-400">
              {language === 'es' ? '¿Cómo vas a gestionar la elegibilidad UK?' : 'How will you handle UK eligibility?'}
            </p>

            <label className={`block p-4 rounded-xl border-2 cursor-pointer transition-all ${
              ukEligibilityMode === 'umbrella' 
                ? 'border-gold-500 bg-gold-500/10' 
                : 'border-steel-700 hover:border-steel-600'
            }`}>
              <input
                type="radio"
                name="ukEligibility"
                value="umbrella"
                checked={ukEligibilityMode === 'umbrella'}
                onChange={() => setUkEligibilityMode('umbrella')}
                className="sr-only"
              />
              <div className="flex items-start gap-3">
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5 ${
                  ukEligibilityMode === 'umbrella' ? 'border-gold-500' : 'border-steel-600'
                }`}>
                  {ukEligibilityMode === 'umbrella' && <div className="w-2.5 h-2.5 rounded-full bg-gold-500" />}
                </div>
                <div>
                  <p className="font-medium text-white">{labels.ukUmbrellaOption}</p>
                  <p className="text-sm text-steel-400 mt-1">{labels.ukUmbrellaDesc}</p>
                </div>
              </div>
            </label>

            <label className={`block p-4 rounded-xl border-2 cursor-pointer transition-all ${
              ukEligibilityMode === 'self_arranged' 
                ? 'border-gold-500 bg-gold-500/10' 
                : 'border-steel-700 hover:border-steel-600'
            }`}>
              <input
                type="radio"
                name="ukEligibility"
                value="self_arranged"
                checked={ukEligibilityMode === 'self_arranged'}
                onChange={() => setUkEligibilityMode('self_arranged')}
                className="sr-only"
              />
              <div className="flex items-start gap-3">
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5 ${
                  ukEligibilityMode === 'self_arranged' ? 'border-gold-500' : 'border-steel-600'
                }`}>
                  {ukEligibilityMode === 'self_arranged' && <div className="w-2.5 h-2.5 rounded-full bg-gold-500" />}
                </div>
                <div>
                  <p className="font-medium text-white">{labels.ukSelfOption}</p>
                  <p className="text-sm text-steel-400 mt-1">{labels.ukSelfDesc}</p>
                </div>
              </div>
            </label>

            {/* Acknowledgment checkbox for self_arranged */}
            {ukEligibilityMode === 'self_arranged' && (
              <label className="flex items-start gap-3 p-3 rounded-lg bg-navy-800/50 border border-steel-700/30 cursor-pointer">
                <input
                  type="checkbox"
                  checked={ukSelfArrangedAcknowledged}
                  onChange={(e) => setUkSelfArrangedAcknowledged(e.target.checked)}
                  className="mt-1 w-4 h-4 rounded border-steel-600 bg-navy-800 text-gold-500 focus:ring-gold-500 focus:ring-offset-0"
                />
                <span className="text-sm text-steel-300">{labels.ukSelfAcknowledge}</span>
              </label>
            )}
          </div>
        )}

        {/* Step 1: Work Mode Selection */}
        {step === 'work_mode' && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-white mb-4">{labels.workModeTitle}</h3>
            
            <label className={`block p-4 rounded-xl border-2 cursor-pointer transition-all ${
              workMode === 'self_employed' 
                ? 'border-gold-500 bg-gold-500/10' 
                : 'border-steel-700 hover:border-steel-600'
            }`}>
              <input
                type="radio"
                name="workMode"
                value="self_employed"
                checked={workMode === 'self_employed'}
                onChange={() => setWorkMode('self_employed')}
                className="sr-only"
              />
              <div className="flex items-start gap-3">
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5 ${
                  workMode === 'self_employed' ? 'border-gold-500' : 'border-steel-600'
                }`}>
                  {workMode === 'self_employed' && <div className="w-2.5 h-2.5 rounded-full bg-gold-500" />}
                </div>
                <div>
                  <p className="font-medium text-white">{labels.selfEmployed}</p>
                  <p className="text-sm text-steel-400 mt-1">{labels.selfEmployedDesc}</p>
                </div>
              </div>
            </label>

            <label className={`block p-4 rounded-xl border-2 cursor-pointer transition-all ${
              workMode === 'umbrella' 
                ? 'border-gold-500 bg-gold-500/10' 
                : 'border-steel-700 hover:border-steel-600'
            }`}>
              <input
                type="radio"
                name="workMode"
                value="umbrella"
                checked={workMode === 'umbrella'}
                onChange={() => setWorkMode('umbrella')}
                className="sr-only"
              />
              <div className="flex items-start gap-3">
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5 ${
                  workMode === 'umbrella' ? 'border-gold-500' : 'border-steel-600'
                }`}>
                  {workMode === 'umbrella' && <div className="w-2.5 h-2.5 rounded-full bg-gold-500" />}
                </div>
                <div>
                  <p className="font-medium text-white">{labels.umbrella}</p>
                  <p className="text-sm text-steel-400 mt-1">{labels.umbrellaDesc}</p>
                </div>
              </div>
            </label>

            <label className={`block p-4 rounded-xl border-2 cursor-pointer transition-all ${
              workMode === 'umbrella_with_insurance' 
                ? 'border-gold-500 bg-gold-500/10' 
                : 'border-steel-700 hover:border-steel-600'
            }`}>
              <input
                type="radio"
                name="workMode"
                value="umbrella_with_insurance"
                checked={workMode === 'umbrella_with_insurance'}
                onChange={() => setWorkMode('umbrella_with_insurance')}
                className="sr-only"
              />
              <div className="flex items-start gap-3">
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5 ${
                  workMode === 'umbrella_with_insurance' ? 'border-gold-500' : 'border-steel-600'
                }`}>
                  {workMode === 'umbrella_with_insurance' && <div className="w-2.5 h-2.5 rounded-full bg-gold-500" />}
                </div>
                <div>
                  <p className="font-medium text-white">{labels.umbrellaInsurance}</p>
                  <p className="text-sm text-steel-400 mt-1">{labels.umbrellaInsuranceDesc}</p>
                </div>
              </div>
            </label>

            {/* Legal note for umbrella modes */}
            {(workMode === 'umbrella' || workMode === 'umbrella_with_insurance') && (
              <div className="mt-4 p-3 rounded-lg bg-navy-800/50 border border-steel-700/50">
                <p className="text-xs text-steel-400">
                  {labels.umbrellaNote}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Step 2: Umbrella Selection */}
        {step === 'umbrella_selection' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-white">{labels.selectUmbrella}</h3>
              <span className="text-sm text-steel-500">
                {labels.recommendedFor} {jobRequest.country_code || 'ES'}
              </span>
            </div>

            {loadingProviders ? (
              <div className="text-center py-8 text-steel-400">Loading...</div>
            ) : umbrellaProviders.length === 0 ? (
              <div className="text-center py-8 text-steel-400">{labels.noProviders}</div>
            ) : (
              <div className="space-y-3">
                {umbrellaProviders.map((provider) => (
                  <label 
                    key={provider.id}
                    className={`block p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      selectedUmbrella?.id === provider.id 
                        ? 'border-gold-500 bg-gold-500/10' 
                        : 'border-steel-700 hover:border-steel-600'
                    }`}
                  >
                    <input
                      type="radio"
                      name="umbrella"
                      value={provider.id}
                      checked={selectedUmbrella?.id === provider.id}
                      onChange={() => setSelectedUmbrella(provider)}
                      className="sr-only"
                    />
                    <div className="flex items-start gap-3">
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5 ${
                        selectedUmbrella?.id === provider.id ? 'border-gold-500' : 'border-steel-600'
                      }`}>
                        {selectedUmbrella?.id === provider.id && <div className="w-2.5 h-2.5 rounded-full bg-gold-500" />}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-white">{provider.name}</p>
                        {provider.description && (
                          <p className="text-sm text-steel-400 mt-1">{provider.description}</p>
                        )}
                        <div className="flex items-center gap-4 mt-2">
                          {provider.website_url && (
                            <a 
                              href={provider.website_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="text-xs text-gold-400 hover:text-gold-300 flex items-center gap-1"
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                              </svg>
                              {labels.visitWebsite}
                            </a>
                          )}
                          {provider.contact_email && (
                            <a 
                              href={`mailto:${provider.contact_email}`}
                              onClick={(e) => e.stopPropagation()}
                              className="text-xs text-gold-400 hover:text-gold-300 flex items-center gap-1"
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                              </svg>
                              {labels.contactEmail}
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            )}

            {/* Bank Account Input */}
            <div className="mt-6">
              <label className="block text-sm text-steel-400 mb-2">{labels.bankAccount}</label>
              <input
                type="text"
                value={bankAccount}
                onChange={(e) => setBankAccount(e.target.value)}
                placeholder="ES12 3456 7890 1234 5678 9012"
                className="input w-full"
              />
              <p className="text-xs text-steel-500 mt-1">{labels.bankAccountHint}</p>
            </div>

            {/* Note */}
            <div className="mt-4 p-3 rounded-lg bg-navy-800/50 border border-steel-700/30">
              <p className="text-xs text-steel-400 flex items-start gap-2">
                <svg className="w-4 h-4 text-gold-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {labels.note}
              </p>
            </div>
          </div>
        )}

        {/* Step 3: Confirmation */}
        {step === 'confirmation' && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-white mb-4">{labels.summaryTitle}</h3>
            
            <div className="bg-navy-800/50 rounded-xl p-4 space-y-3">
              <div className="flex justify-between">
                <span className="text-steel-400">Job</span>
                <span className="text-white font-medium">{jobRequest.final_client_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-steel-400">Location</span>
                <span className="text-white">{jobRequest.work_location}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-steel-400">Dates</span>
                <span className="text-white">
                  {new Date(jobRequest.start_date).toLocaleDateString()} - {new Date(jobRequest.end_date).toLocaleDateString()}
                </span>
              </div>
              <div className="border-t border-steel-700/30 pt-3">
                <div className="flex justify-between">
                  <span className="text-steel-400">{labels.workArrangement}</span>
                  <span className="text-gold-400 font-medium">{workModeLabels[workMode]}</span>
                </div>
              </div>
              {selectedUmbrella && (
                <div className="flex justify-between">
                  <span className="text-steel-400">{labels.umbrellaProvider}</span>
                  <span className="text-white">{selectedUmbrella.name}</span>
                </div>
              )}
              {bankAccount && (
                <div className="flex justify-between">
                  <span className="text-steel-400">IBAN</span>
                  <span className="text-white font-mono text-sm">{bankAccount}</span>
                </div>
              )}
            </div>

            {/* Copy Details Button (only for umbrella modes) */}
            {(workMode === 'umbrella' || workMode === 'umbrella_with_insurance') && selectedUmbrella && (
              <button
                onClick={copyDetailsToClipboard}
                disabled={copied}
                className="btn-secondary w-full flex items-center justify-center gap-2"
              >
                {copied ? (
                  <>
                    <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {labels.copied}
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    {labels.copyDetails}
                  </>
                )}
              </button>
            )}
          </div>
        )}

        {/* Footer Buttons */}
        <div className="flex gap-3 mt-6 pt-4 border-t border-steel-700/30">
          {(step !== 'work_mode' && step !== 'uk_eligibility') || (step === 'work_mode' && needsUkEligibility) ? (
            <button onClick={handleBack} className="btn-ghost flex-1">
              {labels.back}
            </button>
          ) : (
            <button onClick={onClose} className="btn-ghost flex-1">
              {labels.cancel}
            </button>
          )}
          
          {step === 'confirmation' ? (
            <button 
              onClick={handleConfirm} 
              disabled={loading}
              className="btn-primary-filled flex-1"
            >
              {loading ? labels.processing : labels.confirm}
            </button>
          ) : (
            <button 
              onClick={handleNext}
              className="btn-primary-filled flex-1"
            >
              {labels.next}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

