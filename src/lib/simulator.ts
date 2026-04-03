export interface Question {
  id: string
  ata: string
  subtopic: string
  category: 'B1' | 'B2' | 'B1B2'
  level: 1 | 2 | 3
  question: string
  options: { a: string; b: string; c: string }
  correct_answer: 'a' | 'b' | 'c'
  justification: string
  book: string
  phase: string
}

export const BOOKS = [
  {
    id: 'book1',
    name: 'Book 1',
    phase: 'Phase 1',
    description:
      'Aircraft General, Documentation, Ground Handling, Doors, Fuselage, Pylon, Stabilizers, Windows',
    atas: [
      { code: '00', description: 'Aircraft General Overview' },
      { code: '01', description: 'Manuals, FIN, ATA 100, MMEL' },
      { code: '05', description: 'Maintenance Checks & Inspections' },
      { code: '06', description: 'Aircraft Dimensions & Zoning' },
      { code: '07', description: 'Jacking & Landing Gear Lifting' },
      { code: '08', description: 'Leveling & Weighing' },
      { code: '09', description: 'Towing & Taxiing' },
      { code: '10', description: 'Parking & Mooring' },
      { code: '11', description: 'Placards & Markings' },
      { code: '12', description: 'Ground Support Equipment & Servicing' },
      { code: '20', description: 'Safety Items - Warnings & Cautions' },
      { code: '24', description: 'Electrical Power' },
      { code: '31', description: 'Indicating / Recording Systems' },
      { code: '33', description: 'Lights' },
      { code: '51', description: 'Structural Breakdown & Damage Assessment' },
      { code: '52', description: 'Doors - Passenger, Cargo, Cockpit' },
      { code: '53', description: 'Fuselage Structure' },
      { code: '54', description: 'Pylon Structure' },
      { code: '55', description: 'Stabilizers - THS, Elevators, Rudder' },
      { code: '56', description: 'Windows - Cockpit & Cabin' },
      { code: '57', description: 'Wings' },
    ],
  },
  {
    id: 'book2',
    name: 'Book 2',
    phase: 'Phase 2',
    description: 'Air Systems, Fire, Ice, Pneumatics, Oxygen',
    atas: [
      { code: '21', description: 'Air Conditioning & Pressurization' },
      { code: '26', description: 'Fire Protection' },
      { code: '30', description: 'Ice & Rain Protection' },
      { code: '35', description: 'Oxygen Systems' },
      { code: '36', description: 'Pneumatic System' },
      { code: '47', description: 'Nitrogen Generation System' },
    ],
  },
  {
    id: 'book3',
    name: 'Book 3',
    phase: 'Phase 3',
    description: 'Flight Controls, Hydraulics, Water & Waste',
    atas: [
      { code: '27', description: 'Flight Controls' },
      { code: '29', description: 'Hydraulic System' },
      { code: '25', description: 'Equipment & Furnishings' },
      { code: '38', description: 'Water & Waste' },
    ],
  },
  {
    id: 'book4',
    name: 'Book 4',
    phase: 'Phase 4',
    description: 'Fuel, Landing Gear, APU',
    atas: [
      { code: '28', description: 'Fuel System' },
      { code: '32', description: 'Landing Gear' },
      { code: '49', description: 'Airborne Auxiliary Power (APU)' },
    ],
  },
  {
    id: 'book5',
    name: 'Book 5',
    phase: 'Phase 5',
    description: 'Engines (IAE V2500 & CFM56-5B) - All ATAs',
    atas: [
      { code: '70', description: 'Engine Overview & General' },
      { code: '71', description: 'Nacelle & Powerplant / Engine R&I' },
      { code: '72', description: 'Fan, Compressor, Turbine, Combustion' },
      { code: '73', description: 'Fuel System & FADEC/ECU' },
      { code: '74', description: 'Ignition System' },
      { code: '75', description: 'Air System - VSV/VBV, ACC' },
      { code: '76', description: 'Engine Controls' },
      { code: '77', description: 'Engine Monitoring / Indicating' },
      { code: '78', description: 'Thrust Reverser' },
      { code: '79', description: 'Oil System' },
      { code: '80', description: 'Starting System' },
    ],
  },
  {
    id: 'book6',
    name: 'Book 6',
    phase: 'Phase 6',
    description: 'Avionics & Communications',
    atas: [
      { code: '22', description: 'Auto Flight' },
      { code: '23', description: 'Communications' },
      { code: '34', description: 'Navigation' },
      { code: '46', description: 'Information Systems' },
    ],
  },
] as const

export function getBook(bookId: string) {
  return (BOOKS as readonly any[]).find((b) => b.id === bookId) || null
}

export function storageKeyAnswered(bookId: string, ataCode: string) {
  return `simulator_${bookId}_${ataCode}_answered`
}

export function safeParseJsonArray(value: string | null): string[] {
  if (!value) return []
  try {
    const parsed = JSON.parse(value)
    return Array.isArray(parsed) ? parsed.filter((x) => typeof x === 'string') : []
  } catch {
    return []
  }
}

export function getAnsweredIds(bookId: string, ataCode: string): string[] {
  if (typeof window === 'undefined') return []
  return safeParseJsonArray(window.localStorage.getItem(storageKeyAnswered(bookId, ataCode)))
}

export function setAnsweredIds(bookId: string, ataCode: string, ids: string[]) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(storageKeyAnswered(bookId, ataCode), JSON.stringify(Array.from(new Set(ids))))
}

export function addAnsweredIds(bookId: string, ataCode: string, ids: string[]) {
  const current = getAnsweredIds(bookId, ataCode)
  setAnsweredIds(bookId, ataCode, [...current, ...ids])
}

export function shuffle<T>(items: T[]): T[] {
  const arr = [...items]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    const tmp = arr[i]
    arr[i] = arr[j]
    arr[j] = tmp
  }
  return arr
}

function hashStringToInt(input: string): number {
  // FNV-1a 32-bit
  let h = 0x811c9dc5
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return h >>> 0
}

function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5)
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function shuffleQuestionOptionsForSession(params: {
  question: Question
  sessionSeed: string
}): Question {
  const { question, sessionSeed } = params
  const q = question
  if (!q?.options || !q.correct_answer) return q

  const entries: Array<{ key: 'a' | 'b' | 'c'; text: string }> = [
    { key: 'a', text: q.options.a },
    { key: 'b', text: q.options.b },
    { key: 'c', text: q.options.c },
  ]

  const rng = mulberry32(hashStringToInt(`${sessionSeed}:${q.id}`))
  for (let i = entries.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    const tmp = entries[i]
    entries[i] = entries[j]
    entries[j] = tmp
  }

  const newOptions = { a: entries[0].text, b: entries[1].text, c: entries[2].text }
  const correctOldKey = q.correct_answer
  const newCorrectIndex = entries.findIndex((e) => e.key === correctOldKey)
  const newCorrectKey = (['a', 'b', 'c'] as const)[Math.max(0, newCorrectIndex)] || 'a'

  return { ...q, options: newOptions, correct_answer: newCorrectKey }
}

export function buildExamSessionQuestions(params: {
  bookId: string
  ataCode: string
  questions: Question[]
  sessionSize?: number
}): { sessionQuestions: Question[]; willResetAfterSession: boolean } {
  const { bookId, ataCode, questions } = params
  const sessionSize = params.sessionSize ?? 20

  const pool = questions.filter((q) => q && q.id && q.ata === ataCode)
  const answered = new Set(getAnsweredIds(bookId, ataCode))
  const unasked = pool.filter((q) => !answered.has(q.id))

  if (pool.length === 0) return { sessionQuestions: [], willResetAfterSession: false }

  // If everything in this ATA has already been answered, reset rotation immediately
  // so we can start a new session instead of showing an empty ATA.
  if (unasked.length === 0) {
    setAnsweredIds(bookId, ataCode, [])
    return { sessionQuestions: shuffle(pool).slice(0, sessionSize), willResetAfterSession: false }
  }

  if (unasked.length >= sessionSize) {
    return { sessionQuestions: shuffle(unasked).slice(0, sessionSize), willResetAfterSession: false }
  }

  // Serve remaining, then reset rotation for next time.
  return { sessionQuestions: shuffle(unasked), willResetAfterSession: true }
}

export type CustomExamDistributionMode = 'auto' | 'manual'

export function allocateAutoCounts(params: {
  ataCodes: string[]
  totalQuestions: number
  availableByAta: Map<string, number>
}): { counts: Record<string, number>; ok: boolean } {
  const { ataCodes, totalQuestions, availableByAta } = params
  const codes = ataCodes.filter(Boolean)
  if (codes.length === 0 || totalQuestions <= 0) return { counts: {}, ok: false }

  const base = Math.floor(totalQuestions / codes.length)
  const remainder = totalQuestions % codes.length

  const counts: Record<string, number> = {}
  for (let i = 0; i < codes.length; i++) {
    const code = codes[i]
    counts[code] = base + (i < remainder ? 1 : 0)
  }

  // Validate availability
  for (const code of codes) {
    const avail = availableByAta.get(code) ?? 0
    if ((counts[code] || 0) > avail) return { counts, ok: false }
  }

  return { counts, ok: true }
}

export function buildCustomExamSessionQuestions(params: {
  bookId: string
  ataCounts: Record<string, number>
  questions: Question[]
}): { sessionQuestions: Question[]; willResetByAta: Record<string, boolean> } {
  const { bookId, ataCounts, questions } = params
  const willResetByAta: Record<string, boolean> = {}

  const out: Question[] = []
  for (const [ataCode, needRaw] of Object.entries(ataCounts)) {
    const need = Math.max(0, Math.floor(Number(needRaw) || 0))
    if (!ataCode || need <= 0) continue

    const pool = questions.filter((q) => q && q.id && q.ata === ataCode)
    if (pool.length === 0) {
      willResetByAta[ataCode] = false
      continue
    }

    const answered = new Set(getAnsweredIds(bookId, ataCode))
    const unasked = pool.filter((q) => !answered.has(q.id))

    if (unasked.length >= need) {
      out.push(...shuffle(unasked).slice(0, need))
      willResetByAta[ataCode] = false
      continue
    }

    // Not enough unasked: consume remaining, then sample from the rest of the pool.
    // Mark for reset after session so rotation restarts cleanly next time.
    const picked: Question[] = [...shuffle(unasked)]
    const remainingNeed = need - picked.length
    const rest = pool.filter((q) => !picked.some((p) => p.id === q.id))
    picked.push(...shuffle(rest).slice(0, remainingNeed))
    out.push(...picked)
    willResetByAta[ataCode] = true
  }

  return { sessionQuestions: shuffle(out), willResetByAta }
}

export type CustomExamSelection = {
  bookId: string
  ataCode: string
  count: number
}

export function buildCustomExamSessionQuestionsMultiBook(params: {
  selections: CustomExamSelection[]
  questionsByBook: Record<string, Question[]>
}): {
  sessionQuestions: Question[]
  willResetByBookAta: Record<string, Record<string, boolean>>
} {
  const { selections, questionsByBook } = params
  const willResetByBookAta: Record<string, Record<string, boolean>> = {}

  const out: Question[] = []

  for (const s of selections) {
    const bookId = s.bookId
    const ataCode = s.ataCode
    const need = Math.max(0, Math.floor(Number(s.count) || 0))
    if (!bookId || !ataCode || need <= 0) continue

    const all = questionsByBook[bookId] || []
    const pool = all.filter((q) => q && q.id && q.ata === ataCode)
    if (!willResetByBookAta[bookId]) willResetByBookAta[bookId] = {}

    if (pool.length === 0) {
      willResetByBookAta[bookId][ataCode] = false
      continue
    }

    const answered = new Set(getAnsweredIds(bookId, ataCode))
    const unasked = pool.filter((q) => !answered.has(q.id))

    if (unasked.length >= need) {
      out.push(...shuffle(unasked).slice(0, need))
      willResetByBookAta[bookId][ataCode] = false
      continue
    }

    const picked: Question[] = [...shuffle(unasked)]
    const remainingNeed = need - picked.length
    const rest = pool.filter((q) => !picked.some((p) => p.id === q.id))
    picked.push(...shuffle(rest).slice(0, remainingNeed))
    out.push(...picked)
    willResetByBookAta[bookId][ataCode] = true
  }

  return { sessionQuestions: shuffle(out), willResetByBookAta }
}

export function computeBookProgressFromLocalStorage(bookId: string): { answered: number } {
  if (typeof window === 'undefined') return { answered: 0 }
  let totalAnswered = 0
  for (let i = 0; i < window.localStorage.length; i++) {
    const key = window.localStorage.key(i)
    if (!key) continue
    if (!key.startsWith(`simulator_${bookId}_`)) continue
    if (!key.endsWith('_answered')) continue
    totalAnswered += safeParseJsonArray(window.localStorage.getItem(key)).length
  }
  return { answered: totalAnswered }
}

