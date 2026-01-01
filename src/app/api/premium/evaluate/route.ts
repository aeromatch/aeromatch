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
      .eq('user_id', user.id)
      .eq('grant_type', 'founding_profile_complete')
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
    // 1. Technician profile exists with capabilities
    const { data: technician } = await supabase
      .from('technicians')
      .select('id, license_category, aircraft_types, specialties')
      .eq('user_id', user.id)
      .single()

    const hasCapabilities = technician && (
      (technician.license_category && technician.license_category.length > 0) ||
      (technician.aircraft_types && technician.aircraft_types.length > 0) ||
      (technician.specialties && technician.specialties.length > 0)
    )

    // 2. Has at least 1 document uploaded
    const { count: docCount } = await supabase
      .from('documents')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)

    const hasDocuments = (docCount || 0) >= 1

    // 3. Has active availability
    const { count: availCount } = await supabase
      .from('availability_slots')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('end_date', now.toISOString().split('T')[0])

    const hasAvailability = (availCount || 0) >= 1

    const isComplete = hasCapabilities && hasDocuments && hasAvailability

    if (!isComplete) {
      return NextResponse.json({ 
        complete: false, 
        premiumGranted: false,
        missing: {
          capabilities: !hasCapabilities,
          documents: !hasDocuments,
          availability: !hasAvailability
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
        user_id: user.id,
        grant_type: 'founding_profile_complete',
        expires_at: expiresAt.toISOString(),
        snapshot: {
          cutoff_date: cutoffDateStr,
          granted_at: now.toISOString(),
          had_capabilities: hasCapabilities,
          had_documents: hasDocuments,
          had_availability: hasAvailability,
          doc_count: docCount,
          avail_count: availCount
        }
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

