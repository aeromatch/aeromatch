import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
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

    if (!jobRequestId || !technicianId || !overall) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Verify the job request belongs to this company and is completed
    const { data: jobRequest, error: jobError } = await supabase
      .from('job_requests')
      .select('id, company_id, status, end_date')
      .eq('id', jobRequestId)
      .single()

    if (jobError || !jobRequest) {
      return NextResponse.json({ error: 'Job request not found' }, { status: 404 })
    }

    // Check permissions (company user must own the job request)
    if (jobRequest.company_id !== user.id) {
      return NextResponse.json({ error: 'Not authorized to rate this job' }, { status: 403 })
    }

    // Check job is completed (accepted + end_date passed)
    if (jobRequest.status !== 'accepted') {
      return NextResponse.json({ error: 'Job must be accepted to rate' }, { status: 400 })
    }

    const endDate = new Date(jobRequest.end_date)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    if (endDate >= today) {
      return NextResponse.json({ error: 'Job must be completed to rate' }, { status: 400 })
    }

    // Insert rating
    const { error: ratingError } = await supabase
      .from('job_ratings')
      .insert({
        job_request_id: jobRequestId,
        technician_user_id: technicianId,
        company_user_id: user.id,
        overall_rating: overall,
        reliability_rating: reliability || null,
        skills_match_rating: skillsMatch || null,
        communication_rating: communication || null,
        safety_compliance_rating: safetyCompliance || null,
        private_comment: privateComment || null,
      })

    if (ratingError) {
      console.error('Rating insert error:', ratingError)
      return NextResponse.json({ error: 'Failed to save rating' }, { status: 500 })
    }

    // Mark job request as rated
    const { error: updateError } = await supabase
      .from('job_requests')
      .update({ rated: true })
      .eq('id', jobRequestId)

    if (updateError) {
      console.error('Job update error:', updateError)
    }

    // Update technician's average rating
    const { data: ratings } = await supabase
      .from('job_ratings')
      .select('overall_rating')
      .eq('technician_user_id', technicianId)

    if (ratings && ratings.length > 0) {
      const avgRating = ratings.reduce((sum, r) => sum + r.overall_rating, 0) / ratings.length
      
      await supabase
        .from('technicians')
        .update({ average_rating: Math.round(avgRating * 10) / 10 })
        .eq('user_id', technicianId)
    }

    return NextResponse.json({ success: true })

  } catch (error: any) {
    console.error('Rating submit error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
