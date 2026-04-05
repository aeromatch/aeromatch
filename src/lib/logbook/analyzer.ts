/**
 * Análisis de logbook vía Anthropic  (deploy-force 2025-04-05T2)
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

const MAX_TEXT_CHARS_SINGLE = 30_000

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

const PAGES_PER_VISION_CHUNK = 15
const VISION_MAX_TOKENS = 16000

function salvageTruncatedJson(raw: string): Record<string, unknown> | null {
  const lastBoundary = raw.lastIndexOf('},{')
  if (lastBoundary === -1) return null
  const truncated = raw.substring(0, lastBoundary + 1) + ']}'
  try {
    const parsed = JSON.parse(truncated) as Record<string, unknown>
    const count = Array.isArray(parsed.entries) ? parsed.entries.length : 0
    console.log(`JSON truncado recuperado: ${count} entradas rescatadas`)
    return parsed
  } catch {
    return null
  }
}

/** Parsea JSON de una respuesta de visión (objeto completo o solo `{ "entries": [...] }`). */
function parseVisionResponseJson(clean: string): LogbookAnalysisResult {
  let parsed: Record<string, unknown>
  try {
    parsed = JSON.parse(clean) as Record<string, unknown>
  } catch {
    console.log('JSON parse error, intentando recuperar JSON truncado...')
    console.log('Raw (500 chars):', clean.substring(0, 500))
    const salvaged = salvageTruncatedJson(clean)
    if (salvaged) {
      parsed = salvaged
    } else {
      throw new Error(`JSON parse failed (no recuperable): ${clean.substring(0, 200)}`)
    }
  }
  if (!parsed.entries || !Array.isArray(parsed.entries)) {
    parsed.entries = []
  }
  const entries = (parsed.entries as LogbookAnalysisResult['entries']).map((e) => ({
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
  const out: LogbookAnalysisResult = {
    source_system: (parsed.source_system as string) || 'UNKNOWN',
    source_system_label: parsed.source_system_label as string | undefined,
    extraction_confidence: parsed.extraction_confidence as number | undefined,
    technician_name: parsed.technician_name as string | undefined,
    mro_operator: parsed.mro_operator as string | undefined,
    pages_detected: parsed.pages_detected as number | undefined,
    document_notes: parsed.document_notes as string | undefined,
    summary: parsed.summary as LogbookAnalysisResult['summary'],
    entries,
  }
  return normalizeEntries(out)
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
      max_tokens: 8000,
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
    usage?: { input_tokens?: number; output_tokens?: number }
    stop_reason?: string
  }
  process.stdout.write(`[callClaudeText] chunk ${chunkIndex}/${chunkTotal} stop_reason: ${data.stop_reason} output_tokens: ${data.usage?.output_tokens}\n`)
  const block = data.content?.[0]
  const text = block?.type === 'text' ? block.text || '' : ''
  const clean = text
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim()

  if (data.stop_reason === 'max_tokens') {
    process.stdout.write('[callClaudeText] TRUNCADO — intentando salvage\n')
    const salvaged = salvageTruncatedJson(clean)
    if (salvaged) {
      return normalizeEntries({
        source_system: (salvaged.source_system as string) || 'UNKNOWN',
        entries: Array.isArray(salvaged.entries) ? (salvaged.entries as LogbookAnalysisResult['entries']) : [],
        summary: salvaged.summary as LogbookAnalysisResult['summary'],
        source_system_label: salvaged.source_system_label as string | undefined,
        technician_name: salvaged.technician_name as string | undefined,
        mro_operator: salvaged.mro_operator as string | undefined,
        pages_detected: salvaged.pages_detected as number | undefined,
      })
    }
  }

  try {
    return parseClaudeJson(clean)
  } catch {
    const lastBoundary = clean.lastIndexOf('},{')
    if (lastBoundary !== -1) {
      try {
        const truncated = clean.substring(0, lastBoundary + 1) + ']}'
        const recovered = JSON.parse(truncated) as LogbookAnalysisResult
        console.log('callClaudeText: JSON truncado recuperado,',
          recovered.entries?.length, 'entradas')
        return normalizeEntries(recovered)
      } catch {
        // no se pudo recuperar
      }
    }
    throw new Error(`JSON parse failed. Snippet: ${clean.substring(0, 500)}`)
  }
}

async function callClaudeVision(
  base64PDF: string,
  totalPages: number,
  customPrompt?: string,
  maxTokensOverride?: number
): Promise<LogbookAnalysisResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY is not configured')
  }

  const tokensToUse = maxTokensOverride ?? VISION_MAX_TOKENS
  process.stdout.write(`[callClaudeVision] max_tokens: ${tokensToUse}\n`)

  const prompt =
    customPrompt?.trim() ||
    `Analiza este logbook de ${totalPages} páginas y extrae TODAS las entradas. Devuelve el JSON estructurado según el system prompt.`

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: LOGBOOK360_MODEL,
      max_tokens: tokensToUse,
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
              text: prompt,
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
    usage?: { input_tokens?: number; output_tokens?: number }
    stop_reason?: string
  }
  process.stdout.write(`VISION stop_reason: ${data.stop_reason}\n`)
  process.stdout.write(`VISION output_tokens: ${data.usage?.output_tokens}\n`)
  if (data.usage) {
    process.stdout.write(`VISION input_tokens: ${data.usage.input_tokens}\n`)
  }
  if (data.stop_reason === 'max_tokens') {
    process.stdout.write('VISION TRUNCADA por max_tokens\n')
  }

  const block = data.content?.[0]
  const raw = block?.type === 'text' ? block.text || '' : ''
  process.stdout.write(`VISION raw length: ${raw.length}\n`)
  const clean = raw
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim()

  return parseVisionResponseJson(clean)
}

async function callClaudeVisionPaginated(
  base64PDF: string,
  totalPages: number
): Promise<LogbookAnalysisResult> {
  const pageCount = Math.max(totalPages, 1)
  const totalChunks = Math.max(1, Math.ceil(pageCount / PAGES_PER_VISION_CHUNK))

  console.log('INICIANDO PAGINACIÓN:', totalChunks, 'bloques')
  console.log(`Procesando PDF en ${totalChunks} bloque(s) de hasta ${PAGES_PER_VISION_CHUNK} páginas`)

  let sourceInfo: LogbookAnalysisResult | null = null
  const allEntries: LogbookAnalysisResult['entries'] = []

  for (let chunk = 0; chunk < totalChunks; chunk++) {
    const pageFrom = chunk * PAGES_PER_VISION_CHUNK + 1
    const pageTo = Math.min((chunk + 1) * PAGES_PER_VISION_CHUNK, pageCount)
    const isFirst = chunk === 0

    console.log(`Bloque visión ${chunk + 1}/${totalChunks}: páginas ${pageFrom}-${pageTo}`)

    const prompt = isFirst
      ? `Este PDF tiene ${totalPages || pageCount} páginas en total.
Analiza las páginas ${pageFrom} a ${pageTo}.
Extrae la información del técnico y TODAS las entradas de mantenimiento visibles en estas páginas.
Devuelve el JSON completo con source_system, source_system_label, technician_name, mro_operator, summary y entries.`
      : `Continúa extrayendo entradas del mismo logbook.
Analiza las páginas ${pageFrom} a ${pageTo}.
Devuelve SOLO el objeto JSON con el array entries con las entradas de estas páginas. Sin repetir source_system si no aplica; el formato debe ser: {"entries":[...]} .`

    const chunkTokens = isFirst ? 4000 : VISION_MAX_TOKENS
    process.stdout.write(`Bloque ${chunk + 1} → max_tokens: ${chunkTokens}\n`)
    const result = await callClaudeVision(base64PDF, totalPages, prompt, chunkTokens)

    if (isFirst) {
      sourceInfo = result
      if (result.entries?.length) {
        allEntries.push(...result.entries)
      }
    } else if (result.entries?.length) {
      allEntries.push(...result.entries)
    }

    console.log(
      `Bloque ${chunk + 1}: ${result.entries?.length || 0} entradas. Total acumulado: ${allEntries.length}`
    )

    if (chunk < totalChunks - 1) {
      await new Promise((resolve) => setTimeout(resolve, 1000))
    }
  }

  const base = sourceInfo ?? ({
    source_system: 'UNKNOWN',
    entries: [],
  } as LogbookAnalysisResult)

  const sortedEntries = [...allEntries].sort((a, b) =>
    (b.entry_date || '').localeCompare(a.entry_date || '')
  )

  const totalHours = sortedEntries.reduce(
    (sum, e) => sum + (Number(e.duration_hours) || 0),
    0
  )

  return normalizeEntries({
    ...base,
    pages_detected: totalPages || pageCount,
    summary: {
      ...base.summary,
      total_entries: sortedEntries.length,
      total_hours: Math.round(totalHours * 10) / 10,
      date_from:
        sortedEntries[sortedEntries.length - 1]?.entry_date || base.summary?.date_from || undefined,
      date_to: sortedEntries[0]?.entry_date || base.summary?.date_to || undefined,
    },
    entries: sortedEntries,
  })
}

/**
 * Analiza un PDF en base64: modo texto (pdf-parse + Claude texto) o visión (PDF binario a Claude).
 */
export async function analyzeLogbookWithClaude(base64PDF: string): Promise<LogbookAnalysisResult> {
  process.stdout.write('=== ANALYZER VERSION 5 STDOUT ===\n')
  console.log('=== ANALYZER VERSION 5 - VISION PAGINATED FIX ===')
  const buffer = Buffer.from(base64PDF, 'base64')
  const parsed = await parsePdfBuffer(buffer)
  const strippedLen = parsed.text.replace(/\s/g, '').length
  const hasText = strippedLen > 500

  const pdfSizeKB = Math.round(buffer.length / 1024)
  const parsedPages = parsed.numpages || 0
  const estimatedPages = Math.max(1, Math.round(pdfSizeKB / 100))
  const totalPages = parsedPages > 0 ? parsedPages : estimatedPages

  console.log('PDF size:', pdfSizeKB, 'KB')
  console.log('Chars sin espacios:', strippedLen)
  console.log('Pages pdf-parse:', parsedPages, '| estimadas:', estimatedPages, '| usadas:', totalPages)
  console.log('Modo seleccionado:', hasText ? 'TEXT' : 'VISION_PAGINATED')

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
      if (result.entries?.length) {
        results.push(result)
      }
    }
    if (results.length === 0) {
      const fallback = await callClaudeText(chunks[0]!, totalPages, 1, chunks.length)
      fallback.pages_detected = totalPages
      return normalizeEntries(fallback)
    }
    return mergeChunkResults(results, totalPages)
  }

  console.log('→ Rama hasText=false: ejecutando callClaudeVisionPaginated (no una sola callClaudeVision)')
  return callClaudeVisionPaginated(base64PDF, totalPages)
}

/** Solo para diagnóstico / otras rutas que necesiten texto local. */
export async function extractTextFromPDF(buffer: Buffer): Promise<{ text: string; pages: number }> {
  const data = await parsePdfBuffer(buffer)
  return { text: data.text, pages: data.numpages }
}
