'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useLanguage } from '@/lib/i18n/LanguageContext'

export function AuthForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { t, language } = useLanguage()
  const initialMode = searchParams.get('mode') === 'signup' ? 'signup' : 'login'
  const initialRole = searchParams.get('role') as 'technician' | 'company' | null
  
  const [mode, setMode] = useState<'login' | 'signup' | 'forgot'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [role, setRole] = useState<'technician' | 'company'>(initialRole || 'technician')
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const supabase = createClient()

  // Google OAuth sign-in
  const handleGoogleSignIn = async () => {
    setGoogleLoading(true)
    setError(null)

    try {
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (oauthError) throw oauthError
    } catch (err: any) {
      setError(err.message || (language === 'es' ? 'Error al iniciar sesión con Google' : 'Failed to sign in with Google'))
      setGoogleLoading(false)
    }
  }

  // Set initial mode from URL
  useState(() => {
    if (initialMode === 'signup') setMode('signup')
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setMessage(null)

    try {
      if (mode === 'forgot') {
        const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/auth/callback?type=recovery`,
        })

        if (resetError) throw resetError

        setMessage(language === 'es' 
          ? 'Te hemos enviado un email para restablecer tu contraseña. Revisa tu bandeja de entrada.' 
          : 'We have sent you an email to reset your password. Check your inbox.')
        return
      }

      if (mode === 'signup') {
        if (!termsAccepted) {
          throw new Error(language === 'es' 
            ? 'Debes aceptar los términos y condiciones' 
            : 'You must accept the terms and conditions')
        }

        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
              role: role,
            },
          },
        })

        if (signUpError) throw signUpError

        if (data.user) {
          // Create profile with consent tracking
          const { error: profileError } = await supabase
            .from('profiles')
            .upsert({
              id: data.user.id,
              email: email,
              full_name: fullName,
              role: role,
              onboarding_completed: false,
              terms_accepted: true,
              terms_accepted_at: new Date().toISOString(),
            })

          if (profileError) {
            console.error('Profile error:', profileError)
          }

          setMessage(language === 'es' 
            ? '¡Cuenta creada! Revisa tu email para confirmar.' 
            : 'Account created! Check your email to confirm.')
        }
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        })

        if (signInError) throw signInError

        router.push('/dashboard')
        router.refresh()
      }
    } catch (err: any) {
      setError(err.message || (language === 'es' ? 'Ha ocurrido un error' : 'An error occurred'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="card p-8">
      {/* Mode selector tabs - clear distinction */}
      {mode !== 'forgot' && (
        <div className="flex gap-2 mb-6 p-1 bg-navy-800 rounded-lg">
          <button
            type="button"
            onClick={() => setMode('login')}
            className={`flex-1 py-2.5 px-4 rounded-md text-sm font-medium transition-all ${
              mode === 'login'
                ? 'bg-gold-500 text-navy-950'
                : 'text-steel-400 hover:text-white'
            }`}
          >
            {t.auth.signIn}
          </button>
          <button
            type="button"
            onClick={() => setMode('signup')}
            className={`flex-1 py-2.5 px-4 rounded-md text-sm font-medium transition-all ${
              mode === 'signup'
                ? 'bg-gold-500 text-navy-950'
                : 'text-steel-400 hover:text-white'
            }`}
          >
            {t.auth.signUp}
          </button>
        </div>
      )}

      <h2 className="text-2xl font-bold text-white mb-2">
        {mode === 'forgot' 
          ? (language === 'es' ? 'Recuperar Contraseña' : 'Reset Password')
          : mode === 'login' 
            ? t.auth.signIn 
            : t.auth.signUp}
      </h2>
      <p className="text-steel-400 mb-6">
        {mode === 'forgot'
          ? (language === 'es' ? 'Te enviaremos un enlace para restablecer tu contraseña' : 'We will send you a link to reset your password')
          : mode === 'login' 
            ? (language === 'es' ? 'Accede a tu cuenta de AeroMatch' : 'Access your AeroMatch account')
            : (language === 'es' ? 'Únete a la plataforma aeronáutica' : 'Join the aviation platform')}
      </p>

      <form onSubmit={handleSubmit} className="space-y-5">
        {mode === 'signup' && (
          <>
            <div>
              <label className="label">{t.auth.fullName}</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="input"
                placeholder={language === 'es' ? 'Tu nombre completo' : 'Your full name'}
                required
              />
            </div>

            <div>
              <label className="label">{t.auth.accountType}</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setRole('technician')}
                  className={`p-4 rounded-lg transition-all text-left ${
                    role === 'technician'
                      ? 'border-4 border-gold-500 bg-gold-500/15'
                      : 'border-2 border-steel-700 hover:border-steel-600 bg-navy-800/50'
                  }`}
                  style={role === 'technician' ? { boxShadow: '0 0 15px rgba(201, 162, 77, 0.2)' } : {}}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <svg className={`w-5 h-5 ${role === 'technician' ? 'text-gold-400' : 'text-steel-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span className={`font-medium ${role === 'technician' ? 'text-gold-300' : 'text-steel-300'}`}>
                      {t.auth.technician}
                    </span>
                  </div>
                  <p className="text-xs text-steel-500">{t.auth.technicianDesc}</p>
                </button>

                <button
                  type="button"
                  onClick={() => setRole('company')}
                  className={`p-4 rounded-lg transition-all text-left ${
                    role === 'company'
                      ? 'border-4 border-gold-500 bg-gold-500/15'
                      : 'border-2 border-steel-700 hover:border-steel-600 bg-navy-800/50'
                  }`}
                  style={role === 'company' ? { boxShadow: '0 0 15px rgba(201, 162, 77, 0.2)' } : {}}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <svg className={`w-5 h-5 ${role === 'company' ? 'text-gold-400' : 'text-steel-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    <span className={`font-medium ${role === 'company' ? 'text-gold-300' : 'text-steel-300'}`}>
                      {t.auth.company}
                    </span>
                  </div>
                  <p className="text-xs text-steel-500">{t.auth.companyDesc}</p>
                </button>
              </div>
            </div>
          </>
        )}

        <div>
          <label className="label">{t.auth.email}</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input"
            placeholder="email@example.com"
            required
          />
        </div>

        {mode !== 'forgot' && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="label mb-0">{t.auth.password}</label>
              {mode === 'login' && (
                <button
                  type="button"
                  onClick={() => setMode('forgot')}
                  className="text-xs text-gold-400 hover:text-gold-300 transition-colors"
                >
                  {language === 'es' ? '¿Olvidaste tu contraseña?' : 'Forgot password?'}
                </button>
              )}
            </div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input"
              placeholder="••••••••"
              required
              minLength={6}
            />
          </div>
        )}

        {/* Terms & Conditions checkbox for signup */}
        {mode === 'signup' && (
          <div className="flex items-start gap-3">
            <input
              type="checkbox"
              id="terms"
              checked={termsAccepted}
              onChange={(e) => setTermsAccepted(e.target.checked)}
              className="checkbox mt-1"
              required
            />
            <label htmlFor="terms" className="text-sm text-steel-400">
              {language === 'es' ? 'Acepto los ' : 'I accept the '}
              <Link href="/terms" className="text-gold-400 hover:text-gold-300 underline">
                {t.auth.termsLink}
              </Link>
              {language === 'es' ? ' y la ' : ' and '}
              <Link href="/privacy" className="text-gold-400 hover:text-gold-300 underline">
                {t.auth.privacyLink}
              </Link>
            </label>
          </div>
        )}

        {error && (
          <div className="p-3 rounded-md bg-error-600/20 border border-error-500/30 text-error-400 text-sm">
            {error}
          </div>
        )}

        {message && (
          <div className="p-3 rounded-md bg-success-600/20 border border-success-500/30 text-success-400 text-sm">
            {message}
          </div>
        )}

        <button
          type="submit"
          disabled={loading || googleLoading}
          className="btn-primary-filled w-full py-3"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              {t.common.processing}
            </span>
          ) : mode === 'forgot' 
            ? (language === 'es' ? 'Enviar enlace' : 'Send link')
            : mode === 'login' 
              ? t.auth.signIn 
              : t.auth.signUp}
        </button>
      </form>

      {/* Google Sign-In - Only show for login/signup */}
      {mode !== 'forgot' && (
        <>
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-steel-700/50"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-3 bg-navy-900 text-steel-500">
                {language === 'es' ? 'o continúa con' : 'or continue with'}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading || googleLoading}
            className="w-full py-3 px-4 flex items-center justify-center gap-3 bg-white hover:bg-gray-100 text-gray-800 font-medium rounded-lg transition-colors disabled:opacity-50"
          >
            {googleLoading ? (
              <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            ) : (
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
            )}
            {language === 'es' ? 'Continuar con Google' : 'Continue with Google'}
          </button>
        </>
      )}

      {/* Mode switch links */}
      <div className="mt-6 text-center space-y-3">
        {mode === 'forgot' ? (
          <button
            onClick={() => setMode('login')}
            className="text-sm text-steel-400 hover:text-white transition-colors"
          >
            {language === 'es' ? '← Volver a iniciar sesión' : '← Back to login'}
          </button>
        ) : (
          <button
            onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
            className="text-sm text-steel-400 hover:text-white transition-colors"
          >
            {mode === 'login' ? t.auth.noAccount : t.auth.hasAccount}
          </button>
        )}
      </div>

      {/* Footer with terms */}
      <div className="mt-6 pt-6 border-t border-steel-800/40 text-center">
        <p className="text-xs text-steel-600">
          © 2025 AeroMatch. 
          <Link href="/terms" className="text-steel-500 hover:text-steel-400 ml-2">
            {t.footer.terms}
          </Link>
          <span className="mx-1">·</span>
          <Link href="/privacy" className="text-steel-500 hover:text-steel-400">
            {t.footer.privacy}
          </Link>
        </p>
      </div>
    </div>
  )
}
