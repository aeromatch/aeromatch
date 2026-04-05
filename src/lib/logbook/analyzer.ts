/**
 * Análisis de logbook vía Anthropic: texto extraído localmente con pdf-parse (ver process route).
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

const MAX_CHUNK_CHARS = 350_000

function chunkText(fullText: string): string[] {
  if (fullText.length <= MAX_CHUNK_CHARS) return [fullText]
  const chunks: string[] = []
  for (let i = 0; i < fullText.length; i += MAX_CHUNK_CHARS) {
    chunks.push(fullText.slice(i, i + MAX_CHUNK_CHARS))
  }
  return chunks
}

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

function parseClaudeJson(clean: string): LogbookAnalysisResult {
  const parsed = JSON.parse(clean) as LogbookAnalysisResult
  return normalizeEntries(parsed)
}

async function callClaudeForChunk(
  textChunk: string,
  numPages: number,
  chunkIndex: number,
  chunkTotal: number
): Promise<LogbookAnalysisResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY is not configured')
  }

  const model =
    process.env.ANTHROPIC_MODEL ||
    process.env.ANTHROPIC_LOGBOOK_MODEL ||
    'claude-sonnet-4-20250514'

  const userBody =
    chunkTotal > 1
      ? `Fragmento ${chunkIndex} de ${chunkTotal} del texto extraído del PDF (~${numPages} páginas). Extrae TODAS las entradas de mantenimiento visibles en este fragmento. Si no hay filas de logbook aquí, devuelve "entries": [].\n\n---\n${textChunk}\n---`
      : `Texto extraído del PDF de logbook (${numPages} páginas). Analiza y devuelve el JSON según las instrucciones del sistema.\n\n---\n${textChunk}\n---`

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model,
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

function mergeChunkResults(
  parts: LogbookAnalysisResult[],
  numPages: number
): LogbookAnalysisResult {
  const base = parts[0]
  const entries = parts.flatMap((p) => (Array.isArray(p.entries) ? p.entries : []))
  return normalizeEntries({
    ...base,
    pages_detected: numPages,
    entries,
    summary: {
      ...base.summary,
      total_entries: entries.length,
    },
  })
}

/** Analiza texto ya extraído del PDF (pdf-parse en process). */
export async function analyzeLogbookWithClaude(input: {
  fullText: string
  numPages: number
}): Promise<LogbookAnalysisResult> {
  const chunks = chunkText(input.fullText)
  console.log('Texto total a analizar:', input.fullText.length, 'caracteres')
  console.log('Número de chunks:', chunks?.length ?? 1)

  if (chunks.length === 1) {
    const parsed = await callClaudeForChunk(chunks[0], input.numPages, 1, 1)
    parsed.pages_detected = input.numPages
    return normalizeEntries(parsed)
  }

  const parts: LogbookAnalysisResult[] = []
  for (let i = 0; i < chunks.length; i++) {
    const part = await callClaudeForChunk(chunks[i], input.numPages, i + 1, chunks.length)
    parts.push(part)
  }
  return mergeChunkResults(parts, input.numPages)
}
