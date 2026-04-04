/**
 * Type ratings EASA por SERIE (no por cada variante).
 * Variantes del catálogo → serie mostrada en certificado / documentos.
 */

export const AIRCRAFT_SERIES: Record<string, string> = {
  // Airbus narrow body
  A318: 'A318/A319/A320/A321',
  A319: 'A318/A319/A320/A321',
  A320: 'A318/A319/A320/A321',
  A320neo: 'A318/A319/A320/A321',
  A321: 'A318/A319/A320/A321',
  A321neo: 'A318/A319/A320/A321',
  A321XLR: 'A318/A319/A320/A321',
  // Airbus wide body A330
  'A330-200': 'A330',
  'A330-300': 'A330',
  A330neo: 'A330',
  // Airbus wide body A350
  'A350-900': 'A350',
  'A350-1000': 'A350',
  // Airbus wide body A380
  A380: 'A380',
  // Boeing 737 — tres familias (cursos / habilitaciones distintas)
  'B737-300': 'B737 Classic',
  'B737-400': 'B737 Classic',
  'B737-500': 'B737 Classic',
  'B737-600': 'B737 NG',
  'B737-700': 'B737 NG',
  'B737-800': 'B737 NG',
  'B737-900': 'B737 NG',
  'B737 MAX 7': 'B737 MAX',
  'B737 MAX 8': 'B737 MAX',
  'B737 MAX 9': 'B737 MAX',
  'B737 MAX 10': 'B737 MAX',
  // Alias por si aparecen sin prefijo B
  '737 Classic': 'B737 Classic',
  '737 NG': 'B737 NG',
  '737 MAX': 'B737 MAX',
  // Boeing wide body — B757 y B767 independientes
  'B757-200': 'B757',
  'B757-300': 'B757',
  'B767-200': 'B767',
  'B767-300': 'B767',
  'B767-400': 'B767',
  // Boeing wide body B777
  'B777-200': 'B777',
  'B777-300': 'B777',
  B777X: 'B777',
  // Boeing wide body B787
  B787: 'B787',
  'B787-8': 'B787',
  'B787-9': 'B787',
  'B787-10': 'B787',
  // Boeing wide body B747
  'B747-400': 'B747',
  'B747-8': 'B747',
  // ATR (catálogo con espacios)
  ATR42: 'ATR42/72',
  ATR72: 'ATR42/72',
  'ATR 42-300': 'ATR42/72',
  'ATR 42-500': 'ATR42/72',
  'ATR 42-600': 'ATR42/72',
  'ATR 72-200': 'ATR42/72',
  'ATR 72-500': 'ATR42/72',
  'ATR 72-600': 'ATR42/72',
}

/** Orden de acordeones / filas AMX (nivel 1) */
export const SERIES_UI_ORDER: string[] = [
  'A318/A319/A320/A321',
  'A330',
  'A350',
  'A380',
  'B737 Classic',
  'B737 NG',
  'B737 MAX',
  'B757',
  'B767',
  'B777',
  'B787',
  'B747',
  'ATR42/72',
]

export function seriesToDocSlug(series: string): string {
  return series
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '_')
    .replace(/\//g, '_')
    .replace(/[^a-z0-9_]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
}

export function typeRatingTheoryKeyFromSeries(series: string): string {
  return `type_${seriesToDocSlug(series)}_theory`
}

export function typeRatingPracticalKeyFromSeries(series: string): string {
  return `type_${seriesToDocSlug(series)}_practical`
}

/** Un solo PDF que cubre teórico + práctico (EASA combinado). */
export function typeRatingCombinedKeyFromSeries(series: string): string {
  return `type_${seriesToDocSlug(series)}_combined`
}

export function typeRatingExtraKeyFromSeries(series: string, extraKey: string): string {
  return `type_${seriesToDocSlug(series)}_${extraKey}`
}

/** Series únicas a partir de variantes del perfil */
export function getUniqueSeries(aircraftTypes: string[]): string[] {
  const series = aircraftTypes.map((t) => AIRCRAFT_SERIES[t] || t)
  return [...new Set(series)]
}

/** Variantes del catálogo que pertenecen a una serie (selección masiva / acordeón) */
export function getVariantsForSeries(series: string, catalogAircraft: string[]): string[] {
  return catalogAircraft.filter((ac) => (AIRCRAFT_SERIES[ac] || ac) === series)
}

/** Orden estable para PDF / UI */
export function sortSeriesForDisplay(seriesList: string[]): string[] {
  return [...seriesList].sort((a, b) => {
    const ia = SERIES_UI_ORDER.indexOf(a)
    const ib = SERIES_UI_ORDER.indexOf(b)
    if (ia !== -1 && ib !== -1) return ia - ib
    if (ia !== -1) return -1
    if (ib !== -1) return 1
    return a.localeCompare(b)
  })
}

/**
 * Type rating completo: documento combinado, o teórico + práctico.
 * Incluye filas legacy type_b757_b767_* hasta migración.
 */
export function isTypeRatingDocSetComplete(docTypes: string[], series: string): boolean {
  const slug = seriesToDocSlug(series)
  const combined = `type_${slug}_combined`
  if (docTypes.includes(combined)) return true
  const theory = typeRatingTheoryKeyFromSeries(series)
  const practical = typeRatingPracticalKeyFromSeries(series)
  if (docTypes.includes(theory) && docTypes.includes(practical)) return true
  // Legacy B757/B767 fusionado (pre-split)
  if (series === 'B757' || series === 'B767') {
    const legT = 'type_b757_b767_theory'
    const legP = 'type_b757_b767_practical'
    if (docTypes.includes(legT) && docTypes.includes(legP)) return true
    const legLegT = 'type_b757_b767_legacy_theory'
    const legLegP = 'type_b757_b767_legacy_practical'
    if (docTypes.includes(legLegT) && docTypes.includes(legLegP)) return true
  }
  return false
}
