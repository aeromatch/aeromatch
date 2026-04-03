import fs from 'node:fs'
import path from 'node:path'

function usage() {
  console.log('Usage: node scripts/fix-simulator-book-json.mjs <file> <bookId> <phase> [--force]')
  process.exit(1)
}

const [, , fileArg, bookId, phase] = process.argv
const force = process.argv.includes('--force')
if (!fileArg || !bookId || !phase) usage()

const filePath = path.resolve(process.cwd(), fileArg)
const raw = fs.readFileSync(filePath, 'utf8')

let data
try {
  data = JSON.parse(raw)
} catch (e) {
  console.error('Invalid JSON:', e?.message || e)
  process.exit(2)
}

if (!Array.isArray(data)) {
  console.error('Expected top-level JSON array.')
  process.exit(3)
}

let changed = 0
const out = data.map((q) => {
  if (!q || typeof q !== 'object') return q
  const next = { ...q }
  if (force || typeof next.book !== 'string' || next.book.trim() === '') {
    next.book = bookId
    changed++
  }
  if (force || typeof next.phase !== 'string' || next.phase.trim() === '') {
    next.phase = phase
    changed++
  }
  return next
})

fs.writeFileSync(filePath, JSON.stringify(out, null, 2) + '\n', 'utf8')
console.log(`OK. Updated ${filePath}. Fields added/filled: ${changed}`)

