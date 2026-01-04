import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { sendJobRequestNotification } from '@/lib/email/resend'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Verify user is a company and get company name
    const { data: companyProfile } = await supabase
      .from('profiles')
      .select('role, full_name')
      .eq('id', user.id)
      .single()

    if (companyProfile?.role !== 'company') {
      return NextResponse.json({ error: 'Solo empresas pueden crear solicitudes' }, { status: 403 })
    }

    // Get company name from companies table if available
    const { data: companyData } = await supabase
      .from('companies')
      .select('company_name')
      .eq('user_id', user.id)
      .single()

    const body = await request.json()
    const {
      technician_id,
      final_client_name,
      work_location,
      contract_type,
      start_date,
      end_date,
      notes,
      requires_right_to_work_uk
    } = body

    if (!technician_id || !final_client_name || !work_location || !start_date || !end_date) {
      return NextResponse.json({ error: 'Faltan campos obligatorios' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('job_requests')
      .insert({
        company_id: user.id,
        technician_id,
        final_client_name,
        work_location,
        contract_type: contract_type || 'short-term',
        start_date,
        end_date,
        notes,
        status: 'pending',
        requires_right_to_work_uk: requires_right_to_work_uk || false
      })
      .select()
      .single()

    if (error) {
      console.error('Create request error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Get technician info for email notification
    const { data: technicianProfile } = await supabase
      .from('profiles')
      .select('email, full_name')
      .eq('id', technician_id)
      .single()

    // Send email notification (don't block response if it fails)
    console.log('Preparing email notification for technician:', technicianProfile?.email)
    
    if (technicianProfile?.email) {
      try {
        const emailResult = await sendJobRequestNotification({
          technicianEmail: technicianProfile.email,
          technicianName: technicianProfile.full_name || 'Técnico',
          companyName: companyData?.company_name || companyProfile?.full_name || 'Una empresa',
          finalClient: final_client_name,
          workLocation: work_location,
          startDate: start_date,
          endDate: end_date,
          contractType: contract_type || 'short-term',
          notes: notes || undefined,
          requiresRightToWorkUk: requires_right_to_work_uk || false
        })
        console.log('Email result:', JSON.stringify(emailResult))
      } catch (err) {
        console.error('Email notification failed:', err)
      }
    } else {
      console.log('No email found for technician, skipping notification')
    }

    return NextResponse.json({ request: data })
  } catch (error: any) {
    console.error('Create request error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    let query = supabase
      .from('job_requests')
      .select('*')
      .order('created_at', { ascending: false })

    if (profile?.role === 'technician') {
      query = query.eq('technician_id', user.id)
    } else {
      query = query.eq('company_id', user.id)
    }

    const { data, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ requests: data })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

