import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { sendDocumentPendingVerificationEmail } from '@/lib/email/resend'

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

function labelForDocType(docType: string): string {
  if (docType.startsWith('type_') && docType.endsWith('_theory')) {
    const slug = docType.replace(/^type_/, '').replace(/_theory$/, '')
    return `Type rating theory (${slug.replace(/_/g, '/')})`
  }
  if (docType.startsWith('type_') && docType.endsWith('_practical')) {
    const slug = docType.replace(/^type_/, '').replace(/_practical$/, '')
    return `Type rating practical (${slug.replace(/_/g, '/')})`
  }
  const map: Record<string, string> = {
    easa_license: 'EASA Part-66 License',
    uk_license: 'UK CAA License',
    faa_ap: 'FAA A&P License',
    passport: 'Passport / ID',
    cv: 'CV / Resume',
    medical: 'Medical certificate',
    training: 'Training Certificate',
    logbook: 'Technical Logbook',
    driving_license_doc: 'Driving license',
    avsaf: 'AVSAF',
    other_additional: 'Other documents',
  }
  if (docType.startsWith('cert_')) {
    const sub = docType.slice(5)
    return `Certificate: ${sub.replace(/_/g, ' ')}`
  }
  return map[docType] || docType.replace(/_/g, ' ')
}

export async function POST(request: Request) {
  try {
    const supabase = await createServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const docType = typeof body.docType === 'string' ? body.docType.trim() : ''
    if (!docType) {
      return NextResponse.json({ error: 'docType required' }, { status: 400 })
    }

    const serviceClient = getServiceClient()
    const [{ data: profile }, { data: tech }, { data: cert }] = await Promise.all([
      serviceClient.from('profiles').select('full_name').eq('id', user.id).maybeSingle(),
      serviceClient
        .from('technicians')
        .select('verification_status')
        .eq('user_id', user.id)
        .maybeSingle(),
      serviceClient
        .from('amx_certificates')
        .select('reference_id')
        .eq('technician_id', user.id)
        .order('generated_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
    ])

    const technicianLabel =
      tech?.verification_status === 'verified' && profile?.full_name?.trim()
        ? profile.full_name.trim()
        : user.id

    const amxReferenceOrId = cert?.reference_id?.trim() || user.id

    try {
      await sendDocumentPendingVerificationEmail({
        technicianId: user.id,
        technicianLabel: String(technicianLabel),
        documentTypeLabel: labelForDocType(docType),
        amxReferenceOrId,
      })
      return NextResponse.json({ ok: true, emailed: true })
    } catch (emailErr) {
      console.error('notify-pending email:', emailErr)
      return NextResponse.json({ ok: true, emailed: false })
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error'
    console.error('notify-pending:', error)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
