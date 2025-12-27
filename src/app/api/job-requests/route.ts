import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Verify user is a company
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'company') {
      return NextResponse.json({ error: 'Solo empresas pueden crear solicitudes' }, { status: 403 })
    }

    const body = await request.json()
    const {
      technician_id,
      final_client_name,
      work_location,
      contract_type,
      start_date,
      end_date,
      notes
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
        status: 'pending'
      })
      .select()
      .single()

    if (error) {
      console.error('Create request error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
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

