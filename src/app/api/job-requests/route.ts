import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { sendJobRequestNotification } from '@/lib/email/resend'
import { sendAdminAogLaunchedNotification } from '@/lib/email/resend'

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
      technician_ids,
      final_client_name,
      work_location,
      contract_type,
      start_date,
      end_date,
      notes,
      requires_right_to_work_uk,
      company_offer_message,
      positions_needed,
      is_aog,
      required_aircraft_type
    } = body

    if (!final_client_name || !work_location || !start_date || !end_date) {
      return NextResponse.json({ error: 'Faltan campos obligatorios' }, { status: 400 })
    }

    const requestedIds: string[] = Array.isArray(technician_ids)
      ? technician_ids.filter((id: any) => typeof id === 'string').slice(0, 10)
      : (typeof technician_id === 'string' ? [technician_id] : [])

    const emergencyAog = !!is_aog
    const targetPositions = Math.max(1, Math.min(10, Number(positions_needed) || 1))
    const now = Date.now()
    const expiresAtIso = new Date(now + (emergencyAog ? 2 : 24) * 60 * 60 * 1000).toISOString()
    const requestGroupId = crypto.randomUUID()

    let prioritizedTechIds = requestedIds

    if (emergencyAog) {
      const { data: aogTechs } = await supabase
        .from('technicians')
        .select('user_id, aircraft_types, aog_available, aog_location, availability_status, is_available, profile_active')
        .eq('aog_available', true)
        .eq('is_available', true)
        .eq('profile_active', true)
        .in('availability_status', ['available_unverified', 'available_verified'])

      prioritizedTechIds = (aogTechs || [])
        .filter((row: any) => {
          if (!required_aircraft_type) return true
          return Array.isArray(row.aircraft_types) && row.aircraft_types.includes(required_aircraft_type)
        })
        .slice(0, 4)
        .map((row: any) => row.user_id)
    }

    if (prioritizedTechIds.length === 0) {
      return NextResponse.json({ error: 'No hay técnicos válidos para crear la solicitud' }, { status: 400 })
    }

    const rows = prioritizedTechIds.map((techId, idx) => ({
      company_id: user.id,
      technician_id: techId,
      final_client_name,
      work_location,
      contract_type: contract_type || 'short-term',
      start_date,
      end_date,
      notes,
      company_offer_message: company_offer_message || null,
      status: idx === 0 || emergencyAog ? 'pending' : 'draft',
      requires_right_to_work_uk: requires_right_to_work_uk || false,
      positions_needed: targetPositions,
      positions_filled: 0,
      preference_order: idx + 1,
      expires_at: idx === 0 || emergencyAog ? expiresAtIso : null,
      is_aog: emergencyAog,
      request_group_id: requestGroupId,
    }))

    const { data, error } = await supabase
      .from('job_requests')
      .insert(rows)
      .select('*')
      .order('preference_order', { ascending: true })

    if (error) {
      console.error('Create request error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const { data: techProfiles } = await supabase
      .from('profiles')
      .select('id, email, full_name')
      .in('id', prioritizedTechIds)

    const techProfileMap = new Map((techProfiles || []).map((p: any) => [p.id, p]))
    for (const req of data || []) {
      if (req.status !== 'pending') continue
      const technicianProfile: any = techProfileMap.get(req.technician_id)
      if (!technicianProfile?.email) continue
      try {
        await sendJobRequestNotification({
          technicianEmail: technicianProfile.email,
          technicianName: technicianProfile.full_name || 'Técnico',
          companyName: companyData?.company_name || companyProfile?.full_name || 'Una empresa',
          contactName: companyProfile?.full_name || undefined,
          finalClient: final_client_name,
          workLocation: work_location,
          startDate: start_date,
          endDate: end_date,
          contractType: contract_type || 'short-term',
          notes: notes || undefined,
          requiresRightToWorkUk: requires_right_to_work_uk || false,
          companyOfferMessage: company_offer_message || undefined,
          isAog: emergencyAog,
          responseDeadline: new Date(expiresAtIso).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
          requiredAircraftType: required_aircraft_type || undefined,
        })
      } catch (err: any) {
        console.error('Email notification exception:', err?.message || err)
      }
    }

    if (emergencyAog) {
      await sendAdminAogLaunchedNotification({
        companyName: companyData?.company_name || companyProfile?.full_name || 'Empresa',
        workLocation: work_location,
        startDate: start_date,
        endDate: end_date,
        contractType: contract_type || 'short-term',
        positionsNeeded: targetPositions,
      })
    }

    return NextResponse.json({ request: data?.[0], requests: data, request_group_id: requestGroupId })
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

