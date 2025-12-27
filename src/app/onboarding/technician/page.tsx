'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Logo } from '@/components/ui/Logo'

const LICENSE_CATEGORIES = ['B1.1', 'B1.2', 'B1.3', 'B1.4', 'B2', 'B3', 'A']
const AIRCRAFT_TYPES = ['A320', 'A330', 'A350', 'A380', 'B737', 'B747', 'B777', 'B787', 'ATR', 'E-Jets', 'Helicopters']
const SPECIALTIES = ['Line Maintenance', 'Base Maintenance', 'Heavy Checks', 'Engine', 'Avionics', 'Structures', 'NDT', 'Boroscope']
const LANGUAGES = ['Español', 'English', 'Français', 'Deutsch', 'Português', 'Italiano']
const DOC_TYPES = ['license', 'passport', 'cv', 'training', 'medical']

export default function TechnicianOnboardingPage() {
  const router = useRouter()
  const supabase = createClient()
  
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)

  // Step 1: Capabilities
  const [licenseCategory, setLicenseCategory] = useState<string[]>([])
  const [aircraftTypes, setAircraftTypes] = useState<string[]>([])
  const [specialties, setSpecialties] = useState<string[]>([])

  // Step 2: Availability
  const [availabilitySlots, setAvailabilitySlots] = useState<{id?: string, start_date: string, end_date: string}[]>([])
  const [newStartDate, setNewStartDate] = useState('')
  const [newEndDate, setNewEndDate] = useState('')

  // Step 3: Amenities
  const [ownTools, setOwnTools] = useState(false)
  const [rightToWorkUk, setRightToWorkUk] = useState(false)
  const [passportExpiry, setPassportExpiry] = useState('')
  const [drivingLicense, setDrivingLicense] = useState(false)
  const [languages, setLanguages] = useState<string[]>([])
  const [minDailyRate, setMinDailyRate] = useState('')
  const [visibilityAnonymous, setVisibilityAnonymous] = useState(true)

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth')
        return
      }
      setUserId(user.id)
      
      // Load existing data
      const { data: tech } = await supabase
        .from('technicians')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (tech) {
        setLicenseCategory(tech.license_category || [])
        setAircraftTypes(tech.aircraft_types || [])
        setSpecialties(tech.specialties || [])
        setOwnTools(tech.own_tools || false)
        setRightToWorkUk(tech.right_to_work_uk || false)
        setPassportExpiry(tech.passport_expiry || '')
        setDrivingLicense(tech.driving_license || false)
        setLanguages(tech.languages || [])
        setMinDailyRate(tech.min_daily_rate_eur?.toString() || '')
        setVisibilityAnonymous(tech.visibility_anonymous ?? true)
      }

      // Load availability slots
      const { data: slots } = await supabase
        .from('availability_slots')
        .select('*')
        .eq('technician_id', user.id)
        .order('start_date', { ascending: true })

      if (slots) {
        setAvailabilitySlots(slots.map(s => ({
          id: s.id,
          start_date: s.start_date,
          end_date: s.end_date
        })))
      }
    }
    getUser()
  }, [])

  const toggleItem = (item: string, list: string[], setList: (items: string[]) => void) => {
    if (list.includes(item)) {
      setList(list.filter(i => i !== item))
    } else {
      setList([...list, item])
    }
  }

  const saveCapabilities = async () => {
    if (!userId) return
    setLoading(true)
    setError(null)

    try {
      const { error } = await supabase
        .from('technicians')
        .upsert({
          user_id: userId,
          license_category: licenseCategory,
          aircraft_types: aircraftTypes,
          specialties: specialties,
          is_available: true
        }, { onConflict: 'user_id' })

      if (error) throw error
      setStep(2)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const addAvailabilitySlot = async () => {
    if (!userId || !newStartDate || !newEndDate) return
    if (new Date(newEndDate) < new Date(newStartDate)) {
      setError('La fecha de fin debe ser posterior a la de inicio')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const { data, error } = await supabase
        .from('availability_slots')
        .insert({
          technician_id: userId,
          start_date: newStartDate,
          end_date: newEndDate
        })
        .select()
        .single()

      if (error) throw error
      
      setAvailabilitySlots([...availabilitySlots, {
        id: data.id,
        start_date: data.start_date,
        end_date: data.end_date
      }])
      setNewStartDate('')
      setNewEndDate('')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const removeAvailabilitySlot = async (id: string) => {
    setLoading(true)
    try {
      await supabase
        .from('availability_slots')
        .delete()
        .eq('id', id)
      
      setAvailabilitySlots(availabilitySlots.filter(s => s.id !== id))
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const saveAmenities = async () => {
    if (!userId) return
    setLoading(true)
    setError(null)

    try {
      const { error } = await supabase
        .from('technicians')
        .update({
          own_tools: ownTools,
          right_to_work_uk: rightToWorkUk,
          passport_expiry: passportExpiry || null,
          driving_license: drivingLicense,
          languages: languages,
          min_daily_rate_eur: minDailyRate ? parseInt(minDailyRate) : null,
          visibility_anonymous: visibilityAnonymous
        })
        .eq('user_id', userId)

      if (error) throw error
      setStep(4)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const completeOnboarding = async () => {
    if (!userId) return
    setLoading(true)
    setError(null)

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ onboarding_completed: true })
        .eq('id', userId)

      if (error) throw error
      router.push('/dashboard')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-navy-950 py-10 px-6">
      <div className="max-w-2xl mx-auto">
        <Logo size="md" className="mb-10" />
        
        {/* Progress */}
        <div className="flex items-center gap-2 mb-8">
          {[1, 2, 3, 4].map((s) => (
            <div
              key={s}
              className={`flex-1 h-1 rounded-full transition-colors ${
                s <= step ? 'bg-gold-500' : 'bg-steel-700'
              }`}
            />
          ))}
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-lg bg-error-600/20 border border-error-500/30 text-error-400">
            {error}
          </div>
        )}

        {/* Step 1: Capabilities */}
        {step === 1 && (
          <div className="card p-8">
            <h2 className="text-2xl font-bold text-white mb-2">Capacidades</h2>
            <p className="text-steel-400 mb-8">Selecciona tus licencias, tipos de aeronave y especialidades</p>

            <div className="space-y-8">
              <div>
                <label className="label">Licencias</label>
                <div className="flex flex-wrap gap-2">
                  {LICENSE_CATEGORIES.map((license) => (
                    <button
                      key={license}
                      type="button"
                      onClick={() => toggleItem(license, licenseCategory, setLicenseCategory)}
                      className={licenseCategory.includes(license) ? 'chip-selected' : 'chip'}
                    >
                      {license}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="label">Tipos de Aeronave</label>
                <div className="flex flex-wrap gap-2">
                  {AIRCRAFT_TYPES.map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => toggleItem(type, aircraftTypes, setAircraftTypes)}
                      className={aircraftTypes.includes(type) ? 'chip-selected' : 'chip'}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="label">Especialidades</label>
                <div className="flex flex-wrap gap-2">
                  {SPECIALTIES.map((spec) => (
                    <button
                      key={spec}
                      type="button"
                      onClick={() => toggleItem(spec, specialties, setSpecialties)}
                      className={specialties.includes(spec) ? 'chip-selected' : 'chip'}
                    >
                      {spec}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button
              onClick={saveCapabilities}
              disabled={loading || licenseCategory.length === 0}
              className="btn-primary w-full mt-8"
            >
              {loading ? 'Guardando...' : 'Continuar'}
            </button>
          </div>
        )}

        {/* Step 2: Availability */}
        {step === 2 && (
          <div className="card p-8">
            <h2 className="text-2xl font-bold text-white mb-2">Disponibilidad</h2>
            <p className="text-steel-400 mb-8">Añade los períodos en los que estarás disponible</p>

            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Fecha inicio</label>
                  <input
                    type="date"
                    value={newStartDate}
                    onChange={(e) => setNewStartDate(e.target.value)}
                    className="input"
                  />
                </div>
                <div>
                  <label className="label">Fecha fin</label>
                  <input
                    type="date"
                    value={newEndDate}
                    onChange={(e) => setNewEndDate(e.target.value)}
                    className="input"
                  />
                </div>
              </div>

              <button
                onClick={addAvailabilitySlot}
                disabled={loading || !newStartDate || !newEndDate}
                className="btn-secondary w-full"
              >
                Añadir período
              </button>

              {availabilitySlots.length > 0 && (
                <div className="space-y-2">
                  <label className="label">Períodos añadidos</label>
                  {availabilitySlots.map((slot) => (
                    <div key={slot.id} className="flex items-center justify-between p-3 bg-navy-800 rounded-lg border border-steel-700/30">
                      <span className="text-sm text-white">
                        {new Date(slot.start_date).toLocaleDateString('es-ES')} - {new Date(slot.end_date).toLocaleDateString('es-ES')}
                      </span>
                      <button
                        onClick={() => slot.id && removeAvailabilitySlot(slot.id)}
                        className="text-error-400 hover:text-error-300 text-sm"
                      >
                        Eliminar
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-4 mt-8">
              <button onClick={() => setStep(1)} className="btn-secondary flex-1">
                Atrás
              </button>
              <button
                onClick={() => setStep(3)}
                className="btn-primary flex-1"
              >
                Continuar
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Amenities */}
        {step === 3 && (
          <div className="card p-8">
            <h2 className="text-2xl font-bold text-white mb-2">Información Adicional</h2>
            <p className="text-steel-400 mb-8">Completa tu perfil con información operativa</p>

            <div className="space-y-6">
              <div className="space-y-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={ownTools}
                    onChange={(e) => setOwnTools(e.target.checked)}
                    className="checkbox"
                  />
                  <span className="text-sm text-white">Tengo herramientas propias</span>
                </label>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rightToWorkUk}
                    onChange={(e) => setRightToWorkUk(e.target.checked)}
                    className="checkbox"
                  />
                  <span className="text-sm text-white">Derecho a trabajar en UK</span>
                </label>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={drivingLicense}
                    onChange={(e) => setDrivingLicense(e.target.checked)}
                    className="checkbox"
                  />
                  <span className="text-sm text-white">Carné de conducir</span>
                </label>
              </div>

              <div>
                <label className="label">Caducidad del pasaporte</label>
                <input
                  type="date"
                  value={passportExpiry}
                  onChange={(e) => setPassportExpiry(e.target.value)}
                  className="input"
                />
              </div>

              <div>
                <label className="label">Idiomas</label>
                <div className="flex flex-wrap gap-2">
                  {LANGUAGES.map((lang) => (
                    <button
                      key={lang}
                      type="button"
                      onClick={() => toggleItem(lang, languages, setLanguages)}
                      className={languages.includes(lang) ? 'chip-selected' : 'chip'}
                    >
                      {lang}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="label">Tarifa mínima diaria (EUR)</label>
                <input
                  type="number"
                  value={minDailyRate}
                  onChange={(e) => setMinDailyRate(e.target.value)}
                  className="input"
                  placeholder="Ej: 350"
                />
              </div>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={visibilityAnonymous}
                  onChange={(e) => setVisibilityAnonymous(e.target.checked)}
                  className="checkbox"
                />
                <span className="text-sm text-white">Mantener perfil anónimo hasta aceptar solicitud</span>
              </label>
            </div>

            <div className="flex gap-4 mt-8">
              <button onClick={() => setStep(2)} className="btn-secondary flex-1">
                Atrás
              </button>
              <button
                onClick={saveAmenities}
                disabled={loading}
                className="btn-primary flex-1"
              >
                {loading ? 'Guardando...' : 'Continuar'}
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Documents */}
        {step === 4 && (
          <div className="card p-8">
            <h2 className="text-2xl font-bold text-white mb-2">Documentos</h2>
            <p className="text-steel-400 mb-8">Sube tus documentos para verificar tu perfil (opcional)</p>

            <div className="space-y-4">
              {DOC_TYPES.map((docType) => (
                <div key={docType} className="p-4 bg-navy-800 rounded-lg border border-steel-700/30">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <svg className="w-5 h-5 text-steel-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span className="text-sm text-white capitalize">
                        {docType === 'license' ? 'Licencia' : 
                         docType === 'passport' ? 'Pasaporte' :
                         docType === 'cv' ? 'CV' :
                         docType === 'training' ? 'Formación' : 'Médico'}
                      </span>
                    </div>
                    <span className="text-xs text-steel-500">Pendiente</span>
                  </div>
                </div>
              ))}
            </div>

            <p className="text-xs text-steel-500 mt-4">
              Puedes subir documentos más tarde desde tu perfil
            </p>

            <div className="flex gap-4 mt-8">
              <button onClick={() => setStep(3)} className="btn-secondary flex-1">
                Atrás
              </button>
              <button
                onClick={completeOnboarding}
                disabled={loading}
                className="btn-primary flex-1"
              >
                {loading ? 'Finalizando...' : 'Completar Registro'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

