'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { AppLayout } from '@/components/ui/AppLayout'
import { useLanguage } from '@/lib/i18n/LanguageContext'
import { useAccess } from '@/hooks/useAccess'
import { UpgradeBanner } from '@/components/ui/UpgradeBanner'
import {
  getUniqueSeries,
  typeRatingTheoryKeyFromSeries,
  typeRatingPracticalKeyFromSeries,
  typeRatingCombinedKeyFromSeries,
  typeRatingExtraKeyFromSeries,
  isTypeRatingDocSetComplete,
} from '@/lib/aircraft-series'

interface Document {
  id: string
  doc_type: string
  status: 'pending' | 'checked' | 'not_uploaded'
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

/** Obligatorios para contratación (junto con licencia y logbook) */
const MANDATORY_COURSE_CERTIFICATES = [
  { key: 'hf', label: { es: 'Human Factors (HF)', en: 'Human Factors (HF)' } },
  { key: 'ewis', label: { es: 'EWIS', en: 'EWIS' } },
  { key: 'fts', label: { es: 'Fuel Tank Safety (FTS)', en: 'Fuel Tank Safety (FTS)' } },
]

// Certificados opcionales (en el PDF AMX aparecen como not uploaded si no hay archivo)
const GENERAL_CERTIFICATES = [
  { key: 'rvsm', label: 'RVSM' },
  { key: 'etops', label: 'ETOPS' },
  { key: 'tank_entry', label: 'Tank Entry' },
  { key: 'dangerous_goods', label: 'Dangerous Goods' },
  { key: 'sms', label: 'SMS Training' },
]

// Additional documents (optional, shared only when accepting offers)
const ADDITIONAL_DOCUMENTS = [
  { 
    key: 'cv', 
    label: { es: 'CV / Currículum', en: 'CV / Resume' },
    description: { 
      es: 'Tu currículum profesional. Se compartirá solo cuando aceptes una oferta.', 
      en: 'Your professional resume. Shared only when you accept an offer.' 
    },
    icon: '📄'
  },
  { 
    key: 'driving_license_doc', 
    label: { es: 'Carnet de conducir', en: 'Driving license' },
    description: { 
      es: 'Copia de tu carnet de conducir.', 
      en: 'Copy of your driving license.' 
    },
    icon: '🚗'
  },
  { 
    key: 'avsaf', 
    label: { es: 'AVSAF', en: 'AVSAF' },
    description: { 
      es: 'Documento AVSAF u homologable.', 
      en: 'AVSAF document or equivalent.' 
    },
    icon: '🛡️'
  },
  { 
    key: 'other_additional', 
    label: { es: 'Otros documentos', en: 'Other documents' },
    description: { 
      es: 'Cualquier otra documentación relevante.', 
      en: 'Any other relevant documentation.' 
    },
    icon: '📎'
  },
]

export default function DocumentsPage() {
  const router = useRouter()
  const supabase = createClient()
  const { t, language } = useLanguage()
  const { hasAccess: hasLogbookAccess } = useAccess('logbook')

  const [profile, setProfile] = useState<any>(null)
  const [technician, setTechnician] = useState<any>(null)
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'licenses' | 'ratings' | 'certificates' | 'logbook' | 'additional'>('licenses')
  /** Extras por serie EASA (clave = serie, ej. A318/A319/A320/A321) */
  const [selectedExtras, setSelectedExtras] = useState<{ [series: string]: string[] }>({})
  const [customExtraText, setCustomExtraText] = useState<{[key: string]: string}>({})
  /** Type rating: certificado único vs teórico/práctico separados */
  const [trUploadMode, setTrUploadMode] = useState<Record<string, 'combined' | 'separate'>>({})

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
            status: 'pending'
          })
          .eq('id', existing.id)

        if (dbError) throw dbError
      } else {
        const { error: dbError } = await supabase
          .from('documents')
          .insert({
            technician_id: user.id,
            doc_type: docType,
            status: 'pending',
            storage_path: path,
            file_name: file.name
          })

        if (dbError) throw dbError
      }

      await loadData()
      setSuccess(language === 'es' ? 'Documento subido correctamente' : 'Document uploaded successfully')
      try {
        await fetch('/api/documents/notify-pending', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ docType }),
        })
      } catch {
        /* email opcional; no bloquea */
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setUploading(null)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <span className="chip-warning text-xs">{language === 'es' ? 'Pendiente de verificación' : 'Pending review'}</span>
      case 'checked':
        return <span className="chip-verified text-xs">{language === 'es' ? 'Verificado' : 'Verified'}</span>
      case 'not_uploaded':
        return <span className="chip-pending text-xs">{language === 'es' ? 'No subido' : 'Not uploaded'}</span>
      default:
        return null
    }
  }

  const getDocumentForType = (docType: string) => {
    return documents.find(d => d.doc_type === docType)
  }

  const selectedAircraft = technician?.aircraft_types || []
  const uniqueSeriesForRatings = getUniqueSeries(selectedAircraft)

  const toggleExtra = (series: string, extra: string) => {
    const current = selectedExtras[series] || []
    if (current.includes(extra)) {
      setSelectedExtras({
        ...selectedExtras,
        [series]: current.filter((e) => e !== extra),
      })
    } else {
      setSelectedExtras({
        ...selectedExtras,
        [series]: [...current, extra],
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
  const verifiedCount = documents.filter(d => d.status === 'checked').length
  const pendingCount = documents.filter(d => d.status === 'pending').length

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
        <div className="flex gap-2 mb-6 border-b border-steel-700/40 pb-4 flex-wrap">
          {[
            { key: 'licenses', label: language === 'es' ? 'Licencias' : 'Licenses', icon: '🛡️' },
            { key: 'ratings', label: language === 'es' ? 'Habilitaciones' : 'Type Ratings', icon: '✈️' },
            { key: 'certificates', label: language === 'es' ? 'Certificados' : 'Certificates', icon: '📋' },
            { key: 'logbook', label: language === 'es' ? 'Logbook' : 'Logbook', icon: '📖' },
            { key: 'additional', label: language === 'es' ? 'Adicionales' : 'Additional', icon: '📎' },
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
                        doc?.status === 'checked' 
                          ? 'bg-gold-500/15 border-2 border-gold-500/50' 
                          : doc 
                            ? 'bg-steel-700/30 border-2 border-steel-600/50' 
                            : 'bg-navy-800 border-2 border-steel-700/50'
                      }`}>
                        {doc?.status === 'checked' ? (
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
            {documents.some(
              (d) =>
                d.doc_type === 'type_b757_b767_legacy_theory' ||
                d.doc_type === 'type_b757_b767_legacy_practical'
            ) && (
              <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
                {language === 'es'
                  ? 'Tienes documentos de tipo B757/B767 sin clasificar por modelo. Vuelve a subir el certificado o contacta con soporte para migrar tu expediente.'
                  : 'Your B757/B767 type rating documents could not be split automatically. Please re-upload or contact support.'}
              </div>
            )}
            {selectedAircraft.length === 0 ? (
              <div className="card p-8 text-center">
                <svg className="w-12 h-12 text-steel-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
                <p className="text-steel-400 font-medium">{t.documents.noAircraftSelected}</p>
                <p className="text-steel-500 text-sm mt-1">{t.documents.selectAircraftHint}</p>
              </div>
            ) : (
              uniqueSeriesForRatings.map((series: string) => {
                const theoryKey = typeRatingTheoryKeyFromSeries(series)
                const practicalKey = typeRatingPracticalKeyFromSeries(series)
                const combinedKey = typeRatingCombinedKeyFromSeries(series)
                const theoryDoc = getDocumentForType(theoryKey)
                const practicalDoc = getDocumentForType(practicalKey)
                const combinedDoc = getDocumentForType(combinedKey)
                const seriesExtras = selectedExtras[series] || []
                const mode = trUploadMode[series] ?? 'combined'
                const docTypeList = documents.map((d) => d.doc_type)
                const trComplete = isTypeRatingDocSetComplete(docTypeList, series)

                return (
                  <div key={series} className="card p-5">
                    <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                      <h3 className="font-semibold text-white flex items-center gap-2 flex-wrap">
                        <span className="chip-blue max-w-full break-words">
                          {language === 'es' ? 'Serie' : 'Series'}: {series}
                        </span>
                        {trComplete && (
                          <span className="chip-verified text-xs">
                            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            {language === 'es' ? 'Completo' : 'Complete'}
                          </span>
                        )}
                      </h3>
                    </div>

                    <div className="flex flex-col gap-2 mb-4">
                      <label className="flex items-center gap-2 text-sm text-steel-300 cursor-pointer">
                        <input
                          type="radio"
                          name={`tr-mode-${series.replace(/\//g, '-')}`}
                          checked={mode === 'combined'}
                          onChange={() => setTrUploadMode((m) => ({ ...m, [series]: 'combined' }))}
                          className="text-gold-500"
                        />
                        {language === 'es'
                          ? 'Tengo un solo certificado combinado (teórico + práctico)'
                          : 'I have a single combined certificate (theory + practical)'}
                      </label>
                      <label className="flex items-center gap-2 text-sm text-steel-300 cursor-pointer">
                        <input
                          type="radio"
                          name={`tr-mode-${series.replace(/\//g, '-')}`}
                          checked={mode === 'separate'}
                          onChange={() => setTrUploadMode((m) => ({ ...m, [series]: 'separate' }))}
                          className="text-gold-500"
                        />
                        {language === 'es'
                          ? 'Tengo teórico y práctico en documentos separados'
                          : 'I have separate theory and practical documents'}
                      </label>
                    </div>

                    {mode === 'combined' ? (
                      <div className="p-4 bg-navy-800/50 rounded-lg border-2 border-steel-700/40 mb-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-white">
                            {language === 'es' ? 'Certificado de tipo (combinado)' : 'Type rating certificate (combined)'}
                          </span>
                          {combinedDoc && getStatusBadge(combinedDoc.status)}
                        </div>
                        <p className="text-xs text-steel-500 mb-3">
                          {language === 'es'
                            ? 'Un solo PDF que acredite teórico y práctico para esta serie EASA.'
                            : 'One PDF covering both theory and practical for this EASA series.'}
                        </p>
                        <label
                          className={`btn-ghost text-xs cursor-pointer w-full justify-center border-2 border-dashed ${
                            combinedDoc?.status === 'checked' ? 'border-gold-500/30' : 'border-steel-600'
                          } py-2`}
                        >
                          <input
                            type="file"
                            className="hidden"
                            accept=".pdf,.jpg,.jpeg,.png"
                            disabled={uploading === combinedKey}
                            onChange={(e) => {
                              const file = e.target.files?.[0]
                              if (file) handleUpload(combinedKey, file)
                            }}
                          />
                          {uploading === combinedKey
                            ? t.common.processing
                            : combinedDoc
                              ? t.documents.update
                              : t.documents.uploadFile}
                        </label>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                        <div className="p-4 bg-navy-800/50 rounded-lg border-2 border-steel-700/40">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-white">{t.documents.theoretical}</span>
                              <span className="text-gold-500 text-xs">*</span>
                            </div>
                            {theoryDoc && getStatusBadge(theoryDoc.status)}
                          </div>
                          <p className="text-xs text-steel-500 mb-3">
                            {language === 'es' ? 'Certificado teórico del tipo (serie EASA)' : 'Type theoretical certificate (EASA series)'}
                          </p>
                          <label
                            className={`btn-ghost text-xs cursor-pointer w-full justify-center border-2 border-dashed ${
                              theoryDoc?.status === 'checked' ? 'border-gold-500/30' : 'border-steel-600'
                            } py-2`}
                          >
                            <input
                              type="file"
                              className="hidden"
                              accept=".pdf,.jpg,.jpeg,.png"
                              disabled={uploading === theoryKey}
                              onChange={(e) => {
                                const file = e.target.files?.[0]
                                if (file) handleUpload(theoryKey, file)
                              }}
                            />
                            {uploading === theoryKey
                              ? t.common.processing
                              : theoryDoc
                                ? t.documents.update
                                : t.documents.uploadFile}
                          </label>
                        </div>

                        <div className="p-4 bg-navy-800/50 rounded-lg border-2 border-steel-700/40">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-white">{t.documents.practical}</span>
                              <span className="text-gold-500 text-xs">*</span>
                            </div>
                            {practicalDoc && getStatusBadge(practicalDoc.status)}
                          </div>
                          <p className="text-xs text-steel-500 mb-3">
                            {language === 'es' ? 'Certificado práctico del tipo (serie EASA)' : 'Type practical certificate (EASA series)'}
                          </p>
                          <label
                            className={`btn-ghost text-xs cursor-pointer w-full justify-center border-2 border-dashed ${
                              practicalDoc?.status === 'checked' ? 'border-gold-500/30' : 'border-steel-600'
                            } py-2`}
                          >
                            <input
                              type="file"
                              className="hidden"
                              accept=".pdf,.jpg,.jpeg,.png"
                              disabled={uploading === practicalKey}
                              onChange={(e) => {
                                const file = e.target.files?.[0]
                                if (file) handleUpload(practicalKey, file)
                              }}
                            />
                            {uploading === practicalKey
                              ? t.common.processing
                              : practicalDoc
                                ? t.documents.update
                                : t.documents.uploadFile}
                          </label>
                        </div>
                      </div>
                    )}

                    {/* Optional Extras */}
                    <div className="border-t border-steel-700/30 pt-4">
                      <p className="text-sm text-steel-400 mb-3">
                        {language === 'es' ? 'Documentación adicional (opcional)' : 'Additional documentation (optional)'}
                      </p>
                      <div className="flex flex-wrap gap-2 mb-4">
                        {TYPE_RATING_EXTRAS.map((extra) => (
                          <button
                            key={extra.key}
                            type="button"
                            onClick={() => toggleExtra(series, extra.key)}
                            className={seriesExtras.includes(extra.key) ? 'chip-selected' : 'chip-selectable'}
                          >
                            {extra.label}
                          </button>
                        ))}
                      </div>

                      {seriesExtras.length > 0 && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {seriesExtras.map((extraKey) => {
                            const extra = TYPE_RATING_EXTRAS.find(e => e.key === extraKey)
                            const extraDocType = typeRatingExtraKeyFromSeries(series, extraKey)
                            const extraDoc = getDocumentForType(extraDocType)
                            const customKey = `${series}|||${extraKey}`

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
                                    value={customExtraText[customKey] || ''}
                                    onChange={(e) => setCustomExtraText({
                                      ...customExtraText,
                                      [customKey]: e.target.value
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
                                      if (file) handleUpload(extraDocType, file)
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
            <div className="p-4 rounded-lg bg-gold-500/10 border border-gold-500/25 mb-2">
              <p className="text-sm text-gold-200 font-medium mb-1">
                {language === 'es' ? 'Obligatorio para contratación' : 'Required for hiring'}
              </p>
              <p className="text-xs text-steel-400">
                {language === 'es'
                  ? 'HF, EWIS y FTS son obligatorios, al igual que la licencia (pestaña Licencias) y el logbook.'
                  : 'HF, EWIS and FTS are required, along with your license (Licenses tab) and logbook.'}
              </p>
            </div>

            {MANDATORY_COURSE_CERTIFICATES.map((cert) => {
              const doc = getDocumentForType(`cert_${cert.key}`)
              const isUploading = uploading === `cert_${cert.key}`
              const label = cert.label[language === 'es' ? 'es' : 'en']

              return (
                <div key={cert.key} className="card p-5 border-2 border-gold-500/20">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        doc?.status === 'checked'
                          ? 'bg-gold-500/15 border-2 border-gold-500/50'
                          : doc
                            ? 'bg-steel-700/30 border border-steel-600/50'
                            : 'bg-navy-800 border border-steel-700/50'
                      }`}>
                        {doc?.status === 'checked' ? (
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
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium text-white">{label}</h3>
                          <span className="text-gold-500 text-xs">*</span>
                        </div>
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

            <p className="text-sm text-steel-500 mt-6 mb-2">
              {language === 'es' ? 'Opcional (aparecen en el certificado AMX)' : 'Optional (shown on AMX certificate)'}
            </p>

            {GENERAL_CERTIFICATES.map((cert) => {
              const doc = getDocumentForType(`cert_${cert.key}`)
              const isUploading = uploading === `cert_${cert.key}`

              return (
                <div key={cert.key} className="card p-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        doc?.status === 'checked' 
                          ? 'bg-gold-500/15 border-2 border-gold-500/50' 
                          : doc 
                            ? 'bg-steel-700/30 border border-steel-600/50' 
                            : 'bg-navy-800 border border-steel-700/50'
                      }`}>
                        {doc?.status === 'checked' ? (
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

        {/* Logbook Tab */}
        {activeTab === 'logbook' && (
          <div className="space-y-4">
            {!hasLogbookAccess && (
              <UpgradeBanner feature="logbook" />
            )}

            {hasLogbookAccess && (
              <>
                {(() => {
                const doc = getDocumentForType('logbook')
                const isUploading = uploading === 'logbook'
                return (
                  <div className="card p-5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-2xl ${
                          doc?.status === 'checked'
                            ? 'bg-gold-500/15 border-2 border-gold-500/50'
                            : doc
                              ? 'bg-steel-700/30 border-2 border-steel-600/50'
                              : 'bg-navy-800 border-2 border-steel-700/50'
                        }`}>
                          📖
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium text-white">Technical Logbook (PDF)</h3>
                            <span className="text-gold-500 text-xs">*</span>
                          </div>
                          <p className="text-xs text-steel-500 mt-0.5">
                            {language === 'es'
                              ? 'Obligatorio para contratación. Visible para empresas cuando revisan tu perfil.'
                              : 'Required for hiring. Visible to companies when they review your profile.'}
                          </p>
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
                          accept=".pdf"
                          disabled={isUploading}
                          onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (file) handleUpload('logbook', file)
                          }}
                        />
                        {isUploading ? t.common.processing : doc ? t.documents.update : t.documents.upload}
                      </label>
                    </div>
                  </div>
                )
                })()}

            <div className="card p-5">
              <p className="font-medium text-white mb-1">
                {language === 'es' ? 'Análisis disponible próximamente' : 'Analysis available soon'}
              </p>
              <p className="text-sm text-steel-400">
                {language === 'es'
                  ? 'Pronto podrás ver análisis automático de experiencia y trazabilidad del logbook.'
                  : 'Soon you will see automatic analysis of experience and logbook traceability.'}
              </p>
            </div>
              </>
            )}
          </div>
        )}

        {/* Additional Documents Tab */}
        {activeTab === 'additional' && (
          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-navy-800/50 border border-steel-700/30 mb-6">
              <div className="flex items-start gap-3">
                <span className="text-xl">🔒</span>
                <div>
                  <p className="text-white font-medium">
                    {language === 'es' ? 'Documentos privados' : 'Private documents'}
                  </p>
                  <p className="text-sm text-steel-400 mt-1">
                    {language === 'es' 
                      ? 'Estos documentos son opcionales y permanecen ocultos para las empresas hasta que aceptes una oferta de trabajo. Una vez aceptada, la empresa podrá acceder a ellos.'
                      : 'These documents are optional and remain hidden from companies until you accept a job offer. Once accepted, the company will be able to access them.'}
                  </p>
                </div>
              </div>
            </div>
            
            {ADDITIONAL_DOCUMENTS.map((docType) => {
              const doc = getDocumentForType(docType.key)
              const isUploading = uploading === docType.key

              return (
                <div key={docType.key} className="card p-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-2xl ${
                        doc?.status === 'checked' 
                          ? 'bg-gold-500/15 border-2 border-gold-500/50' 
                          : doc 
                            ? 'bg-steel-700/30 border-2 border-steel-600/50' 
                            : 'bg-navy-800 border-2 border-steel-700/50'
                      }`}>
                        {docType.icon}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium text-white">
                            {docType.label[language as 'es' | 'en']}
                          </h3>
                          <span className="text-xs text-steel-500 italic">
                            ({language === 'es' ? 'opcional' : 'optional'})
                          </span>
                        </div>
                        <p className="text-xs text-steel-500 mt-0.5 max-w-md">
                          {docType.description[language as 'es' | 'en']}
                        </p>
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
                        accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                        disabled={isUploading}
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) handleUpload(docType.key, file)
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
