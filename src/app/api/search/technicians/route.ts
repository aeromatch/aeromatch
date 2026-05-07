import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 401 })
    }

    // Verify user is a company
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'company') {
      return NextResponse.json({ error: 'Only companies can search technicians' }, { status: 403 })
    }

    const body = await request.json()
    const {
      start_date,
      end_date,
      license_category,
      aircraft_types,
      specialties,
      uk_license,
      right_to_work_uk,
      own_tools,
      contract_type  // 'short-term' | 'long-term' | undefined
    } = body

    if (!start_date || !end_date) {
      return NextResponse.json({ error: 'Dates are required' }, { status: 400 })
    }

    // Find technicians with matching availability
    // Include verification status for ranking (verified first)
    let query = supabase
      .from('technicians')
      .select(`
        user_id,
        license_category,
        aircraft_types,
        specialties,
        own_tools,
        right_to_work_uk,
        uk_license,
        languages,
        verification_status,
        availability_status,
        contract_type_preference,
        years_experience,
        average_rating
      `)
      .eq('profile_active', true)
      .eq('is_available', true)
      // Only show technicians who are visible (not hidden)
      .in('availability_status', ['available_unverified', 'available_verified'])

    // Apply filters (right_to_work_uk is NOT a filter - all technicians must appear)
    if (uk_license) {
      query = query.eq('uk_license', true)
    }

    // NOTE: right_to_work_uk is intentionally NOT filtered here
    // The job request flag determines if RTW is required, not the search filter
    // Technicians without RTW UK will show a warning but still appear in results

    if (own_tools) {
      query = query.eq('own_tools', true)
    }

    const { data: technicians, error } = await query

    if (error) {
      console.error('Search error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Get availability slots - without confirmed_at to avoid schema errors
    const { data: availableSlots } = await supabase
      .from('availability_slots')
      .select('technician_id, start_date, end_date, created_at')
      .lte('start_date', start_date)
      .gte('end_date', end_date)

    // Create map of technician_id to availability info
    const technicianAvailability = new Map<string, { hasSlot: boolean; createdAt: string | null }>()
    
    availableSlots?.forEach(slot => {
      const existing = technicianAvailability.get(slot.technician_id)
      if (!existing || (slot.created_at && (!existing.createdAt || slot.created_at > existing.createdAt))) {
        technicianAvailability.set(slot.technician_id, {
          hasSlot: true,
          createdAt: slot.created_at
        })
      }
    })

    // Filter technicians who have availability
    let filteredTechnicians = technicians?.filter(t => 
      technicianAvailability.has(t.user_id)
    ) || []

    // Filter by license category (if any filter matches)
    if (license_category && license_category.length > 0) {
      filteredTechnicians = filteredTechnicians.filter(t => 
        t.license_category?.some((lic: string) => license_category.includes(lic))
      )
    }

    // Filter by aircraft types (if any filter matches)
    if (aircraft_types && aircraft_types.length > 0) {
      filteredTechnicians = filteredTechnicians.filter(t => 
        t.aircraft_types?.some((type: string) => aircraft_types.includes(type))
      )
    }

    // Filter by specialties (if any filter matches)
    if (specialties && specialties.length > 0) {
      filteredTechnicians = filteredTechnicians.filter(t => 
        t.specialties?.some((spec: string) => specialties.includes(spec))
      )
    }

    // Filter by contract type preference
    // Show technicians who prefer the requested type OR prefer 'both'
    if (contract_type && (contract_type === 'short-term' || contract_type === 'long-term')) {
      filteredTechnicians = filteredTechnicians.filter(t => {
        const pref = t.contract_type_preference || 'both'
        return pref === contract_type || pref === 'both'
      })
    }

    const technicianIds = filteredTechnicians.map(t => t.user_id)
    const { data: logbooks } = technicianIds.length > 0
      ? await supabase
          .from('documents')
          .select('technician_id')
          .eq('doc_type', 'logbook')
          .in('technician_id', technicianIds)
      : { data: [] as any[] }
    const hasLogbookSet = new Set((logbooks || []).map((d: any) => d.technician_id))

    // logBook360 HTML report (visible solo si el tecnico esta verificado)
    const { data: logbookReports } = technicianIds.length > 0
      ? await supabase
          .from('logbook_analysis')
          .select('technician_id, html_report_path')
          .in('technician_id', technicianIds)
      : { data: [] as any[] }
    const hasLogbookReportSet = new Set(
      (logbookReports || [])
        .filter((r: any) => Boolean(r.html_report_path))
        .map((r: any) => r.technician_id),
    )

    // Calculate freshness based on created_at and sort results
    const now = Date.now()
    const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000
    const SIXTY_DAYS = 60 * 24 * 60 * 60 * 1000

    const results = filteredTechnicians.map(t => {
      const availData = technicianAvailability.get(t.user_id)
      const createdAt = availData?.createdAt
      
      let freshness: 'fresh' | 'warning' | 'stale' = 'fresh'
      
      if (createdAt) {
        const timeSinceCreation = now - new Date(createdAt).getTime()
        if (timeSinceCreation < THIRTY_DAYS) {
          freshness = 'fresh'
        } else if (timeSinceCreation < SIXTY_DAYS) {
          freshness = 'warning'
        } else {
          freshness = 'stale'
        }
      }

      return {
        user_id: t.user_id,
        tech_id: t.user_id.substring(0, 8).toUpperCase(),
        license_category: t.license_category,
        aircraft_types: t.aircraft_types,
        specialties: t.specialties,
        own_tools: t.own_tools,
        right_to_work_uk: t.right_to_work_uk,
        uk_license: t.uk_license,
        languages: t.languages,
        freshness,
        last_updated: createdAt,
        // Include verification status for UI badges
        verification_status: t.verification_status || 'unverified',
        availability_status: t.availability_status || 'available_unverified',
        is_verified: t.verification_status === 'verified',
        // Contract preference
        contract_type_preference: t.contract_type_preference || 'both',
        years_experience: t.years_experience,
        average_rating: t.average_rating,
        has_logbook: hasLogbookSet.has(t.user_id),
        // logBook360 HTML solo se expone a empresas si el tecnico esta verificado
        has_logbook_report:
          t.verification_status === 'verified' && hasLogbookReportSet.has(t.user_id),
      }
    })

    // Sort by: 1) Verification (verified first), 2) Freshness
    results.sort((a, b) => {
      // Verified technicians always come first
      if (a.is_verified && !b.is_verified) return -1
      if (!a.is_verified && b.is_verified) return 1
      
      // Then sort by freshness
      const order = { fresh: 0, warning: 1, stale: 2 }
      return order[a.freshness] - order[b.freshness]
    })

    return NextResponse.json({ technicians: results })
  } catch (error: any) {
    console.error('Search error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
