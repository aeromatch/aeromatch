'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { AppLayout } from '@/components/ui/AppLayout'
import { useLanguage } from '@/lib/i18n/LanguageContext'
import { createClient } from '@/lib/supabase/client'
import { SubscriptionSection } from '@/components/billing/SubscriptionSection'
import { VERIFICATION_BADGES } from '@/lib/config/features'
import {
  getUniqueSeries,
  isTypeRatingDocSetComplete,
} from '@/lib/aircraft-series'

interface DashboardViewProps {
  profile: any
  technician: any
  company: any
  availabilitySlots: any[]
  pendingRequests: any[]
  ratingsSummary?: {
    count: number
    overall: number | null
    punctuality: number | null
    documentation: number | null
    technical: number | null
    communication: number | null
    safety: number | null
  } | null
  canUseTestOffer?: boolean
}

type VerificationStatus = 'unverified' | 'pending' | 'verified' | 'rejected'

// Profile completion checker for technicians
function getProfileCompletion(technician: any, availabilitySlots: any[], documentsCount: number, documentTypes: string[]) {
  // Basic license check
  const basicLicenseTypes = ['easa_license', 'uk_license', 'faa_ap']
  const hasBasicLicense = basicLicenseTypes.some(type => documentTypes.includes(type))
  
  // Type ratings por serie EASA: theory + practical por serie
  const aircraftTypes = technician?.aircraft_types || []
  let aircraftDocsComplete = true
  const seriesList = getUniqueSeries(aircraftTypes)

  for (const series of seriesList) {
    if (!isTypeRatingDocSetComplete(documentTypes, series)) {
      aircraftDocsComplete = false
      break
    }
  }

  const checks = {
    basicLicense: hasBasicLicense,
    aircraftDocs: aircraftTypes.length === 0 || aircraftDocsComplete,
    availability: availabilitySlots.length > 0,
  }
  
  const completed = Object.values(checks).filter(Boolean).length
  const total = Object.keys(checks).length
  
  return { checks, completed, total, percentage: Math.round((completed / total) * 100) }
}

// Verification Progress Widget Component
function VerificationProgressWidget({ 
  language, 
  profileComplete, 
  documentsCount, 
  verificationStatus 
}: { 
  language: string
  profileComplete: boolean
  documentsCount: number
  verificationStatus: VerificationStatus
}) {
  const steps = [
    {
      id: 'profile',
      label: language === 'es' ? 'Perfil' : 'Profile',
      description: language === 'es' ? 'Información básica completa' : 'Basic info complete',
      completed: profileComplete,
      link: '/profile/edit',
    },
    {
      id: 'documents',
      label: language === 'es' ? 'Documentos' : 'Documents',
      description: language === 'es' ? 'Licencias y certificados' : 'Licenses and certificates',
      completed: documentsCount > 0,
      link: '/profile/documents',
    },
    {
      id: 'verification',
      label: language === 'es' ? 'Verificación AMX' : 'AMX Verification',
      description: verificationStatus === 'verified' 
        ? (language === 'es' ? '¡Perfil verificado!' : 'Profile verified!')
        : verificationStatus === 'pending'
        ? (language === 'es' ? 'En revisión' : 'Under review')
        : (language === 'es' ? 'Pendiente de documentos' : 'Awaiting documents'),
      completed: verificationStatus === 'verified',
      pending: verificationStatus === 'pending',
      link: '/profile/documents',
    },
  ]

  const completedSteps = steps.filter(s => s.completed).length
  const isFullyVerified = verificationStatus === 'verified'

  // If fully verified, show compact success state
  if (isFullyVerified) {
    return (
      <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/30 flex items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-green-500/20 border border-green-500/40 flex items-center justify-center">
          <svg className="w-6 h-6 text-green-400" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        </div>
        <div>
          <p className="font-semibold text-green-400">{VERIFICATION_BADGES[language as 'es' | 'en'].verified}</p>
          <p className="text-sm text-steel-400">
            {language === 'es' 
              ? 'Puedes aceptar ofertas y aparecer en búsquedas prioritarias' 
              : 'You can accept offers and appear in priority searches'}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-5 rounded-xl bg-navy-800/50 border border-steel-700/30">
      <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
        <svg className="w-5 h-5 text-gold-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
        {language === 'es' ? 'Progreso de verificación' : 'Verification Progress'}
      </h3>
      
      {/* Steps */}
      <div className="flex items-start gap-4">
        {steps.map((step, idx) => (
          <div key={step.id} className="flex-1 relative">
            {/* Connector line */}
            {idx < steps.length - 1 && (
              <div className={`absolute top-5 left-[calc(50%+20px)] right-0 h-0.5 ${
                step.completed ? 'bg-green-500' : 'bg-steel-700'
              }`} />
            )}
            
            <Link 
              href={step.link}
              className="group flex flex-col items-center text-center"
            >
              {/* Step circle */}
              <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 mb-2 transition-all ${
                step.completed 
                  ? 'bg-green-500/20 border-green-500 text-green-400' 
                  : step.pending 
                  ? 'bg-yellow-500/20 border-yellow-500 text-yellow-400 animate-pulse'
                  : 'bg-navy-800 border-steel-600 text-steel-400 group-hover:border-gold-500'
              }`}>
                {step.completed ? (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                ) : step.pending ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ) : (
                  <span className="text-sm font-medium">{idx + 1}</span>
                )}
              </div>
              
              {/* Step label */}
              <p className={`text-sm font-medium mb-1 ${
                step.completed ? 'text-green-400' : step.pending ? 'text-yellow-400' : 'text-white'
              }`}>
                {step.label}
              </p>
              <p className="text-xs text-steel-500">
                {step.description}
              </p>
            </Link>
          </div>
        ))}
      </div>

      {/* Info message */}
      <div className="mt-4 pt-4 border-t border-steel-700/30">
        <p className="text-xs text-steel-400 flex items-start gap-2">
          <svg className="w-4 h-4 text-gold-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {verificationStatus === 'pending' 
            ? (language === 'es' 
                ? 'Tu documentación está siendo revisada. Te notificaremos cuando esté verificada.'
                : 'Your documentation is being reviewed. We will notify you when verified.')
            : (language === 'es' 
                ? 'Completa los pasos para desbloquear la aceptación de ofertas y aparecer primero en búsquedas.'
                : 'Complete the steps to unlock offer acceptance and appear first in searches.')
          }
        </p>
      </div>
    </div>
  )
}

export function DashboardView({ profile, technician, company, availabilitySlots, pendingRequests, ratingsSummary, canUseTestOffer }: DashboardViewProps) {
  const { t, language } = useLanguage()
  const isTechnician = profile.role === 'technician'
  const supabase = createClient()

  // Documents count
  const [documentsCount, setDocumentsCount] = useState(0)
  
  // Premium state
  const [premiumGranted, setPremiumGranted] = useState(false)
  const [showPremiumToast, setShowPremiumToast] = useState(false)
  const [premiumChecked, setPremiumChecked] = useState(false)
  
  // Password change state (for companies)
  const [showPasswordForm, setShowPasswordForm] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [passwordSuccess, setPasswordSuccess] = useState(false)

  // Dismiss reminders state
  const [dismissedReminders, setDismissedReminders] = useState<string[]>([])
  const [creatingTestOffer, setCreatingTestOffer] = useState(false)
  const [showTestOfferEmailMessage, setShowTestOfferEmailMessage] = useState(false)

  // Load documents
  const [documentTypes, setDocumentTypes] = useState<string[]>([])
  
  useEffect(() => {
    if (isTechnician) {
      supabase
        .from('documents')
        .select('doc_type')
        .eq('technician_id', profile.id)
        .then(({ data, count }) => {
          setDocumentsCount(data?.length || 0)
          setDocumentTypes((data || []).map(d => d.doc_type))
        })
    }
  }, [isTechnician, profile.id])

  // Check and grant premium automatically when profile appears complete
  useEffect(() => {
    if (isTechnician && !premiumChecked && documentsCount > 0 && availabilitySlots.length > 0) {
      // Check basic license
      const basicLicenseTypes = ['easa_license', 'uk_license', 'faa_ap']
      const hasBasicLicense = basicLicenseTypes.some(type => documentTypes.includes(type))
      
      // Check aircraft docs
      const aircraftTypes = technician?.aircraft_types || []
      let hasAllAircraftDocs = true

      for (const series of getUniqueSeries(aircraftTypes)) {
        if (!isTypeRatingDocSetComplete(documentTypes, series)) {
          hasAllAircraftDocs = false
          break
        }
      }
      
      // If profile appears complete, call API to evaluate and grant premium
      if (hasBasicLicense && hasAllAircraftDocs) {
        setPremiumChecked(true)
        
        fetch('/api/premium/evaluate', { method: 'POST' })
          .then(res => res.json())
          .then(data => {
            console.log('Premium evaluate response:', data)
            if (data.premiumGranted) {
              setPremiumGranted(true)
              setShowPremiumToast(true)
              setTimeout(() => setShowPremiumToast(false), 8000)
            }
          })
          .catch(err => console.error('Premium check error:', err))
      }
    }
  }, [isTechnician, technician, availabilitySlots, documentsCount, documentTypes, premiumChecked])

  const profileCompletion = isTechnician 
    ? getProfileCompletion(technician, availabilitySlots, documentsCount, documentTypes)
    : null

  const reminderTexts = {
    es: {
      completeProfile: 'Completa tu perfil para desbloquear más oportunidades.',
      addBasicLicense: 'Sube tu licencia básica (EASA, UK CAA o FAA)',
      addAircraftDocs: 'Sube documentos teórico + práctico de tus aviones',
      addAvailability: 'Añade tus períodos de disponibilidad',
      profileProgress: 'Perfil completado',
      goTo: 'Ir a'
    },
    en: {
      completeProfile: 'Complete your profile to unlock more opportunities.',
      addBasicLicense: 'Upload your basic license (EASA, UK CAA or FAA)',
      addAircraftDocs: 'Upload theory + practical docs for your aircraft',
      addAvailability: 'Add your availability periods',
      profileProgress: 'Profile completed',
      goTo: 'Go to'
    }
  }
  const rt = reminderTexts[language] || reminderTexts.en

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordError(null)

    if (newPassword !== confirmPassword) {
      setPasswordError(language === 'es' ? 'Las contraseñas no coinciden' : 'Passwords do not match')
      return
    }

    if (newPassword.length < 6) {
      setPasswordError(language === 'es' ? 'Mínimo 6 caracteres' : 'Minimum 6 characters')
      return
    }

    setPasswordLoading(true)

    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword })
      if (error) throw error

      setPasswordSuccess(true)
      setNewPassword('')
      setConfirmPassword('')
      setTimeout(() => {
        setPasswordSuccess(false)
        setShowPasswordForm(false)
      }, 2000)
    } catch (err: any) {
      setPasswordError(err.message)
    } finally {
      setPasswordLoading(false)
    }
  }

  const dismissReminder = (key: string) => {
    setDismissedReminders([...dismissedReminders, key])
  }

  // Generate active reminders for technicians
  const getActiveReminders = () => {
    if (!isTechnician || !profileCompletion) return []
    
    const reminders = []
    
    if (!profileCompletion.checks.basicLicense && !dismissedReminders.includes('basicLicense')) {
      reminders.push({
        key: 'basicLicense',
        text: rt.addBasicLicense,
        link: '/profile/documents',
        icon: '🛡️',
        priority: 1
      })
    }
    
    if (!profileCompletion.checks.aircraftDocs && !dismissedReminders.includes('aircraftDocs')) {
      reminders.push({
        key: 'aircraftDocs',
        text: rt.addAircraftDocs,
        link: '/profile/documents',
        icon: '✈️',
        priority: 2
      })
    }
    
    if (!profileCompletion.checks.availability && !dismissedReminders.includes('availability')) {
      reminders.push({
        key: 'availability',
        text: rt.addAvailability,
        link: '/profile/availability',
        icon: '📅',
        priority: 3
      })
    }
    
    return reminders.sort((a, b) => a.priority - b.priority)
  }

  const activeReminders = getActiveReminders()

  const premiumToastText = {
    es: '🎉 ¡Premium activado por 12 meses! Gracias por completar tu perfil antes del lanzamiento.',
    en: '🎉 Premium activated for 12 months! Thanks for completing your profile before launch.'
  }

  const renderStars = (value: number | null) => {
    if (typeof value !== 'number') return '—'
    const rounded = Math.round(value)
    return `${'★'.repeat(rounded)}${'☆'.repeat(5 - rounded)}`
  }

  const createTestOffer = async () => {
    if (creatingTestOffer) return
    setCreatingTestOffer(true)
    try {
      const response = await fetch('/api/job-requests/test', { method: 'POST' })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'No se pudo crear la oferta de prueba')
      setShowTestOfferEmailMessage(true)
    } catch (err: any) {
      alert(err?.message || 'Error al crear oferta de prueba')
    } finally {
      setCreatingTestOffer(false)
    }
  }

  return (
    <AppLayout userEmail={profile.email} userRole={profile.role}>
      {/* Premium Granted Toast */}
      {showPremiumToast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 animate-pulse">
          <div className="bg-gradient-to-r from-gold-600 to-gold-500 text-navy-950 px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 max-w-md">
            <span className="text-2xl">🎁</span>
            <p className="font-medium text-sm">
              {premiumToastText[language] || premiumToastText.en}
            </p>
            <button 
              onClick={() => setShowPremiumToast(false)}
              className="ml-2 text-navy-950/60 hover:text-navy-950"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {showTestOfferEmailMessage && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50">
          <div className="bg-navy-800 border border-gold-500/40 text-white px-6 py-4 rounded-xl shadow-2xl flex items-start gap-3 max-w-lg">
            <span className="text-xl flex-shrink-0">📧</span>
            <p className="font-medium text-sm text-steel-100">
              {language === 'es'
                ? 'Te hemos enviado una oferta de prueba a tu email. Ábrela y sigue el proceso desde ahí.'
                : 'We sent a test offer to your email. Open it and continue the flow from there.'}
            </p>
            <button
              type="button"
              onClick={() => setShowTestOfferEmailMessage(false)}
              className="ml-1 text-steel-500 hover:text-white flex-shrink-0"
              aria-label={language === 'es' ? 'Cerrar' : 'Close'}
            >
              ✕
            </button>
          </div>
        </div>
      )}

      <div className="p-6 lg:p-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
            {t.dashboard.welcome}, {profile.full_name}
          </h1>
          <p className="text-steel-400">
            {isTechnician ? t.dashboard.technicianSubtitle : t.dashboard.companySubtitle}
          </p>
        </div>

        {/* Verification Progress Widget - For technicians */}
        {isTechnician && (
          <div className="mb-8">
            <VerificationProgressWidget 
              language={language}
              profileComplete={profileCompletion ? profileCompletion.percentage >= 100 : false}
              documentsCount={documentsCount}
              verificationStatus={(technician?.verification_status || 'unverified') as VerificationStatus}
            />
          </div>
        )}

        {/* Profile Completion Banner - Only for technicians with incomplete profile */}
        {isTechnician && profileCompletion && profileCompletion.percentage < 100 && (
          <div className="mb-8 p-5 rounded-xl bg-gradient-to-r from-gold-500/10 via-gold-500/5 to-transparent border border-gold-500/30">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-gold-500/20 border border-gold-500/40 flex items-center justify-center flex-shrink-0">
                <span className="text-xl">⚡</span>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-white mb-1">
                  {rt.completeProfile}
                </h3>
                <p className="text-sm text-steel-400 mb-4">
                  {rt.profileProgress}: {profileCompletion.percentage}%
                </p>
                
                {/* Progress bar */}
                <div className="w-full h-2 bg-navy-800 rounded-full overflow-hidden mb-4">
                  <div 
                    className="h-full bg-gradient-to-r from-gold-500 to-gold-400 rounded-full transition-all duration-500"
                    style={{ width: `${profileCompletion.percentage}%` }}
                  />
                </div>

                {/* Reminder cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {activeReminders.slice(0, 4).map((reminder) => (
                    <Link
                      key={reminder.key}
                      href={reminder.link}
                      className="group flex items-center gap-3 p-3 rounded-lg bg-navy-800/60 border border-steel-700/30 hover:border-gold-500/50 hover:bg-navy-800 transition-all"
                    >
                      <span className="text-lg">{reminder.icon}</span>
                      <span className="text-sm text-steel-300 group-hover:text-white transition-colors flex-1">
                        {reminder.text}
                      </span>
                      <svg className="w-4 h-4 text-gold-500/50 group-hover:text-gold-400 group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-white mb-4">{t.dashboard.quickActions}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {isTechnician ? (
              <>
                <Link href="/profile" className="card-action-primary p-5 group relative">
                  {/* Notification badge if profile incomplete */}
                  {profileCompletion && profileCompletion.percentage < 100 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-gold-500 rounded-full flex items-center justify-center text-[10px] font-bold text-navy-900">
                      !
                    </span>
                  )}
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gold-500/10 border border-gold-500/30 flex items-center justify-center">
                      <svg className="w-5 h-5 text-gold-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium text-white group-hover:text-gold-300 transition-colors">{t.nav.myProfile}</p>
                      <p className="text-xs text-steel-500">{t.dashboard.updateInfo}</p>
                    </div>
                    <svg className="w-5 h-5 text-gold-500/50 ml-auto group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </Link>

                <Link href="/profile/availability" className="card-action-primary p-5 group relative">
                  {availabilitySlots.length === 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-warning-500 rounded-full flex items-center justify-center text-[10px] font-bold text-navy-900">
                      !
                    </span>
                  )}
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gold-500/10 border border-gold-500/30 flex items-center justify-center">
                      <svg className="w-5 h-5 text-gold-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium text-white group-hover:text-gold-300 transition-colors">{t.dashboard.availability}</p>
                      <p className="text-xs text-steel-500">{availabilitySlots.length} {t.dashboard.activePeriods}</p>
                    </div>
                    <svg className="w-5 h-5 text-gold-500/50 ml-auto group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </Link>

                <Link href="/profile/documents" className="card-action-primary p-5 group relative">
                  {documentsCount === 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-warning-500 rounded-full flex items-center justify-center text-[10px] font-bold text-navy-900">
                      !
                    </span>
                  )}
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gold-500/10 border border-gold-500/30 flex items-center justify-center">
                      <svg className="w-5 h-5 text-gold-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium text-white group-hover:text-gold-300 transition-colors">{t.dashboard.documents}</p>
                      <p className="text-xs text-steel-500">{t.dashboard.manageCerts}</p>
                    </div>
                    <svg className="w-5 h-5 text-gold-500/50 ml-auto group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </Link>
              </>
            ) : (
              <>
                <Link href="/search" className="card-action-primary p-5 group">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gold-500/10 border border-gold-500/30 flex items-center justify-center">
                      <svg className="w-5 h-5 text-gold-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium text-white group-hover:text-gold-300 transition-colors">{t.dashboard.searchTechnicians}</p>
                      <p className="text-xs text-steel-500">{t.dashboard.findTalent}</p>
                    </div>
                    <svg className="w-5 h-5 text-gold-500/50 ml-auto group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </Link>

                <Link href="/requests" className="card-action-primary p-5 group">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gold-500/10 border border-gold-500/30 flex items-center justify-center">
                      <svg className="w-5 h-5 text-gold-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 4H6a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-2m-4-1v8m0 0l3-3m-3 3L9 8" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium text-white group-hover:text-gold-300 transition-colors">{t.dashboard.myRequests}</p>
                      <p className="text-xs text-steel-500">{pendingRequests.length} {t.dashboard.requests}</p>
                    </div>
                    <svg className="w-5 h-5 text-gold-500/50 ml-auto group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </Link>
              </>
            )}
          </div>
          {isTechnician && canUseTestOffer && (
            <div className="mt-4">
              <button onClick={createTestOffer} disabled={creatingTestOffer} className="btn-secondary">
                {creatingTestOffer
                  ? (language === 'es' ? 'Creando oferta de prueba...' : 'Creating test offer...')
                  : (language === 'es' ? '¿Cómo funciona una oferta?' : 'How does an offer work?')}
              </button>
            </div>
          )}
        </div>

        {/* Subscription Section */}
        <div className="mb-8">
          <SubscriptionSection userRole={profile.role} />
        </div>

        {/* Status Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pending Requests */}
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-white mb-4">
              {isTechnician ? t.dashboard.pendingRequests : t.dashboard.recentRequests}
            </h3>
            {pendingRequests.length === 0 ? (
              <p className="text-steel-500 text-sm">{t.dashboard.noRequests}</p>
            ) : (
              <div className="space-y-3">
                {pendingRequests.slice(0, 3).map((request: any) => (
                  <div key={request.id} className="p-3 bg-navy-800/50 rounded-lg border border-steel-700/30">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-white">{request.final_client_name}</span>
                      <span className={`text-xs px-2 py-0.5 rounded ${
                        request.status === 'pending' ? 'bg-warning-500/20 text-warning-400' :
                        request.status === 'accepted' ? 'bg-success-500/20 text-success-400' :
                        'bg-steel-700/50 text-steel-400'
                      }`}>
                        {request.status === 'pending' ? t.common.pending : 
                         request.status === 'accepted' ? t.common.accepted : request.status}
                      </span>
                    </div>
                    <p className="text-xs text-steel-500">
                      {new Date(request.start_date).toLocaleDateString(language === 'es' ? 'es-ES' : 'en-GB')} - {new Date(request.end_date).toLocaleDateString(language === 'es' ? 'es-ES' : 'en-GB')}
                    </p>
                  </div>
                ))}
              </div>
            )}
            <Link href="/requests" className="block mt-4 text-sm text-gold-400 hover:text-gold-300 transition-colors">
              {t.dashboard.viewAll} →
            </Link>
          </div>

          {/* Profile/Company Status */}
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-white mb-4">
              {isTechnician ? t.dashboard.profileStatus : t.dashboard.companyInfo}
            </h3>
            {isTechnician && technician ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-steel-400">{t.dashboard.licenses}</span>
                  <span className="text-sm text-white">
                    {technician.license_category?.length > 0 
                      ? technician.license_category.join(', ') 
                      : <span className="text-warning-400">{t.dashboard.notSpecified}</span>}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-steel-400">{t.dashboard.availabilityStatus}</span>
                  <span className={`text-sm ${technician.is_available ? 'text-success-400' : 'text-steel-500'}`}>
                    {technician.is_available ? t.dashboard.available : t.dashboard.notAvailable}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-steel-400">{t.dashboard.activePeriods}</span>
                  <span className={`text-sm ${availabilitySlots.length > 0 ? 'text-white' : 'text-warning-400'}`}>
                    {availabilitySlots.length > 0 ? availabilitySlots.length : t.dashboard.notSpecified}
                  </span>
                </div>
                {profileCompletion && (
                  <div className="pt-3 mt-3 border-t border-steel-700/40">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-steel-400">{rt.profileProgress}</span>
                      <span className={`text-sm font-medium ${
                        profileCompletion.percentage === 100 ? 'text-success-400' : 'text-gold-400'
                      }`}>
                        {profileCompletion.percentage}%
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-navy-800 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${
                          profileCompletion.percentage === 100 
                            ? 'bg-success-500' 
                            : 'bg-gradient-to-r from-gold-500 to-gold-400'
                        }`}
                        style={{ width: `${profileCompletion.percentage}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            ) : company ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-steel-400">{t.dashboard.company}</span>
                  <span className="text-sm text-white">{company.company_name}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-steel-400">{t.dashboard.type}</span>
                  <span className="text-sm text-white">{company.company_type}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-steel-400">{t.dashboard.country}</span>
                  <span className="text-sm text-white">{company.hq_country}</span>
                </div>
              </div>
            ) : (
              <p className="text-steel-500 text-sm">{t.dashboard.infoNotAvailable}</p>
            )}
          </div>
        </div>

        {/* Technician Ratings */}
        {isTechnician && ratingsSummary && (
          <div className="mt-8 card p-6">
            <h3 className="text-lg font-semibold text-white mb-4">
              {language === 'es' ? 'Mis valoraciones' : 'My Ratings'}
            </h3>
            <div className="mb-4 p-4 rounded-lg bg-navy-800/50 border border-steel-700/30">
              <p className="text-sm text-steel-400">
                {language === 'es' ? 'Puntuación media general' : 'Overall average score'}
              </p>
              <p className="text-2xl font-bold text-gold-400">
                {ratingsSummary.overall ? `${ratingsSummary.overall.toFixed(1)} / 5` : '—'}
              </p>
              <p className="text-sm text-steel-300 mt-1">{renderStars(ratingsSummary.overall)}</p>
              <p className="text-xs text-steel-500 mt-2">
                {language === 'es'
                  ? `Total valoraciones: ${ratingsSummary.count}`
                  : `Total ratings: ${ratingsSummary.count}`}
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              {[
                { key: 'punctuality', label: language === 'es' ? 'Puntualidad y disponibilidad' : 'Punctuality and availability', value: ratingsSummary.punctuality },
                { key: 'documentation', label: language === 'es' ? 'Documentación en regla' : 'Documentation in order', value: ratingsSummary.documentation },
                { key: 'technical', label: language === 'es' ? 'Competencia técnica' : 'Technical competence', value: ratingsSummary.technical },
                { key: 'communication', label: language === 'es' ? 'Comunicación' : 'Communication', value: ratingsSummary.communication },
                { key: 'safety', label: language === 'es' ? 'Cumplimiento de procedimientos de seguridad' : 'Safety procedures compliance', value: ratingsSummary.safety },
              ].map((row) => (
                <div key={row.key} className="p-3 rounded-lg bg-navy-800/40 border border-steel-700/30">
                  <p className="text-steel-400">{row.label}</p>
                  <p className="text-white font-medium">
                    {typeof row.value === 'number' ? `${row.value.toFixed(1)} / 5` : '—'}
                  </p>
                </div>
              ))}
            </div>
            {[
              ratingsSummary.punctuality !== null && ratingsSummary.punctuality < 3 ? (language === 'es' ? 'Mejora puntualidad/disponibilidad: confirma fechas con antelación y mantén respuesta rápida.' : 'Improve punctuality/availability: confirm dates in advance and reply quickly.') : null,
              ratingsSummary.documentation !== null && ratingsSummary.documentation < 3 ? (language === 'es' ? 'Mejora documentación: revisa vigencias y sube versiones actualizadas.' : 'Improve documentation: check expirations and upload updated files.') : null,
              ratingsSummary.technical !== null && ratingsSummary.technical < 3 ? (language === 'es' ? 'Mejora competencia técnica: refuerza formación específica de tipo y tareas críticas.' : 'Improve technical competence: reinforce type-specific and critical-task training.') : null,
              ratingsSummary.communication !== null && ratingsSummary.communication < 3 ? (language === 'es' ? 'Mejora comunicación: reporta estado diario y confirma instrucciones por escrito.' : 'Improve communication: report status daily and confirm instructions in writing.') : null,
              ratingsSummary.safety !== null && ratingsSummary.safety < 3 ? (language === 'es' ? 'Mejora seguridad: repasa SOPs y registra cumplimiento de procedimientos.' : 'Improve safety: review SOPs and record procedure compliance.') : null,
            ].filter(Boolean).length > 0 && (
              <div className="mt-4 p-4 rounded-lg bg-warning-500/10 border border-warning-500/30">
                <p className="text-sm font-medium text-warning-400 mb-2">
                  {language === 'es' ? 'Orientación privada de mejora (solo visible para ti)' : 'Private improvement guidance (visible only to you)'}
                </p>
                <ul className="text-sm text-steel-300 space-y-1">
                  {[
                    ratingsSummary.punctuality !== null && ratingsSummary.punctuality < 3 ? (language === 'es' ? 'Mejora puntualidad/disponibilidad: confirma fechas con antelación y mantén respuesta rápida.' : 'Improve punctuality/availability: confirm dates in advance and reply quickly.') : null,
                    ratingsSummary.documentation !== null && ratingsSummary.documentation < 3 ? (language === 'es' ? 'Mejora documentación: revisa vigencias y sube versiones actualizadas.' : 'Improve documentation: check expirations and upload updated files.') : null,
                    ratingsSummary.technical !== null && ratingsSummary.technical < 3 ? (language === 'es' ? 'Mejora competencia técnica: refuerza formación específica de tipo y tareas críticas.' : 'Improve technical competence: reinforce type-specific and critical-task training.') : null,
                    ratingsSummary.communication !== null && ratingsSummary.communication < 3 ? (language === 'es' ? 'Mejora comunicación: reporta estado diario y confirma instrucciones por escrito.' : 'Improve communication: report status daily and confirm instructions in writing.') : null,
                    ratingsSummary.safety !== null && ratingsSummary.safety < 3 ? (language === 'es' ? 'Mejora seguridad: repasa SOPs y registra cumplimiento de procedimientos.' : 'Improve safety: review SOPs and record procedure compliance.') : null,
                  ].filter(Boolean).map((tip, idx) => (
                    <li key={idx}>• {tip}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Settings Section - Company only */}
        {!isTechnician && (
          <div className="mt-8">
            <h2 className="text-lg font-semibold text-white mb-4">
              {language === 'es' ? 'Configuración' : 'Settings'}
            </h2>
            <div className="card p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-white">
                    {language === 'es' ? 'Cambiar Contraseña' : 'Change Password'}
                  </h3>
                  <p className="text-sm text-steel-400">
                    {language === 'es' ? 'Actualiza tu contraseña de acceso' : 'Update your access password'}
                  </p>
                </div>
                {!showPasswordForm && (
                  <button
                    onClick={() => setShowPasswordForm(true)}
                    className="btn-secondary"
                  >
                    {language === 'es' ? 'Cambiar' : 'Change'}
                  </button>
                )}
              </div>

              {showPasswordForm && (
                <form onSubmit={handlePasswordChange} className="mt-4 pt-4 border-t border-steel-700/40 space-y-4">
                  <div>
                    <label className="label">
                      {language === 'es' ? 'Nueva contraseña' : 'New password'}
                    </label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="input"
                      placeholder="••••••••"
                      required
                      minLength={6}
                    />
                  </div>
                  <div>
                    <label className="label">
                      {language === 'es' ? 'Confirmar contraseña' : 'Confirm password'}
                    </label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="input"
                      placeholder="••••••••"
                      required
                      minLength={6}
                    />
                  </div>

                  {passwordError && (
                    <div className="p-3 rounded-md bg-error-600/20 border border-error-500/30 text-error-400 text-sm">
                      {passwordError}
                    </div>
                  )}

                  {passwordSuccess && (
                    <div className="p-3 rounded-md bg-success-600/20 border border-success-500/30 text-success-400 text-sm">
                      {language === 'es' ? '¡Contraseña actualizada!' : 'Password updated!'}
                    </div>
                  )}

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setShowPasswordForm(false)
                        setNewPassword('')
                        setConfirmPassword('')
                        setPasswordError(null)
                      }}
                      className="btn-ghost"
                    >
                      {t.common.cancel}
                    </button>
                    <button
                      type="submit"
                      disabled={passwordLoading}
                      className="btn-primary-filled"
                    >
                      {passwordLoading 
                        ? t.common.processing 
                        : (language === 'es' ? 'Actualizar' : 'Update')
                      }
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  )
}
