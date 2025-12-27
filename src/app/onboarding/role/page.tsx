import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Logo } from '@/components/ui/Logo'

export default async function RoleSelectionPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth')
  }

  // Check if profile already exists
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, onboarding_completed')
    .eq('id', user.id)
    .single()

  if (profile?.onboarding_completed) {
    redirect('/dashboard')
  }

  if (profile?.role) {
    redirect(profile.role === 'technician' ? '/onboarding/technician' : '/onboarding/company')
  }

  return (
    <div className="min-h-screen bg-navy-950 flex items-center justify-center p-6">
      <div className="w-full max-w-xl mx-auto text-center">
        <Logo size="lg" className="justify-center mb-10" />
        
        <h1 className="text-3xl font-bold text-white mb-4">
          ¿Cómo quieres usar AeroMatch?
        </h1>
        <p className="text-steel-400 mb-10">
          Selecciona tu tipo de cuenta para continuar
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <Link
            href="/onboarding/technician"
            className="card-action-primary p-8 text-left group"
          >
            <div className="w-14 h-14 rounded-2xl bg-gold-500/10 border border-gold-500/30 flex items-center justify-center mb-6">
              <svg className="w-7 h-7 text-gold-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-white mb-2 group-hover:text-gold-300 transition-colors">
              Soy Técnico
            </h3>
            <p className="text-steel-400 text-sm mb-4">
              Busco oportunidades laborales en el sector aeronáutico
            </p>
            <div className="flex items-center text-gold-400 text-sm font-medium">
              Continuar
              <svg className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </Link>

          <Link
            href="/onboarding/company"
            className="card-action-primary p-8 text-left group"
          >
            <div className="w-14 h-14 rounded-2xl bg-gold-500/10 border border-gold-500/30 flex items-center justify-center mb-6">
              <svg className="w-7 h-7 text-gold-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-white mb-2 group-hover:text-gold-300 transition-colors">
              Soy Empresa
            </h3>
            <p className="text-steel-400 text-sm mb-4">
              Busco talento técnico certificado para mi empresa
            </p>
            <div className="flex items-center text-gold-400 text-sm font-medium">
              Continuar
              <svg className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </Link>
        </div>
      </div>
    </div>
  )
}

