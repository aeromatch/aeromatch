import { NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { sendOfferExpiredNotification, sendAdminOfferExpiredNotification, sendJobRequestNotification } from '@/lib/email/resend'
import { sendCompanyNoAcceptanceNotification } from '@/lib/email/resend'

function getServiceClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function GET(request: Request) {
  try {
    const auth = request.headers.get('authorization')
    const expected = process.env.CRON_SECRET
    if (expected && auth !== `Bearer ${expected}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = getServiceClient()
    const nowIso = new Date().toISOString()

    const { data: expiredPending } = await supabase
      .from('job_requests')
      .select('*')
      .eq('status', 'pending')
      .not('expires_at', 'is', null)
      .lt('expires_at', nowIso)
      .eq('is_test', false)

    for (const row of expiredPending || []) {
      await supabase
        .from('job_requests')
        .update({ status: 'rejected', updated_at: nowIso })
        .eq('id', row.id)

      const [{ data: tech }, { data: companyProfile }, { data: companyData }] = await Promise.all([
        supabase.from('profiles').select('full_name, email').eq('id', row.technician_id).single(),
        supabase.from('profiles').select('full_name').eq('id', row.company_id).single(),
        supabase.from('companies').select('company_name').eq('user_id', row.company_id).single(),
      ])

      const companyName = companyData?.company_name || companyProfile?.full_name || 'Empresa'
      if (tech?.email) {
        await sendOfferExpiredNotification({
          technicianEmail: tech.email,
          technicianName: tech.full_name || 'Técnico',
          companyName,
        })
      }
      await sendAdminOfferExpiredNotification({
        requestId: row.id,
        technicianName: tech?.full_name || 'Técnico',
        companyName,
      })

      if (!row.request_group_id) continue

      const { data: groupRows } = await supabase
        .from('job_requests')
        .select('*')
        .eq('request_group_id', row.request_group_id)
        .order('preference_order', { ascending: true })

      const nextDraft = (groupRows || []).find((r: any) => r.status === 'draft')
      if (!nextDraft) {
        const { data: companyOwner } = await supabase
          .from('profiles')
          .select('email, full_name')
          .eq('id', row.company_id)
          .single()
        if (companyOwner?.email) {
          await sendCompanyNoAcceptanceNotification({
            companyEmail: companyOwner.email,
            companyName: companyOwner.full_name || companyName,
          })
        }
        continue
      }

      const nextExpires = new Date(Date.now() + (row.is_aog ? 2 : 24) * 60 * 60 * 1000).toISOString()
      await supabase
        .from('job_requests')
        .update({ status: 'pending', expires_at: nextExpires, updated_at: nowIso })
        .eq('id', nextDraft.id)

      const { data: nextTech } = await supabase
        .from('profiles')
        .select('email, full_name')
        .eq('id', nextDraft.technician_id)
        .single()

      if (nextTech?.email) {
        await sendJobRequestNotification({
          technicianEmail: nextTech.email,
          technicianName: nextTech.full_name || 'Técnico',
          companyName,
          finalClient: nextDraft.final_client_name,
          workLocation: nextDraft.work_location,
          startDate: nextDraft.start_date,
          endDate: nextDraft.end_date,
          contractType: nextDraft.contract_type,
          notes: nextDraft.notes || undefined,
          companyOfferMessage: nextDraft.company_offer_message || undefined,
          isAog: !!nextDraft.is_aog,
        })
      }
    }

    return NextResponse.json({ ok: true, processed: (expiredPending || []).length })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
