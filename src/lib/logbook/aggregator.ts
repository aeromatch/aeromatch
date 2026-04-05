import type { SupabaseClient } from '@supabase/supabase-js'

export async function recalculateAnalysis(technicianId: string, supabase: SupabaseClient) {
  const { data: entries, error } = await supabase
    .from('logbook_entries')
    .select('*')
    .eq('technician_id', technicianId)
    .order('entry_date', { ascending: true })

  if (error) throw new Error(error.message)

  if (!entries?.length) {
    await supabase.from('logbook_analysis').delete().eq('technician_id', technicianId)
    return
  }

  const { data: sources } = await supabase
    .from('logbook_sources')
    .select('source_system_label, entries_count, date_from, date_to, uploaded_at')
    .eq('technician_id', technicianId)
    .order('uploaded_at', { ascending: true })

  const totalEntries = entries.length
  const totalHours = entries.reduce((s, e) => s + (Number(e.duration_hours) || 0), 0)
  const dateFrom = entries[0].entry_date as string
  const dateTo = entries[entries.length - 1].entry_date as string
  const yearsSet = new Set(entries.map((e) => String(e.entry_date).substring(0, 4)))

  const activityByYear: Record<string, Record<string, number>> = {}
  for (const e of entries) {
    const year = String(e.entry_date).substring(0, 4)
    const fleet = (e.ac_type as string) || 'Desconocido'
    if (!activityByYear[year]) activityByYear[year] = {}
    activityByYear[year][fleet] = (activityByYear[year][fleet] || 0) + 1
  }

  const fleetMap: Record<
    string,
    {
      ac_type: string
      entries_count: number
      total_hours: number
      date_from: string
      date_to: string
      bases: Set<string>
    }
  > = {}

  for (const e of entries) {
    const fleet = (e.ac_type as string) || 'Desconocido'
    if (!fleetMap[fleet]) {
      fleetMap[fleet] = {
        ac_type: fleet,
        entries_count: 0,
        total_hours: 0,
        date_from: e.entry_date as string,
        date_to: e.entry_date as string,
        bases: new Set<string>(),
      }
    }
    const f = fleetMap[fleet]
    f.entries_count++
    f.total_hours += Number(e.duration_hours) || 0
    if (String(e.entry_date) > f.date_to) f.date_to = e.entry_date as string
    if (String(e.entry_date) < f.date_from) f.date_from = e.entry_date as string
    if (e.location) f.bases.add(e.location as string)
  }

  const fleetSummary = Object.values(fleetMap)
    .map((f) => ({
      ac_type: f.ac_type,
      entries_count: f.entries_count,
      total_hours: Math.round(f.total_hours * 10) / 10,
      date_from: f.date_from,
      date_to: f.date_to,
      bases: Array.from(f.bases),
    }))
    .sort((a, b) => b.entries_count - a.entries_count)

  const baseMap: Record<string, number> = {}
  for (const e of entries) {
    if (e.location) baseMap[e.location as string] = (baseMap[e.location as string] || 0) + 1
  }
  const bases = Object.entries(baseMap)
    .map(([code, count]) => ({ code, entries_count: count }))
    .sort((a, b) => b.entries_count - a.entries_count)

  const ataByFleet: Record<string, Record<string, { count: number; description: string }>> = {}
  for (const e of entries) {
    if (!e.ata_chapter) continue
    const fleet = (e.ac_type as string) || 'Desconocido'
    const ch = String(e.ata_chapter)
    if (!ataByFleet[fleet]) ataByFleet[fleet] = {}
    if (!ataByFleet[fleet][ch]) {
      ataByFleet[fleet][ch] = { count: 0, description: (e.ata_description as string) || '' }
    }
    ataByFleet[fleet][ch].count++
  }

  const ataByFleetFormatted: Record<string, Array<{ chapter: string; count: number; description: string }>> = {}
  for (const [fleet, atas] of Object.entries(ataByFleet)) {
    ataByFleetFormatted[fleet] = Object.entries(atas)
      .map(([chapter, data]) => ({ chapter, ...data }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6)
  }

  const sourcesFormatted = (sources || []).map((s) => ({
    system_label: s.source_system_label,
    entries_count: s.entries_count,
    date_from: s.date_from,
    date_to: s.date_to,
    uploaded_at: s.uploaded_at,
  }))

  const analysisJson = {
    summary: {
      total_entries: totalEntries,
      total_hours: Math.round(totalHours * 10) / 10,
      date_from: dateFrom,
      date_to: dateTo,
      years_active: yearsSet.size,
      fleet_count: fleetSummary.length,
      base_count: bases.length,
    },
    activity_by_year: activityByYear,
    fleet_summary: fleetSummary,
    bases,
    ata_by_fleet: ataByFleetFormatted,
    sources: sourcesFormatted,
  }

  const { error: upErr } = await supabase.from('logbook_analysis').upsert(
    {
      technician_id: technicianId,
      analysis_json: analysisJson,
      entries_total: totalEntries,
      last_updated: new Date().toISOString(),
    },
    { onConflict: 'technician_id' }
  )

  if (upErr) throw new Error(upErr.message)
}
