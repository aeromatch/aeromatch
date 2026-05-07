import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

const STORAGE_BUCKET = 'documents'

function getAdminClient() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  )
}

/**
 * GET /api/logbook/report?download=1&technician_id=...
 *
 * Devuelve los datos del HTML logBook360 del tecnico:
 * - Sin params: signedUrl + uploaded_at del propio tecnico autenticado.
 * - Con technician_id: si el caller es el propio tecnico o admin, igual.
 *   (Si el caller es company verificada, RLS permite lectura del analysis pero
 *    aqui ademas devolvemos la signed URL; mantenemos la regla "solo el propio
 *    tecnico o admin" para no exponer ficheros HTML a terceros sin permiso
 *    explicito - los reports HTML los descarga el tecnico).
 *
 * Si download=1, en lugar de devolver JSON con signedUrl, devuelve el HTML
 * como response con header Content-Disposition: attachment.
 */
export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const technicianId = searchParams.get('technician_id') || user.id
  const isDownload = searchParams.get('download') === '1'

  // Reglas de acceso:
  //  - Owner (el propio tecnico) → OK
  //  - Admin (ADMIN_EMAILS o role='admin') → OK
  //  - Empresa autenticada → OK SOLO si el tecnico esta verificado (AMX checked).
  //    Replica la misma policy que ya existe sobre logbook_analysis para
  //    "companies_see_verified".
  if (technicianId !== user.id) {
    const adminEmails = (process.env.ADMIN_EMAILS || '')
      .split(',')
      .map((e) => e.trim().toLowerCase())
    const isAdminEmail = adminEmails.includes((user.email || '').toLowerCase())

    if (!isAdminEmail) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      if (profile?.role === 'admin') {
        // OK admin role
      } else if (profile?.role === 'company') {
        const { data: tech } = await supabase
          .from('technicians')
          .select('verification_status')
          .eq('user_id', technicianId)
          .maybeSingle()
        if (tech?.verification_status !== 'verified') {
          return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
        }
      } else {
        return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
      }
    }
  }

  const admin = getAdminClient()
  const { data: row } = await admin
    .from('logbook_analysis')
    .select('html_report_path, html_report_uploaded_at')
    .eq('technician_id', technicianId)
    .maybeSingle()

  if (!row?.html_report_path) {
    return NextResponse.json({ has_report: false }, { status: 404 })
  }

  const isInline = searchParams.get('inline') === '1'
  const wantsMeta = searchParams.get('meta') === '1'

  // Modo "meta": devuelve solo metadata (sin descargar el HTML).
  if (wantsMeta) {
    return NextResponse.json({
      has_report: true,
      html_report_uploaded_at: row.html_report_uploaded_at,
    })
  }

  // Por defecto, servimos el HTML directamente con el Content-Type correcto.
  // Asi el iframe lo renderiza como pagina (no como texto plano) y respetamos
  // la auth (solo dueno/admin acceden).
  const { data: file, error } = await admin.storage
    .from(STORAGE_BUCKET)
    .download(row.html_report_path)
  if (error || !file) {
    return NextResponse.json({ error: error?.message || 'download failed' }, { status: 500 })
  }

  const disposition = isDownload
    ? 'attachment; filename="logbook360.html"'
    : 'inline; filename="logbook360.html"'

  // Para descarga directa, no tocamos el HTML (lo entregamos tal cual al usuario).
  // Para mostrarlo en el iframe (inline), inyectamos un <style> con reglas de
  // print que evitan cortar tarjetas/secciones a mitad de pagina.
  if (isDownload) {
    const arrayBuffer = await file.arrayBuffer()
    return new NextResponse(arrayBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Disposition': disposition,
        'Cache-Control': 'private, max-age=0, no-store',
        'X-Frame-Options': 'SAMEORIGIN',
      },
    })
  }

  const html = await file.text()
  const augmented = injectPrintStyles(html)

  return new NextResponse(augmented, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Content-Disposition': disposition,
      'Cache-Control': 'private, max-age=0, no-store',
      'X-Frame-Options': 'SAMEORIGIN',
    },
  })
}

/**
 * Inyecta reglas CSS de impresion en el HTML del logBook360 sin tocar el
 * resto del documento. Evita cortes en tarjetas/secciones cuando el tecnico
 * o la empresa imprime el HTML directamente desde el iframe.
 */
function injectPrintStyles(html: string): string {
  const printCss = `
<style id="aerom-print-fix">
@media print {
  @page { size: A4; margin: 12mm; }
  html, body {
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }
  /* Evita cortes a mitad de bloque en tarjetas y secciones tipicas */
  .header, .header-left, .header-right,
  .kpi-row, .kpi-card,
  .ata-card, .ata-grid,
  .fleet-card, .fleet-summary,
  .base-card, .bases,
  .verified-badge,
  section, .card, .panel,
  table, thead, tbody, tr, td, th {
    break-inside: avoid !important;
    page-break-inside: avoid !important;
  }
  h1, h2, h3, h4 { break-after: avoid; page-break-after: avoid; }
}
</style>`
  if (/<\/head>/i.test(html)) {
    return html.replace(/<\/head>/i, `${printCss}\n</head>`)
  }
  if (/<head[^>]*>/i.test(html)) {
    return html.replace(/<head[^>]*>/i, (m) => `${m}\n${printCss}`)
  }
  // Sin head: prepend
  return `${printCss}\n${html}`
}
