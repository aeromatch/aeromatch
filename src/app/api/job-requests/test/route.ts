import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { sendJobRequestNotification } from '@/lib/email/resend'

export async function POST() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const { data: profile } = await supabase
      .from('profiles')
      .select('role, full_name, email')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'technician') {
      return NextResponse.json({ error: 'Solo técnicos' }, { status: 403 })
    }

    const { count: realCount } = await supabase
      .from('job_requests')
      .select('id', { count: 'exact', head: true })
      .eq('technician_id', user.id)
      .eq('is_test', false)

    if ((realCount || 0) > 0) {
      return NextResponse.json({ error: 'Ya tienes ofertas reales' }, { status: 400 })
    }

    const { data: row, error } = await supabase
      .from('job_requests')
      .insert({
        company_id: user.id,
        technician_id: user.id,
        final_client_name: 'Demo Airlines',
        work_location: 'Madrid, España',
        contract_type: 'short-term',
        start_date: '2026-03-30',
        end_date: '2026-04-06',
        notes: 'Esta es una oferta de prueba para que conozcas el flujo de AeroMatch. Puedes aceptarla o rechazarla sin ningún efecto real.',
        status: 'pending',
        is_test: true,
        company_offer_message: null
      })
      .select('*')
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    if (profile?.email) {
      await sendJobRequestNotification({
        technicianEmail: profile.email,
        technicianName: profile.full_name || 'Técnico',
        companyName: 'Demo Airlines',
        contactName: 'AeroMatch Demo',
        finalClient: 'Demo Airlines',
        workLocation: 'Madrid, España',
        startDate: row.start_date,
        endDate: row.end_date,
        contractType: row.contract_type,
        notes: row.notes || undefined,
        isDemoOffer: true
      })
    }

    return NextResponse.json({ request: row })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
