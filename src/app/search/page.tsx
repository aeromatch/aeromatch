'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { AppLayout } from '@/components/ui/AppLayout'
import { AvailabilityCalendar } from '@/components/availability/AvailabilityCalendar'
import { useLanguage } from '@/lib/i18n/LanguageContext'
import { AircraftMultiSelect } from '@/components/profile/AircraftMultiSelect'
import { LICENSE_CATEGORIES, SPECIALTIES } from '@/lib/aircraftCatalog'

interface TechnicianResult {
  user_id: string
  tech_id: string
  license_category: string[]
  aircraft_types: string[]
  specialties: string[]
  own_tools: boolean
  right_to_work_uk: boolean
  languages: string[]
  freshness: 'fresh' | 'warning' | 'stale'
  last_confirmed?: string
}

export default function SearchPage() {
  const router = useRouter()
  const supabase = createClient()
  const { t, language } = useLanguage()

  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [searching, setSearching] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Search filters
  const [dateRange, setDateRange] = useState<{ start: Date; end: Date } | null>(null)
  const [licenseCategory, setLicenseCategory] = useState<string[]>([])
  const [aircraftTypes, setAircraftTypes] = useState<string[]>([])
  const [specialties, setSpecialties] = useState<string[]>([])
  const [ukLicense, setUkLicense] = useState(false)
  const [ownTools, setOwnTools] = useState(false)
  
  // Job requires Right to Work UK (determines warning display, not filtering)
  const [jobRequiresRightToWorkUk, setJobRequiresRightToWorkUk] = useState(false)

  // Results
  const [results, setResults] = useState<TechnicianResult[]>([])
  const [hasSearched, setHasSearched] = useState(false)

  // Request modal
  const [showRequestModal, setShowRequestModal] = useState(false)
  const [selectedTechnician, setSelectedTechnician] = useState<TechnicianResult | null>(null)
  const [finalClientName, setFinalClientName] = useState('')
  const [workLocation, setWorkLocation] = useState('')
  const [contractType, setContractType] = useState<'short-term' | 'long-term'>('short-term')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    const loadProfile = async () => {
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

      if (profileData?.role !== 'company') {
        setError(language === 'es' ? 'Solo empresas pueden buscar técnicos' : 'Only companies can search technicians')
      }

      setProfile(profileData)
      setLoading(false)
    }
    loadProfile()
  }, [])

  const toggleItem = (item: string, list: string[], setList: (items: string[]) => void) => {
    if (list.includes(item)) {
      setList(list.filter(i => i !== item))
    } else {
      setList([...list, item])
    }
  }

  const handleDateRangeSelect = (range: { start: Date; end: Date }) => {
    setDateRange(range)
  }

  const handleSearch = async () => {
    if (!dateRange) {
      setError(language === 'es' ? 'Por favor selecciona las fechas' : 'Please select dates')
      return
    }

    setSearching(true)
    setError(null)
    setHasSearched(true)

    try {
      const response = await fetch('/api/search/technicians', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          start_date: dateRange.start.toISOString().split('T')[0],
          end_date: dateRange.end.toISOString().split('T')[0],
          license_category: licenseCategory,
          aircraft_types: aircraftTypes,
          specialties: specialties,
          uk_license: ukLicense,
          own_tools: ownTools
          // Note: right_to_work_uk is not sent - filtering happens on job flag, not search
        })
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error)

      setResults(data.technicians || [])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSearching(false)
    }
  }

  const handleRequestAvailability = (tech: TechnicianResult) => {
    setSelectedTechnician(tech)
    setShowRequestModal(true)
  }

  const submitRequest = async () => {
    if (!selectedTechnician || !finalClientName || !workLocation || !dateRange) {
      setError(language === 'es' ? 'Por favor completa todos los campos obligatorios' : 'Please complete all required fields')
      return
    }

    setSearching(true)
    setError(null)

    try {
      const response = await fetch('/api/job-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          technician_id: selectedTechnician.user_id,
          final_client_name: finalClientName,
          work_location: workLocation,
          contract_type: contractType,
          start_date: dateRange.start.toISOString().split('T')[0],
          end_date: dateRange.end.toISOString().split('T')[0],
          notes: notes || null
        })
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error)

      setShowRequestModal(false)
      setSelectedTechnician(null)
      setFinalClientName('')
      setWorkLocation('')
      setNotes('')
      
      router.push('/requests')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSearching(false)
    }
  }

  const getFreshnessIndicator = (freshness: string) => {
    switch (freshness) {
      case 'fresh':
        return (
          <span className="freshness-fresh">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            {t.availability.freshness.fresh}
          </span>
        )
      case 'warning':
        return (
          <span className="freshness-warning">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {t.availability.freshness.warning}
          </span>
        )
      default:
        return (
          <span className="freshness-stale">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            {t.availability.freshness.stale}
          </span>
        )
    }
  }

  if (loading) {
    return (
      <AppLayout userEmail={profile?.email} userRole="company">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-steel-400">{t.common.loading}</div>
        </div>
      </AppLayout>
    )
  }

  if (profile?.role !== 'company') {
    return (
      <AppLayout userEmail={profile?.email} userRole={profile?.role}>
        <div className="p-6 lg:p-8 max-w-4xl mx-auto">
          <div className="card p-8 text-center">
            <p className="text-error-400">{error}</p>
          </div>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout userEmail={profile?.email} userRole="company">
      <div className="p-6 lg:p-8 max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold text-white mb-6">{t.dashboard.searchTechnicians}</h1>

        {error && (
          <div className="mb-6 p-4 rounded-lg bg-error-600/20 border border-error-500/30 text-error-400">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Search Filters */}
          <div className="lg:col-span-1 space-y-6">
            {/* Date Selection */}
            <div className="card p-6">
              <h2 className="text-lg font-semibold text-white mb-4">
                {language === 'es' ? 'Fechas de trabajo' : 'Work dates'}
              </h2>
              
              <AvailabilityCalendar
                selectedRanges={dateRange ? [{ start: dateRange.start, end: dateRange.end }] : []}
                onRangeSelect={handleDateRangeSelect}
                mode="select"
              />
            </div>

            {/* Filters */}
            <div className="card p-6">
              <h2 className="text-lg font-semibold text-white mb-4">{t.common.filter}</h2>
              
              <div className="space-y-6">
                {/* Licenses - Same as technician profile */}
                <div>
                  <label className="label">{t.dashboard.licenses}</label>
                  <div className="flex flex-wrap gap-2">
                    {LICENSE_CATEGORIES.map((license) => (
                      <button
                        key={license}
                        type="button"
                        onClick={() => toggleItem(license, licenseCategory, setLicenseCategory)}
                        className={licenseCategory.includes(license) ? 'chip-selected' : 'chip-blue-selectable'}
                      >
                        {license}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Aircraft Types - Same selector as technician profile */}
                <div>
                  <label className="label">{language === 'es' ? 'Tipos de aeronave' : 'Aircraft types'}</label>
                  <AircraftMultiSelect
                    selected={aircraftTypes}
                    onChange={setAircraftTypes}
                    maxHeight="250px"
                  />
                </div>

                {/* Specialties - Same as technician profile */}
                <div>
                  <label className="label">{language === 'es' ? 'Especialidades' : 'Specialties'}</label>
                  <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto">
                    {SPECIALTIES.map((spec) => (
                      <button
                        key={spec}
                        type="button"
                        onClick={() => toggleItem(spec, specialties, setSpecialties)}
                        className={specialties.includes(spec) ? 'chip-selected' : 'chip-blue-selectable'}
                      >
                        {spec}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Boolean filters */}
                <div className="space-y-3">
                  <label className="flex items-center gap-3 cursor-pointer p-2 bg-navy-800/30 rounded-lg hover:bg-navy-800/50 transition-colors">
                    <input
                      type="checkbox"
                      checked={ukLicense}
                      onChange={(e) => setUkLicense(e.target.checked)}
                      className="checkbox"
                    />
                    <span className="text-sm text-white">{language === 'es' ? 'Licencia UK CAA' : 'UK CAA License'}</span>
                  </label>

                  <label className="flex items-center gap-3 cursor-pointer p-2 bg-warning-500/10 border border-warning-500/30 rounded-lg hover:bg-warning-500/20 transition-colors">
                    <input
                      type="checkbox"
                      checked={jobRequiresRightToWorkUk}
                      onChange={(e) => setJobRequiresRightToWorkUk(e.target.checked)}
                      className="checkbox"
                    />
                    <div>
                      <span className="text-sm text-white">{language === 'es' ? 'Trabajo requiere Right to Work UK' : 'Job requires UK Right to Work'}</span>
                      <p className="text-xs text-steel-500 mt-0.5">
                        {language === 'es' ? 'Se mostrará aviso en candidatos sin RTW' : 'Warning will show for candidates without RTW'}
                      </p>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 cursor-pointer p-2 bg-navy-800/30 rounded-lg hover:bg-navy-800/50 transition-colors">
                    <input
                      type="checkbox"
                      checked={ownTools}
                      onChange={(e) => setOwnTools(e.target.checked)}
                      className="checkbox"
                    />
                    <span className="text-sm text-white">{language === 'es' ? 'Herramientas propias' : 'Own tools'}</span>
                  </label>
                </div>

                <button
                  onClick={handleSearch}
                  disabled={searching || !dateRange}
                  className="btn-primary-filled w-full"
                >
                  {searching ? t.common.processing : t.common.search}
                </button>
              </div>
            </div>
          </div>

          {/* Results */}
          <div className="lg:col-span-2">
            {!hasSearched ? (
              <div className="card p-12 text-center">
                <svg className="w-16 h-16 text-steel-700 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <p className="text-steel-400">
                  {language === 'es' 
                    ? 'Selecciona las fechas y filtros para buscar técnicos disponibles'
                    : 'Select dates and filters to search for available technicians'
                  }
                </p>
              </div>
            ) : results.length === 0 ? (
              <div className="card p-12 text-center">
                <svg className="w-16 h-16 text-steel-700 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-steel-400">
                  {language === 'es' 
                    ? 'No se encontraron técnicos con los criterios seleccionados'
                    : 'No technicians found with selected criteria'
                  }
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-white">
                  {language === 'es' ? 'Resultados' : 'Results'} ({results.length})
                </h2>
                
                {/* Warning banner for stale availability */}
                {results.some(r => r.freshness === 'stale' || r.freshness === 'warning') && (
                  <div className="p-4 rounded-lg bg-warning-500/10 border border-warning-500/30 mb-4">
                    <div className="flex items-start gap-3">
                      <svg className="w-5 h-5 text-warning-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      <div>
                        <p className="text-sm font-medium text-warning-400">
                          {language === 'es' 
                            ? 'Algunos perfiles necesitan confirmar disponibilidad' 
                            : 'Some profiles need to confirm availability'}
                        </p>
                        <p className="text-xs text-steel-400 mt-1">
                          {language === 'es' 
                            ? 'Los técnicos con disponibilidad no confirmada recientemente pueden no responder rápidamente.'
                            : 'Technicians with unconfirmed availability may not respond quickly.'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                
                {results.map((tech) => (
                  <div key={tech.user_id} className="card-action p-5">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-navy-800 border border-steel-700/50 flex items-center justify-center">
                          <span className="text-sm font-mono text-steel-400">
                            {tech.tech_id.substring(0, 2)}
                          </span>
                        </div>
                        <div>
                          <p className="text-xs font-mono text-steel-500">ID: {tech.tech_id}</p>
                          {getFreshnessIndicator(tech.freshness)}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {tech.own_tools && (
                          <span className="chip-success text-xs">
                            {language === 'es' ? 'Herramientas' : 'Tools'}
                          </span>
                        )}
                        {tech.right_to_work_uk ? (
                          <span className="chip-success text-xs">UK RTW ✓</span>
                        ) : jobRequiresRightToWorkUk && (
                          <span className="chip-warning text-xs">⚠️ No UK RTW</span>
                        )}
                      </div>
                    </div>

                    {/* UK Right to Work Warning */}
                    {jobRequiresRightToWorkUk && !tech.right_to_work_uk && (
                      <div className="p-3 rounded-lg bg-warning-500/10 border border-warning-500/30 mb-4">
                        <p className="text-xs text-warning-400">
                          {language === 'es'
                            ? '⚠️ No consta Right to Work UK — la ejecución del contrato UK requiere soporte Umbrella/EoR para facturación MoR, seguro de accidentes (términos del proveedor) o sponsorship de visado.'
                            : '⚠️ No Right to Work UK — UK contract execution requires Umbrella/EoR support for MoR billing, accident insurance (provider terms) or VISA sponsorship.'}
                        </p>
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                      <div>
                        <p className="text-xs text-steel-500 mb-1">{t.dashboard.licenses}</p>
                        <div className="flex flex-wrap gap-1">
                          {tech.license_category?.map((lic) => (
                            <span key={lic} className="text-xs px-2 py-0.5 bg-gold-500/10 border border-gold-500/30 rounded text-gold-400">
                              {lic}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div>
                        <p className="text-xs text-steel-500 mb-1">{language === 'es' ? 'Aeronaves' : 'Aircraft'}</p>
                        <p className="text-sm text-white">
                          {tech.aircraft_types?.slice(0, 3).join(', ')}
                          {tech.aircraft_types?.length > 3 && ` +${tech.aircraft_types.length - 3}`}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-steel-500 mb-1">{language === 'es' ? 'Especialidades' : 'Specialties'}</p>
                        <p className="text-sm text-white">
                          {tech.specialties?.slice(0, 2).join(', ')}
                          {tech.specialties?.length > 2 && ` +${tech.specialties.length - 2}`}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => handleRequestAvailability(tech)}
                      className="btn-primary w-full"
                    >
                      {language === 'es' ? 'Solicitar Disponibilidad' : 'Request Availability'}
                      <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Request Modal */}
        {showRequestModal && (
          <div className="modal-overlay" onClick={() => setShowRequestModal(false)}>
            <div className="modal p-6" onClick={(e) => e.stopPropagation()}>
              <h3 className="text-xl font-bold text-white mb-4">
                {language === 'es' ? 'Solicitar Disponibilidad' : 'Request Availability'}
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="label label-required">
                    {language === 'es' ? 'Cliente final' : 'Final client'}
                  </label>
                  <input
                    type="text"
                    value={finalClientName}
                    onChange={(e) => setFinalClientName(e.target.value)}
                    className="input"
                    placeholder={language === 'es' ? 'Nombre del cliente' : 'Client name'}
                  />
                </div>

                <div>
                  <label className="label label-required">
                    {language === 'es' ? 'Ubicación del trabajo' : 'Work location'}
                  </label>
                  <input
                    type="text"
                    value={workLocation}
                    onChange={(e) => setWorkLocation(e.target.value)}
                    className="input"
                    placeholder={language === 'es' ? 'Ciudad, País' : 'City, Country'}
                  />
                </div>

                <div>
                  <label className="label">
                    {language === 'es' ? 'Tipo de contrato' : 'Contract type'}
                  </label>
                  <select
                    value={contractType}
                    onChange={(e) => setContractType(e.target.value as 'short-term' | 'long-term')}
                    className="select"
                  >
                    <option value="short-term">{language === 'es' ? 'Corto plazo' : 'Short-term'}</option>
                    <option value="long-term">{language === 'es' ? 'Largo plazo' : 'Long-term'}</option>
                  </select>
                </div>

                <div>
                  <label className="label">
                    {language === 'es' ? 'Notas adicionales' : 'Additional notes'}
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="textarea h-20"
                    placeholder={language === 'es' ? 'Información adicional...' : 'Additional information...'}
                  />
                </div>
              </div>

              <div className="flex gap-4 mt-6">
                <button
                  onClick={() => setShowRequestModal(false)}
                  className="btn-secondary flex-1"
                >
                  {t.common.cancel}
                </button>
                <button
                  onClick={submitRequest}
                  disabled={searching || !finalClientName || !workLocation}
                  className="btn-primary-filled flex-1"
                >
                  {searching ? t.common.processing : t.common.submit}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  )
}
