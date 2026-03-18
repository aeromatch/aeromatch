import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim().toLowerCase())

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function GET(request: Request) {
  try {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') // pending, checked, rejected, or all
    const isAdmin = ADMIN_EMAILS.includes(user.email?.toLowerCase() || '')

    const serviceClient = getServiceClient()

    // Admin can see all certificates, technician can only see their own
    let query = serviceClient
      .from('amx_certificates')
      .select('*')
      .order('generated_at', { ascending: false })

    if (!isAdmin) {
      query = query.eq('technician_id', user.id)
    }

    if (status && status !== 'all') {
      query = query.eq('status', status)
    }

    const { data: certificates, error } = await query

    if (error) {
      console.error('Error fetching certificates:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // If admin, also get technician info
    if (isAdmin && certificates && certificates.length > 0) {
      const techIds = [...new Set(certificates.map(c => c.technician_id))]
      
      const { data: profiles } = await serviceClient
        .from('profiles')
        .select('id, full_name, email')
        .in('id', techIds)

      const { data: technicians } = await serviceClient
        .from('technicians')
        .select('user_id, license_category, aircraft_types')
        .in('user_id', techIds)

      const enrichedCertificates = certificates.map(cert => {
        const profile = profiles?.find(p => p.id === cert.technician_id)
        const tech = technicians?.find(t => t.user_id === cert.technician_id)
        return {
          ...cert,
          technicianName: profile?.full_name || 'Unknown',
          technicianEmail: profile?.email || 'Unknown',
          licenseCategory: tech?.license_category || [],
          aircraftTypes: tech?.aircraft_types || [],
        }
      })

      return NextResponse.json({ certificates: enrichedCertificates })
    }

    return NextResponse.json({ certificates: certificates || [] })

  } catch (error: any) {
    console.error('Certificates GET error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
