import type { SupabaseClient } from '@supabase/supabase-js'
import type { LogbookAnalysisResult } from '@/lib/logbook/analyzer'

export async function mergeEntries(
  result: LogbookAnalysisResult,
  jobId: string,
  technicianId: string,
  supabase: SupabaseClient,
  meta?: { sourceFilename?: string | null; sourcePages?: number | null }
) {
  const entriesRaw = Array.isArray(result.entries) ? result.entries : []
  const summary = result.summary

  const { data: source, error: insErr } = await supabase
    .from('logbook_sources')
    .insert({
      technician_id: technicianId,
      job_id: jobId,
      source_system: result.source_system,
      source_system_label: result.source_system_label || result.source_system,
      source_filename: meta?.sourceFilename ?? null,
      source_pages: meta?.sourcePages ?? result.pages_detected ?? null,
      entries_count: entriesRaw.length,
      date_from: summary?.date_from ?? null,
      date_to: summary?.date_to ?? null,
    })
    .select('id')
    .single()

  if (insErr) throw new Error(`logbook_sources insert: ${insErr.message}`)
  if (!source?.id || entriesRaw.length === 0) return

  const { data: jobRow } = await supabase
    .from('logbook_jobs')
    .select('storage_path')
    .eq('id', jobId)
    .maybeSingle()

  if (jobRow?.storage_path) {
    const { data: docMatch } = await supabase
      .from('documents')
      .select('id')
      .eq('technician_id', technicianId)
      .eq('storage_path', jobRow.storage_path)
      .maybeSingle()

    if (docMatch?.id) {
      await supabase
        .from('logbook_sources')
        .update({ document_id: docMatch.id })
        .eq('id', source.id)
    }
  }

  const mappedRows = entriesRaw.map((e) => {
    const ataStr =
      e.ata_chapter !== null && e.ata_chapter !== undefined
        ? String(e.ata_chapter).trim()
        : ''
    const woStr =
      e.wo_number !== null && e.wo_number !== undefined
        ? String(e.wo_number).trim()
        : `${String(e.entry_date ?? '')}-${ataStr || 'na'}-${Math.random().toString(36).slice(2, 7)}`
    return {
      technician_id: technicianId,
      source_id: source.id,
      entry_date: String(e.entry_date ?? '').trim() || null,
      ac_registration: e.ac_registration != null ? String(e.ac_registration).trim() : null,
      ac_type: e.ac_type != null ? String(e.ac_type).trim() : null,
      ac_type_raw: e.ac_type_raw != null ? String(e.ac_type_raw).trim() : null,
      ata_chapter: ataStr,
      ata_description:
        e.ata_description != null ? String(e.ata_description).trim().substring(0, 500) : null,
      wo_number: woStr,
      description: e.description != null ? String(e.description).trim().substring(0, 500) : null,
      duration_hours:
        e.duration_hours !== null && e.duration_hours !== undefined
          ? Number(e.duration_hours) || null
          : null,
      location: e.location != null ? String(e.location).trim() : null,
      skill_level: e.skill_level != null ? String(e.skill_level).trim() : null,
    }
  })

  // DEBUG temporal — quitar tras diagnosticar fechas Claude
  const rawEntries = result.entries ?? []
  console.log('Total entradas recibidas de Claude:', rawEntries.length)
  console.log('Muestra primeras 3 entradas raw:', JSON.stringify(rawEntries.slice(0, 3), null, 2))

  const sinFecha = rawEntries.filter(
    (e: { entry_date?: unknown }) =>
      !String(e.entry_date ?? '').match(/^\d{4}-\d{2}-\d{2}$/)
  )
  console.log('Entradas descartadas por fecha inválida:', sinFecha.length)
  console.log(
    'Muestra fechas inválidas:',
    sinFecha.slice(0, 5).map((e: { entry_date?: unknown }) => e.entry_date)
  )

  const rows = mappedRows.filter(
    (row): row is (typeof mappedRows)[number] & { entry_date: string } =>
      Boolean(row.entry_date && /^\d{4}-\d{2}-\d{2}$/.test(row.entry_date))
  )

  const chunk = 200
  for (let i = 0; i < rows.length; i += chunk) {
    const batch = rows.slice(i, i + chunk)
    const { error } = await supabase.from('logbook_entries').upsert(batch, {
      onConflict: 'technician_id,entry_date,wo_number,ata_chapter',
    })
    if (error) throw new Error(`logbook_entries upsert: ${error.message}`)
  }

  await supabase
    .from('logbook_sources')
    .update({ entries_count: rows.length })
    .eq('id', source.id)
}
