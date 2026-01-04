'use client'

import Link from 'next/link'
import { AppLayout } from '@/components/ui/AppLayout'
import { useLanguage } from '@/lib/i18n/LanguageContext'

interface MyProfileViewProps {
  profile: any
  technician: any
  documents: any[]
  availabilitySlots: any[]
}

export function MyProfileView({ profile, technician, documents, availabilitySlots }: MyProfileViewProps) {
  const { t, language } = useLanguage()

  const uploadedDocs = documents.filter(d => d.status === 'uploaded' || d.status === 'verified')
  const verifiedDocs = documents.filter(d => d.status === 'verified')
  
  // Check if has at least one basic license (minimum requirement)
  const basicLicenseTypes = ['easa_license', 'uk_license', 'faa_ap']
  const hasBasicLicense = documents.some(d => basicLicenseTypes.includes(d.doc_type))
  
  // Documents are complete if user has at least one basic license uploaded
  const documentsComplete = hasBasicLicense

  // Check if profile is verified (has verified docs)
  const isVerified = verifiedDocs.length > 0

  return (
    <AppLayout userEmail={profile?.email} userRole={profile?.role}>
      <div className="p-6 lg:p-8 max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">{t.profile.title}</h1>
            <p className="text-steel-400 text-sm mt-1">{t.profile.subtitle}</p>
          </div>
          <Link href="/profile/edit" className="btn-primary-filled">
            {t.profile.editProfile}
          </Link>
        </div>

        {/* Verification Badge */}
        <div className="card p-5 mb-6">
          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 rounded-full flex items-center justify-center ${
              isVerified 
                ? 'bg-success-500/20 border-2 border-success-500/50' 
                : 'bg-warning-500/10 border-2 border-warning-500/30'
            }`}>
              {isVerified ? (
                <svg className="w-7 h-7 text-success-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              ) : (
                <svg className="w-7 h-7 text-warning-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
            </div>
            <div>
              <p className="text-lg font-semibold text-white">
                {isVerified ? t.profile.verified : t.profile.pending}
              </p>
              <p className="text-sm text-steel-400">
                {t.profile.verification}
              </p>
            </div>
            {!isVerified && (
              <Link href="/profile/documents" className="ml-auto btn-secondary text-sm">
                {t.dashboard.documents}
              </Link>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Licenses - Blue chips to match Type Ratings */}
          <div className="card p-5">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-gold-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              {t.profile.licenses}
            </h3>
            <div className="flex flex-wrap gap-2">
              {technician?.license_category?.length > 0 ? (
                technician.license_category.map((lic: string) => (
                  <span key={lic} className="chip-blue">
                    {lic}
                  </span>
                ))
              ) : (
                <span className="text-steel-500">{t.dashboard.notSpecified}</span>
              )}
            </div>
          </div>

          {/* Aircraft Types - Blue chips */}
          <div className="card p-5">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-gold-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
              {t.profile.aircraftTypes}
            </h3>
            <div className="flex flex-wrap gap-2">
              {technician?.aircraft_types?.length > 0 ? (
                technician.aircraft_types.map((ac: string) => (
                  <span key={ac} className="chip-blue">
                    {ac}
                  </span>
                ))
              ) : (
                <span className="text-steel-500">{t.dashboard.notSpecified}</span>
              )}
            </div>
          </div>

          {/* Specialties - Blue chips */}
          <div className="card p-5">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-gold-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
              </svg>
              {t.profile.specialties}
            </h3>
            <div className="flex flex-wrap gap-2">
              {technician?.specialties?.length > 0 ? (
                technician.specialties.map((spec: string) => (
                  <span key={spec} className="chip-blue">
                    {spec}
                  </span>
                ))
              ) : (
                <span className="text-steel-500">{t.dashboard.notSpecified}</span>
              )}
            </div>
          </div>

          {/* Operational Details */}
          <div className="card p-5">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-gold-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {t.profile.operationalDetails}
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-steel-400">{t.profile.ownTools}</span>
                <span className={technician?.own_tools ? 'text-success-400' : 'text-steel-500'}>
                  {technician?.own_tools ? t.profile.yes : t.profile.no}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-steel-400">{t.profile.rightToWorkUK}</span>
                <span className={technician?.right_to_work_uk ? 'text-success-400' : 'text-steel-500'}>
                  {technician?.right_to_work_uk ? t.profile.yes : t.profile.no}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-steel-400">{language === 'es' ? 'Licencia UK CAA' : 'UK CAA License'}</span>
                {technician?.uk_license ? (
                  <span className="chip-selected text-xs">
                    <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    UK
                  </span>
                ) : (
                  <span className="text-steel-500">{t.profile.no}</span>
                )}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-steel-400">{t.profile.drivingLicense}</span>
                <span className={technician?.driving_license ? 'text-success-400' : 'text-steel-500'}>
                  {technician?.driving_license ? t.profile.yes : t.profile.no}
                </span>
              </div>
              {technician?.languages?.length > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-steel-400">{t.profile.languages}</span>
                  <span className="text-white">{technician.languages.join(', ')}</span>
                </div>
              )}
              {technician?.min_daily_rate_eur && (
                <div className="flex items-center justify-between">
                  <span className="text-steel-400">{t.profile.minDailyRate}</span>
                  <span className="text-white">€{technician.min_daily_rate_eur}/day</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Availability Summary */}
        <div className="card p-5 mt-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <svg className="w-5 h-5 text-gold-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              {t.dashboard.availability}
            </h3>
            <Link href="/profile/availability" className="btn-secondary text-sm">
              {t.common.edit}
            </Link>
          </div>
          
          {availabilitySlots.length > 0 ? (
            <div className="space-y-2">
              {availabilitySlots.slice(0, 3).map((slot: any) => (
                <div key={slot.id} className="flex items-center justify-between p-3 bg-navy-800/50 rounded-lg">
                  <span className="text-white">
                    {new Date(slot.start_date).toLocaleDateString(language === 'es' ? 'es-ES' : 'en-GB', { 
                      day: 'numeric', month: 'short', year: 'numeric' 
                    })}
                    {' — '}
                    {new Date(slot.end_date).toLocaleDateString(language === 'es' ? 'es-ES' : 'en-GB', { 
                      day: 'numeric', month: 'short', year: 'numeric' 
                    })}
                  </span>
                  <span className="text-success-400 text-sm">{t.dashboard.available}</span>
                </div>
              ))}
              {availabilitySlots.length > 3 && (
                <Link href="/profile/availability" className="block text-sm text-gold-400 hover:text-gold-300 mt-2">
                  +{availabilitySlots.length - 3} {t.documents.more} →
                </Link>
              )}
            </div>
          ) : (
            <p className="text-steel-500">{t.availability.noActivePeriods}</p>
          )}
        </div>

        {/* Documents Summary */}
        <div className="card p-5 mt-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <svg className="w-5 h-5 text-gold-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              {t.profile.documents}
            </h3>
            <Link href="/profile/documents" className="btn-secondary text-sm">
              {t.common.edit}
            </Link>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-success-500/20 flex items-center justify-center">
                <svg className="w-4 h-4 text-success-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <span className="text-white">{uploadedDocs.length} {t.profile.documentsUploaded}</span>
            </div>
            {!documentsComplete && (
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-warning-500/20 flex items-center justify-center">
                  <svg className="w-4 h-4 text-warning-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <span className="text-warning-400">{language === 'es' ? 'Falta licencia básica' : 'Basic license missing'}</span>
              </div>
            )}
            {documentsComplete && (
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-success-500/20 flex items-center justify-center">
                  <svg className="w-4 h-4 text-success-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-success-400">{language === 'es' ? 'Documentos completos' : 'Documents complete'}</span>
              </div>
            )}
          </div>
        </div>

        {/* Download PDF - Stub */}
        <div className="card p-5 mt-6">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-white">{t.profile.downloadPdf}</h4>
              <p className="text-sm text-steel-500">{t.documents.pdfDescription}</p>
            </div>
            <button className="btn-secondary opacity-50 cursor-not-allowed" disabled>
              {t.profile.comingSoon}
            </button>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}

