'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Logo } from '@/components/ui/Logo'
import { useLanguage } from '@/lib/i18n/LanguageContext'
import { AircraftMultiSelect } from '@/components/profile/AircraftMultiSelect'
import { LICENSE_CATEGORIES, SPECIALTIES } from '@/lib/aircraftCatalog'

const COMPANY_TYPES = ['MRO', 'Airline', 'CAMO', 'Training Organization', 'Leasing', 'Staffing Agency', 'AOG Provider']
const COUNTRIES = ['España', 'United Kingdom', 'France', 'Germany', 'Italy', 'Portugal', 'Netherlands', 'Ireland', 'Belgium', 'Switzerland', 'Other EU', 'Other']
const SERVICES = ['Line Maintenance', 'Base Maintenance', 'Heavy Checks', 'Engine Services', 'Component Services', 'Modifications', 'Painting', 'AOG Support', 'Aircraft Parking']

export default function CompanyOnboardingPage() {
  const router = useRouter()
  const supabase = createClient()
  const { language } = useLanguage()
  
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)

  // Step 1: Basic Info
  const [companyName, setCompanyName] = useState('')
  const [companyType, setCompanyType] = useState('')
  const [hqCountry, setHqCountry] = useState('')
  const [taxId, setTaxId] = useState('')
  const [website, setWebsite] = useState('')

  // Step 2: Details
  const [headquarters, setHeadquarters] = useState('')
  const [employeeCount, setEmployeeCount] = useState('')
  const [services, setServices] = useState<string[]>([])
  const [aircraftTypes, setAircraftTypes] = useState<string[]>([])

  // Step 3: Needs
  const [hiringNeeds, setHiringNeeds] = useState('')
  const [urgentPositions, setUrgentPositions] = useState('')
  const [preferredLicenses, setPreferredLicenses] = useState<string[]>([])
  const [preferredSpecialties, setPreferredSpecialties] = useState<string[]>([])

  const labels = {
    step1Title: language === 'es' ? 'Información Básica' : 'Basic Information',
    step1Subtitle: language === 'es' ? 'Cuéntanos sobre tu empresa' : 'Tell us about your company',
    step2Title: language === 'es' ? 'Detalles de Operación' : 'Operation Details',
    step2Subtitle: language === 'es' ? 'Información adicional sobre tu empresa' : 'Additional information about your company',
    step3Title: language === 'es' ? 'Necesidades de Contratación' : 'Hiring Needs',
    step3Subtitle: language === 'es' ? 'Cuéntanos qué tipo de talento buscas' : 'Tell us what kind of talent you need',
    companyName: language === 'es' ? 'Nombre de la empresa' : 'Company name',
    companyType: language === 'es' ? 'Tipo de empresa' : 'Company type',
    selectType: language === 'es' ? 'Selecciona tipo' : 'Select type',
    hqCountry: language === 'es' ? 'País sede' : 'Headquarters country',
    selectCountry: language === 'es' ? 'Selecciona país' : 'Select country',
    taxId: language === 'es' ? 'CIF/NIF' : 'Tax ID',
    website: language === 'es' ? 'Sitio web' : 'Website',
    optional: language === 'es' ? 'Opcional' : 'Optional',
    location: language === 'es' ? 'Ubicación sede' : 'Headquarters location',
    employees: language === 'es' ? 'Número de empleados' : 'Number of employees',
    selectRange: language === 'es' ? 'Selecciona rango' : 'Select range',
    services: language === 'es' ? 'Servicios' : 'Services',
    aircraftTypes: language === 'es' ? 'Tipos de aeronave' : 'Aircraft types',
    preferredLicenses: language === 'es' ? 'Licencias preferidas' : 'Preferred licenses',
    preferredSpecialties: language === 'es' ? 'Especialidades preferidas' : 'Preferred specialties',
    hiringNeeds: language === 'es' ? 'Necesidades de contratación' : 'Hiring needs',
    hiringNeedsPlaceholder: language === 'es' ? 'Describe brevemente tus necesidades...' : 'Briefly describe your needs...',
    urgentPositions: language === 'es' ? 'Posiciones urgentes' : 'Urgent positions',
    urgentPlaceholder: language === 'es' ? '¿Tienes posiciones que cubrir de forma urgente?' : 'Do you have urgent positions to fill?',
    back: language === 'es' ? 'Atrás' : 'Back',
    continue: language === 'es' ? 'Continuar' : 'Continue',
    saving: language === 'es' ? 'Guardando...' : 'Saving...',
    finishing: language === 'es' ? 'Finalizando...' : 'Finishing...',
    completeRegistration: language === 'es' ? 'Completar Registro' : 'Complete Registration',
    requiredFields: language === 'es' ? 'Por favor completa todos los campos obligatorios' : 'Please complete all required fields',
  }

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth')
        return
      }
      setUserId(user.id)

      // Update profile role
      await supabase
        .from('profiles')
        .update({ role: 'company' })
        .eq('id', user.id)
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

  const saveBasicInfo = async () => {
    if (!userId) return
    if (!companyName || !companyType || !hqCountry) {
      setError(labels.requiredFields)
      return
    }
    
    setLoading(true)
    setError(null)

    try {
      const { error } = await supabase
        .from('companies')
        .upsert({
          user_id: userId,
          company_name: companyName,
          company_type: companyType,
          hq_country: hqCountry,
          tax_id: taxId || null,
          website: website || null
        }, { onConflict: 'user_id' })

      if (error) throw error
      setStep(2)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const saveDetails = async () => {
    if (!userId) return
    setLoading(true)
    setError(null)

    try {
      const { error } = await supabase
        .from('companies')
        .update({
          headquarters: headquarters || null,
          employee_count: employeeCount || null,
          services: services,
          aircraft_types: aircraftTypes
        })
        .eq('user_id', userId)

      if (error) throw error
      setStep(3)
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
      // Save hiring needs
      await supabase
        .from('companies')
        .update({
          hiring_needs: hiringNeeds || null,
          urgent_positions: urgentPositions || null,
          preferred_licenses: preferredLicenses,
          preferred_specialties: preferredSpecialties
        })
        .eq('user_id', userId)

      // Mark onboarding complete
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
          {[1, 2, 3].map((s) => (
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

        {/* Step 1: Basic Info */}
        {step === 1 && (
          <div className="card p-8">
            <h2 className="text-2xl font-bold text-white mb-2">{labels.step1Title}</h2>
            <p className="text-steel-400 mb-8">{labels.step1Subtitle}</p>

            <div className="space-y-6">
              <div>
                <label className="label label-required">{labels.companyName}</label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="input"
                  placeholder={labels.companyName}
                />
              </div>

              <div>
                <label className="label label-required">{labels.companyType}</label>
                <select
                  value={companyType}
                  onChange={(e) => setCompanyType(e.target.value)}
                  className="select"
                >
                  <option value="">{labels.selectType}</option>
                  {COMPANY_TYPES.map((type) => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label label-required">{labels.hqCountry}</label>
                <select
                  value={hqCountry}
                  onChange={(e) => setHqCountry(e.target.value)}
                  className="select"
                >
                  <option value="">{labels.selectCountry}</option>
                  {COUNTRIES.map((country) => (
                    <option key={country} value={country}>{country}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">{labels.taxId}</label>
                <input
                  type="text"
                  value={taxId}
                  onChange={(e) => setTaxId(e.target.value)}
                  className="input"
                  placeholder={labels.optional}
                />
              </div>

              <div>
                <label className="label">{labels.website}</label>
                <input
                  type="url"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  className="input"
                  placeholder="https://..."
                />
              </div>
            </div>

            <button
              onClick={saveBasicInfo}
              disabled={loading}
              className="btn-primary-filled w-full mt-8 py-3"
            >
              {loading ? labels.saving : labels.continue}
            </button>
          </div>
        )}

        {/* Step 2: Details */}
        {step === 2 && (
          <div className="card p-8">
            <h2 className="text-2xl font-bold text-white mb-2">{labels.step2Title}</h2>
            <p className="text-steel-400 mb-8">{labels.step2Subtitle}</p>

            <div className="space-y-6">
              <div>
                <label className="label">{labels.location}</label>
                <input
                  type="text"
                  value={headquarters}
                  onChange={(e) => setHeadquarters(e.target.value)}
                  className="input"
                  placeholder={language === 'es' ? 'Ciudad, País' : 'City, Country'}
                />
              </div>

              <div>
                <label className="label">{labels.employees}</label>
                <select
                  value={employeeCount}
                  onChange={(e) => setEmployeeCount(e.target.value)}
                  className="select"
                >
                  <option value="">{labels.selectRange}</option>
                  <option value="1-10">1-10</option>
                  <option value="11-50">11-50</option>
                  <option value="51-200">51-200</option>
                  <option value="201-500">201-500</option>
                  <option value="500+">500+</option>
                </select>
              </div>

              <div>
                <label className="label">{labels.services}</label>
                <div className="flex flex-wrap gap-2">
                  {SERVICES.map((service) => (
                    <button
                      key={service}
                      type="button"
                      onClick={() => toggleItem(service, services, setServices)}
                      className={services.includes(service) ? 'chip-selected' : 'chip-blue-selectable'}
                    >
                      {service}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="label">{labels.aircraftTypes}</label>
                <AircraftMultiSelect
                  selected={aircraftTypes}
                  onChange={setAircraftTypes}
                  maxHeight="300px"
                />
              </div>
            </div>

            <div className="flex gap-4 mt-8">
              <button onClick={() => setStep(1)} className="btn-secondary flex-1">
                {labels.back}
              </button>
              <button
                onClick={saveDetails}
                disabled={loading}
                className="btn-primary-filled flex-1"
              >
                {loading ? labels.saving : labels.continue}
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Hiring Needs */}
        {step === 3 && (
          <div className="card p-8">
            <h2 className="text-2xl font-bold text-white mb-2">{labels.step3Title}</h2>
            <p className="text-steel-400 mb-8">{labels.step3Subtitle}</p>

            <div className="space-y-6">
              <div>
                <label className="label">{labels.preferredLicenses}</label>
                <div className="flex flex-wrap gap-2">
                  {LICENSE_CATEGORIES.map((license) => (
                    <button
                      key={license}
                      type="button"
                      onClick={() => toggleItem(license, preferredLicenses, setPreferredLicenses)}
                      className={preferredLicenses.includes(license) ? 'chip-selected' : 'chip-blue-selectable'}
                    >
                      {license}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="label">{labels.preferredSpecialties}</label>
                <div className="flex flex-wrap gap-2">
                  {SPECIALTIES.slice(0, 15).map((spec) => (
                    <button
                      key={spec}
                      type="button"
                      onClick={() => toggleItem(spec, preferredSpecialties, setPreferredSpecialties)}
                      className={preferredSpecialties.includes(spec) ? 'chip-selected' : 'chip-blue-selectable'}
                    >
                      {spec}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="label">{labels.hiringNeeds}</label>
                <textarea
                  value={hiringNeeds}
                  onChange={(e) => setHiringNeeds(e.target.value)}
                  className="textarea h-24"
                  placeholder={labels.hiringNeedsPlaceholder}
                />
              </div>

              <div>
                <label className="label">{labels.urgentPositions}</label>
                <textarea
                  value={urgentPositions}
                  onChange={(e) => setUrgentPositions(e.target.value)}
                  className="textarea h-24"
                  placeholder={labels.urgentPlaceholder}
                />
              </div>
            </div>

            <div className="flex gap-4 mt-8">
              <button onClick={() => setStep(2)} className="btn-secondary flex-1">
                {labels.back}
              </button>
              <button
                onClick={completeOnboarding}
                disabled={loading}
                className="btn-primary-filled flex-1"
              >
                {loading ? labels.finishing : labels.completeRegistration}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
