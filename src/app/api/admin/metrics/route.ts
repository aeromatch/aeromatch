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

    const today = new Date().toISOString().split('T')[0]

    // Fetch all metrics in parallel
    const [
      techniciansResult,
      companiesResult,
      jobRequestsResult,
      acceptedJobsResult,
      completedJobsResult,
      ratingsResult,
      premiumGrantsResult,
      techsWithDocsResult,
      techsWithAvailResult,
      totalDocsResult
    ] = await Promise.all([
      // Total technicians
      adminClient.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'technician'),
      // Total companies
      adminClient.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'company'),
      // Total job requests
      adminClient.from('job_requests').select('id', { count: 'exact', head: true }),
      // Accepted jobs
      adminClient.from('job_requests').select('id', { count: 'exact', head: true }).eq('status', 'accepted'),
      // Completed jobs (rated)
      adminClient.from('job_requests').select('id', { count: 'exact', head: true }).eq('rated', true),
      // Total ratings
      adminClient.from('job_ratings').select('id', { count: 'exact', head: true }),
      // Founding premium grants (both types: founding_member and founding_profile_complete)
      adminClient.from('premium_grants').select('id', { count: 'exact', head: true }).in('reason', ['founding_member', 'founding_profile_complete']),
      // Technicians with at least 1 document
      adminClient.from('documents').select('technician_id', { count: 'exact', head: false }),
      // Availability slots active
      adminClient.from('availability_slots').select('technician_id', { count: 'exact', head: false }).gte('end_date', today),
      // Total documents
      adminClient.from('documents').select('id', { count: 'exact', head: true })
    ])

    // Count unique technicians with docs
    const uniqueTechsWithDocs = new Set((techsWithDocsResult.data || []).map((d: any) => d.technician_id)).size
    // Count unique technicians with availability
    const uniqueTechsWithAvail = new Set((techsWithAvailResult.data || []).map((a: any) => a.technician_id)).size

    return NextResponse.json({
      totalTechnicians: techniciansResult.count || 0,
      totalCompanies: companiesResult.count || 0,
      totalJobRequests: jobRequestsResult.count || 0,
      totalAccepted: acceptedJobsResult.count || 0,
      totalCompleted: completedJobsResult.count || 0,
      totalRatings: ratingsResult.count || 0,
      totalFoundingPremium: premiumGrantsResult.count || 0,
      techsWithDocs: uniqueTechsWithDocs,
      techsWithAvailability: uniqueTechsWithAvail,
      totalDocuments: totalDocsResult.count || 0
    })

  } catch (error: any) {
    console.error('Admin metrics error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

