import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// Admin client for inserting premium grants
function getAdminClient() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

export async function POST() {
  try {
    const supabase = await createClient()
    
    // Verify user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Get user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'technician') {
      return NextResponse.json({ error: 'Only technicians can receive founding premium' }, { status: 403 })
    }

    // Check cutoff date
    const cutoffDateStr = process.env.NEXT_PUBLIC_FOUNDING_CUTOFF_DATE || '2026-01-20'
    const cutoffDate = new Date(cutoffDateStr)
    const now = new Date()

    if (now > cutoffDate) {
      return NextResponse.json({ 
        complete: false, 
        premiumGranted: false,
        reason: 'Founding premium period has ended'
      })
    }

    // Check if already has founding premium
    const { data: existingGrant } = await supabase
      .from('premium_grants')
      .select('id, expires_at')
      .eq('technician_id', user.id)
      .single()

    if (existingGrant) {
      return NextResponse.json({ 
        complete: true, 
        premiumGranted: false,
        alreadyHasPremium: true,
        expiresAt: existingGrant.expires_at
      })
    }

    // Check profile completion criteria
    // 1. Technician profile exists with aircraft types
    const { data: technician } = await supabase
      .from('technicians')
      .select('user_id, license_category, aircraft_types, specialties')
      .eq('user_id', user.id)
      .single()

    // 2. Get all documents
    const { data: documents } = await supabase
      .from('documents')
      .select('doc_type')
      .eq('technician_id', user.id)

    const docTypes = (documents || []).map(d => d.doc_type)

    // Check for basic license (EASA, UK CAA or FAA)
    const basicLicenseTypes = ['easa_license', 'uk_license', 'faa_ap']
    const hasBasicLicense = basicLicenseTypes.some(type => docTypes.includes(type))

    // Check aircraft type ratings - for each aircraft selected, must have theory + practical
    const aircraftTypes = technician?.aircraft_types || []
    let missingAircraftDocs: string[] = []
    
    for (const aircraft of aircraftTypes) {
      const aircraftLower = aircraft.toLowerCase()
      const hasTheory = docTypes.includes(`type_${aircraftLower}_theory`)
      const hasPractical = docTypes.includes(`type_${aircraftLower}_practical`)
      
      if (!hasTheory || !hasPractical) {
        missingAircraftDocs.push(aircraft)
      }
    }

    const hasAllAircraftDocs = aircraftTypes.length === 0 || missingAircraftDocs.length === 0

    // 3. Has active availability
    const { count: availCount } = await supabase
      .from('availability_slots')
      .select('id', { count: 'exact', head: true })
      .eq('technician_id', user.id)
      .gte('end_date', now.toISOString().split('T')[0])

    const hasAvailability = (availCount || 0) >= 1

    const isComplete = hasBasicLicense && hasAllAircraftDocs && hasAvailability

    if (!isComplete) {
      return NextResponse.json({ 
        complete: false, 
        premiumGranted: false,
        missing: {
          basicLicense: !hasBasicLicense,
          aircraftDocs: missingAircraftDocs,
          availability: !hasAvailability
        },
        debug: {
          docTypes,
          aircraftTypes,
          availCount: availCount || 0
        }
      })
    }

    // Grant Founding Premium (12 months)
    const expiresAt = new Date()
    expiresAt.setFullYear(expiresAt.getFullYear() + 1)

    const adminClient = getAdminClient()
    const { error: insertError } = await adminClient
      .from('premium_grants')
      .insert({
        technician_id: user.id,
        reason: 'founding_profile_complete',
        expires_at: expiresAt.toISOString()
      })

    if (insertError) {
      // Might be duplicate, check again
      if (insertError.code === '23505') {
        return NextResponse.json({ 
          complete: true, 
          premiumGranted: false,
          alreadyHasPremium: true
        })
      }
      console.error('Error granting premium:', insertError)
      return NextResponse.json({ error: 'Failed to grant premium' }, { status: 500 })
    }

    return NextResponse.json({ 
      complete: true, 
      premiumGranted: true,
      expiresAt: expiresAt.toISOString()
    })

  } catch (error: any) {
    console.error('Premium evaluate error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

