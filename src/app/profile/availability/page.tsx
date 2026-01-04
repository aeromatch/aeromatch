'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { AppLayout } from '@/components/ui/AppLayout'
import { CompactRangePicker } from '@/components/availability/CompactRangePicker'
import { useLanguage } from '@/lib/i18n/LanguageContext'

interface AvailabilitySlot {
  id: string
  start_date: string
  end_date: string
  status?: string
  created_at?: string
  is_deleted?: boolean
}

export default function AvailabilityPage() {
  const router = useRouter()
  const supabase = createClient()
  const { t, language } = useLanguage()

  const [profile, setProfile] = useState<any>(null)
  const [slots, setSlots] = useState<AvailabilitySlot[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [expandedSection, setExpandedSection] = useState<'active' | 'pending' | 'expired' | null>('active')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
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

      // Try basic query first (columns that definitely exist)
      const { data: slotsData, error: slotsError } = await supabase
        .from('availability_slots')
        .select('id, technician_id, start_date, end_date, created_at')
        .eq('technician_id', user.id)
        .order('start_date', { ascending: true })

      if (slotsError) {
        console.error('Error loading slots:', slotsError)
        setSlots([])
      } else {
        // Map to include default status for slots without it
        const mappedSlots = (slotsData || []).map(slot => ({
          ...slot,
          status: 'active', // Default status
          is_deleted: false
        }))
        setSlots(mappedSlots)
      }
    } catch (err) {
      console.error('Load error:', err)
      setSlots([])
    } finally {
      setLoading(false)
    }
  }

  const handleRangeSelect = async (range: { start: Date; end: Date }) => {
    setSaving(true)
    setError(null)
    setSuccess(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error(t.common.notAuthenticated || 'Not authenticated')

      // Ensure technician record exists (required for FK constraint)
      const { data: existingTech } = await supabase
        .from('technicians')
        .select('user_id')
        .eq('user_id', user.id)
        .single()

      if (!existingTech) {
        const { error: techError } = await supabase
          .from('technicians')
          .upsert({
            user_id: user.id,
            license_category: [],
            aircraft_types: [],
            specialties: [],
            languages: [],
            is_available: false,
            visibility_anonymous: true
          }, { onConflict: 'user_id' })
        
        if (techError) {
          console.error('Error creating technician record:', techError)
          throw new Error(language === 'es' ? 'Error al preparar el perfil' : 'Error preparing profile')
        }
      }

      const { data, error } = await supabase
        .from('availability_slots')
        .insert({
          technician_id: user.id,
          start_date: range.start.toISOString().split('T')[0],
          end_date: range.end.toISOString().split('T')[0]
        })
        .select('id, technician_id, start_date, end_date, created_at')
        .single()

      if (error) throw error

      // Add default status for UI
      const slotWithStatus = { ...data, status: 'active', is_deleted: false }
      setSlots([...slots, slotWithStatus])
      setSuccess(t.availability.periodAdded)
      setShowAddForm(false)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleSoftDelete = async (id: string) => {
    try {
      // Just do hard delete for now (simpler and more reliable)
      const { error } = await supabase
        .from('availability_slots')
        .delete()
        .eq('id', id)

      if (error) {
        throw error
      }

      setSlots(slots.filter(s => s.id !== id))
      setSuccess(t.availability.periodDeleted)
    } catch (err: any) {
      setError(err.message)
    }
  }

  const clearAllSlots = async () => {
    if (!confirm(t.availability.confirmClear)) return

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Hard delete all
      const { error } = await supabase
        .from('availability_slots')
        .delete()
        .eq('technician_id', user.id)

      if (error) throw error

      setSlots([])
      setSuccess(t.availability.allCleared)
    } catch (err: any) {
      setError(err.message)
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

  // Categorize slots
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const activeSlots = slots.filter(s => {
    const endDate = new Date(s.end_date)
    return endDate >= today && s.status !== 'pending'
  })

  const pendingSlots = slots.filter(s => s.status === 'pending')

  const expiredSlots = slots.filter(s => {
    const endDate = new Date(s.end_date)
    return endDate < today
  })

  const formatDateRange = (slot: AvailabilitySlot) => {
    const start = new Date(slot.start_date)
    const end = new Date(slot.end_date)
    const locale = language === 'es' ? 'es-ES' : 'en-GB'
    return `${start.toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' })} — ${end.toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' })}`
  }

  const getDaysCount = (slot: AvailabilitySlot) => {
    const start = new Date(slot.start_date)
    const end = new Date(slot.end_date)
    return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1
  }

  return (
    <AppLayout userEmail={profile?.email} userRole={profile?.role}>
      <div className="p-6 lg:p-8 max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white">{t.availability.title}</h1>
          <p className="text-steel-400 text-sm mt-1">{t.availability.subtitle}</p>
        </div>

        {/* Alerts */}
        {error && (
          <div className="mb-6 p-4 rounded-lg bg-error-600/20 border border-error-500/30 text-error-400">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 rounded-lg bg-success-600/20 border border-success-500/30 text-success-400">
            {success}
          </div>
        )}

        {/* Calendar Section - At Top */}
        <div className="card p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">
              {language === 'es' ? 'Calendario' : 'Calendar'}
            </h2>
            {!showAddForm && (
              <button
                onClick={() => setShowAddForm(true)}
                className="btn-primary-filled"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                {t.availability.addPeriod}
              </button>
            )}
          </div>

          {showAddForm ? (
            <div>
              <CompactRangePicker
                onRangeSelect={handleRangeSelect}
                saving={saving}
              />
              <button
                onClick={() => setShowAddForm(false)}
                className="btn-ghost mt-4 w-full"
              >
                {t.common.cancel}
              </button>
            </div>
          ) : (
            <div className="text-center py-8 text-steel-500">
              <svg className="w-10 h-10 mx-auto mb-3 text-steel-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p>{language === 'es' ? 'Haz clic en "Añadir Período" para seleccionar fechas' : 'Click "Add Period" to select dates'}</p>
            </div>
          )}
        </div>

        {/* Periods List - Accordion Style */}
        <div className="space-y-4">
          {/* Active Periods - Expanded by default */}
          <div className="card overflow-hidden">
            <button
              onClick={() => setExpandedSection(expandedSection === 'active' ? null : 'active')}
              className={`w-full px-5 py-4 flex items-center justify-between ${
                expandedSection === 'active' ? 'bg-navy-800 border-b border-gold-500/20' : 'bg-navy-900'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-success-500"></div>
                <span className="font-semibold text-white">
                  {t.availability.activePeriods} ({activeSlots.length})
                </span>
              </div>
              <svg className={`w-5 h-5 text-steel-400 transition-transform ${expandedSection === 'active' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {expandedSection === 'active' && (
              <div className="p-4 space-y-3">
                {activeSlots.length === 0 ? (
                  <p className="text-center text-steel-500 py-4">{t.availability.noActivePeriods}</p>
                ) : (
                  activeSlots.map((slot) => (
                    <div
                      key={slot.id}
                      className="flex items-center justify-between p-4 bg-navy-800/50 rounded-lg border-2 border-success-500/20"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-success-500/10 border border-success-500/30 flex items-center justify-center">
                          <svg className="w-5 h-5 text-success-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        <div>
                          <p className="font-medium text-white">{formatDateRange(slot)}</p>
                          <p className="text-sm text-steel-500">{getDaysCount(slot)} {t.availability.days}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleSoftDelete(slot.id)}
                        className="btn-ghost text-error-400 hover:text-error-300 p-2"
                        aria-label={t.common.delete}
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  ))
                )}

                {activeSlots.length > 0 && (
                  <div className="pt-3 border-t border-steel-700/40">
                    <button
                      onClick={clearAllSlots}
                      className="btn-ghost text-sm text-error-400 hover:text-error-300"
                    >
                      {t.availability.presets.clear}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Pending Periods - Collapsed */}
          {pendingSlots.length > 0 && (
            <div className="card overflow-hidden">
              <button
                onClick={() => setExpandedSection(expandedSection === 'pending' ? null : 'pending')}
                className={`w-full px-5 py-4 flex items-center justify-between ${
                  expandedSection === 'pending' ? 'bg-navy-800 border-b border-warning-500/20' : 'bg-navy-900'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-warning-500"></div>
                  <span className="font-semibold text-white">
                    {language === 'es' ? 'Pendientes' : 'Pending'} ({pendingSlots.length})
                  </span>
                </div>
                <svg className={`w-5 h-5 text-steel-400 transition-transform ${expandedSection === 'pending' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {expandedSection === 'pending' && (
                <div className="p-4 space-y-3">
                  {pendingSlots.map((slot) => (
                    <div
                      key={slot.id}
                      className="flex items-center justify-between p-4 bg-navy-800/50 rounded-lg border-2 border-warning-500/20"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-warning-500/10 border border-warning-500/30 flex items-center justify-center">
                          <svg className="w-5 h-5 text-warning-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <div>
                          <p className="font-medium text-white">{formatDateRange(slot)}</p>
                          <p className="text-sm text-warning-400">{language === 'es' ? 'Pendiente de confirmación' : 'Pending confirmation'}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleSoftDelete(slot.id)}
                        className="btn-ghost text-error-400 hover:text-error-300 p-2"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Expired Periods - Collapsed */}
          {expiredSlots.length > 0 && (
            <div className="card overflow-hidden">
              <button
                onClick={() => setExpandedSection(expandedSection === 'expired' ? null : 'expired')}
                className={`w-full px-5 py-4 flex items-center justify-between ${
                  expandedSection === 'expired' ? 'bg-navy-800 border-b border-steel-600/20' : 'bg-navy-900'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-steel-600"></div>
                  <span className="font-semibold text-steel-400">
                    {language === 'es' ? 'Expirados' : 'Expired'} ({expiredSlots.length})
                  </span>
                </div>
                <svg className={`w-5 h-5 text-steel-400 transition-transform ${expandedSection === 'expired' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {expandedSection === 'expired' && (
                <div className="p-4 space-y-3">
                  {expiredSlots.map((slot) => (
                    <div
                      key={slot.id}
                      className="flex items-center justify-between p-4 bg-navy-800/30 rounded-lg border border-steel-700/30 opacity-70"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-steel-700/30 flex items-center justify-center">
                          <svg className="w-5 h-5 text-steel-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <div>
                          <p className="font-medium text-steel-400">{formatDateRange(slot)}</p>
                          <p className="text-sm text-steel-600">{language === 'es' ? 'Período expirado' : 'Expired period'}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  )
}
