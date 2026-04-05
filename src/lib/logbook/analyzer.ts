/**
 * Análisis de logbook vía Anthropic:
 * - PDF con texto extraíble → Claude con texto (barato).
 * - PDF escaneado (sin texto) → Claude con PDF base64 (visión nativa).
 * pdf-parse solo se usa para decidir el modo, no como única extracción.
 */

const SYSTEM_PROMPT = `Eres un sistema especializado en análisis de logbooks de mantenimiento aeronáutico EASA Part-66. Recibes un PDF exportado de un sistema MRO y debes extraer datos estructurados.

PASO 1 — CLASIFICACIÓN (obligatorio, hazlo antes de extraer cualquier dato):

Identifica el sistema de origen buscando estas señales en el texto:

AMOS_EXPERIENCE_REPORT:
- Contiene "Experience Report" en el header
- Footer: "produced by AMOS www.swiss-as.com" o "Designed by [Aerolínea] Avionics"
- Columnas: User Id | WO / Task-No. | Description | AC | AC Type | ATA Chapter | Duration | Date | Scope | Skill
- Tiene resumen de horas en la cabecera: "Total Hours:", "Workorder Hours:", "Taskcard Hours:"

AMOS_WO_SUMMARY:
- Contiene "WO-Summary" en el header
- Footer: "produced by www.swiss-as.com AMOS"
- Header con nombre técnico: "LOGBOOK [NOMBRE]" y código usuario

TRAX:
- Contiene "TRAX" en header o footer
- O exportado con marca SMA/TRAX

EASA_MANUAL:
- Formato EASA estándar con columnas numeradas de fecha, registro, ATA, etc.

NOT_A_LOGBOOK:
- Carta de empleo, licencia sola, Part-145 sin registro de trabajo, etc.

UNKNOWN:
- No reconoces el formato con confianza

PASO 2 — EXTRACCIÓN:

Para cada entrada: entry_date, ac_registration, ac_type_raw, ac_type, ata_chapter (solo número sin ceros a la izquierda), ata_description, wo_number, description (max 200 chars), duration_hours, location (IATA), skill_level.

NORMALIZACIÓN ac_type (ejemplos): A320 family, A330, B737 NG, Boeing 787 Dreamliner, ATR 72.

NORMALIZACIÓN ATA: usar descripciones ATA 100 en español cuando sea posible.

duration_hours: decimal; HH:MM → decimal. Si no hay duración, null.

wo_number: si falta, construye "FECHA-ATA" único (ej. 2024-03-15-32).

PASO 3 — RESUMEN en summary: total_entries, total_hours, date_from, date_to, pages_detected.

FORMATO DE RESPUESTA: ÚNICAMENTE JSON válido, sin markdown.

Estructura logbook reconocido:
{
  "source_system": "AMOS_EXPERIENCE_REPORT",
  "source_system_label": "AMOS (Vueling)",
  "extraction_confidence": 0.95,
  "technician_name": "",
  "mro_operator": "",
  "pages_detected": 1,
  "summary": {
    "total_entries": 0,
    "total_hours": null,
    "date_from": "YYYY-MM-DD",
    "date_to": "YYYY-MM-DD"
  },
  "entries": []
}

NOT_A_LOGBOOK:
{
  "source_system": "NOT_A_LOGBOOK",
  "source_system_label": "Documento no reconocido",
  "extraction_confidence": 0,
  "document_notes": "",
  "entries": []
}`

const MAX_TEXT_CHARS_SINGLE = 120_000

/** Modelo fijo logBook360 (modo texto y visión). Sin variables de entorno. */
const LOGBOOK360_MODEL = 'claude-opus-4-5'

export type LogbookAnalysisResult = {
  source_system: string
  source_system_label?: string
  extraction_confidence?: number
  technician_name?: string
  mro_operator?: string
  pages_detected?: number
  document_notes?: string
  summary?: {
    total_entries?: number
    total_hours?: number | null
    date_from?: string
    date_to?: string
  }
  entries: Array<{
    entry_date: string
    ac_registration?: string | null
    ac_type?: string | null
    ac_type_raw?: string | null
    ata_chapter?: string | null
    ata_description?: string | null
    wo_number?: string | null
    description?: string | null
    duration_hours?: number | null
    location?: string | null
    skill_level?: string | null
  }>
}

function normalizeEntries(parsed: LogbookAnalysisResult): LogbookAnalysisResult {
  if (!parsed.entries || !Array.isArray(parsed.entries)) {
    parsed.entries = []
  }
  parsed.entries = parsed.entries.map((e) => ({
    ...e,
    entry_date: e.entry_date != null ? String(e.entry_date) : '',
    ata_chapter:
      e.ata_chapter !== undefined && e.ata_chapter !== null ? String(e.ata_chapter) : null,
    wo_number: e.wo_number !== undefined && e.wo_number !== null ? String(e.wo_number) : null,
    duration_hours:
      e.duration_hours !== undefined && e.duration_hours !== null
        ? Number(e.duration_hours) || null
        : null,
  }))
  return parsed
}

async function parsePdfBuffer(buffer: Buffer): Promise<{ text: string; numpages: number }> {
  const pdfParse = (await import('pdf-parse/lib/pdf-parse.js')) as unknown as (
    b: Buffer
  ) => Promise<{ text: string; numpages: number }>
  return pdfParse(buffer).catch(() => ({ text: '', numpages: 0 }))
}

function splitIntoChunks(text: string, maxChars: number): string[] {
  const chunks: string[] = []
  let remaining = text
  while (remaining.length > 0) {
    if (remaining.length <= maxChars) {
      chunks.push(remaining)
      break
    }
    let cutPoint = remaining.lastIndexOf('\n', maxChars)
    if (cutPoint === -1 || cutPoint < maxChars * 0.5) cutPoint = maxChars
    chunks.push(remaining.substring(0, cutPoint))
    remaining = remaining.substring(cutPoint)
  }
  return chunks
}

function mergeChunkResults(parts: LogbookAnalysisResult[], totalPages: number): LogbookAnalysisResult {
  if (parts.length === 0) {
    throw new Error('mergeChunkResults: no parts')
  }
  const first = parts[0]
  const allEntries = parts.flatMap((r) => (Array.isArray(r.entries) ? r.entries : []))
  return normalizeEntries({
    ...first,
    pages_detected: totalPages,
    summary: {
      ...first.summary,
      total_entries: allEntries.length,
      date_from: allEntries[0]?.entry_date || first.summary?.date_from,
      date_to: allEntries[allEntries.length - 1]?.entry_date || first.summary?.date_to,
    },
    entries: allEntries,
  })
}

function parseClaudeJson(clean: string): LogbookAnalysisResult {
  const parsed = JSON.parse(clean) as LogbookAnalysisResult
  return normalizeEntries(parsed)
}

async function callClaudeText(
  textChunk: string,
  totalPages: number,
  chunkIndex = 1,
  chunkTotal = 1
): Promise<LogbookAnalysisResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY is not configured')
  }

  const userBody =
    chunkTotal > 1
      ? `Fragmento ${chunkIndex} de ${chunkTotal} del texto extraído del PDF (~${totalPages} páginas). Extrae TODAS las entradas de mantenimiento visibles en este fragmento. Si no hay filas de logbook aquí, devuelve "entries": [].\n\n---\n${textChunk}\n---`
      : `Texto extraído del PDF de logbook (${totalPages} páginas). Analiza y devuelve el JSON según las instrucciones del sistema.\n\n---\n${textChunk}\n---`

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: LOGBOOK360_MODEL,
      max_tokens: 16000,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: [{ type: 'text', text: userBody }],
        },
      ],
    }),
  })

  if (!response.ok) {
    const err = await response.text()
    throw new Error(`Anthropic API error ${response.status}: ${err}`)
  }

  const data = (await response.json()) as {
    content: Array<{ type: string; text?: string }>
  }
  const block = data.content?.[0]
  const text = block?.type === 'text' ? block.text || '' : ''
  const clean = text
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim()

  try {
    return parseClaudeJson(clean)
  } catch {
    throw new Error(`JSON parse failed. Snippet: ${clean.substring(0, 500)}`)
  }
}

async function callClaudeVision(base64PDF: string, totalPages: number): Promise<LogbookAnalysisResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY is not configured')
  }

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: LOGBOOK360_MODEL,
      max_tokens: 64000,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'document',
              source: {
                type: 'base64',
                media_type: 'application/pdf',
                data: base64PDF,
              },
            },
            {
              type: 'text',
              text: `Este PDF tiene ${totalPages} páginas y es un logbook escaneado o con poco texto extraíble. Analiza visualmente todas las páginas y extrae TODAS las entradas de mantenimiento que veas. Devuelve el JSON estructurado según las instrucciones.`,
            },
          ],
        },
      ],
    }),
  })

  if (!response.ok) {
    const err = await response.text()
    throw new Error(`Anthropic API vision error ${response.status}: ${err}`)
  }

  const data = (await response.json()) as {
    content: Array<{ type: string; text?: string }>
    usage?: unknown
  }
  if (data.usage) {
    console.log('Claude vision usage:', data.usage)
  }

  const block = data.content?.[0]
  const raw = block?.type === 'text' ? block.text || '' : ''
  const clean = raw
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim()

  try {
    const parsed = JSON.parse(clean) as LogbookAnalysisResult
    if (!parsed.entries || !Array.isArray(parsed.entries)) {
      parsed.entries = []
    }
    parsed.entries = parsed.entries.map((e) => ({
      ...e,
      entry_date: e.entry_date != null ? String(e.entry_date) : '',
      ata_chapter:
        e.ata_chapter !== undefined && e.ata_chapter !== null ? String(e.ata_chapter) : null,
      wo_number: e.wo_number !== undefined && e.wo_number !== null ? String(e.wo_number) : null,
      duration_hours:
        e.duration_hours !== undefined && e.duration_hours !== null
          ? Number(e.duration_hours) || null
          : null,
    }))
    console.log('Entradas extraídas por visión:', parsed.entries.length)
    return normalizeEntries(parsed)
  } catch {
    throw new Error(`JSON parse failed: ${clean.substring(0, 500)}`)
  }
}

/**
 * Analiza un PDF en base64: modo texto (pdf-parse + Claude texto) o visión (PDF binario a Claude).
 */
export async function analyzeLogbookWithClaude(base64PDF: string): Promise<LogbookAnalysisResult> {
  const buffer = Buffer.from(base64PDF, 'base64')
  const parsed = await parsePdfBuffer(buffer)
  const strippedLen = parsed.text.replace(/\s/g, '').length
  const hasText = strippedLen > 200
  const totalPages = parsed.numpages || 0

  console.log(
    'PDF pages:',
    totalPages,
    '| extractable text chars (no ws):',
    strippedLen,
    '| mode:',
    hasText ? 'TEXT' : 'VISION'
  )

  if (hasText) {
    const fullText = parsed.text
    if (fullText.length <= MAX_TEXT_CHARS_SINGLE) {
      const out = await callClaudeText(fullText, totalPages, 1, 1)
      out.pages_detected = totalPages
      return normalizeEntries(out)
    }
    const chunks = splitIntoChunks(fullText, MAX_TEXT_CHARS_SINGLE)
    const results: LogbookAnalysisResult[] = []
    for (let i = 0; i < chunks.length; i++) {
      const result = await callClaudeText(chunks[i], totalPages, i + 1, chunks.length)
      results.push(result)
    }
    return mergeChunkResults(results, totalPages)
  }

  console.log('PDF escaneado o sin texto extraíble, usando visión de Claude')
  const out = await callClaudeVision(base64PDF, totalPages)
  out.pages_detected = totalPages || out.pages_detected
  return normalizeEntries(out)
}

/** Solo para diagnóstico / otras rutas que necesiten texto local. */
export async function extractTextFromPDF(buffer: Buffer): Promise<{ text: string; pages: number }> {
  const data = await parsePdfBuffer(buffer)
  return { text: data.text, pages: data.numpages }
}
