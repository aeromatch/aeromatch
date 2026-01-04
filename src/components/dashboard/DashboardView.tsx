'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { AppLayout } from '@/components/ui/AppLayout'
import { useLanguage } from '@/lib/i18n/LanguageContext'
import { createClient } from '@/lib/supabase/client'
import { SubscriptionSection } from '@/components/billing/SubscriptionSection'

interface DashboardViewProps {
  profile: any
  technician: any
  company: any
  availabilitySlots: any[]
  pendingRequests: any[]
}

// Profile completion checker for technicians
function getProfileCompletion(technician: any, availabilitySlots: any[], documentsCount: number, documentTypes: string[]) {
  // Basic license check
  const basicLicenseTypes = ['easa_license', 'uk_license', 'faa_ap']
  const hasBasicLicense = basicLicenseTypes.some(type => documentTypes.includes(type))
  
  // Aircraft docs check - for each aircraft, need theory + practical
  const aircraftTypes = technician?.aircraft_types || []
  let aircraftDocsComplete = true
  
  for (const aircraft of aircraftTypes) {
    const aircraftLower = aircraft.toLowerCase()
    const hasTheory = documentTypes.includes(`type_${aircraftLower}_theory`)
    const hasPractical = documentTypes.includes(`type_${aircraftLower}_practical`)
    if (!hasTheory || !hasPractical) {
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

export function DashboardView({ profile, technician, company, availabilitySlots, pendingRequests }: DashboardViewProps) {
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
      
      for (const aircraft of aircraftTypes) {
        const aircraftLower = aircraft.toLowerCase()
        const hasTheory = documentTypes.includes(`type_${aircraftLower}_theory`)
        const hasPractical = documentTypes.includes(`type_${aircraftLower}_practical`)
        if (!hasTheory || !hasPractical) {
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
      completeProfile: '¡Completa tu perfil para activar Premium GRATIS!',
      addBasicLicense: 'Sube tu licencia básica (EASA, UK CAA o FAA)',
      addAircraftDocs: 'Sube documentos teórico + práctico de tus aviones',
      addAvailability: 'Añade tus períodos de disponibilidad',
      profileProgress: 'Perfil completado',
      goTo: 'Ir a'
    },
    en: {
      completeProfile: 'Complete your profile to activate FREE Premium!',
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
