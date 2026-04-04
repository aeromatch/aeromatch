/**
 * Filas esperadas para el certificado AMX: EASA, logbook, un bloque TR por serie EASA (no por variante).
 */

import {
  getUniqueSeries,
  sortSeriesForDisplay,
  seriesToDocSlug,
  typeRatingCombinedKeyFromSeries,
} from '@/lib/aircraft-series'

export type AmxDocTier = 'checked' | 'pending' | 'not_uploaded'

export type AmxCertificateDocumentRow = {
  sortKey: string
  icon: 'check' | 'hourglass' | 'warning'
  label: string
  tier: AmxDocTier
  detail: string
}

type DocRow = {
  doc_type: string
  status: string
  verified_at?: string | null
}

/** Normaliza status desde BD (espacios, mayúsculas, rarezas) para comparar con el esquema AMX. */
export function normalizeDocStatus(raw: string | null | undefined): string {
  return String(raw ?? '')
    .trim()
    .toLowerCase()
}

function formatDateEn(d: Date): string {
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

function rowTier(row: DocRow | undefined): AmxDocTier {
  if (!row) return 'not_uploaded'
  const s = normalizeDocStatus(row.status)
  if (s === 'checked') return 'checked'
  if (s === 'not_uploaded') return 'not_uploaded'
  return 'pending'
}

function detailForTier(tier: AmxDocTier, verifiedAt: string | null | undefined): string {
  if (tier === 'checked' && verifiedAt) {
    return formatDateEn(new Date(verifiedAt))
  }
  if (tier === 'pending') return 'Awaiting review'
  return '--'
}

/** TR por serie: combinado, o teórico+práctico, o legacy B757/B767 fusionado */
function typeRatingTiersForSeries(
  series: string,
  docsByType: Map<string, DocRow>
): { tier: AmxDocTier; detail: string } {
  const slug = seriesToDocSlug(series)
  const combinedKey = typeRatingCombinedKeyFromSeries(series)
  const combined = docsByType.get(combinedKey)
  if (combined) {
    const tc = rowTier(combined)
    if (tc === 'checked' && combined.verified_at) {
      return { tier: 'checked', detail: formatDateEn(new Date(combined.verified_at)) }
    }
    if (tc === 'checked') {
      return { tier: 'checked', detail: formatDateEn(new Date()) }
    }
    if (tc === 'not_uploaded') {
      return { tier: 'not_uploaded', detail: '--' }
    }
    return { tier: 'pending', detail: 'Awaiting review' }
  }

  const theory = docsByType.get(`type_${slug}_theory`)
  const practical = docsByType.get(`type_${slug}_practical`)
  const tTheory = theory ? rowTier(theory) : 'not_uploaded'
  const tPractical = practical ? rowTier(practical) : 'not_uploaded'

  // Legacy: type_b757_b767_* antes de separar B757/B767
  const legTheory = docsByType.get('type_b757_b767_theory')
  const legPractical = docsByType.get('type_b757_b767_practical')
  const legLegacyT = docsByType.get('type_b757_b767_legacy_theory')
  const legLegacyP = docsByType.get('type_b757_b767_legacy_practical')
  if (series === 'B757' || series === 'B767') {
    const useLegacy = legTheory && legPractical
    const useLegacySplit = legLegacyT && legLegacyP
    if (useLegacy || useLegacySplit) {
      const lt = useLegacy ? legTheory! : legLegacyT!
      const lp = useLegacy ? legPractical! : legLegacyP!
      const rt = rowTier(lt)
      const rp = rowTier(lp)
      if (rt === 'not_uploaded' && rp === 'not_uploaded') {
        return { tier: 'not_uploaded', detail: '--' }
      }
      if (rt === 'checked' && rp === 'checked') {
        const d1 = lt.verified_at ? new Date(lt.verified_at).getTime() : 0
        const d2 = lp.verified_at ? new Date(lp.verified_at).getTime() : 0
        return { tier: 'checked', detail: formatDateEn(new Date(Math.max(d1, d2))) }
      }
      return { tier: 'pending', detail: 'Awaiting review' }
    }
  }

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
  const hasEasa = byType.has('easa_license')
  const hasUk = byType.has('uk_license')
  const hasFaa = byType.has('faa_ap')
  const easaRow = byType.get('easa_license') || byType.get('uk_license') || byType.get('faa_ap')
  const easaLabel = hasEasa
    ? lc
      ? `EASA License ${lc}`
      : 'EASA Part-66 License'
    : hasUk
      ? lc
        ? `UK CAA License ${lc}`
        : 'UK CAA License'
      : hasFaa
        ? 'FAA A&P License'
        : lc
          ? `EASA License ${lc}`
          : 'EASA Part-66 License'

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

  const seriesList = sortSeriesForDisplay(getUniqueSeries(technician.aircraft_types || []))
  seriesList.forEach((series, i) => {
    const { tier, detail } = typeRatingTiersForSeries(series, byType)
    out.push({
      sortKey: `2_tr_${i}_${seriesToDocSlug(series)}`,
      icon: tier === 'checked' ? 'check' : tier === 'pending' ? 'hourglass' : 'warning',
      label: `Type Rating ${series}`,
      tier,
      detail,
    })
  })

  return out
}
