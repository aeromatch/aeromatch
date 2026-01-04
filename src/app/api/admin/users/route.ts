import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

function getAdminClient() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

function isAdmin(email: string | undefined): boolean {
  if (!email) return false
  const adminEmails = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim().toLowerCase())
  return adminEmails.includes(email.toLowerCase())
}

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    
    // Verify user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Check admin authorization
    if (!isAdmin(user.email)) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'technicians'

    const adminClient = getAdminClient()

    if (type === 'technicians') {
      // Get technicians with their profile and premium status
      const { data: profiles } = await adminClient
        .from('profiles')
        .select('id, email, full_name, created_at')
        .eq('role', 'technician')
        .order('created_at', { ascending: false })
        .limit(100)

      if (!profiles) {
        return NextResponse.json({ users: [] })
      }

      // Get technician details
      const userIds = profiles.map(p => p.id)
      
      const [technicianData, premiumData, docsData, availData] = await Promise.all([
        adminClient.from('technicians').select('user_id, license_category, aircraft_types, specialties').in('user_id', userIds),
        adminClient.from('premium_grants').select('technician_id, expires_at').in('technician_id', userIds),
        adminClient.from('documents').select('technician_id').in('technician_id', userIds),
        adminClient.from('availability_slots').select('technician_id').in('technician_id', userIds)
      ])

      const techMap = new Map(technicianData.data?.map(t => [t.user_id, t]) || [])
      const premiumMap = new Map(premiumData.data?.map(p => [p.technician_id, p]) || [])
      const docsMap = new Map<string, number>()
      const availMap = new Map<string, number>()

      docsData.data?.forEach(d => docsMap.set(d.technician_id, (docsMap.get(d.technician_id) || 0) + 1))
      availData.data?.forEach(a => availMap.set(a.technician_id, (availMap.get(a.technician_id) || 0) + 1))

      const users = profiles.map(p => {
        const tech = techMap.get(p.id)
        const premium = premiumMap.get(p.id)
        return {
          id: p.id,
          email: p.email,
          fullName: p.full_name,
          createdAt: p.created_at,
          hasCapabilities: tech && (
            (tech.license_category?.length > 0) ||
            (tech.aircraft_types?.length > 0) ||
            (tech.specialties?.length > 0)
          ),
          docsCount: docsMap.get(p.id) || 0,
          availCount: availMap.get(p.id) || 0,
          hasPremium: !!premium,
          premiumExpires: premium?.expires_at
        }
      })

      return NextResponse.json({ users })

    } else if (type === 'companies') {
      // Get companies
      const { data: profiles } = await adminClient
        .from('profiles')
        .select('id, email, full_name, created_at')
        .eq('role', 'company')
        .order('created_at', { ascending: false })
        .limit(100)

      if (!profiles) {
        return NextResponse.json({ users: [] })
      }

      const userIds = profiles.map(p => p.id)
      
      const [companyData, jobsData] = await Promise.all([
        adminClient.from('companies').select('user_id, company_name, company_type').in('user_id', userIds),
        adminClient.from('job_requests').select('company_id, status').in('company_id', userIds)
      ])

      const companyMap = new Map(companyData.data?.map(c => [c.user_id, c]) || [])
      const jobsMap = new Map<string, { total: number, accepted: number }>()

      jobsData.data?.forEach(j => {
        const existing = jobsMap.get(j.company_id) || { total: 0, accepted: 0 }
        existing.total++
        if (j.status === 'accepted' || j.status === 'completed') existing.accepted++
        jobsMap.set(j.company_id, existing)
      })

      const users = profiles.map(p => {
        const company = companyMap.get(p.id)
        const jobs = jobsMap.get(p.id) || { total: 0, accepted: 0 }
        return {
          id: p.id,
          email: p.email,
          fullName: p.full_name,
          companyName: company?.company_name,
          companyType: company?.company_type,
          createdAt: p.created_at,
          totalJobs: jobs.total,
          acceptedJobs: jobs.accepted
        }
      })

      return NextResponse.json({ users })
    }

    return NextResponse.json({ error: 'Invalid type' }, { status: 400 })

  } catch (error: any) {
    console.error('Admin users error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

