'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { AppLayout } from '@/components/ui/AppLayout'
import { useLanguage } from '@/lib/i18n/LanguageContext'

interface Document {
  id: string
  doc_type: string
  status: 'uploaded' | 'pending_verification' | 'verified' | 'rejected' | 'expired'
  storage_path: string
  file_name?: string
  expires_on: string | null
  created_at: string
  is_deleted?: boolean
}

// Simplified license structure
const LICENSE_TYPES = [
  { key: 'easa_license', label: 'EASA License', description: 'European Aviation Safety Agency license (covers B1/B2/C)', required: true },
  { key: 'uk_license', label: 'UK CAA License', description: 'UK Civil Aviation Authority license', required: false },
  { key: 'faa_ap', label: 'FAA A&P', description: 'FAA Airframe & Powerplant certificate', required: false },
]

// Type rating extras options
const TYPE_RATING_EXTRAS = [
  { key: 'runup', label: 'Run-up' },
  { key: 'borescope', label: 'Borescope' },
  { key: 'ndt', label: 'NDT' },
  { key: 'engine_specific', label: 'Engine-specific Training' },
  { key: 'custom', label: 'Other (specify)' },
]

// General certificates (excluding run-up/borescope which moved to type ratings)
const GENERAL_CERTIFICATES = [
  { key: 'hf', label: 'Human Factors (HF)' },
  { key: 'ewis', label: 'EWIS' },
  { key: 'fts', label: 'Fuel Tank Safety (FTS)' },
  { key: 'rvsm', label: 'RVSM' },
  { key: 'etops', label: 'ETOPS' },
  { key: 'tank_entry', label: 'Tank Entry' },
  { key: 'dangerous_goods', label: 'Dangerous Goods' },
  { key: 'sms', label: 'SMS Training' },
]

export default function DocumentsPage() {
  const router = useRouter()
  const supabase = createClient()
  const { t, language } = useLanguage()

  const [profile, setProfile] = useState<any>(null)
  const [technician, setTechnician] = useState<any>(null)
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'licenses' | 'ratings' | 'certificates'>('licenses')
  const [selectedExtras, setSelectedExtras] = useState<{[aircraft: string]: string[]}>({})
  const [customExtraText, setCustomExtraText] = useState<{[key: string]: string}>({})

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/auth')
      return
    }

    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    setProfile(profileData)

    const { data: techData } = await supabase
      .from('technicians')
      .select('*')
      .eq('user_id', user.id)
      .single()

    setTechnician(techData)

    const { data: docsData } = await supabase
      .from('documents')
      .select('*')
      .eq('technician_id', user.id)
      .order('created_at', { ascending: false })

    setDocuments(docsData || [])
    setLoading(false)
  }

  const handleUpload = async (docType: string, file: File) => {
    setUploading(docType)
    setError(null)
    setSuccess(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error(t.common.notAuthenticated)

      // Ensure technician record exists (required for FK constraint)
      if (!technician) {
        const { error: techError } = await supabase
          .from('technicians')
          .upsert({
            user_id: user.id,
            license_category: [],
            aircraft_types: [],
            specialties: [],
            languages: [],
            is_available: false,
            visibility_anonymous: true
          }, { onConflict: 'user_id' })
        
        if (techError) {
          console.error('Error creating technician record:', techError)
          throw new Error(language === 'es' ? 'Error al preparar el perfil' : 'Error preparing profile')
        }
        // Reload technician data
        const { data: techData } = await supabase
          .from('technicians')
          .select('*')
          .eq('user_id', user.id)
          .single()
        setTechnician(techData)
      }

      const timestamp = Date.now()
      const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
      const path = `${user.id}/${docType}/${timestamp}-${sanitizedFileName}`

      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(path, file)

      if (uploadError) throw uploadError

      const existing = documents.find(d => d.doc_type === docType)

      if (existing) {
        const { error: dbError } = await supabase
          .from('documents')
          .update({
            storage_path: path,
            file_name: file.name,
            status: 'uploaded'
          })
          .eq('id', existing.id)

        if (dbError) throw dbError
      } else {
        const { error: dbError } = await supabase
          .from('documents')
          .insert({
            technician_id: user.id,
            doc_type: docType,
            status: 'uploaded',
            storage_path: path,
            file_name: file.name
          })

        if (dbError) throw dbError
      }

      await loadData()
      setSuccess(language === 'es' ? 'Documento subido correctamente' : 'Document uploaded successfully')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setUploading(null)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'uploaded':
        return <span className="chip-pending text-xs">{language === 'es' ? 'Subido' : 'Uploaded'}</span>
      case 'pending_verification':
        return <span className="chip-warning text-xs">{language === 'es' ? 'En revisión' : 'In Review'}</span>
      case 'verified':
        return <span className="chip-verified text-xs">{language === 'es' ? 'Verificado' : 'Verified'}</span>
      case 'rejected':
        return <span className="chip-error text-xs">{language === 'es' ? 'Rechazado' : 'Rejected'}</span>
      case 'expired':
        return <span className="chip-error text-xs">{language === 'es' ? 'Caducado' : 'Expired'}</span>
      default:
        return null
    }
  }

  const getDocumentForType = (docType: string) => {
    return documents.find(d => d.doc_type === docType)
  }

  const selectedAircraft = technician?.aircraft_types || []

  const toggleExtra = (aircraft: string, extra: string) => {
    const current = selectedExtras[aircraft] || []
    if (current.includes(extra)) {
      setSelectedExtras({
        ...selectedExtras,
        [aircraft]: current.filter(e => e !== extra)
      })
    } else {
      setSelectedExtras({
        ...selectedExtras,
        [aircraft]: [...current, extra]
      })
    }
  }

  if (loading) {
    return (
      <AppLayout userEmail={profile?.email} userRole={profile?.role}>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-steel-400">{t.common.loading}</div>
        </div>
      </AppLayout>
    )
  }

  // Count verified docs for badge
  const verifiedCount = documents.filter(d => d.status === 'verified').length
  const pendingCount = documents.filter(d => d.status === 'uploaded' || d.status === 'pending_verification').length

  return (
    <AppLayout userEmail={profile?.email} userRole={profile?.role}>
      <div className="p-6 lg:p-8 max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">{t.documents.title}</h1>
            <p className="text-steel-400 text-sm mt-1">{t.documents.subtitle}</p>
          </div>
          
          {/* Verification Status */}
          <div className="flex items-center gap-3">
            {verifiedCount > 0 && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-success-500/10 border-2 border-success-500/30 rounded-lg">
                <svg className="w-4 h-4 text-success-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-xs text-success-400 font-medium">{verifiedCount} {language === 'es' ? 'verificados' : 'verified'}</span>
              </div>
            )}
            {pendingCount > 0 && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-warning-500/10 border border-warning-500/30 rounded-lg">
                <svg className="w-4 h-4 text-warning-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-xs text-warning-400">{pendingCount} {language === 'es' ? 'pendientes' : 'pending'}</span>
              </div>
            )}
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <div className="mb-6 p-4 rounded-lg bg-error-600/20 border border-error-500/30 text-error-400">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 rounded-lg bg-success-600/20 border border-success-500/30 text-success-400">
            {success}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-steel-700/40 pb-4">
          {[
            { key: 'licenses', label: language === 'es' ? 'Licencias' : 'Licenses', icon: '🛡️' },
            { key: 'ratings', label: language === 'es' ? 'Habilitaciones' : 'Type Ratings', icon: '✈️' },
            { key: 'certificates', label: language === 'es' ? 'Certificados' : 'Certificates', icon: '📋' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={activeTab === tab.key ? 'chip-selected' : 'chip-selectable'}
            >
              <span className="mr-1">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Licenses Tab - Simplified */}
        {activeTab === 'licenses' && (
          <div className="space-y-4">
            <p className="text-sm text-steel-400 mb-4">
              {language === 'es' 
                ? 'Sube tu licencia principal. Las categorías B1/B2/C se detectarán automáticamente del documento.' 
                : 'Upload your main license. B1/B2/C categories will be detected automatically from the document.'}
            </p>
            
            {LICENSE_TYPES.map((license) => {
              const doc = getDocumentForType(license.key)
              const isUploading = uploading === license.key

              return (
                <div key={license.key} className="card p-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                        doc?.status === 'verified' 
                          ? 'bg-gold-500/15 border-2 border-gold-500/50' 
                          : doc 
                            ? 'bg-steel-700/30 border-2 border-steel-600/50' 
                            : 'bg-navy-800 border-2 border-steel-700/50'
                      }`}>
                        {doc?.status === 'verified' ? (
                          <svg className="w-6 h-6 text-gold-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                          </svg>
                        ) : (
                          <svg className={`w-6 h-6 ${doc ? 'text-steel-400' : 'text-steel-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium text-white">{license.label}</h3>
                          {license.required && <span className="text-gold-500 text-xs">*</span>}
                        </div>
                        <p className="text-xs text-steel-500 mt-0.5">{license.description}</p>
                        {doc && (
                          <div className="flex items-center gap-2 mt-2">
                            {getStatusBadge(doc.status)}
                            <span className="text-xs text-steel-500">{doc.file_name}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <label className={`btn-secondary text-sm cursor-pointer ${isUploading ? 'opacity-50' : ''}`}>
                      <input
                        type="file"
                        className="hidden"
                        accept=".pdf,.jpg,.jpeg,.png"
                        disabled={isUploading}
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) handleUpload(license.key, file)
                        }}
                      />
                      {isUploading ? t.common.processing : doc ? t.documents.update : t.documents.upload}
                    </label>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Type Ratings Tab */}
        {activeTab === 'ratings' && (
          <div className="space-y-6">
            {selectedAircraft.length === 0 ? (
              <div className="card p-8 text-center">
                <svg className="w-12 h-12 text-steel-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
                <p className="text-steel-400 font-medium">{t.documents.noAircraftSelected}</p>
                <p className="text-steel-500 text-sm mt-1">{t.documents.selectAircraftHint}</p>
              </div>
            ) : (
              selectedAircraft.map((aircraft: string) => {
                const theoryDoc = getDocumentForType(`type_${aircraft.toLowerCase()}_theory`)
                const practicalDoc = getDocumentForType(`type_${aircraft.toLowerCase()}_practical`)
                const aircraftExtras = selectedExtras[aircraft] || []

                return (
                  <div key={aircraft} className="card p-5">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold text-white flex items-center gap-2">
                        <span className="chip-blue">{aircraft}</span>
                        {theoryDoc?.status === 'verified' && practicalDoc?.status === 'verified' && (
                          <span className="chip-verified text-xs">
                            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            {language === 'es' ? 'Completo' : 'Complete'}
                          </span>
                        )}
                      </h3>
                    </div>
                    
                    {/* Required: Theory + Practical */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                      {/* Theory */}
                      <div className="p-4 bg-navy-800/50 rounded-lg border-2 border-steel-700/40">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-white">{t.documents.theoretical}</span>
                            <span className="text-gold-500 text-xs">*</span>
                          </div>
                          {theoryDoc && getStatusBadge(theoryDoc.status)}
                        </div>
                        <p className="text-xs text-steel-500 mb-3">
                          {language === 'es' ? 'Certificado teórico del tipo' : 'Type theoretical certificate'}
                        </p>
                        <label className={`btn-ghost text-xs cursor-pointer w-full justify-center border-2 border-dashed ${
                          theoryDoc?.status === 'verified' ? 'border-gold-500/30' : 'border-steel-600'
                        } py-2`}>
                          <input
                            type="file"
                            className="hidden"
                            accept=".pdf,.jpg,.jpeg,.png"
                            disabled={uploading === `type_${aircraft.toLowerCase()}_theory`}
                            onChange={(e) => {
                              const file = e.target.files?.[0]
                              if (file) handleUpload(`type_${aircraft.toLowerCase()}_theory`, file)
                            }}
                          />
                          {uploading === `type_${aircraft.toLowerCase()}_theory` 
                            ? t.common.processing 
                            : theoryDoc 
                              ? t.documents.update
                              : t.documents.uploadFile
                          }
                        </label>
                      </div>

                      {/* Practical */}
                      <div className="p-4 bg-navy-800/50 rounded-lg border-2 border-steel-700/40">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-white">{t.documents.practical}</span>
                            <span className="text-gold-500 text-xs">*</span>
                          </div>
                          {practicalDoc && getStatusBadge(practicalDoc.status)}
                        </div>
                        <p className="text-xs text-steel-500 mb-3">
                          {language === 'es' ? 'Certificado práctico del tipo' : 'Type practical certificate'}
                        </p>
                        <label className={`btn-ghost text-xs cursor-pointer w-full justify-center border-2 border-dashed ${
                          practicalDoc?.status === 'verified' ? 'border-gold-500/30' : 'border-steel-600'
                        } py-2`}>
                          <input
                            type="file"
                            className="hidden"
                            accept=".pdf,.jpg,.jpeg,.png"
                            disabled={uploading === `type_${aircraft.toLowerCase()}_practical`}
                            onChange={(e) => {
                              const file = e.target.files?.[0]
                              if (file) handleUpload(`type_${aircraft.toLowerCase()}_practical`, file)
                            }}
                          />
                          {uploading === `type_${aircraft.toLowerCase()}_practical` 
                            ? t.common.processing 
                            : practicalDoc 
                              ? t.documents.update
                              : t.documents.uploadFile
                          }
                        </label>
                      </div>
                    </div>

                    {/* Optional Extras */}
                    <div className="border-t border-steel-700/30 pt-4">
                      <p className="text-sm text-steel-400 mb-3">
                        {language === 'es' ? 'Documentación adicional (opcional)' : 'Additional documentation (optional)'}
                      </p>
                      <div className="flex flex-wrap gap-2 mb-4">
                        {TYPE_RATING_EXTRAS.map((extra) => (
                          <button
                            key={extra.key}
                            onClick={() => toggleExtra(aircraft, extra.key)}
                            className={aircraftExtras.includes(extra.key) ? 'chip-selected' : 'chip-selectable'}
                          >
                            {extra.label}
                          </button>
                        ))}
                      </div>

                      {/* Show upload slots for selected extras */}
                      {aircraftExtras.length > 0 && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {aircraftExtras.map((extraKey) => {
                            const extra = TYPE_RATING_EXTRAS.find(e => e.key === extraKey)
                            const extraDoc = getDocumentForType(`type_${aircraft.toLowerCase()}_${extraKey}`)

                            return (
                              <div key={extraKey} className="p-3 bg-navy-800/30 rounded-lg border border-steel-700/30">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-sm text-steel-300">{extra?.label}</span>
                                  {extraDoc && getStatusBadge(extraDoc.status)}
                                </div>
                                {extraKey === 'custom' && (
                                  <input
                                    type="text"
                                    placeholder={language === 'es' ? 'Especificar...' : 'Specify...'}
                                    value={customExtraText[`${aircraft}_${extraKey}`] || ''}
                                    onChange={(e) => setCustomExtraText({
                                      ...customExtraText,
                                      [`${aircraft}_${extraKey}`]: e.target.value
                                    })}
                                    className="input text-xs py-1.5 mb-2"
                                  />
                                )}
                                <label className="btn-ghost text-xs cursor-pointer w-full justify-center border border-dashed border-steel-700 py-1.5">
                                  <input
                                    type="file"
                                    className="hidden"
                                    accept=".pdf,.jpg,.jpeg,.png"
                                    onChange={(e) => {
                                      const file = e.target.files?.[0]
                                      if (file) handleUpload(`type_${aircraft.toLowerCase()}_${extraKey}`, file)
                                    }}
                                  />
                                  {extraDoc ? t.documents.update : t.documents.uploadFile}
                                </label>
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })
            )}
          </div>
        )}

        {/* Certificates Tab */}
        {activeTab === 'certificates' && (
          <div className="space-y-4">
            <p className="text-sm text-steel-400 mb-4">
              {language === 'es' 
                ? 'Certificaciones generales y formación adicional.' 
                : 'General certifications and additional training.'}
            </p>

            {GENERAL_CERTIFICATES.map((cert) => {
              const doc = getDocumentForType(`cert_${cert.key}`)
              const isUploading = uploading === `cert_${cert.key}`

              return (
                <div key={cert.key} className="card p-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        doc?.status === 'verified' 
                          ? 'bg-gold-500/15 border-2 border-gold-500/50' 
                          : doc 
                            ? 'bg-steel-700/30 border border-steel-600/50' 
                            : 'bg-navy-800 border border-steel-700/50'
                      }`}>
                        {doc?.status === 'verified' ? (
                          <svg className="w-5 h-5 text-gold-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          <svg className={`w-5 h-5 ${doc ? 'text-steel-400' : 'text-steel-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        )}
                      </div>
                      <div>
                        <h3 className="font-medium text-white">{cert.label}</h3>
                        {doc && (
                          <div className="flex items-center gap-2 mt-1">
                            {getStatusBadge(doc.status)}
                            <span className="text-xs text-steel-500">{doc.file_name}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <label className={`btn-secondary text-sm cursor-pointer ${isUploading ? 'opacity-50' : ''}`}>
                      <input
                        type="file"
                        className="hidden"
                        accept=".pdf,.jpg,.jpeg,.png"
                        disabled={isUploading}
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) handleUpload(`cert_${cert.key}`, file)
                        }}
                      />
                      {isUploading ? t.common.processing : doc ? t.documents.update : t.documents.upload}
                    </label>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Info Footer */}
        <div className="mt-8 p-4 bg-navy-800/30 rounded-lg">
          <ul className="text-sm text-steel-400 space-y-1">
            <li>• {t.documents.acceptedFormats}</li>
            <li>• {t.documents.maxSize}</li>
            <li>• {t.documents.reviewTime}</li>
          </ul>
        </div>
      </div>
    </AppLayout>
  )
}
