import { createServiceClient } from '@/lib/supabase/service'
import { createClient } from '@/lib/supabase/server'
import { Resend } from 'resend'
import { NextResponse } from 'next/server'

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'aeroMatch <onboarding@resend.dev>'

async function isAdmin(): Promise<string | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const adminEmails = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim().toLowerCase())
  if (!adminEmails.includes(user.email?.toLowerCase() || '')) return null
  return user.id
}

type Segment =
  | 'all_technicians'
  | 'technicians_no_availability'
  | 'technicians_verified'
  | 'technicians_unverified'
  | 'all_companies'

async function getRecipients(segment: Segment) {
  const supa = createServiceClient()

  if (segment === 'all_companies') {
    const { data, error } = await supa
      .from('profiles')
      .select('id, email, full_name')
      .eq('role', 'company')
    if (error) console.error('[mailing] companies error:', error)
    console.log(`[mailing] companies found: ${data?.length ?? 0}`)
    return (data ?? []).map((r) => ({ email: r.email, name: r.full_name || 'there' }))
  }

  if (segment === 'all_technicians') {
    const { data, error } = await supa
      .from('profiles')
      .select('id, email, full_name')
      .eq('role', 'technician')
    if (error) console.error('[mailing] all_technicians error:', error)
    console.log(`[mailing] all_technicians profiles: ${data?.length ?? 0}`)
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

  const { data: techs, error: techErr } = await techQuery
  if (techErr) console.error('[mailing] technicians error:', techErr)
  const techIds = (techs ?? []).map((t) => t.user_id)
  console.log(`[mailing] segment=${segment} technicians: ${techIds.length}`)

  if (techIds.length === 0) return []

  const { data: profiles, error: profErr } = await supa
    .from('profiles')
    .select('id, email, full_name')
    .in('id', techIds)
  if (profErr) console.error('[mailing] profiles lookup error:', profErr)
  console.log(`[mailing] profiles matched: ${profiles?.length ?? 0}`)

  return (profiles ?? []).map((p) => ({ email: p.email, name: p.full_name || 'there' }))
}

function buildEmailHtml(
  bodyText: string,
  recipientName: string,
  ctaText?: string,
  ctaUrl?: string
) {
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
  const adminId = await isAdmin()
  if (!adminId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const action = searchParams.get('action')

  if (action === 'count') {
    const segment = searchParams.get('segment') as Segment
    if (!segment) return NextResponse.json({ count: 0 })
    try {
      const recipients = await getRecipients(segment)
      console.log(`[mailing] count segment=${segment} → ${recipients.length}`)
      return NextResponse.json({ count: recipients.length })
    } catch (err) {
      console.error('[mailing] count error:', err)
      return NextResponse.json({ count: 0, error: String(err) })
    }
  }

  if (action === 'history') {
    const supa = createServiceClient()
    const { data } = await supa
      .from('mailing_history')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50)
    return NextResponse.json({ rows: data ?? [] })
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}

// Limites de adjuntos (Resend acepta hasta 40 MB total).
const MAX_ATTACHMENTS = 5
const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024 // 10 MB por archivo
const MAX_TOTAL_ATTACHMENT_BYTES = 25 * 1024 * 1024 // 25 MB en total

type Attachment = { filename: string; content: Buffer }

async function readAttachmentsFromFormData(formData: FormData): Promise<
  | { ok: true; attachments: Attachment[] }
  | { ok: false; error: string }
> {
  const files = formData.getAll('attachments').filter((v): v is File => v instanceof File && v.size > 0)
  if (files.length === 0) return { ok: true, attachments: [] }
  if (files.length > MAX_ATTACHMENTS) {
    return { ok: false, error: `Maximo ${MAX_ATTACHMENTS} archivos por email.` }
  }

  let total = 0
  const attachments: Attachment[] = []
  for (const file of files) {
    if (file.size > MAX_ATTACHMENT_BYTES) {
      return { ok: false, error: `${file.name} excede ${MAX_ATTACHMENT_BYTES / 1024 / 1024} MB.` }
    }
    total += file.size
    if (total > MAX_TOTAL_ATTACHMENT_BYTES) {
      return { ok: false, error: `El total de adjuntos excede ${MAX_TOTAL_ATTACHMENT_BYTES / 1024 / 1024} MB.` }
    }
    const buffer = Buffer.from(await file.arrayBuffer())
    attachments.push({ filename: file.name, content: buffer })
  }
  return { ok: true, attachments }
}

export async function POST(req: Request) {
  const adminId = await isAdmin()
  if (!adminId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'RESEND_API_KEY not configured' }, { status: 500 })

  // Soportamos tanto JSON (compat hacia atras) como multipart/form-data (con adjuntos).
  const contentType = req.headers.get('content-type') || ''
  let segment: Segment | undefined
  let subject = ''
  let bodyText = ''
  let cta_text: string | undefined
  let cta_url: string | undefined
  let manual_email: string | undefined
  let scheduled_at: string | undefined
  let attachments: Attachment[] = []

  if (contentType.includes('multipart/form-data')) {
    const formData = await req.formData()
    segment = (formData.get('segment') as Segment | null) ?? undefined
    subject = (formData.get('subject') as string | null) ?? ''
    bodyText = (formData.get('body') as string | null) ?? ''
    cta_text = (formData.get('cta_text') as string | null) ?? undefined
    cta_url = (formData.get('cta_url') as string | null) ?? undefined
    manual_email = (formData.get('manual_email') as string | null) ?? undefined
    scheduled_at = (formData.get('scheduled_at') as string | null) ?? undefined

    const att = await readAttachmentsFromFormData(formData)
    if (!att.ok) return NextResponse.json({ error: att.error }, { status: 400 })
    attachments = att.attachments
  } else {
    const json = await req.json()
    segment = json.segment
    subject = json.subject
    bodyText = json.body
    cta_text = json.cta_text
    cta_url = json.cta_url
    manual_email = json.manual_email
    scheduled_at = json.scheduled_at
  }

  if (!subject || !bodyText) {
    return NextResponse.json({ error: 'subject and body required' }, { status: 400 })
  }

  if (scheduled_at && attachments.length > 0) {
    return NextResponse.json(
      { error: 'Los adjuntos solo estan soportados en envio inmediato. Quita los archivos o el envio programado.' },
      { status: 400 },
    )
  }

  const supa = createServiceClient()

  if (scheduled_at) {
    await supa.from('mailing_history').insert({
      subject,
      body: bodyText,
      cta_text: cta_text || null,
      cta_url: cta_url || null,
      segment: manual_email ? `manual:${manual_email}` : segment,
      recipients_count: 0,
      errors_count: 0,
      status: 'scheduled',
      scheduled_at,
      sent_by: adminId,
    })
    return NextResponse.json({ scheduled: true })
  }

  let recipients: { email: string; name: string }[]
  if (manual_email) {
    const { data: profile } = await supa
      .from('profiles')
      .select('full_name')
      .eq('email', manual_email)
      .maybeSingle()
    recipients = [{ email: manual_email, name: profile?.full_name || manual_email.split('@')[0] }]
  } else {
    if (!segment) {
      return NextResponse.json({ error: 'segment or manual_email required' }, { status: 400 })
    }
    recipients = await getRecipients(segment)
  }

  if (recipients.length === 0) {
    return NextResponse.json({ error: 'No recipients' }, { status: 400 })
  }

  const resend = new Resend(apiKey)
  let sent = 0
  let errors = 0

  console.log(
    `[mailing] Enviando a ${recipients.length} destinatarios, from: ${FROM_EMAIL}, attachments: ${attachments.length}`,
  )

  for (const r of recipients) {
    try {
      const html = buildEmailHtml(bodyText, r.name, cta_text, cta_url)
      const result = await resend.emails.send({
        from: FROM_EMAIL,
        to: r.email,
        subject: subject.replace(/\[nombre\]/gi, r.name),
        html,
        ...(attachments.length > 0
          ? { attachments: attachments.map((a) => ({ filename: a.filename, content: a.content })) }
          : {}),
      })
      console.log(`[mailing] OK ${r.email}:`, JSON.stringify(result))
      sent++
    } catch (err) {
      console.error(`[mailing] ERROR ${r.email}:`, err)
      errors++
    }
    await new Promise((resolve) => setTimeout(resolve, 300))
  }

  await supa.from('mailing_history').insert({
    subject,
    body: bodyText,
    cta_text: cta_text || null,
    cta_url: cta_url || null,
    segment: manual_email ? `manual:${manual_email}` : segment,
    recipients_count: sent,
    errors_count: errors,
    status: 'sent',
    sent_by: adminId,
  })

  return NextResponse.json({ sent, errors })
}
