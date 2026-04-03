'use client'

import { useCallback, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useLanguage } from '@/lib/i18n/LanguageContext'

const VISIBLE_STATUSES = ['available_unverified', 'available_verified'] as const

function isSearchVisible(
  availabilityStatus: string | null | undefined,
  isAvailable: boolean | null | undefined
) {
  return (
    VISIBLE_STATUSES.includes(availabilityStatus as (typeof VISIBLE_STATUSES)[number]) &&
    !!isAvailable
  )
}

export function TechnicianVisibilityToggle() {
  const { t } = useLanguage()
  const supabase = createClient()
  const [visible, setVisible] = useState<boolean | null>(null)
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase
      .from('technicians')
      .select('is_available, availability_status')
      .eq('user_id', user.id)
      .single()
    if (!data) return
    setVisible(isSearchVisible(data.availability_status, data.is_available))
  }, [supabase])

  useEffect(() => {
    load()
  }, [load])

  const onToggle = async (checked: boolean) => {
    setSaving(true)
    const prev = visible
    setVisible(checked)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('no user')
      const { data: row } = await supabase
        .from('technicians')
        .select('verification_status')
        .eq('user_id', user.id)
        .single()

      const verification_status = row?.verification_status ?? 'unverified'
      const payload = checked
        ? {
            is_available: true,
            availability_status:
              verification_status === 'verified'
                ? 'available_verified'
                : 'available_unverified',
          }
        : { is_available: false, availability_status: 'hidden' }

      const { error } = await supabase
        .from('technicians')
        .update(payload)
        .eq('user_id', user.id)
      if (error) throw error
    } catch {
      setVisible(prev ?? false)
    } finally {
      setSaving(false)
    }
  }

  if (visible === null) {
    return (
      <div className="px-3 mb-3 pb-3 border-b border-steel-800/20">
        <div className="h-16 rounded-lg bg-navy-800/40 animate-pulse" aria-hidden />
      </div>
    )
  }

  return (
    <div className="px-3 mb-3 pb-3 border-b border-steel-800/20">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-white">{t.nav.visibleForOffers}</p>
          <p className="text-xs text-steel-500 truncate">{t.nav.visibleForOffersHint}</p>
        </div>
        <label className="relative inline-flex items-center cursor-pointer shrink-0">
          <input
            type="checkbox"
            checked={visible}
            disabled={saving}
            onChange={(e) => onToggle(e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-14 h-7 bg-steel-700 peer-focus:ring-2 peer-focus:ring-gold-500/30 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-success-500" />
        </label>
      </div>
    </div>
  )
}
