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

export async function GET() {
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

    const adminClient = getAdminClient()

    // Fetch all metrics in parallel
    const [
      techniciansResult,
      companiesResult,
      jobRequestsResult,
      acceptedJobsResult,
      completedJobsResult,
      ratingsResult,
      premiumGrantsResult
    ] = await Promise.all([
      // Total technicians
      adminClient.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'technician'),
      // Total companies
      adminClient.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'company'),
      // Total job requests
      adminClient.from('job_requests').select('id', { count: 'exact', head: true }),
      // Accepted jobs
      adminClient.from('job_requests').select('id', { count: 'exact', head: true }).eq('status', 'accepted'),
      // Completed jobs
      adminClient.from('job_requests').select('id', { count: 'exact', head: true }).eq('status', 'completed'),
      // Total ratings
      adminClient.from('job_ratings').select('id', { count: 'exact', head: true }),
      // Founding premium grants
      adminClient.from('premium_grants').select('id', { count: 'exact', head: true }).eq('grant_type', 'founding_profile_complete')
    ])

    return NextResponse.json({
      totalTechnicians: techniciansResult.count || 0,
      totalCompanies: companiesResult.count || 0,
      totalJobRequests: jobRequestsResult.count || 0,
      totalAccepted: acceptedJobsResult.count || 0,
      totalCompleted: completedJobsResult.count || 0,
      totalRatings: ratingsResult.count || 0,
      totalFoundingPremium: premiumGrantsResult.count || 0
    })

  } catch (error: any) {
    console.error('Admin metrics error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

