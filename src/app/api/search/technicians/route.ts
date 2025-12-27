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
      own_tools
    } = body

    if (!start_date || !end_date) {
      return NextResponse.json({ error: 'Dates are required' }, { status: 400 })
    }

    // Find technicians with matching availability
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
        languages
      `)
      .eq('is_available', true)

    // Apply filters
    if (uk_license) {
      query = query.eq('uk_license', true)
    }

    if (right_to_work_uk) {
      query = query.eq('right_to_work_uk', true)
    }

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
        last_updated: createdAt
      }
    })

    // Sort by freshness (fresh first, then warning, then stale)
    results.sort((a, b) => {
      const order = { fresh: 0, warning: 1, stale: 2 }
      return order[a.freshness] - order[b.freshness]
    })

    return NextResponse.json({ technicians: results })
  } catch (error: any) {
    console.error('Search error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
