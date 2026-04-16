import { createServiceClient } from '@/lib/supabase/service'
import { Resend } from 'resend'
import { NextResponse } from 'next/server'

export const maxDuration = 300
export const runtime = 'nodejs'

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'aeroMatch <onboarding@resend.dev>'

type Segment =
  | 'all_technicians'
  | 'technicians_no_availability'
  | 'technicians_verified'
  | 'technicians_unverified'
  | 'all_companies'

async function getRecipients(supa: ReturnType<typeof createServiceClient>, segment: string) {
  if (segment.startsWith('manual:')) {
    const email = segment.replace('manual:', '')
    const { data: profile } = await supa
      .from('profiles')
      .select('full_name')
      .eq('email', email)
      .maybeSingle()
    return [{ email, name: profile?.full_name || email.split('@')[0] }]
  }

  if (segment === 'all_companies') {
    const { data } = await supa
      .from('profiles')
      .select('id, email, full_name')
      .eq('role', 'company')
    return (data ?? []).map((r) => ({ email: r.email, name: r.full_name || 'there' }))
  }

  if (segment === 'all_technicians') {
    const { data } = await supa
      .from('profiles')
      .select('id, email, full_name')
      .eq('role', 'technician')
    return (data ?? []).map((r) => ({ email: r.email, name: r.full_name || 'there' }))
  }

  let techQuery = supa.from('technicians').select('user_id, is_available, verification_status')
  if (segment === 'technicians_no_availability') {
    techQuery = techQuery.eq('is_available', false)
  } else if (segment === 'technicians_verified') {
    techQuery = techQuery.eq('verification_status', 'verified')
  } else if (segment === 'technicians_unverified') {
    techQuery = techQuery.or('verification_status.is.null,verification_status.neq.verified')
  }

  const { data: techs } = await techQuery
  const techIds = (techs ?? []).map((t) => t.user_id)
  if (techIds.length === 0) return []

  const { data: profiles } = await supa
    .from('profiles')
    .select('id, email, full_name')
    .in('id', techIds)

  return (profiles ?? []).map((p) => ({ email: p.email, name: p.full_name || 'there' }))
}

function buildEmailHtml(bodyText: string, recipientName: string, ctaText?: string | null, ctaUrl?: string | null) {
  const bodyHtml = bodyText
    .replace(/\[nombre\]/gi, recipientName)
    .replace(/\n/g, '<br/>')

  const ctaBlock = ctaText && ctaUrl
    ? `<tr><td style="padding:24px 40px 0">
        <a href="${ctaUrl}" style="display:inline-block;background:#C9A24D;color:#0B132B;padding:12px 28px;border-radius:8px;font-weight:700;text-decoration:none;font-size:14px">${ctaText}</a>
       </td></tr>`
    : ''

  return `<!DOCTYPE html><html><head><meta charset="utf-8"/></head><body style="margin:0;padding:0;background:#0B132B;font-family:system-ui,-apple-system,sans-serif">
    <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;background:#111827;border-radius:12px;overflow:hidden">
      <tr>
        <td style="background:#0B132B;padding:24px 40px;border-bottom:1px solid #1e293b">
          <img src="https://aeromatch.eu/logo-email.svg" alt="aeroMatch" width="180" style="max-width:180px;height:auto"/>
        </td>
      </tr>
      <tr>
        <td style="padding:32px 40px 0">
          <p style="color:#e2e8f0;font-size:15px;margin:0 0 16px">Hola <strong>${recipientName}</strong>,</p>
          <p style="color:#cbd5e1;font-size:14px;line-height:1.7;margin:0">${bodyHtml}</p>
        </td>
      </tr>
      ${ctaBlock}
      <tr>
        <td style="padding:32px 40px;border-top:1px solid #1e293b;margin-top:24px">
          <p style="color:#475569;font-size:11px;margin:0">aeroMatch · <a href="https://aeromatch.eu" style="color:#C9A24D;text-decoration:none">aeromatch.eu</a></p>
        </td>
      </tr>
    </table>
  </body></html>`
}

export async function GET(req: Request) {
  const secret = req.headers.get('authorization')?.replace('Bearer ', '')
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'No RESEND_API_KEY' }, { status: 500 })

  const supa = createServiceClient()

  const { data: pending } = await supa
    .from('mailing_history')
    .select('*')
    .eq('status', 'scheduled')
    .lte('scheduled_at', new Date().toISOString())
    .order('scheduled_at', { ascending: true })
    .limit(5)

  if (!pending?.length) {
    return NextResponse.json({ processed: 0 })
  }

  const resend = new Resend(apiKey)
  let totalProcessed = 0

  for (const job of pending) {
    await supa.from('mailing_history').update({ status: 'sending' }).eq('id', job.id)

    const recipients = await getRecipients(supa, job.segment)
    let sent = 0
    let errors = 0

    console.log(`[cron-mailing] Job ${job.id}: ${recipients.length} destinatarios`)

    for (const r of recipients) {
      try {
        const html = buildEmailHtml(job.body, r.name, job.cta_text, job.cta_url)
        await resend.emails.send({
          from: FROM_EMAIL,
          to: r.email,
          subject: (job.subject as string).replace(/\[nombre\]/gi, r.name),
          html,
        })
        sent++
      } catch (err) {
        console.error(`[cron-mailing] ERROR ${r.email}:`, err)
        errors++
      }
      await new Promise((resolve) => setTimeout(resolve, 300))
    }

    await supa.from('mailing_history').update({
      status: 'sent',
      recipients_count: sent,
      errors_count: errors,
    }).eq('id', job.id)

    console.log(`[cron-mailing] Job ${job.id} completado: ${sent} enviados, ${errors} errores`)
    totalProcessed++
  }

  return NextResponse.json({ processed: totalProcessed })
}
