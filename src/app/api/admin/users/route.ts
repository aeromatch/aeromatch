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

async function isAdminRequestor(params: { supabase: any; userId: string; userEmail?: string | null }) {
  const { supabase, userId, userEmail } = params
  if (isAdmin(userEmail || undefined)) return true
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', userId).single()
  return profile?.role === 'admin'
}

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    
    // Verify user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Check admin authorization (role-based + legacy email allowlist)
    if (!(await isAdminRequestor({ supabase, userId: user.id, userEmail: user.email }))) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'technicians'

    const adminClient = getAdminClient()

    if (type === 'all') {
      const { data: profiles } = await adminClient
        .from('profiles')
        .select('id, email, full_name, created_at, role, plan')
        .order('created_at', { ascending: false })
        .limit(500)

      return NextResponse.json({
        users: (profiles || []).map((p: any) => ({
          id: p.id,
          email: p.email,
          fullName: p.full_name,
          createdAt: p.created_at,
          role: p.role,
          plan: p.plan || 'free',
        })),
      })
    }

    if (type === 'technicians') {
      // Get technicians with their profile and premium status
      const { data: profiles } = await adminClient
        .from('profiles')
        .select('id, email, full_name, created_at, plan')
        .eq('role', 'technician')
        .order('created_at', { ascending: false })
        .limit(100)

      if (!profiles) {
        return NextResponse.json({ users: [] })
      }

      // Get technician details
      const userIds = profiles.map(p => p.id)
      
      const [technicianData, premiumData, docsData, availData] = await Promise.all([
        adminClient.from('technicians').select('user_id, license_category, aircraft_types, specialties, profile_active').in('user_id', userIds),
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
          plan: p.plan || 'free',
          hasCapabilities: tech && (
            (tech.license_category?.length > 0) ||
            (tech.aircraft_types?.length > 0) ||
            (tech.specialties?.length > 0)
          ),
          docsCount: docsMap.get(p.id) || 0,
          availCount: availMap.get(p.id) || 0,
          hasPremium: !!premium,
          premiumExpires: premium?.expires_at,
          profileActive: tech?.profile_active !== false
        }
      })

      return NextResponse.json({ users })

    } else if (type === 'companies') {
      // Get companies
      const { data: profiles } = await adminClient
        .from('profiles')
        .select('id, email, full_name, created_at, plan')
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
          plan: p.plan || 'free',
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

export async function PATCH(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }
    if (!(await isAdminRequestor({ supabase, userId: user.id, userEmail: user.email }))) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
    }

    const body = await request.json()
    const { userId, action } = body
    if (!userId || typeof action !== 'string') return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })

    const adminClient = getAdminClient()
    if (action === 'block') {
      const { error } = await adminClient
        .from('technicians')
        .update({
          profile_active: false,
          is_available: false,
          availability_status: 'hidden'
        })
        .eq('user_id', userId)

      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ success: true })
    }

    if (action === 'set_plan') {
      const plan = typeof body.plan === 'string' ? body.plan : ''
      if (!['free', 'basic', 'premium'].includes(plan)) {
        return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })
      }
      const { error } = await adminClient
        .from('profiles')
        .update({ plan })
        .eq('id', userId)

      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }
    if (!(await isAdminRequestor({ supabase, userId: user.id, userEmail: user.email }))) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    if (!userId) return NextResponse.json({ error: 'Missing userId' }, { status: 400 })

    const adminClient = getAdminClient()

    // Clean storage files first for complete cleanup
    const { data: docs } = await adminClient
      .from('documents')
      .select('storage_path')
      .eq('technician_id', userId)
    const paths = (docs || []).map((d: any) => d.storage_path).filter(Boolean)
    if (paths.length > 0) {
      await adminClient.storage.from('documents').remove(paths)
    }

    // Best-effort cleanup of related rows (FK cascades may cover many of these)
    await adminClient.from('availability_slots').delete().eq('technician_id', userId)
    await adminClient.from('premium_grants').delete().eq('technician_id', userId)
    await adminClient.from('job_acceptance_workflow').delete().or(`technician_user_id.eq.${userId},company_user_id.eq.${userId}`)
    await adminClient.from('job_requests').delete().or(`technician_id.eq.${userId},company_id.eq.${userId}`)
    await adminClient.from('technicians').delete().eq('user_id', userId)
    await adminClient.from('companies').delete().eq('user_id', userId)
    await adminClient.from('amx_certificates').delete().eq('technician_id', userId)
    await adminClient.from('certificates').delete().eq('technician_id', userId)

    const { error: deleteProfileError } = await adminClient.from('profiles').delete().eq('id', userId)
    if (deleteProfileError) return NextResponse.json({ error: deleteProfileError.message }, { status: 500 })

    // Remove the auth user as well (so it disappears from Supabase Auth)
    const { error: deleteAuthError } = await adminClient.auth.admin.deleteUser(userId)
    if (deleteAuthError) return NextResponse.json({ error: deleteAuthError.message }, { status: 500 })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

