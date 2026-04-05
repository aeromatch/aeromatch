/** Entrada real de pdf-parse@1.x (evita index.js con side-effects). */
declare module 'pdf-parse/lib/pdf-parse.js' {
  import type { Buffer } from 'node:buffer'

  interface PdfParseData {
    numpages: number
    numrender: number
    text: string
    info: unknown
    metadata: unknown
    version: string
  }

  function pdfParse(dataBuffer: Buffer, options?: unknown): Promise<PdfParseData>
  export = pdfParse
}
