import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient as createServerClient } from '@/lib/supabase/server'

// Admin emails from environment
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim().toLowerCase())

// Service role client for admin operations
function getServiceClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  return createClient(supabaseUrl, serviceKey)
}

// GET: List technicians with verification info and their documents
export async function GET(request: Request) {
  try {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user || !ADMIN_EMAILS.includes(user.email?.toLowerCase() || '')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const serviceClient = getServiceClient()
    const { searchParams } = new URL(request.url)
    const filter = searchParams.get('filter') || 'all' // all, pending, verified, unverified

    // Get all technicians with their profile info and documents
    let query = serviceClient
      .from('technicians')
      .select(`
        user_id,
        verification_status,
        availability_status,
        verified_at,
        verification_notes,
        license_category,
        aircraft_types,
        is_available
      `)

    // Apply filter
    if (filter === 'pending') {
      query = query.eq('verification_status', 'pending')
    } else if (filter === 'verified') {
      query = query.eq('verification_status', 'verified')
    } else if (filter === 'unverified') {
      query = query.eq('verification_status', 'unverified')
    }

    const { data: technicians, error: techError } = await query

    if (techError) {
      console.error('Error fetching technicians:', techError)
      return NextResponse.json({ error: techError.message }, { status: 500 })
    }

    // Get profiles for these technicians
    const techIds = technicians?.map(t => t.user_id) || []
    
    const { data: profiles } = await serviceClient
      .from('profiles')
      .select('id, email, full_name')
      .in('id', techIds)

    // Get documents for these technicians
    const { data: documents } = await serviceClient
      .from('documents')
      .select('id, technician_id, doc_type, status, storage_path, expires_on, created_at')
      .in('technician_id', techIds)
      .order('created_at', { ascending: false })

    // Combine data
    const result = technicians?.map(tech => {
      const profile = profiles?.find(p => p.id === tech.user_id)
      const techDocs = documents?.filter(d => d.technician_id === tech.user_id) || []
      
      return {
        id: tech.user_id,
        email: profile?.email || 'Unknown',
        fullName: profile?.full_name || '-',
        verificationStatus: tech.verification_status || 'unverified',
        availabilityStatus: tech.availability_status || 'hidden',
        verifiedAt: tech.verified_at,
        verificationNotes: tech.verification_notes,
        licenseCategory: tech.license_category || [],
        aircraftTypes: tech.aircraft_types || [],
        isAvailable: tech.is_available,
        documents: techDocs.map(d => ({
          id: d.id,
          docType: d.doc_type,
          status: d.status,
          storagePath: d.storage_path,
          expiresOn: d.expires_on,
          createdAt: d.created_at,
        })),
        docsCount: techDocs.length,
      }
    }) || []

    // Sort: pending first, then unverified with docs, then others
    result.sort((a, b) => {
      const order: Record<string, number> = { pending: 0, unverified: 1, verified: 2, rejected: 3 }
      const aOrder = order[a.verificationStatus] ?? 4
      const bOrder = order[b.verificationStatus] ?? 4
      if (aOrder !== bOrder) return aOrder - bOrder
      // Within same status, sort by docs count (more docs first)
      return b.docsCount - a.docsCount
    })

    return NextResponse.json({ technicians: result })
  } catch (error: any) {
    console.error('Admin verification GET error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST: Update technician verification status
export async function POST(request: Request) {
  try {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user || !ADMIN_EMAILS.includes(user.email?.toLowerCase() || '')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const body = await request.json()
    const { technicianId, status, notes } = body

    if (!technicianId || !status) {
      return NextResponse.json({ error: 'technicianId and status required' }, { status: 400 })
    }

    if (!['unverified', 'pending', 'verified', 'rejected'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    const serviceClient = getServiceClient()

    // Build update object
    const updateData: any = {
      verification_status: status,
      verification_notes: notes || null,
    }

    // If verifying, set verified_at and update availability_status
    if (status === 'verified') {
      updateData.verified_at = new Date().toISOString()
      // If technician has is_available=true, upgrade to available_verified
      const { data: tech } = await serviceClient
        .from('technicians')
        .select('is_available')
        .eq('user_id', technicianId)
        .single()
      
      if (tech?.is_available) {
        updateData.availability_status = 'available_verified'
      }
    } else if (status === 'rejected' || status === 'unverified') {
      updateData.verified_at = null
      // Downgrade to available_unverified if was verified
      const { data: tech } = await serviceClient
        .from('technicians')
        .select('availability_status')
        .eq('user_id', technicianId)
        .single()
      
      if (tech?.availability_status === 'available_verified') {
        updateData.availability_status = 'available_unverified'
      }
    }

    const { error: updateError } = await serviceClient
      .from('technicians')
      .update(updateData)
      .eq('user_id', technicianId)

    if (updateError) {
      console.error('Error updating verification:', updateError)
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    // Trigger certificate generation when status changes to 'pending'
    let certificateGenerated = false
    if (status === 'pending') {
      try {
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
        const certRes = await fetch(`${baseUrl}/api/certificates/generate`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Cookie': request.headers.get('cookie') || '',
          },
          body: JSON.stringify({ technicianId }),
        })
        
        if (certRes.ok) {
          certificateGenerated = true
          console.log('Certificate generated for technician:', technicianId)
        } else {
          const certError = await certRes.json()
          console.log('Certificate generation skipped:', certError.error)
        }
      } catch (certErr) {
        console.error('Error triggering certificate generation:', certErr)
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: `Technician ${status === 'verified' ? 'verified' : status}`,
      certificateGenerated,
    })
  } catch (error: any) {
    console.error('Admin verification POST error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}




