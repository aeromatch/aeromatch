'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { ATA_CHAPTERS, getAtaDescription } from '@/lib/logbook/ataChapters'
import { AIRCRAFT_CATALOG } from '@/lib/aircraftCatalog'

type ManualEntry = {
  id: string
  entry_date: string
  ac_type: string | null
  ac_registration: string | null
  ata_chapter: string | null
  ata_description: string | null
  description: string | null
  location: string | null
  duration_hours: number | null
  wo_number: string | null
  skill_level: string | null
  created_at: string
}

const AIRCRAFT_OPTIONS = AIRCRAFT_CATALOG.flatMap((g) => g.aircraft)

const SKILL_LEVELS: { value: 'B1' | 'B2' | 'C'; label: string }[] = [
  { value: 'B1', label: 'B1 — Mecánico/Motor' },
  { value: 'B2', label: 'B2 — Aviónica' },
  { value: 'C', label: 'C — Base' },
]

type Props = {
  /** Se llama tras crear/borrar una entry para que el padre recargue analysis. */
  onChange?: () => void
}

export function ManualLogbookSection({ onChange }: Props) {
  const today = useMemo(() => new Date().toISOString().substring(0, 10), [])

  const [entries, setEntries] = useState<ManualEntry[]>([])
  const [loading, setLoading] = useState(true)

  const [entryDate, setEntryDate] = useState(today)
  const [acType, setAcType] = useState('')
  const [acRegistration, setAcRegistration] = useState('')
  const [ataChapter, setAtaChapter] = useState('')
  const [ataDescription, setAtaDescription] = useState('')
  const [description, setDescription] = useState('')
  const [location, setLocation] = useState('')
  const [durationHours, setDurationHours] = useState('')
  const [woNumber, setWoNumber] = useState('')
  const [skillLevel, setSkillLevel] = useState<'B1' | 'B2' | 'C'>('B1')

  const [saving, setSaving] = useState(false)
  const [feedback, setFeedback] = useState<{ kind: 'ok' | 'err'; msg: string } | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [confirmingDelete, setConfirmingDelete] = useState<string | null>(null)

  const fetchEntries = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/logbook/manual-entry')
      if (res.ok) {
        const data = await res.json()
        setEntries(data.entries || [])
      } else {
        setEntries([])
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetchEntries()
  }, [fetchEntries])

  function handleAtaChange(code: string) {
    setAtaChapter(code)
    setAtaDescription(getAtaDescription(code))
  }

  function resetForm() {
    setEntryDate(today)
    setAcType('')
    setAcRegistration('')
    setAtaChapter('')
    setAtaDescription('')
    setDescription('')
    setLocation('')
    setDurationHours('')
    setWoNumber('')
    setSkillLevel('B1')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setFeedback(null)

    if (!entryDate || !acType.trim() || !ataChapter || !description.trim() || !skillLevel) {
      setFeedback({ kind: 'err', msg: 'Completa los campos obligatorios.' })
      return
    }

    setSaving(true)
    try {
      const res = await fetch('/api/logbook/manual-entry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entry_date: entryDate,
          ac_type: acType.trim(),
          ac_registration: acRegistration.trim() || null,
          ata_chapter: ataChapter,
          ata_description: ataDescription.trim() || null,
          description: description.trim(),
          location: location.trim() || null,
          duration_hours: durationHours === '' ? null : Number(durationHours),
          wo_number: woNumber.trim() || null,
          skill_level: skillLevel,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setFeedback({ kind: 'err', msg: data.error || 'Error al guardar la entrada.' })
        return
      }
      setFeedback({ kind: 'ok', msg: 'Entrada guardada correctamente.' })
      resetForm()
      await fetchEntries()
      onChange?.()
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id)
    setFeedback(null)
    try {
      const res = await fetch(`/api/logbook/manual-entry?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setFeedback({ kind: 'err', msg: data.error || 'Error al borrar la entrada.' })
        return
      }
      setConfirmingDelete(null)
      await fetchEntries()
      onChange?.()
    } finally {
      setDeletingId(null)
    }
  }

  const labelClass = 'block text-xs text-steel-400 mb-1'
  const inputClass =
    'w-full bg-navy-950 border border-steel-700/50 rounded-lg px-3 py-2 text-sm text-white placeholder:text-steel-600 focus:outline-none focus:border-gold-500/50'

  return (
    <div className="space-y-6">
      <div className="bg-navy-900 border border-steel-700/40 rounded-xl p-5">
        <div className="mb-5">
          <h3 className="text-sm font-semibold text-white">Añadir entrada manual</h3>
          <p className="text-xs text-steel-500 mt-1">
            Cada entrada se guarda como fuente <span className="text-steel-400 font-medium">MANUAL</span> y
            actualiza tu logBook360 al instante.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>
                Fecha <span className="text-gold-400">*</span>
              </label>
              <input
                type="date"
                value={entryDate}
                onChange={(e) => setEntryDate(e.target.value)}
                max={today}
                className={inputClass}
                required
              />
            </div>

            <div>
              <label className={labelClass}>
                Privilegio <span className="text-gold-400">*</span>
              </label>
              <select
                value={skillLevel}
                onChange={(e) => setSkillLevel(e.target.value as 'B1' | 'B2' | 'C')}
                className={inputClass}
                required
              >
                {SKILL_LEVELS.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className={labelClass}>
                Tipo de aeronave <span className="text-gold-400">*</span>
              </label>
              <input
                type="text"
                value={acType}
                onChange={(e) => setAcType(e.target.value)}
                list="manual-aircraft-options"
                placeholder="Ej: A320neo, B737-800…"
                className={inputClass}
                required
              />
              <datalist id="manual-aircraft-options">
                {AIRCRAFT_OPTIONS.map((a) => (
                  <option key={a} value={a} />
                ))}
              </datalist>
            </div>

            <div>
              <label className={labelClass}>Matrícula</label>
              <input
                type="text"
                value={acRegistration}
                onChange={(e) => setAcRegistration(e.target.value.toUpperCase())}
                placeholder="EC-MUM"
                className={inputClass}
                maxLength={12}
              />
            </div>

            <div>
              <label className={labelClass}>
                Capítulo ATA <span className="text-gold-400">*</span>
              </label>
              <select
                value={ataChapter}
                onChange={(e) => handleAtaChange(e.target.value)}
                className={inputClass}
                required
              >
                <option value="">Selecciona…</option>
                {ATA_CHAPTERS.map((c) => (
                  <option key={c.code} value={c.code}>
                    ATA {c.code} · {c.description}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className={labelClass}>Descripción ATA</label>
              <input
                type="text"
                value={ataDescription}
                onChange={(e) => setAtaDescription(e.target.value)}
                placeholder="Auto-rellenado al elegir capítulo"
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <label className={labelClass}>
              Operación realizada <span className="text-gold-400">*</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Ej: Replacement of #1 main wheel and brake assembly per AMM 32-41-21."
              className={`${inputClass} resize-y`}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className={labelClass}>Base (IATA)</label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value.toUpperCase())}
                placeholder="MAD"
                maxLength={3}
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>Duración (horas)</label>
              <input
                type="number"
                step="0.5"
                min="0"
                value={durationHours}
                onChange={(e) => setDurationHours(e.target.value)}
                placeholder="2.5"
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>WO / Referencia</label>
              <input
                type="text"
                value={woNumber}
                onChange={(e) => setWoNumber(e.target.value)}
                placeholder="WO-123456"
                className={inputClass}
              />
            </div>
          </div>

          {feedback && (
            <div
              className={`text-xs rounded-md p-2.5 ${
                feedback.kind === 'ok'
                  ? 'bg-green-500/10 border border-green-500/30 text-green-300'
                  : 'bg-red-500/10 border border-red-500/30 text-red-300'
              }`}
            >
              {feedback.msg}
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={resetForm}
              disabled={saving}
              className="text-xs px-3 py-2 border border-steel-700/40 text-steel-400 rounded-md hover:bg-steel-700/20"
            >
              Limpiar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="text-xs px-4 py-2 bg-gold-500 text-navy-950 font-semibold rounded-md hover:bg-gold-400 disabled:opacity-60"
            >
              {saving ? 'Guardando…' : 'Guardar entrada'}
            </button>
          </div>
        </form>
      </div>

      {/* Lista de entries manuales */}
      <div className="bg-navy-900 border border-steel-700/40 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-white">Mis entradas manuales</h3>
            <p className="text-xs text-steel-500 mt-0.5">
              {loading
                ? 'Cargando…'
                : `${entries.length} entrada${entries.length === 1 ? '' : 's'} (últimas 50)`}
            </p>
          </div>
        </div>

        {!loading && entries.length === 0 && (
          <div className="text-center py-6 text-xs text-steel-500">
            Aún no has añadido entradas manuales.
          </div>
        )}

        {entries.length > 0 && (
          <div className="overflow-x-auto -mx-2">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-steel-500 border-b border-steel-700/40 text-left">
                  <th className="py-2 px-2">Fecha</th>
                  <th className="py-2 px-2">Aeronave</th>
                  <th className="py-2 px-2">ATA</th>
                  <th className="py-2 px-2">Operación</th>
                  <th className="py-2 px-2">Base</th>
                  <th className="py-2 px-2 text-right">Horas</th>
                  <th className="py-2 px-2">Priv.</th>
                  <th className="py-2 px-2 text-right" />
                </tr>
              </thead>
              <tbody>
                {entries.map((e) => (
                  <tr key={e.id} className="border-b border-steel-800/40">
                    <td className="py-2 px-2 text-steel-300 whitespace-nowrap">
                      {new Date(e.entry_date + 'T00:00:00').toLocaleDateString('es-ES', {
                        day: '2-digit',
                        month: '2-digit',
                        year: '2-digit',
                      })}
                    </td>
                    <td className="py-2 px-2 text-white whitespace-nowrap">
                      {e.ac_type || '—'}
                      {e.ac_registration && (
                        <span className="block text-[10px] text-steel-500">
                          {e.ac_registration}
                        </span>
                      )}
                    </td>
                    <td className="py-2 px-2 text-steel-300 whitespace-nowrap">
                      {e.ata_chapter ? `ATA ${e.ata_chapter}` : '—'}
                    </td>
                    <td className="py-2 px-2 text-steel-300 max-w-[260px] truncate" title={e.description ?? ''}>
                      {e.description || '—'}
                    </td>
                    <td className="py-2 px-2 text-steel-400">{e.location || '—'}</td>
                    <td className="py-2 px-2 text-steel-300 text-right">
                      {e.duration_hours != null ? Number(e.duration_hours).toFixed(1) : '—'}
                    </td>
                    <td className="py-2 px-2 text-gold-400">{e.skill_level || '—'}</td>
                    <td className="py-2 px-2 text-right whitespace-nowrap">
                      {confirmingDelete === e.id ? (
                        <span className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleDelete(e.id)}
                            disabled={deletingId === e.id}
                            className="text-[10px] px-2 py-1 bg-red-500/20 border border-red-500/30 text-red-300 rounded hover:bg-red-500/30 disabled:opacity-60"
                          >
                            {deletingId === e.id ? '…' : 'Sí'}
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmingDelete(null)}
                            disabled={deletingId === e.id}
                            className="text-[10px] px-2 py-1 border border-steel-700/40 text-steel-400 rounded hover:bg-steel-700/20"
                          >
                            No
                          </button>
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setConfirmingDelete(e.id)}
                          className="text-[10px] text-steel-500 hover:text-red-400"
                          aria-label="Eliminar"
                        >
                          Eliminar
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
