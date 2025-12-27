'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { AppLayout } from '@/components/ui/AppLayout'
import { useLanguage } from '@/lib/i18n/LanguageContext'
import { AircraftMultiSelect } from '@/components/profile/AircraftMultiSelect'
import { ChangePasswordModal } from '@/components/profile/ChangePasswordModal'
import { LICENSE_CATEGORIES, SPECIALTIES, LANGUAGES_LIST } from '@/lib/aircraftCatalog'

export default function EditProfilePage() {
  const router = useRouter()
  const supabase = createClient()
  const { t, language } = useLanguage()

  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [showPasswordModal, setShowPasswordModal] = useState(false)

  // Profile fields
  const [fullName, setFullName] = useState('')
  const [licenseCategory, setLicenseCategory] = useState<string[]>([])
  const [aircraftTypes, setAircraftTypes] = useState<string[]>([])
  const [specialties, setSpecialties] = useState<string[]>([])
  const [ownTools, setOwnTools] = useState(false)
  const [rightToWorkUk, setRightToWorkUk] = useState(false)
  const [ukLicense, setUkLicense] = useState(false)
  const [passportExpiry, setPassportExpiry] = useState('')
  const [drivingLicense, setDrivingLicense] = useState(false)
  const [languages, setLanguages] = useState<string[]>([])
  const [visibilityAnonymous, setVisibilityAnonymous] = useState(true)
  const [isAvailable, setIsAvailable] = useState(true)

  useEffect(() => {
    loadProfile()
  }, [])

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

    setProfile(profileData)
    setFullName(profileData?.full_name || '')

    if (profileData?.role === 'technician') {
      const { data: techData } = await supabase
        .from('technicians')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (techData) {
        setLicenseCategory(techData.license_category || [])
        setAircraftTypes(techData.aircraft_types || [])
        setSpecialties(techData.specialties || [])
        setOwnTools(techData.own_tools || false)
        setRightToWorkUk(techData.right_to_work_uk || false)
        setUkLicense(techData.uk_license || false)
        setPassportExpiry(techData.passport_expiry || '')
        setDrivingLicense(techData.driving_license || false)
        setLanguages(techData.languages || [])
        setVisibilityAnonymous(techData.visibility_anonymous ?? true)
        setIsAvailable(techData.is_available ?? true)
      }
    }

    setLoading(false)
  }

  const toggleItem = (item: string, list: string[], setList: (items: string[]) => void) => {
    if (list.includes(item)) {
      setList(list.filter(i => i !== item))
    } else {
      setList([...list, item])
    }
  }

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    setSuccess(false)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error(t.common.notAuthenticated)

      // Update profile
      await supabase
        .from('profiles')
        .update({ full_name: fullName })
        .eq('id', user.id)

      // Update technician data
      if (profile?.role === 'technician') {
        const { error: updateError } = await supabase
          .from('technicians')
          .update({
            license_category: licenseCategory,
            aircraft_types: aircraftTypes,
            specialties: specialties,
            own_tools: ownTools,
            right_to_work_uk: rightToWorkUk,
            uk_license: ukLicense,
            passport_expiry: passportExpiry || null,
            driving_license: drivingLicense,
            languages: languages,
            visibility_anonymous: visibilityAnonymous,
            is_available: isAvailable
          })
          .eq('user_id', user.id)

        if (updateError) throw updateError
      }

      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
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

  const labels = {
    title: language === 'es' ? 'Editar Perfil' : 'Edit Profile',
    basicInfo: language === 'es' ? 'Información Básica' : 'Basic Information',
    fullName: language === 'es' ? 'Nombre completo' : 'Full name',
    availabilityStatus: language === 'es' ? 'Estado de disponibilidad' : 'Availability status',
    availabilityDesc: language === 'es' ? '¿Estás disponible para nuevas ofertas?' : 'Are you available for new offers?',
    capabilities: language === 'es' ? 'Capacidades' : 'Capabilities',
    licenses: language === 'es' ? 'Licencias' : 'Licenses',
    aircraftTypes: language === 'es' ? 'Tipos de Aeronave' : 'Aircraft Types',
    specialties: language === 'es' ? 'Especialidades' : 'Specialties',
    additionalInfo: language === 'es' ? 'Información Adicional' : 'Additional Information',
    ownTools: language === 'es' ? 'Tengo herramientas propias' : 'I have my own tools',
    rightToWorkUk: language === 'es' ? 'Derecho a trabajar en UK' : 'Right to work in UK',
    ukLicense: language === 'es' ? 'Licencia UK CAA' : 'UK CAA License',
    ukLicenseDesc: language === 'es' ? 'Tengo licencia emitida por UK CAA' : 'I have a UK CAA issued license',
    drivingLicense: language === 'es' ? 'Carné de conducir' : 'Driving license',
    passportExpiry: language === 'es' ? 'Caducidad del pasaporte' : 'Passport expiry',
    languages: language === 'es' ? 'Idiomas' : 'Languages',
    anonymous: language === 'es' ? 'Mantener perfil anónimo hasta aceptar solicitud' : 'Keep profile anonymous until accepting request',
    saveChanges: language === 'es' ? 'Guardar Cambios' : 'Save Changes',
    saving: language === 'es' ? 'Guardando...' : 'Saving...',
    profileUpdated: language === 'es' ? 'Perfil actualizado correctamente' : 'Profile updated successfully',
    security: language === 'es' ? 'Seguridad' : 'Security',
    changePassword: language === 'es' ? 'Cambiar Contraseña' : 'Change Password',
    changePasswordDesc: language === 'es' ? 'Actualiza tu contraseña de acceso' : 'Update your access password',
  }

  return (
    <AppLayout userEmail={profile?.email} userRole={profile?.role}>
      <div className="p-6 lg:p-8 max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-white mb-6">{labels.title}</h1>

        {error && (
          <div className="mb-6 p-4 rounded-lg bg-error-600/20 border border-error-500/30 text-error-400">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 rounded-lg bg-success-600/20 border border-success-500/30 text-success-400">
            {labels.profileUpdated}
          </div>
        )}

        <div className="space-y-6">
          {/* Basic Info */}
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-white mb-4">{labels.basicInfo}</h2>
            <div>
              <label className="label">{labels.fullName}</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="input"
              />
            </div>
          </div>

          {/* Security Section */}
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-gold-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              {labels.security}
            </h2>
            <div className="flex items-center justify-between p-4 bg-navy-800/50 rounded-lg">
              <div>
                <p className="font-medium text-white">{labels.changePassword}</p>
                <p className="text-sm text-steel-400">{labels.changePasswordDesc}</p>
              </div>
              <button
                onClick={() => setShowPasswordModal(true)}
                className="btn-secondary"
              >
                {labels.changePassword}
              </button>
            </div>
          </div>

          {profile?.role === 'technician' && (
            <>
              {/* Availability Toggle */}
              <div className="card p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-white">{labels.availabilityStatus}</p>
                    <p className="text-sm text-steel-400">{labels.availabilityDesc}</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isAvailable}
                      onChange={(e) => setIsAvailable(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-14 h-7 bg-steel-700 peer-focus:ring-2 peer-focus:ring-gold-500/30 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-success-500"></div>
                  </label>
                </div>
              </div>

              {/* Licenses - Blue chips, gold when selected */}
              <div className="card p-6">
                <h2 className="text-lg font-semibold text-white mb-4">{labels.licenses}</h2>
                <div className="flex flex-wrap gap-2">
                  {LICENSE_CATEGORIES.map((license) => (
                    <button
                      key={license}
                      type="button"
                      onClick={() => toggleItem(license, licenseCategory, setLicenseCategory)}
                      className={licenseCategory.includes(license) 
                        ? 'chip-selected' 
                        : 'chip-blue-selectable'}
                    >
                      {license}
                    </button>
                  ))}
                </div>

                {/* UK License Toggle */}
                <div className="mt-4 pt-4 border-t border-steel-700/40">
                  <label className="flex items-center gap-3 cursor-pointer p-3 bg-navy-800/50 rounded-lg hover:bg-navy-800 transition-colors">
                    <input
                      type="checkbox"
                      checked={ukLicense}
                      onChange={(e) => setUkLicense(e.target.checked)}
                      className="checkbox"
                    />
                    <div>
                      <span className="text-sm text-white font-medium">{labels.ukLicense}</span>
                      <p className="text-xs text-steel-500">{labels.ukLicenseDesc}</p>
                    </div>
                    {ukLicense && (
                      <span className="ml-auto chip-selected text-xs">
                        <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        UK
                      </span>
                    )}
                  </label>
                </div>
              </div>

              {/* Aircraft Types - Using unified selector */}
              <div className="card p-6">
                <h2 className="text-lg font-semibold text-white mb-4">{labels.aircraftTypes}</h2>
                <AircraftMultiSelect
                  selected={aircraftTypes}
                  onChange={setAircraftTypes}
                />
              </div>

              {/* Specialties - Including Sheet Metal */}
              <div className="card p-6">
                <h2 className="text-lg font-semibold text-white mb-4">{labels.specialties}</h2>
                <div className="flex flex-wrap gap-2">
                  {SPECIALTIES.map((spec) => (
                    <button
                      key={spec}
                      type="button"
                      onClick={() => toggleItem(spec, specialties, setSpecialties)}
                      className={specialties.includes(spec) 
                        ? 'chip-selected' 
                        : 'chip-blue-selectable'}
                    >
                      {spec}
                    </button>
                  ))}
                </div>
              </div>

              {/* Additional Info */}
              <div className="card p-6">
                <h2 className="text-lg font-semibold text-white mb-4">{labels.additionalInfo}</h2>
                
                <div className="space-y-4">
                  <label className="flex items-center gap-3 cursor-pointer p-3 bg-navy-800/50 rounded-lg hover:bg-navy-800 transition-colors">
                    <input
                      type="checkbox"
                      checked={ownTools}
                      onChange={(e) => setOwnTools(e.target.checked)}
                      className="checkbox"
                    />
                    <span className="text-sm text-white">{labels.ownTools}</span>
                  </label>

                  <label className="flex items-center gap-3 cursor-pointer p-3 bg-navy-800/50 rounded-lg hover:bg-navy-800 transition-colors">
                    <input
                      type="checkbox"
                      checked={rightToWorkUk}
                      onChange={(e) => setRightToWorkUk(e.target.checked)}
                      className="checkbox"
                    />
                    <span className="text-sm text-white">{labels.rightToWorkUk}</span>
                  </label>

                  <label className="flex items-center gap-3 cursor-pointer p-3 bg-navy-800/50 rounded-lg hover:bg-navy-800 transition-colors">
                    <input
                      type="checkbox"
                      checked={drivingLicense}
                      onChange={(e) => setDrivingLicense(e.target.checked)}
                      className="checkbox"
                    />
                    <span className="text-sm text-white">{labels.drivingLicense}</span>
                  </label>

                  <div className="pt-4">
                    <label className="label">{labels.passportExpiry}</label>
                    <input
                      type="date"
                      value={passportExpiry}
                      onChange={(e) => setPassportExpiry(e.target.value)}
                      className="input max-w-xs"
                    />
                  </div>

                  <div className="pt-4">
                    <label className="label">{labels.languages}</label>
                    <div className="flex flex-wrap gap-2">
                      {LANGUAGES_LIST.map((lang) => (
                        <button
                          key={lang}
                          type="button"
                          onClick={() => toggleItem(lang, languages, setLanguages)}
                          className={languages.includes(lang) 
                            ? 'chip-selected' 
                            : 'chip-blue-selectable'}
                        >
                          {lang}
                        </button>
                      ))}
                    </div>
                  </div>

                  <label className="flex items-center gap-3 cursor-pointer p-3 bg-navy-800/50 rounded-lg hover:bg-navy-800 transition-colors mt-4">
                    <input
                      type="checkbox"
                      checked={visibilityAnonymous}
                      onChange={(e) => setVisibilityAnonymous(e.target.checked)}
                      className="checkbox"
                    />
                    <span className="text-sm text-white">{labels.anonymous}</span>
                  </label>
                </div>
              </div>
            </>
          )}

          {/* Save Button */}
          <button
            onClick={handleSave}
            disabled={saving}
            className="btn-primary-filled w-full py-4 text-lg"
          >
            {saving ? labels.saving : labels.saveChanges}
          </button>
        </div>
      </div>

      {/* Change Password Modal */}
      <ChangePasswordModal 
        isOpen={showPasswordModal} 
        onClose={() => setShowPasswordModal(false)} 
      />
    </AppLayout>
  )
}
