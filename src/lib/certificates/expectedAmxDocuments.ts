/**
 * Filas esperadas para el certificado AMX: EASA, logbook, un bloque TR por aircraft_type.
 * Estados: checked | pending | not_uploaded (según filas en `documents`).
 */

export type AmxDocTier = 'checked' | 'pending' | 'not_uploaded'

export type AmxCertificateDocumentRow = {
  /** Clave estable para ordenar */
  sortKey: string
  /** Icono en PDF: checkmark, hourglass, warning */
  icon: 'check' | 'hourglass' | 'warning'
  /** Texto primera columna (símbolo + etiqueta) */
  label: string
  tier: AmxDocTier
  /** Columna derecha: fecha DD Mon YYYY, "Awaiting review", o "--" (ASCII para PDF/WinAnsi) */
  detail: string
}

type DocRow = {
  doc_type: string
  status: string
  verified_at?: string | null
}

function formatDateEn(d: Date): string {
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

function rowTier(row: DocRow | undefined): AmxDocTier {
  if (!row) return 'not_uploaded'
  if (row.status === 'checked') return 'checked'
  return 'pending'
}

function detailForTier(tier: AmxDocTier, verifiedAt: string | null | undefined): string {
  if (tier === 'checked' && verifiedAt) {
    return formatDateEn(new Date(verifiedAt))
  }
  if (tier === 'pending') return 'Awaiting review'
  return '--'
}

/** TR: requiere theory + practical para considerar checked */
function typeRatingTiers(
  aircraft: string,
  docsByType: Map<string, DocRow>
): { tier: AmxDocTier; detail: string } {
  const a = aircraft.toLowerCase()
  const theory = docsByType.get(`type_${a}_theory`)
  const practical = docsByType.get(`type_${a}_practical`)
  const tTheory = theory ? rowTier(theory) : 'not_uploaded'
  const tPractical = practical ? rowTier(practical) : 'not_uploaded'

  if (tTheory === 'not_uploaded' && tPractical === 'not_uploaded') {
    return { tier: 'not_uploaded', detail: '--' }
  }
  if (tTheory === 'checked' && tPractical === 'checked') {
    const d1 = theory?.verified_at ? new Date(theory.verified_at).getTime() : 0
    const d2 = practical?.verified_at ? new Date(practical.verified_at).getTime() : 0
    const latest = Math.max(d1, d2)
    return { tier: 'checked', detail: formatDateEn(new Date(latest)) }
  }
  return { tier: 'pending', detail: 'Awaiting review' }
}

export function buildAmxCertificateDocumentRows(
  technician: { license_category?: string[] | null; aircraft_types?: string[] | null },
  docRows: DocRow[]
): AmxCertificateDocumentRow[] {
  const byType = new Map<string, DocRow>()
  for (const r of docRows) {
    byType.set(r.doc_type, r)
  }

  const out: AmxCertificateDocumentRow[] = []

  const lc = technician.license_category?.[0]
  const easaLabel = lc
    ? `EASA License ${lc}`
    : 'EASA Part-66 License'

  const easaRow = byType.get('easa_license')
  const easaTier = easaRow ? rowTier(easaRow) : 'not_uploaded'
  out.push({
    sortKey: '0_easa',
    icon: easaTier === 'checked' ? 'check' : easaTier === 'pending' ? 'hourglass' : 'warning',
    label: easaLabel,
    tier: easaTier,
    detail: detailForTier(easaTier, easaRow?.verified_at),
  })

  const logRow = byType.get('logbook')
  const logTier = logRow ? rowTier(logRow) : 'not_uploaded'
  out.push({
    sortKey: '1_logbook',
    icon: logTier === 'checked' ? 'check' : logTier === 'pending' ? 'hourglass' : 'warning',
    label: 'Logbook',
    tier: logTier,
    detail: detailForTier(logTier, logRow?.verified_at),
  })

  const aircrafts = technician.aircraft_types || []
  aircrafts.forEach((ac, i) => {
    const { tier, detail } = typeRatingTiers(ac, byType)
    out.push({
      sortKey: `2_tr_${i}_${ac}`,
      icon: tier === 'checked' ? 'check' : tier === 'pending' ? 'hourglass' : 'warning',
      label: `Type Rating ${ac}`,
      tier,
      detail,
    })
  })

  return out
}
