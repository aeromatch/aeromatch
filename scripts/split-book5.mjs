// Split book5.json into book5_iae.json + book5_cfm.json, create empty
// book5_pw.json + book5_leap.json placeholders, and clean page references
// from every justification.
//
// Classification rules:
//   - IAE keywords: IAE, V2500, V2527, EPR, PRSOV, FMU, EEC
//   - CFM keywords: CFM, CFM56, HMU, FMV, ECU
//   - If a question matches both or neither, duplicate it in both files.
//
// Usage:
//   node scripts/split-book5.mjs

import fs from 'node:fs'
import path from 'node:path'

const DATA_DIR = path.join('public', 'data')
const SRC = path.join(DATA_DIR, 'book5.json')

const IAE_KEYWORDS = /\b(IAE|V2500|V2527|EPR|PRSOV|FMU|EEC)\b/i
const CFM_KEYWORDS = /\b(CFM(?:56)?|HMU|FMV|ECU)\b/i

function textBlob(q) {
  return [
    q.question || '',
    q.subtopic || '',
    q.justification || '',
    q.options ? Object.values(q.options).join(' ') : '',
  ].join(' ')
}

function cleanPages(text) {
  if (!text) return text
  let s = text

  s = s.replace(/Manual\s+ATA\s+\d+,?\s*Page\s+\d+:?\s*/gi, '')
  s = s.replace(/\(\s*Book\s+\d+[A-Z]?,\s*p\.?\s*\d+\s*\)/gi, '')
  s = s.replace(/\(\s*p\.?\s*\d+\s*\)/gi, '')

  s = s.replace(
    /\bAccording\s+to\s+page\s+\d+(?:\s+of\s+the\s+manual)?,?\s*/gi,
    ''
  )
  s = s.replace(
    /\bThe\s+manual\s+on\s+page\s+\d+\s+(?:specifies|states|says|indicates|mentions|describes|notes|outlines|details)\s+(?:that\s+)?/gi,
    ''
  )
  s = s.replace(/\bon\s+page\s+\d+\s*[,:\.]?\s*/gi, '')
  s = s.replace(
    /\bPage\s+\d+\s+(?:states?|specifies|says|indicates|mentions|describes|notes|outlines|details)\s+(?:that\s+)?/gi,
    ''
  )
  s = s.replace(/\bPage\s+\d+:\s*/g, '')
  s = s.replace(
    /\b(?:refer\s+to|see|as\s+per|per)\s+page\s+\d+,?\s*/gi,
    ''
  )
  // Last-resort trailing "page X"
  s = s.replace(/,?\s*\bpage\s+\d+\b/gi, '')

  // Cleanup artifacts
  s = s.replace(/\s{2,}/g, ' ')
  s = s.replace(/^\s*[,\.;:]\s*/, '')
  s = s.replace(/\s+,/g, ',')
  s = s.replace(/\s+\./g, '.')
  s = s.trim()
  if (s && /^[a-z]/.test(s)) s = s.charAt(0).toUpperCase() + s.slice(1)
  return s
}

const raw = fs.readFileSync(SRC, 'utf-8')
const questions = JSON.parse(raw)

const iae = []
const cfm = []
let iaeOnly = 0
let cfmOnly = 0
let bothBoth = 0
let generic = 0

for (const q of questions) {
  const blob = textBlob(q)
  const isIae = IAE_KEYWORDS.test(blob)
  const isCfm = CFM_KEYWORDS.test(blob)

  const cleaned = { ...q, justification: cleanPages(q.justification) }

  if (isIae && !isCfm) {
    iae.push({ ...cleaned, book: 'book5_iae' })
    iaeOnly++
  } else if (isCfm && !isIae) {
    cfm.push({ ...cleaned, book: 'book5_cfm' })
    cfmOnly++
  } else {
    iae.push({ ...cleaned, book: 'book5_iae' })
    cfm.push({ ...cleaned, book: 'book5_cfm' })
    if (isIae && isCfm) bothBoth++
    else generic++
  }
}

fs.writeFileSync(
  path.join(DATA_DIR, 'book5_iae.json'),
  JSON.stringify(iae, null, 2) + '\n'
)
fs.writeFileSync(
  path.join(DATA_DIR, 'book5_cfm.json'),
  JSON.stringify(cfm, null, 2) + '\n'
)

// Placeholders for engines without questions yet
if (!fs.existsSync(path.join(DATA_DIR, 'book5_pw.json'))) {
  fs.writeFileSync(path.join(DATA_DIR, 'book5_pw.json'), '[]\n')
}
if (!fs.existsSync(path.join(DATA_DIR, 'book5_leap.json'))) {
  fs.writeFileSync(path.join(DATA_DIR, 'book5_leap.json'), '[]\n')
}

console.log('=== book5.json split ===')
console.log(`Total questions processed: ${questions.length}`)
console.log(`  IAE only:               ${iaeOnly}`)
console.log(`  CFM only:               ${cfmOnly}`)
console.log(`  Both engines (dup):     ${bothBoth}`)
console.log(`  Generic/neither (dup):  ${generic}`)
console.log('---')
console.log(`book5_iae.json:  ${iae.length} questions`)
console.log(`book5_cfm.json:  ${cfm.length} questions`)
console.log(`book5_pw.json:   placeholder (empty array)`)
console.log(`book5_leap.json: placeholder (empty array)`)
console.log('book5.json preserved as backup.')
