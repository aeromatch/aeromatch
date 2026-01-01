'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Logo } from '@/components/ui/Logo'
import { useLanguage } from '@/lib/i18n/LanguageContext'

export default function RoleSelectionPage() {
  const router = useRouter()
  const supabase = createClient()
  const { language } = useLanguage()
  
  const [loading, setLoading] = useState(true)
  const [selecting, setSelecting] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [userEmail, setUserEmail] = useState<string | null>(null)

  const t = {
    es: {
      title: '¿Cómo quieres usar AeroMatch?',
      subtitle: 'Selecciona tu tipo de cuenta para continuar',
      technician: 'Soy Técnico',
      technicianDesc: 'Busco oportunidades laborales en el sector aeronáutico',
      company: 'Soy Empresa',
      companyDesc: 'Busco talento técnico certificado para mi empresa',
      continue: 'Continuar',
      selecting: 'Configurando...'
    },
    en: {
      title: 'How do you want to use AeroMatch?',
      subtitle: 'Select your account type to continue',
      technician: 'I\'m a Technician',
      technicianDesc: 'I\'m looking for job opportunities in the aviation sector',
      company: 'I\'m a Company',
      companyDesc: 'I\'m looking for certified technical talent for my company',
      continue: 'Continue',
      selecting: 'Setting up...'
    }
  }

  const text = t[language] || t.en

  useEffect(() => {
    checkUser()
  }, [])

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      router.push('/auth')
      return
    }

    setUserId(user.id)
    setUserEmail(user.email || null)

    // Check if already has a profile with role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, onboarding_completed')
      .eq('id', user.id)
      .single()

    if (profile?.onboarding_completed) {
      router.push('/dashboard')
      return
    }

    if (profile?.role) {
      // Has role but not completed onboarding
      router.push(profile.role === 'technician' ? '/onboarding/technician' : '/onboarding/company')
      return
    }

    setLoading(false)
  }

  const selectRole = async (role: 'technician' | 'company') => {
    if (!userId || !userEmail) return
    
    setSelecting(true)

    try {
      // Create or update profile with selected role
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: userId,
          email: userEmail,
          role: role,
          onboarding_completed: false
        }, { onConflict: 'id' })

      if (error) throw error

      // Redirect to role-specific onboarding
      router.push(role === 'technician' ? '/onboarding/technician' : '/onboarding/company')
    } catch (err) {
      console.error('Error setting role:', err)
      setSelecting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-navy-950 flex items-center justify-center">
        <div className="text-steel-400">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-navy-950 flex items-center justify-center p-6">
      <div className="w-full max-w-xl mx-auto text-center">
        <Logo size="lg" className="justify-center mb-10" />
        
        <h1 className="text-3xl font-bold text-white mb-4">
          {text.title}
        </h1>
        <p className="text-steel-400 mb-10">
          {text.subtitle}
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <button
            onClick={() => selectRole('technician')}
            disabled={selecting}
            className="card-action-primary p-8 text-left group disabled:opacity-50"
          >
            <div className="w-14 h-14 rounded-2xl bg-gold-500/10 border border-gold-500/30 flex items-center justify-center mb-6">
              <svg className="w-7 h-7 text-gold-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-white mb-2 group-hover:text-gold-300 transition-colors">
              {text.technician}
            </h3>
            <p className="text-steel-400 text-sm mb-4">
              {text.technicianDesc}
            </p>
            <div className="flex items-center text-gold-400 text-sm font-medium">
              {selecting ? text.selecting : text.continue}
              <svg className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </button>

          <button
            onClick={() => selectRole('company')}
            disabled={selecting}
            className="card-action-primary p-8 text-left group disabled:opacity-50"
          >
            <div className="w-14 h-14 rounded-2xl bg-gold-500/10 border border-gold-500/30 flex items-center justify-center mb-6">
              <svg className="w-7 h-7 text-gold-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-white mb-2 group-hover:text-gold-300 transition-colors">
              {text.company}
            </h3>
            <p className="text-steel-400 text-sm mb-4">
              {text.companyDesc}
            </p>
            <div className="flex items-center text-gold-400 text-sm font-medium">
              {selecting ? text.selecting : text.continue}
              <svg className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </button>
        </div>
      </div>
    </div>
  )
}
