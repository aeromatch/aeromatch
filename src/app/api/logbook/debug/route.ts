/**
 * TEMPORAL — diagnóstico PDF. ELIMINAR cuando el problema esté resuelto.
 */
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

/** Misma API que `pdf-parse` por defecto, sin cargar `index.js` (evita ENOENT en build Next). */
import pdfParse from 'pdf-parse/lib/pdf-parse.js'

export const runtime = 'nodejs'

export async function POST(req: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: { storage_path?: string; bucket?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const storage_path = body.storage_path
  const bucketName = typeof body.bucket === 'string' && body.bucket.length > 0 ? body.bucket : 'documents'

  if (!storage_path || typeof storage_path !== 'string') {
    return NextResponse.json({ error: 'storage_path required' }, { status: 400 })
  }

  const { data: fileData, error } = await supabase.storage.from(bucketName).download(storage_path)

  if (error || !fileData) {
    return NextResponse.json(
      {
        error: 'Download failed',
        detail: error?.message,
        tried_bucket: bucketName,
        tried_path: storage_path,
      },
      { status: 400 }
    )
  }

  const buffer = Buffer.from(await fileData.arrayBuffer())

  let parsed: { numpages: number; text: string }
  try {
    parsed = await pdfParse(buffer)
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    return NextResponse.json(
      {
        error: 'pdf-parse failed',
        detail: msg,
        size_mb: (buffer.length / 1024 / 1024).toFixed(2),
      },
      { status: 400 }
    )
  }

  return NextResponse.json({
    size_mb: (buffer.length / 1024 / 1024).toFixed(2),
    pages: parsed.numpages,
    chars: parsed.text.length,
    sample_start: parsed.text.substring(0, 500),
    sample_middle: parsed.text.substring(
      Math.floor(parsed.text.length / 2),
      Math.floor(parsed.text.length / 2) + 500
    ),
    sample_end: parsed.text.substring(parsed.text.length - 500),
  })
}
