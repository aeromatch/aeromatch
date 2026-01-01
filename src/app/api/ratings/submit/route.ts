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

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    
    // Verify user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Get user profile - must be company
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'company') {
      return NextResponse.json({ error: 'Only companies can submit ratings' }, { status: 403 })
    }

    const body = await request.json()
    const { 
      jobRequestId, 
      technicianId,
      overall,
      reliability,
      skillsMatch,
      communication,
      safetyCompliance,
      privateComment 
    } = body

    // Validate required fields
    if (!jobRequestId || !technicianId || !overall) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (overall < 1 || overall > 5) {
      return NextResponse.json({ error: 'Overall rating must be 1-5' }, { status: 400 })
    }

    // Verify job belongs to this company and is completed
    const { data: job } = await supabase
      .from('job_requests')
      .select('id, company_user_id, technician_user_id, status')
      .eq('id', jobRequestId)
      .single()

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    }

    if (job.company_user_id !== user.id) {
      return NextResponse.json({ error: 'Not authorized to rate this job' }, { status: 403 })
    }

    if (job.status !== 'completed') {
      return NextResponse.json({ error: 'Can only rate completed jobs' }, { status: 400 })
    }

    if (job.technician_user_id !== technicianId) {
      return NextResponse.json({ error: 'Technician mismatch' }, { status: 400 })
    }

    // Insert rating using admin client
    const adminClient = getAdminClient()
    const { error: insertError } = await adminClient
      .from('job_ratings')
      .upsert({
        job_request_id: jobRequestId,
        rater_user_id: user.id,
        rated_user_id: technicianId,
        overall,
        reliability: reliability || null,
        skills_match: skillsMatch || null,
        communication: communication || null,
        safety_compliance: safetyCompliance || null,
        private_comment: privateComment || null
      }, {
        onConflict: 'job_request_id,rater_user_id,rated_user_id'
      })

    if (insertError) {
      console.error('Error inserting rating:', insertError)
      return NextResponse.json({ error: 'Failed to submit rating' }, { status: 500 })
    }

    // Mark job as rated
    await adminClient
      .from('job_requests')
      .update({ rated: true })
      .eq('id', jobRequestId)

    return NextResponse.json({ success: true })

  } catch (error: any) {
    console.error('Rating submit error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

