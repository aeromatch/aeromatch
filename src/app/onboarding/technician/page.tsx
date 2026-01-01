'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Logo } from '@/components/ui/Logo'
import { useLanguage } from '@/lib/i18n/LanguageContext'

export default function TechnicianOnboardingPage() {
  const router = useRouter()
  const supabase = createClient()
  const { language } = useLanguage()
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)

  // Simple form fields
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [country, setCountry] = useState('')

  const t = {
    es: {
      title: '¡Bienvenido a AeroMatch!',
      subtitle: 'Solo necesitamos unos datos básicos para empezar',
      fullName: 'Nombre completo',
      fullNamePlaceholder: 'Tu nombre y apellidos',
      phone: 'Teléfono (opcional)',
      phonePlaceholder: '+34 600 000 000',
      country: 'País de residencia',
      countryPlaceholder: 'Selecciona tu país',
      continue: 'Empezar',
      saving: 'Guardando...',
      profileNote: 'Después podrás completar tu perfil con licencias, documentos y disponibilidad desde el panel.',
      required: 'El nombre es obligatorio'
    },
    en: {
      title: 'Welcome to AeroMatch!',
      subtitle: 'We just need a few basic details to get started',
      fullName: 'Full name',
      fullNamePlaceholder: 'Your full name',
      phone: 'Phone (optional)',
      phonePlaceholder: '+44 7000 000000',
      country: 'Country of residence',
      countryPlaceholder: 'Select your country',
      continue: 'Get Started',
      saving: 'Saving...',
      profileNote: 'You can complete your profile with licenses, documents and availability later from the dashboard.',
      required: 'Name is required'
    }
  }

  const text = t[language] || t.en

  const COUNTRIES = [
    'España', 'United Kingdom', 'France', 'Germany', 'Italy', 
    'Portugal', 'Netherlands', 'Belgium', 'Ireland', 'Switzerland',
    'Poland', 'Czech Republic', 'Austria', 'Sweden', 'Norway',
    'Denmark', 'Finland', 'Greece', 'Romania', 'Other'
  ]

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth')
        return
      }
      setUserId(user.id)
      
      // Load existing profile data
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single()

      if (profile?.full_name) {
        setFullName(profile.full_name)
      }
    }
    getUser()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!fullName.trim()) {
      setError(text.required)
      return
    }

    if (!userId) return
    setLoading(true)
    setError(null)

    try {
      // Update profile with name
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ 
          full_name: fullName.trim(),
          onboarding_completed: true 
        })
        .eq('id', userId)

      if (profileError) throw profileError

      // Create empty technician record (they'll fill it later)
      const { error: techError } = await supabase
        .from('technicians')
        .upsert({
          user_id: userId,
          phone: phone || null,
          country: country || null,
          license_category: [],
          aircraft_types: [],
          specialties: [],
          languages: [],
          is_available: false,
          visibility_anonymous: true
        }, { onConflict: 'user_id' })

      if (techError) throw techError

      router.push('/dashboard')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-navy-950 flex items-center justify-center py-10 px-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Logo size="md" className="mx-auto mb-6" />
          <h1 className="text-2xl font-bold text-white mb-2">{text.title}</h1>
          <p className="text-steel-400">{text.subtitle}</p>
        </div>

        <form onSubmit={handleSubmit} className="card p-8">
          {error && (
            <div className="mb-6 p-4 rounded-lg bg-error-600/20 border border-error-500/30 text-error-400 text-sm">
              {error}
            </div>
          )}

          <div className="space-y-5">
            <div>
              <label className="label">{text.fullName} *</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="input"
                placeholder={text.fullNamePlaceholder}
                required
              />
            </div>

            <div>
              <label className="label">{text.phone}</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="input"
                placeholder={text.phonePlaceholder}
              />
            </div>

            <div>
              <label className="label">{text.country}</label>
              <select
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="input"
              >
                <option value="">{text.countryPlaceholder}</option>
                {COUNTRIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          <p className="text-xs text-steel-500 mt-6 text-center">
            {text.profileNote}
          </p>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full mt-6"
          >
            {loading ? text.saving : text.continue}
          </button>
        </form>
      </div>
    </div>
  )
}
