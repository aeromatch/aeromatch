'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useLanguage } from '@/lib/i18n/LanguageContext'

interface ChangePasswordModalProps {
  isOpen: boolean
  onClose: () => void
}

export function ChangePasswordModal({ isOpen, onClose }: ChangePasswordModalProps) {
  const supabase = createClient()
  const { language } = useLanguage()
  
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const labels = {
    title: language === 'es' ? 'Cambiar Contraseña' : 'Change Password',
    currentPassword: language === 'es' ? 'Contraseña actual' : 'Current password',
    newPassword: language === 'es' ? 'Nueva contraseña' : 'New password',
    confirmPassword: language === 'es' ? 'Confirmar nueva contraseña' : 'Confirm new password',
    passwordMinLength: language === 'es' ? 'Mínimo 6 caracteres' : 'Minimum 6 characters',
    passwordsNoMatch: language === 'es' ? 'Las contraseñas no coinciden' : 'Passwords do not match',
    changePassword: language === 'es' ? 'Cambiar Contraseña' : 'Change Password',
    changing: language === 'es' ? 'Cambiando...' : 'Changing...',
    success: language === 'es' ? '¡Contraseña actualizada correctamente!' : 'Password updated successfully!',
    cancel: language === 'es' ? 'Cancelar' : 'Cancel',
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    // Validate passwords match
    if (newPassword !== confirmPassword) {
      setError(labels.passwordsNoMatch)
      setLoading(false)
      return
    }

    // Validate password length
    if (newPassword.length < 6) {
      setError(labels.passwordMinLength)
      setLoading(false)
      return
    }

    try {
      // Update password using Supabase
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword
      })

      if (updateError) throw updateError

      setSuccess(true)
      
      // Close modal after success
      setTimeout(() => {
        handleClose()
      }, 1500)
    } catch (err: any) {
      setError(err.message || (language === 'es' ? 'Error al cambiar la contraseña' : 'Failed to change password'))
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setCurrentPassword('')
    setNewPassword('')
    setConfirmPassword('')
    setError(null)
    setSuccess(false)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal p-6 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">{labels.title}</h2>
          <button
            onClick={handleClose}
            className="text-steel-400 hover:text-white transition-colors p-1"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {success ? (
          <div className="text-center py-6">
            <div className="w-16 h-16 rounded-full bg-success-500/20 border-2 border-success-500/40 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-success-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-success-400">{labels.success}</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">{labels.newPassword}</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
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

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={handleClose}
                className="btn-secondary flex-1"
              >
                {labels.cancel}
              </button>
              <button
                type="submit"
                disabled={loading}
                className="btn-primary-filled flex-1"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    {labels.changing}
                  </span>
                ) : labels.changePassword}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

