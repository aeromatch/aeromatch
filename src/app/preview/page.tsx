'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Logo } from '@/components/ui/Logo'
import { useLanguage, LanguageSwitch } from '@/lib/i18n/LanguageContext'

// Sample technician data for preview
const SAMPLE_TECHNICIAN = {
  id: 'AMX-00023',
  licenses: ['B1.1', 'B2'],
  aircraft_types: ['A320', 'A321', 'A330', 'B737NG'],
  specialties: ['Line Maintenance', 'Avionics', 'Engine'],
  own_tools: true,
  right_to_work_uk: true,
  languages: ['English', 'Spanish', 'Portuguese'],
  availability: [
    { start: '2025-02-01', end: '2025-03-15', status: 'confirmed' },
    { start: '2025-04-01', end: '2025-05-31', status: 'confirmed' },
  ],
  documents: [
    { type: 'EASA License', status: 'verified' },
    { type: 'A320 Theory', status: 'verified' },
    { type: 'A320 Practical', status: 'verified' },
    { type: 'Human Factors', status: 'verified' },
    { type: 'EWIS', status: 'verified' },
    { type: 'B737 Theory', status: 'in_review' },
  ],
  requests: [
    { company: 'MRO Europe', dates: 'Feb 1-15', status: 'pending', location: 'Madrid, Spain' },
    { company: 'Airline Services', dates: 'Mar 1-10', status: 'accepted', location: 'Dublin, Ireland' },
  ]
}

export default function PreviewPage() {
  const { language } = useLanguage()
  const [activeSection, setActiveSection] = useState<'profile' | 'availability' | 'documents' | 'requests'>('profile')

  const labels = {
    previewMode: language === 'es' ? 'Vista Previa' : 'Preview Mode',
    viewOnly: language === 'es' ? 'Solo lectura' : 'View only',
    createAccount: language === 'es' ? 'Crear Cuenta Real' : 'Create Real Account',
    backToHome: language === 'es' ? 'Volver al inicio' : 'Back to Home',
    profile: language === 'es' ? 'Perfil' : 'Profile',
    availability: language === 'es' ? 'Disponibilidad' : 'Availability',
    documents: language === 'es' ? 'Documentos' : 'Documents',
    requests: language === 'es' ? 'Solicitudes' : 'Requests',
    technicianId: language === 'es' ? 'ID Técnico' : 'Technician ID',
    licenses: language === 'es' ? 'Licencias' : 'Licenses',
    aircraftTypes: language === 'es' ? 'Tipos de Aeronave' : 'Aircraft Types',
    specialties: language === 'es' ? 'Especialidades' : 'Specialties',
    operationalDetails: language === 'es' ? 'Detalles Operativos' : 'Operational Details',
    ownTools: language === 'es' ? 'Herramientas propias' : 'Own tools',
    ukRight: language === 'es' ? 'Derecho trabajo UK' : 'UK Work Right',
    languages: language === 'es' ? 'Idiomas' : 'Languages',
    verified: language === 'es' ? 'Verificado' : 'Verified',
    available: language === 'es' ? 'Disponible' : 'Available',
    activePeriods: language === 'es' ? 'Períodos Activos' : 'Active Periods',
    confirmed: language === 'es' ? 'Confirmado' : 'Confirmed',
    inReview: language === 'es' ? 'En revisión' : 'In Review',
    pending: language === 'es' ? 'Pendiente' : 'Pending',
    accepted: language === 'es' ? 'Aceptada' : 'Accepted',
    companyRequests: language === 'es' ? 'Solicitudes de empresas' : 'Company requests',
    actionDisabled: language === 'es' ? 'Las acciones están deshabilitadas en modo vista previa' : 'Actions are disabled in preview mode',
    startToday: language === 'es' ? '¿Quieres empezar?' : 'Ready to start?',
    createAccountDesc: language === 'es' ? 'Crea tu perfil real y conecta con empresas de aviación.' : 'Create your real profile and connect with aviation companies.',
  }

  const sections = [
    { key: 'profile', label: labels.profile, icon: '👤' },
    { key: 'availability', label: labels.availability, icon: '📅' },
    { key: 'documents', label: labels.documents, icon: '📋' },
    { key: 'requests', label: labels.requests, icon: '💼' },
  ]

  return (
    <div className="min-h-screen bg-navy-950">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-navy-950/95 backdrop-blur-md border-b border-steel-800/30">
        <nav className="max-w-6xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/">
              <Logo size="sm" />
            </Link>
            
            <div className="flex items-center gap-4">
              {/* Preview Mode Badge */}
              <div className="flex items-center gap-2 px-4 py-2 bg-steel-800/50 border border-steel-700/50 rounded-lg">
                <svg className="w-4 h-4 text-steel-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                <span className="text-sm text-steel-300 font-medium">{labels.previewMode}</span>
              </div>
              
              <LanguageSwitch />
              
              <Link href="/auth?mode=signup" className="btn-primary-filled text-sm">
                {labels.createAccount}
              </Link>
            </div>
          </div>
        </nav>
      </header>

      <main className="pt-24 pb-12 px-6 lg:px-8 max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar - Section Navigation */}
          <div className="lg:col-span-1">
            <div className="card p-4 sticky top-24">
              <div className="space-y-2">
                {sections.map((section) => (
                  <button
                    key={section.key}
                    onClick={() => setActiveSection(section.key as any)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                      activeSection === section.key
                        ? 'bg-navy-800 text-gold-400 border-l-4 border-l-gold-500'
                        : 'text-steel-400 hover:bg-navy-800/50 hover:text-white'
                    }`}
                  >
                    <span>{section.icon}</span>
                    {section.label}
                  </button>
                ))}
              </div>
              
              <div className="mt-6 pt-6 border-t border-steel-700/40">
                <p className="text-xs text-steel-500 mb-3">{labels.viewOnly}</p>
                <Link href="/" className="btn-ghost text-sm w-full justify-center">
                  {labels.backToHome}
                </Link>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            {/* Profile Header */}
            <div className="card p-6">
              <div className="flex items-center gap-6">
                <div className="w-20 h-20 rounded-full bg-gold-500/15 border-4 border-gold-500/50 flex items-center justify-center">
                  <span className="text-2xl font-bold text-gold-400">
                    {SAMPLE_TECHNICIAN.id.slice(-4)}
                  </span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-2xl font-bold text-white">{SAMPLE_TECHNICIAN.id}</h1>
                    <span className="chip-verified">
                      <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {labels.verified}
                    </span>
                  </div>
                  <p className="text-steel-400">
                    {language === 'es' ? 'Técnico de Mantenimiento Aeronáutico' : 'Aircraft Maintenance Technician'}
                  </p>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-success-500/10 border border-success-500/30 rounded-lg">
                  <div className="w-2.5 h-2.5 rounded-full bg-success-500 animate-pulse"></div>
                  <span className="text-sm text-success-400">{labels.available}</span>
                </div>
              </div>
            </div>

            {/* Profile Section */}
            {activeSection === 'profile' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Licenses */}
                <div className="card p-5">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <svg className="w-5 h-5 text-gold-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                    {labels.licenses}
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {SAMPLE_TECHNICIAN.licenses.map((lic) => (
                      <span key={lic} className="chip-blue">{lic}</span>
                    ))}
                  </div>
                </div>

                {/* Aircraft Types */}
                <div className="card p-5">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <svg className="w-5 h-5 text-gold-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                    {labels.aircraftTypes}
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {SAMPLE_TECHNICIAN.aircraft_types.map((ac) => (
                      <span key={ac} className="chip-blue">{ac}</span>
                    ))}
                  </div>
                </div>

                {/* Specialties */}
                <div className="card p-5">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <svg className="w-5 h-5 text-gold-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                    </svg>
                    {labels.specialties}
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {SAMPLE_TECHNICIAN.specialties.map((spec) => (
                      <span key={spec} className="chip-blue">{spec}</span>
                    ))}
                  </div>
                </div>

                {/* Operational Details */}
                <div className="card p-5">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <svg className="w-5 h-5 text-gold-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {labels.operationalDetails}
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-steel-400">{labels.ownTools}</span>
                      <span className="text-success-400">✓</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-steel-400">{labels.ukRight}</span>
                      <span className="text-success-400">✓</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-steel-400">{labels.languages}</span>
                      <span className="text-white">{SAMPLE_TECHNICIAN.languages.join(', ')}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Availability Section */}
            {activeSection === 'availability' && (
              <div className="card p-6">
                <h3 className="text-lg font-semibold text-white mb-6">{labels.activePeriods}</h3>
                <div className="space-y-4">
                  {SAMPLE_TECHNICIAN.availability.map((slot, i) => (
                    <div key={i} className="flex items-center gap-4 p-4 bg-navy-800/50 rounded-lg border-2 border-success-500/20">
                      <div className="w-12 h-12 rounded-lg bg-success-500/10 border border-success-500/30 flex items-center justify-center">
                        <svg className="w-6 h-6 text-success-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-white">
                          {new Date(slot.start).toLocaleDateString(language === 'es' ? 'es-ES' : 'en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                          {' — '}
                          {new Date(slot.end).toLocaleDateString(language === 'es' ? 'es-ES' : 'en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                        <p className="text-sm text-success-400">{labels.confirmed}</p>
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Disabled action hint */}
                <div className="mt-6 p-4 bg-steel-800/30 rounded-lg border border-steel-700/30">
                  <p className="text-sm text-steel-500 text-center">{labels.actionDisabled}</p>
                </div>
              </div>
            )}

            {/* Documents Section */}
            {activeSection === 'documents' && (
              <div className="card p-6">
                <h3 className="text-lg font-semibold text-white mb-6">{labels.documents}</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {SAMPLE_TECHNICIAN.documents.map((doc, i) => (
                    <div key={i} className={`p-4 rounded-lg border-2 text-center ${
                      doc.status === 'verified' 
                        ? 'bg-gold-500/10 border-gold-500/30' 
                        : 'bg-warning-500/10 border-warning-500/30'
                    }`}>
                      <svg className={`w-8 h-8 mx-auto mb-2 ${
                        doc.status === 'verified' ? 'text-gold-400' : 'text-warning-400'
                      }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        {doc.status === 'verified' ? (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        ) : (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        )}
                      </svg>
                      <p className="text-sm text-white font-medium">{doc.type}</p>
                      <p className={`text-xs mt-1 ${
                        doc.status === 'verified' ? 'text-gold-400' : 'text-warning-400'
                      }`}>
                        {doc.status === 'verified' ? labels.verified : labels.inReview}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Requests Section */}
            {activeSection === 'requests' && (
              <div className="card p-6">
                <h3 className="text-lg font-semibold text-white mb-6">{labels.companyRequests}</h3>
                <div className="space-y-4">
                  {SAMPLE_TECHNICIAN.requests.map((req, i) => (
                    <div key={i} className={`p-5 rounded-lg border-l-4 ${
                      req.status === 'accepted' 
                        ? 'bg-success-500/10 border-l-success-500' 
                        : 'bg-warning-500/10 border-l-warning-500'
                    }`}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-white">{req.company}</span>
                        <span className={`chip ${
                          req.status === 'accepted' ? 'chip-success' : 'chip-warning'
                        }`}>
                          {req.status === 'accepted' ? labels.accepted : labels.pending}
                        </span>
                      </div>
                      <p className="text-sm text-steel-400">{req.location}</p>
                      <p className="text-sm text-steel-500">{req.dates}</p>
                    </div>
                  ))}
                </div>
                
                {/* Disabled action hint */}
                <div className="mt-6 p-4 bg-steel-800/30 rounded-lg border border-steel-700/30">
                  <p className="text-sm text-steel-500 text-center">{labels.actionDisabled}</p>
                </div>
              </div>
            )}

            {/* CTA Card */}
            <div className="card p-8 text-center border-2 border-gold-500/30">
              <h3 className="text-xl font-bold text-white mb-2">{labels.startToday}</h3>
              <p className="text-steel-400 mb-6">{labels.createAccountDesc}</p>
              <div className="flex gap-4 justify-center">
                <Link href="/auth?mode=signup&role=technician" className="btn-primary-filled">
                  {language === 'es' ? 'Soy Técnico' : "I'm a Technician"}
                </Link>
                <Link href="/auth?mode=signup&role=company" className="btn-secondary">
                  {language === 'es' ? 'Soy Empresa' : "I'm a Company"}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
