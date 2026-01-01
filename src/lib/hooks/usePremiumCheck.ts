'use client'

import { useState, useCallback } from 'react'

export function usePremiumCheck() {
  const [showPremiumToast, setShowPremiumToast] = useState(false)
  const [premiumGranted, setPremiumGranted] = useState(false)

  const checkPremium = useCallback(async () => {
    try {
      const response = await fetch('/api/premium/evaluate', {
        method: 'POST',
      })

      if (response.ok) {
        const data = await response.json()
        if (data.premiumGranted) {
          setPremiumGranted(true)
          setShowPremiumToast(true)
          return true
        }
      }
      return false
    } catch (error) {
      console.error('Premium check error:', error)
      return false
    }
  }, [])

  const closePremiumToast = useCallback(() => {
    setShowPremiumToast(false)
  }, [])

  return {
    checkPremium,
    showPremiumToast,
    closePremiumToast,
    premiumGranted,
  }
}

