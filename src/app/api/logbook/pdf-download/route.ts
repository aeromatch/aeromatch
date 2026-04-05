import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'

export const runtime = 'nodejs'

/** Helvetica/pdf-lib solo admite WinAnsi; evita 500 por caracteres fuera de rango. */
function pdfSafe(text: unknown, maxLen = 120): string {
  const s = String(text ?? '')
    .normalize('NFKD')
    .replace(/\p{M}/gu, '')
    .replace(/[\u2013\u2014]/g, '-')
    .replace(/[^\x00-\xff]/g, '?')
  return s.slice(0, maxLen)
}

export async function GET() {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: row } = await supabase
      .from('logbook_analysis')
      .select('analysis_json, entries_total, last_updated')
      .eq('technician_id', user.id)
      .maybeSingle()

    const analysis = row?.analysis_json as Record<string, unknown> | undefined
    if (!analysis || !row || Object.keys(analysis).length === 0) {
      return NextResponse.json({ error: 'No analysis' }, { status: 404 })
    }

    const pdf = await PDFDocument.create()
    const font = await pdf.embedFont(StandardFonts.Helvetica)
    const fontBold = await pdf.embedFont(StandardFonts.HelveticaBold)
    let page = pdf.addPage([595, 842])
    const { height } = page.getSize()
    let y = height - 50
    const margin = 48
    const summary = analysis.summary as Record<string, unknown> | undefined

    const line = (text: string, size = 10, bold = false) => {
      const safe = pdfSafe(text, 200)
      if (y < 80) {
        page = pdf.addPage([595, 842])
        y = height - 50
      }
      page.drawText(safe, {
        x: margin,
        y,
        size,
        font: bold ? fontBold : font,
        color: rgb(0.1, 0.15, 0.2),
      })
      y -= size + 6
    }

    line('aeroMatch - logBook360 (resumen)', 14, true)
    line(`Entradas: ${summary?.total_entries ?? '-'} - Horas (aprox.): ${summary?.total_hours ?? '-'}`, 10)
    line(
      `Periodo: ${pdfSafe(summary?.date_from ?? '-', 40)} -> ${pdfSafe(summary?.date_to ?? '-', 40)}`,
      9
    )
    line(`Actualizado: ${row.last_updated ? new Date(row.last_updated).toISOString() : '-'}`, 8)
    y -= 10

    const fleets = analysis.fleet_summary
    if (Array.isArray(fleets) && fleets.length > 0) {
      line('Flota (top)', 11, true)
      for (const f of fleets.slice(0, 12) as Array<Record<string, unknown>>) {
        line(
          ` - ${pdfSafe(f.ac_type, 60)} - ${String(f.entries_count ?? '')} entradas, ${f.total_hours ?? 0} h`,
          9
        )
      }
    }

    const bytes = await pdf.save()
    return new NextResponse(new Uint8Array(bytes), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="logbook360-resumen.pdf"',
      },
    })
  } catch (e) {
    console.error('pdf-download', e)
    const msg = e instanceof Error ? e.message : 'PDF generation failed'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
