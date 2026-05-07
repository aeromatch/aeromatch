import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { recalculateAnalysis } from '@/lib/logbook/aggregator'
import { getAtaDescription } from '@/lib/logbook/ataChapters'

export const runtime = 'nodejs'

const VALID_SKILL_LEVELS = new Set(['B1', 'B2', 'C'])

type ManualEntryPayload = {
  entry_date?: string
  ac_type?: string
  ac_registration?: string | null
  ata_chapter?: string
  ata_description?: string | null
  description?: string
  location?: string | null
  duration_hours?: number | string | null
  wo_number?: string | null
  skill_level?: string
}

async function ensureManualSource(supabase: ReturnType<typeof createClient> extends Promise<infer T> ? T : never, technicianId: string): Promise<string> {
  const { data: existing } = await supabase
    .from('logbook_sources')
    .select('id')
    .eq('technician_id', technicianId)
    .eq('source_system', 'MANUAL')
    .maybeSingle()

  if (existing?.id) return existing.id

  const { data: created, error } = await supabase
    .from('logbook_sources')
    .insert({
      technician_id: technicianId,
      source_system: 'MANUAL',
      source_system_label: 'Entrada manual',
    })
    .select('id')
    .single()

  if (error || !created) {
    throw new Error(error?.message || 'Failed to create MANUAL source')
  }
  return created.id
}

/**
 * GET /api/logbook/manual-entry
 * Devuelve las ultimas 50 entries manuales del tecnico autenticado.
 */
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const { data: source } = await supabase
    .from('logbook_sources')
    .select('id')
    .eq('technician_id', user.id)
    .eq('source_system', 'MANUAL')
    .maybeSingle()

  if (!source?.id) {
    return NextResponse.json({ entries: [], source_id: null })
  }

  const { data: entries, error } = await supabase
    .from('logbook_entries')
    .select(
      'id, entry_date, ac_type, ac_registration, ata_chapter, ata_description, description, location, duration_hours, wo_number, skill_level, created_at',
    )
    .eq('technician_id', user.id)
    .eq('source_id', source.id)
    .order('entry_date', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ entries: entries ?? [], source_id: source.id })
}

/**
 * POST /api/logbook/manual-entry
 * Crea o actualiza una entry manual para el tecnico autenticado.
 * Tras guardar, recalcula logbook_analysis.
 */
export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const body = (await request.json()) as ManualEntryPayload

  const entryDate = (body.entry_date || '').trim()
  const acType = (body.ac_type || '').trim()
  const ataChapter = (body.ata_chapter || '').trim()
  const description = (body.description || '').trim()
  const skillLevel = (body.skill_level || '').trim().toUpperCase()

  if (!entryDate) return NextResponse.json({ error: 'entry_date required' }, { status: 400 })
  if (!/^\d{4}-\d{2}-\d{2}$/.test(entryDate)) {
    return NextResponse.json({ error: 'entry_date must be YYYY-MM-DD' }, { status: 400 })
  }
  if (!acType) return NextResponse.json({ error: 'ac_type required' }, { status: 400 })
  if (!ataChapter) return NextResponse.json({ error: 'ata_chapter required' }, { status: 400 })
  if (!description) return NextResponse.json({ error: 'description required' }, { status: 400 })
  if (!VALID_SKILL_LEVELS.has(skillLevel)) {
    return NextResponse.json({ error: 'skill_level must be B1, B2 or C' }, { status: 400 })
  }

  let durationHours: number | null = null
  if (body.duration_hours !== null && body.duration_hours !== undefined && body.duration_hours !== '') {
    const n = Number(body.duration_hours)
    if (!Number.isFinite(n) || n < 0) {
      return NextResponse.json({ error: 'duration_hours must be a positive number' }, { status: 400 })
    }
    durationHours = Math.round(n * 100) / 100
  }

  const ataDescription =
    (body.ata_description?.trim() || '') || getAtaDescription(ataChapter) || null
  const location = (body.location?.trim() || '').toUpperCase() || null
  const acRegistration = body.ac_registration?.trim() || null
  const woNumber = body.wo_number?.trim() || ''

  let sourceId: string
  try {
    sourceId = await ensureManualSource(supabase, user.id)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to ensure MANUAL source'
    return NextResponse.json({ error: message }, { status: 500 })
  }

  const { data: entry, error } = await supabase
    .from('logbook_entries')
    .upsert(
      {
        technician_id: user.id,
        source_id: sourceId,
        entry_date: entryDate,
        ac_type: acType,
        ac_registration: acRegistration,
        ata_chapter: ataChapter,
        ata_description: ataDescription,
        description,
        location,
        duration_hours: durationHours,
        wo_number: woNumber,
        skill_level: skillLevel,
      },
      { onConflict: 'technician_id,entry_date,wo_number,ata_chapter' },
    )
    .select('id')
    .single()

  if (error) {
    console.error('[manual-entry POST] upsert error', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Actualiza meta de la source MANUAL (entries_count + rango fechas) y recalcula analysis.
  await refreshManualSourceStats(supabase, user.id, sourceId)

  try {
    await recalculateAnalysis(user.id, supabase)
  } catch (err) {
    console.error('[manual-entry POST] recalc error', err)
    // No bloqueamos: la entry se guardo OK; el aggregator se podra reintentar.
  }

  return NextResponse.json({ success: true, entry_id: entry.id })
}

/**
 * DELETE /api/logbook/manual-entry?id=...
 * Borra una entry manual concreta del tecnico autenticado y recalcula analysis.
 */
export async function DELETE(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  // Validar que la entry pertenece al tecnico y a la source MANUAL.
  const { data: source } = await supabase
    .from('logbook_sources')
    .select('id')
    .eq('technician_id', user.id)
    .eq('source_system', 'MANUAL')
    .maybeSingle()

  if (!source?.id) {
    return NextResponse.json({ error: 'No MANUAL source for technician' }, { status: 404 })
  }

  const { error: deleteErr } = await supabase
    .from('logbook_entries')
    .delete()
    .eq('id', id)
    .eq('technician_id', user.id)
    .eq('source_id', source.id)

  if (deleteErr) {
    return NextResponse.json({ error: deleteErr.message }, { status: 500 })
  }

  await refreshManualSourceStats(supabase, user.id, source.id)

  try {
    await recalculateAnalysis(user.id, supabase)
  } catch (err) {
    console.error('[manual-entry DELETE] recalc error', err)
  }

  return NextResponse.json({ success: true })
}

async function refreshManualSourceStats(
  supabase: Awaited<ReturnType<typeof createClient>>,
  technicianId: string,
  sourceId: string,
): Promise<void> {
  const { data: rows } = await supabase
    .from('logbook_entries')
    .select('entry_date')
    .eq('technician_id', technicianId)
    .eq('source_id', sourceId)
    .order('entry_date', { ascending: true })

  const count = rows?.length ?? 0
  const dateFrom = count > 0 ? rows![0].entry_date : null
  const dateTo = count > 0 ? rows![count - 1].entry_date : null

  await supabase
    .from('logbook_sources')
    .update({
      entries_count: count,
      date_from: dateFrom,
      date_to: dateTo,
    })
    .eq('id', sourceId)
    .eq('technician_id', technicianId)
}
