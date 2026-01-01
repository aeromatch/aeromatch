'use client'

import { useState, useEffect } from 'react'

interface PremiumToastProps {
  show: boolean
  onClose: () => void
  language: 'en' | 'es'
}

export function PremiumToast({ show, onClose, language }: PremiumToastProps) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (show) {
      setVisible(true)
      const timer = setTimeout(() => {
        setVisible(false)
        setTimeout(onClose, 300) // Wait for fade out
      }, 6000)
      return () => clearTimeout(timer)
    }
  }, [show, onClose])

  if (!show && !visible) return null

  const message = language === 'es'
    ? '🎉 ¡Premium activado por 12 meses (Recompensa de prelanzamiento) — gracias por completar tu perfil!'
    : '🎉 Premium activated for 12 months (Prelaunch reward) — thanks for completing your profile!'

  return (
    <div className={`fixed bottom-6 right-6 z-50 transition-all duration-300 ${
      visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
    }`}>
      <div className="bg-gradient-to-r from-gold-600 to-gold-500 text-navy-950 px-6 py-4 rounded-xl shadow-2xl max-w-md">
        <div className="flex items-start gap-3">
          <div className="flex-1">
            <p className="font-medium text-sm">{message}</p>
          </div>
          <button 
            onClick={() => { setVisible(false); setTimeout(onClose, 300); }}
            className="text-navy-950/60 hover:text-navy-950 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}

