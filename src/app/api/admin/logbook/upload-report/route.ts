import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

const STORAGE_BUCKET = 'documents'
const MAX_HTML_BYTES = 2 * 1024 * 1024 // 2 MB

function getAdminClient() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  )
}

function isAdmin(email: string | undefined | null): boolean {
  if (!email) return false
  const adminEmails = (process.env.ADMIN_EMAILS || '').split(',').map((e) => e.trim().toLowerCase())
  return adminEmails.includes(email.toLowerCase())
}

async function requireAdmin(): Promise<
  | { ok: true; userId: string }
  | { ok: false; res: NextResponse }
> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { ok: false, res: NextResponse.json({ error: 'Not authenticated' }, { status: 401 }) }
  }
  if (isAdmin(user.email)) return { ok: true, userId: user.id }
  // Fallback role-based
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role === 'admin') return { ok: true, userId: user.id }
  return { ok: false, res: NextResponse.json({ error: 'Not authorized' }, { status: 403 }) }
}

function reportPath(technicianId: string): string {
  return `logbook-reports/${technicianId}/logbook360.html`
}

/**
 * GET /api/admin/logbook/upload-report?technician_id=...
 * Devuelve estado del HTML report del tecnico (si existe).
 */
export async function GET(request: Request) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.res

  const { searchParams } = new URL(request.url)
  const technicianId = searchParams.get('technician_id')
  if (!technicianId) {
    return NextResponse.json({ error: 'technician_id required' }, { status: 400 })
  }

  const admin = getAdminClient()
  const { data, error } = await admin
    .from('logbook_analysis')
    .select('html_report_path, html_report_uploaded_at')
    .eq('technician_id', technicianId)
    .maybeSingle()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({
    has_report: Boolean(data?.html_report_path),
    html_report_path: data?.html_report_path ?? null,
    html_report_uploaded_at: data?.html_report_uploaded_at ?? null,
  })
}

/**
 * POST /api/admin/logbook/upload-report (multipart/form-data)
 * Body: technician_id (string) + file (.html < 2MB)
 * Sube el HTML a documents/logbook-reports/{technician_id}/logbook360.html
 * y persiste path + uploaded_at en logbook_analysis (upsert).
 */
export async function POST(request: Request) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.res

  const contentType = request.headers.get('content-type') || ''
  if (!contentType.includes('multipart/form-data')) {
    return NextResponse.json({ error: 'multipart/form-data required' }, { status: 400 })
  }

  const formData = await request.formData()
  const technicianId = (formData.get('technician_id') as string | null)?.trim() || ''
  const file = formData.get('file')

  if (!technicianId) {
    return NextResponse.json({ error: 'technician_id required' }, { status: 400 })
  }
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: 'file required' }, { status: 400 })
  }
  if (file.size > MAX_HTML_BYTES) {
    return NextResponse.json(
      { error: `file too large (max ${MAX_HTML_BYTES / 1024 / 1024} MB)` },
      { status: 400 },
    )
  }

  const filename = file.name || ''
  const isHtml =
    filename.toLowerCase().endsWith('.html') ||
    filename.toLowerCase().endsWith('.htm') ||
    file.type === 'text/html'
  if (!isHtml) {
    return NextResponse.json({ error: 'only .html files are allowed' }, { status: 400 })
  }

  const admin = getAdminClient()

  // Verifica que el tecnico exista y sea technician
  const { data: profile, error: profileErr } = await admin
    .from('profiles')
    .select('id, role')
    .eq('id', technicianId)
    .maybeSingle()
  if (profileErr) return NextResponse.json({ error: profileErr.message }, { status: 500 })
  if (!profile) return NextResponse.json({ error: 'technician not found' }, { status: 404 })
  if (profile.role !== 'technician') {
    return NextResponse.json({ error: 'profile is not a technician' }, { status: 400 })
  }

  const path = reportPath(technicianId)
  const buffer = Buffer.from(await file.arrayBuffer())

  const { error: uploadErr } = await admin.storage
    .from(STORAGE_BUCKET)
    .upload(path, buffer, {
      contentType: 'text/html; charset=utf-8',
      upsert: true,
      cacheControl: '0',
    })

  if (uploadErr) {
    console.error('[admin/logbook/upload-report] storage error', uploadErr)
    return NextResponse.json({ error: uploadErr.message }, { status: 500 })
  }

  const uploadedAt = new Date().toISOString()
  const { error: upsertErr } = await admin
    .from('logbook_analysis')
    .upsert(
      {
        technician_id: technicianId,
        html_report_path: path,
        html_report_uploaded_at: uploadedAt,
      },
      { onConflict: 'technician_id' },
    )

  if (upsertErr) {
    console.error('[admin/logbook/upload-report] upsert error', upsertErr)
    return NextResponse.json({ error: upsertErr.message }, { status: 500 })
  }

  return NextResponse.json({
    success: true,
    path,
    html_report_uploaded_at: uploadedAt,
  })
}

/**
 * DELETE /api/admin/logbook/upload-report?technician_id=...
 * Borra el HTML del Storage y limpia las columnas en logbook_analysis.
 */
export async function DELETE(request: Request) {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.res

  const { searchParams } = new URL(request.url)
  const technicianId = searchParams.get('technician_id')
  if (!technicianId) {
    return NextResponse.json({ error: 'technician_id required' }, { status: 400 })
  }

  const admin = getAdminClient()
  const path = reportPath(technicianId)

  const { error: removeErr } = await admin.storage.from(STORAGE_BUCKET).remove([path])
  if (removeErr) {
    console.error('[admin/logbook/upload-report] remove error', removeErr)
    // seguimos: igual ya no estaba
  }

  const { error: updateErr } = await admin
    .from('logbook_analysis')
    .update({ html_report_path: null, html_report_uploaded_at: null })
    .eq('technician_id', technicianId)

  if (updateErr) {
    return NextResponse.json({ error: updateErr.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
