'use client'

/**
 * Dashboard visual a partir de analysis_json (logbook_analysis.analysis_json).
 */
export function LogbookWidget({ analysis }: { analysis: Record<string, unknown> }) {
  const summary = analysis.summary as Record<string, unknown> | undefined
  const fleet = (analysis.fleet_summary as Array<Record<string, unknown>>) || []
  const bases = (analysis.bases as Array<{ code: string; entries_count: number }>) || []
  const sources = (analysis.sources as Array<Record<string, unknown>>) || []
  const activity = analysis.activity_by_year as Record<string, Record<string, number>> | undefined
  const ataByFleet = analysis.ata_by_fleet as Record<string, Array<Record<string, unknown>>> | undefined

  return (
    <div className="space-y-6">
      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Entradas', value: summary.total_entries },
            { label: 'Horas (aprox.)', value: summary.total_hours ?? '—' },
            { label: 'Flotas', value: summary.fleet_count },
            { label: 'Bases', value: summary.base_count },
          ].map((k) => (
            <div
              key={k.label}
              className="rounded-lg border border-steel-700/40 bg-navy-900/80 px-3 py-2"
            >
              <div className="text-[10px] uppercase tracking-wide text-steel-500">{k.label}</div>
              <div className="text-lg font-semibold text-white">{String(k.value)}</div>
            </div>
          ))}
        </div>
      )}

      {activity && Object.keys(activity).length > 0 && (
        <div>
          <h3 className="text-xs font-medium text-steel-400 uppercase tracking-wider mb-3">
            Actividad por año y flota
          </h3>
          <div className="space-y-2">
            {Object.entries(activity)
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([year, fleets]) => (
                <div key={year} className="rounded-lg border border-steel-700/40 bg-navy-900/50 p-3">
                  <div className="text-xs text-gold-500/90 mb-2">{year}</div>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(fleets).map(([name, count]) => (
                      <span
                        key={name}
                        className="text-[11px] px-2 py-0.5 rounded bg-navy-800 text-steel-300 border border-steel-700/30"
                      >
                        {name}: <strong className="text-white">{count}</strong>
                      </span>
                    ))}
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {fleet.length > 0 && (
        <div>
          <h3 className="text-xs font-medium text-steel-400 uppercase tracking-wider mb-3">
            Resumen por flota
          </h3>
          <div className="space-y-2">
            {fleet.slice(0, 12).map((f) => (
              <div
                key={String(f.ac_type)}
                className="flex items-center justify-between gap-2 rounded-lg border border-steel-700/40 bg-navy-900/50 px-3 py-2"
              >
                <span className="text-sm text-white">{String(f.ac_type)}</span>
                <span className="text-xs text-steel-400">
                  {Number(f.entries_count ?? 0)} entradas · {Number(f.total_hours ?? 0)} h
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {bases.length > 0 && (
        <div>
          <h3 className="text-xs font-medium text-steel-400 uppercase tracking-wider mb-3">Bases</h3>
          <div className="flex flex-wrap gap-2">
            {bases.slice(0, 16).map((b) => (
              <span
                key={b.code}
                className="text-[11px] px-2 py-1 rounded bg-navy-800 border border-steel-700/30 text-steel-300"
              >
                {b.code}: {b.entries_count}
              </span>
            ))}
          </div>
        </div>
      )}

      {ataByFleet && Object.keys(ataByFleet).length > 0 && (
        <div>
          <h3 className="text-xs font-medium text-steel-400 uppercase tracking-wider mb-3">
            Top ATA por flota
          </h3>
          <div className="space-y-3">
            {Object.entries(ataByFleet).map(([fl, atas]) => (
              <div key={fl} className="rounded-lg border border-steel-700/30 bg-navy-900/40 p-3">
                <div className="text-xs text-gold-500/90 mb-2">{fl}</div>
                <ul className="text-[11px] text-steel-400 space-y-1">
                  {atas.map((a) => (
                    <li key={String(a.chapter)}>
                      ATA {String(a.chapter)} — {String(a.description || '—')} ({a.count as number})
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}

      {sources.length > 0 && (
        <div>
          <h3 className="text-xs font-medium text-steel-400 uppercase tracking-wider mb-3">
            Fuentes del análisis
          </h3>
          <div className="flex flex-col gap-2">
            {sources.map((source, i) => (
              <div
                key={i}
                className="flex items-center justify-between gap-2 bg-navy-900 border border-steel-700/40 rounded-lg px-4 py-3"
              >
                <div className="flex items-center gap-3 flex-wrap min-w-0">
                  <span className="text-xs font-medium text-gold-500 shrink-0">
                    {String(source.system_label ?? '')}
                  </span>
                  <span className="text-xs text-steel-400">
                    {Number(source.entries_count || 0).toLocaleString('es-ES')} entradas
                    {Boolean(source.date_from && source.date_to) ? (
                      <>
                        {' '}
                        · {String(source.date_from).substring(0, 4)}–
                        {String(source.date_to).substring(0, 4)}
                      </>
                    ) : null}
                  </span>
                </div>
                {source.uploaded_at ? (
                  <span className="text-xs text-steel-600 shrink-0">
                    {new Date(String(source.uploaded_at)).toLocaleDateString('es-ES', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </span>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
