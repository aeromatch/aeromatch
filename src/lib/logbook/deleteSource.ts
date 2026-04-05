import type { SupabaseClient } from '@supabase/supabase-js'
import { recalculateAnalysis } from '@/lib/logbook/aggregator'

/** Busca fuente por document_id o por job con mismo storage_path (datos previos a document_id). */
export async function findSourceIdForDocument(
  serviceSupabase: SupabaseClient,
  technicianId: string,
  doc: { id: string; storage_path: string }
): Promise<string | null> {
  const { data: byDoc } = await serviceSupabase
    .from('logbook_sources')
    .select('id')
    .eq('technician_id', technicianId)
    .eq('document_id', doc.id)
    .maybeSingle()

  if (byDoc?.id) return byDoc.id

  const { data: job } = await serviceSupabase
    .from('logbook_jobs')
    .select('id')
    .eq('technician_id', technicianId)
    .eq('storage_path', doc.storage_path)
    .maybeSingle()

  if (!job?.id) return null

  const { data: src } = await serviceSupabase
    .from('logbook_sources')
    .select('id')
    .eq('job_id', job.id)
    .maybeSingle()

  return src?.id ?? null
}

export async function deleteLogbookSourceById(
  serviceSupabase: SupabaseClient,
  technicianId: string,
  sourceId: string
): Promise<{ ok: true } | { error: string }> {
  const { data: source, error: srcErr } = await serviceSupabase
    .from('logbook_sources')
    .select('id, job_id, technician_id, document_id')
    .eq('id', sourceId)
    .eq('technician_id', technicianId)
    .maybeSingle()

  if (srcErr || !source) {
    return { error: 'Not found' }
  }

  let storagePath: string | null = null
  if (source.job_id) {
    const { data: jobRow } = await serviceSupabase
      .from('logbook_jobs')
      .select('storage_path')
      .eq('id', source.job_id)
      .maybeSingle()
    storagePath = jobRow?.storage_path ?? null
  }
  if (!storagePath && source.document_id) {
    const { data: docRow } = await serviceSupabase
      .from('documents')
      .select('storage_path')
      .eq('id', source.document_id)
      .maybeSingle()
    storagePath = docRow?.storage_path ?? null
  }

  const documentIdToRemove = source.document_id

  const { error: delEntriesErr } = await serviceSupabase
    .from('logbook_entries')
    .delete()
    .eq('source_id', source.id)

  if (delEntriesErr) {
    return { error: delEntriesErr.message }
  }

  const { error: delSourceErr } = await serviceSupabase.from('logbook_sources').delete().eq('id', source.id)
  if (delSourceErr) {
    return { error: delSourceErr.message }
  }

  if (source.job_id) {
    await serviceSupabase.from('logbook_jobs').delete().eq('id', source.job_id)
  }

  if (storagePath) {
    const { error: rmErr } = await serviceSupabase.storage.from('documents').remove([storagePath])
    if (rmErr) {
      console.error('logbook source delete storage:', rmErr.message)
    }
  }

  if (documentIdToRemove) {
    await serviceSupabase.from('documents').delete().eq('id', documentIdToRemove)
  } else if (storagePath) {
    await serviceSupabase
      .from('documents')
      .delete()
      .eq('technician_id', technicianId)
      .eq('storage_path', storagePath)
  }

  const { count } = await serviceSupabase
    .from('logbook_entries')
    .select('id', { count: 'exact', head: true })
    .eq('technician_id', technicianId)

  if (!count) {
    await serviceSupabase.from('logbook_analysis').delete().eq('technician_id', technicianId)
  } else {
    await recalculateAnalysis(technicianId, serviceSupabase)
  }

  return { ok: true }
}
