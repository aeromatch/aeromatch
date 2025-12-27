'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Logo } from '@/components/ui/Logo'
import { useLanguage, LanguageSwitch } from '@/lib/i18n/LanguageContext'

export default function ResetPasswordPage() {
  const router = useRouter()
  const supabase = createClient()
  const { language } = useLanguage()
  
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [checkingSession, setCheckingSession] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [hasValidSession, setHasValidSession] = useState(false)

  const labels = {
    title: language === 'es' ? 'Restablecer Contraseña' : 'Reset Password',
    subtitle: language === 'es' 
      ? 'Ingresa tu nueva contraseña' 
      : 'Enter your new password',
    newPassword: language === 'es' ? 'Nueva contraseña' : 'New password',
    confirmPassword: language === 'es' ? 'Confirmar contraseña' : 'Confirm password',
    passwordMinLength: language === 'es' 
      ? 'Mínimo 6 caracteres' 
      : 'Minimum 6 characters',
    passwordsNoMatch: language === 'es' 
      ? 'Las contraseñas no coinciden' 
      : 'Passwords do not match',
    updatePassword: language === 'es' ? 'Actualizar Contraseña' : 'Update Password',
    updating: language === 'es' ? 'Actualizando...' : 'Updating...',
    success: language === 'es' 
      ? '¡Contraseña actualizada correctamente!' 
      : 'Password updated successfully!',
    redirecting: language === 'es' 
      ? 'Redirigiendo al panel...' 
      : 'Redirecting to dashboard...',
    noSession: language === 'es' 
      ? 'No se encontró sesión válida. Es posible que el enlace haya expirado.' 
      : 'No valid session found. The link may have expired.',
    requestNewLink: language === 'es' 
      ? 'Solicitar nuevo enlace' 
      : 'Request new link',
    backToLogin: language === 'es' ? 'Volver a iniciar sesión' : 'Back to login',
  }

  useEffect(() => {
    checkSession()
  }, [])

  const checkSession = async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession()
      
      if (error) {
        console.error('Session check error:', error)
        setHasValidSession(false)
      } else if (session) {
        setHasValidSession(true)
      } else {
        // Try to get session from URL hash (for implicit grant flow)
        const hashParams = new URLSearchParams(window.location.hash.substring(1))
        const accessToken = hashParams.get('access_token')
        const refreshToken = hashParams.get('refresh_token')
        
        if (accessToken && refreshToken) {
          const { error: setSessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
          })
          
          if (!setSessionError) {
            setHasValidSession(true)
          } else {
            console.error('Set session error:', setSessionError)
            setHasValidSession(false)
          }
        } else {
          setHasValidSession(false)
        }
      }
    } catch (err) {
      console.error('Check session error:', err)
      setHasValidSession(false)
    } finally {
      setCheckingSession(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    // Validate passwords match
    if (password !== confirmPassword) {
      setError(labels.passwordsNoMatch)
      setLoading(false)
      return
    }

    // Validate password length
    if (password.length < 6) {
      setError(labels.passwordMinLength)
      setLoading(false)
      return
    }

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: password
      })

      if (updateError) throw updateError

      setSuccess(true)
      
      // Redirect to dashboard after success
      setTimeout(() => {
        router.push('/dashboard')
      }, 2000)
    } catch (err: any) {
      setError(err.message || (language === 'es' ? 'Error al actualizar la contraseña' : 'Failed to update password'))
    } finally {
      setLoading(false)
    }
  }

  // Loading state while checking session
  if (checkingSession) {
    return (
      <div className="min-h-screen bg-navy-950 flex items-center justify-center">
        <div className="text-center">
          <Logo size="lg" />
          <p className="text-steel-400 mt-6 animate-pulse">
            {language === 'es' ? 'Verificando...' : 'Verifying...'}
          </p>
        </div>
      </div>
    )
  }

  // No valid session - show error with link to request new reset
  if (!hasValidSession) {
    return (
      <div className="min-h-screen bg-navy-950 flex flex-col">
        <header className="flex items-center justify-between px-6 py-4">
          <Link href="/">
            <Logo size="sm" />
          </Link>
          <LanguageSwitch />
        </header>

        <main className="flex-1 flex items-center justify-center p-6">
          <div className="w-full max-w-md mx-auto">
            <div className="card p-8 text-center">
              <div className="w-16 h-16 rounded-full bg-error-500/20 border-2 border-error-500/40 flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-error-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              
              <h1 className="text-xl font-bold text-white mb-2">{labels.title}</h1>
              <p className="text-steel-400 mb-6">{labels.noSession}</p>
              
              <div className="space-y-3">
                <Link href="/auth?mode=forgot" className="btn-primary-filled w-full">
                  {labels.requestNewLink}
                </Link>
                <Link href="/auth" className="btn-ghost w-full">
                  {labels.backToLogin}
                </Link>
              </div>
            </div>
          </div>
        </main>
      </div>
    )
  }

  // Success state
  if (success) {
    return (
      <div className="min-h-screen bg-navy-950 flex items-center justify-center p-6">
        <div className="w-full max-w-md mx-auto">
          <div className="card p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-success-500/20 border-2 border-success-500/40 flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-success-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            
            <h1 className="text-xl font-bold text-white mb-2">{labels.success}</h1>
            <p className="text-steel-400">{labels.redirecting}</p>
          </div>
        </div>
      </div>
    )
  }

  // Main reset form
  return (
    <div className="min-h-screen bg-navy-950 flex flex-col">
      <header className="flex items-center justify-between px-6 py-4">
        <Link href="/">
          <Logo size="sm" />
        </Link>
        <LanguageSwitch />
      </header>

      <main className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md mx-auto">
          <div className="text-center mb-8">
            <Logo size="lg" />
          </div>

          <div className="card p-8">
            <h1 className="text-2xl font-bold text-white mb-2">{labels.title}</h1>
            <p className="text-steel-400 mb-6">{labels.subtitle}</p>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="label">{labels.newPassword}</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input"
                  placeholder="••••••••"
                  required
                  minLength={6}
                />
                <p className="text-xs text-steel-500 mt-1">{labels.passwordMinLength}</p>
              </div>

              <div>
                <label className="label">{labels.confirmPassword}</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="input"
                  placeholder="••••••••"
                  required
                  minLength={6}
                />
              </div>

              {error && (
                <div className="p-3 rounded-md bg-error-600/20 border border-error-500/30 text-error-400 text-sm">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="btn-primary-filled w-full py-3"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    {labels.updating}
                  </span>
                ) : labels.updatePassword}
              </button>
            </form>

            <div className="mt-6 text-center">
              <Link href="/auth" className="text-sm text-steel-400 hover:text-white transition-colors">
                {labels.backToLogin}
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

