/**
 * Análisis de PDF de logbook vía Anthropic Messages API (PDF como documento).
 * Modelo: ANTHROPIC_MODEL (ej. claude-opus-4-5) — configurar en Vercel.
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

export async function analyzeLogbookWithClaude(base64PDF: string): Promise<LogbookAnalysisResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY is not configured')
  }

  const model =
    process.env.ANTHROPIC_MODEL ||
    process.env.ANTHROPIC_LOGBOOK_MODEL ||
    'claude-sonnet-4-20250514'

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
              text: 'Analiza este logbook y devuelve el JSON estructurado según las instrucciones del sistema. Extrae todas las entradas visibles.',
            },
          ],
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
    return JSON.parse(clean) as LogbookAnalysisResult
  } catch {
    throw new Error(`JSON parse failed. Snippet: ${clean.substring(0, 500)}`)
  }
}
