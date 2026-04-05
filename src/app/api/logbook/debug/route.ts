/**
 * TEMPORAL — diagnóstico PDF (tamaño, páginas, muestras de texto).
 * ELIMINAR esta ruta cuando el problema esté resuelto.
 */
import { createClient } from '@/lib/supabase/server'
import { extractTextFromPDF } from '@/lib/logbook/analyzer'
import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function POST(req: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: { storage_path?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const storagePath = body.storage_path
  if (!storagePath || typeof storagePath !== 'string') {
    return NextResponse.json({ error: 'storage_path required' }, { status: 400 })
  }

  const prefix = `logbooks/${user.id}/`
  if (!storagePath.startsWith(prefix)) {
    return NextResponse.json({ error: 'Invalid storage_path' }, { status: 403 })
  }

  const { data: fileData, error: dlError } = await supabase.storage
    .from('documents')
    .download(storagePath)

  if (dlError || !fileData) {
    return NextResponse.json({ error: dlError?.message || 'Download failed' }, { status: 500 })
  }

  const arrayBuffer = await fileData.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)

  const { text, pages } = await extractTextFromPDF(buffer)
  const len = text.length
  const mid = Math.floor(len / 2)

  return NextResponse.json({
    size_mb: (buffer.length / 1024 / 1024).toFixed(2),
    pages,
    chars: len,
    sample_start: text.substring(0, 500),
    sample_middle: text.substring(mid, mid + 500),
    sample_end: len > 500 ? text.substring(len - 500) : '',
  })
}
