import type { SupabaseClient } from '@supabase/supabase-js'
import type { LogbookAnalysisResult } from '@/lib/logbook/analyzer'

function safeStr(v: string | null | undefined): string {
  return (v ?? '').trim()
}

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

  const rows = entriesRaw.map((e) => {
    const ata = safeStr(e.ata_chapter)
    const wo =
      safeStr(e.wo_number) ||
      `${safeStr(e.entry_date)}-${ata || 'na'}-${Math.random().toString(36).slice(2, 9)}`
    return {
      technician_id: technicianId,
      source_id: source.id,
      entry_date: e.entry_date,
      ac_registration: e.ac_registration ?? null,
      ac_type: e.ac_type ?? null,
      ac_type_raw: e.ac_type_raw ?? null,
      ata_chapter: ata,
      ata_description: e.ata_description?.substring(0, 500) ?? null,
      wo_number: wo,
      description: e.description?.substring(0, 500) ?? null,
      duration_hours: e.duration_hours ?? null,
      location: e.location ?? null,
      skill_level: e.skill_level ?? null,
    }
  })

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
