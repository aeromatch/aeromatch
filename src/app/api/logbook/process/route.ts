import { createServiceClient } from '@/lib/supabase/service'
import { analyzeLogbookWithClaude } from '@/lib/logbook/analyzer'
import { mergeEntries } from '@/lib/logbook/merger'
import { recalculateAnalysis } from '@/lib/logbook/aggregator'
import { NextResponse } from 'next/server'
import { PDFParse } from 'pdf-parse'

export const maxDuration = 300
export const runtime = 'nodejs'

export async function POST(req: Request) {
  const auth = req.headers.get('Authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: { job_id?: string; storage_path?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const jobId = body.job_id
  const storagePath = body.storage_path
  if (!jobId || !storagePath) {
    return NextResponse.json({ error: 'job_id and storage_path required' }, { status: 400 })
  }

  const supabase = createServiceClient()

  await supabase
    .from('logbook_jobs')
    .update({ status: 'processing', updated_at: new Date().toISOString() })
    .eq('id', jobId)

  try {
    const { data: job, error: jobErr } = await supabase
      .from('logbook_jobs')
      .select('technician_id, source_filename')
      .eq('id', jobId)
      .single()

    if (jobErr || !job) {
      throw new Error('Job not found')
    }

    const { data: fileData, error: dlError } = await supabase.storage
      .from('documents')
      .download(storagePath)

    if (dlError || !fileData) {
      throw new Error(`Storage download failed: ${dlError?.message || 'no data'}`)
    }

    const arrayBuffer = await fileData.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    console.log('PDF buffer size bytes:', buffer.length)
    console.log('PDF buffer size MB:', (buffer.length / 1024 / 1024).toFixed(2))

    const parser = new PDFParse({ data: buffer })
    let fullText = ''
    let numPages = 0
    try {
      const textResult = await parser.getText()
      fullText = textResult.text ?? ''
      numPages = textResult.total ?? 0
    } finally {
      await parser.destroy()
    }

    console.log('Páginas detectadas:', numPages)
    console.log('Caracteres extraídos:', fullText.length)
    console.log('Muestra texto (primeros 500 chars):', fullText.substring(0, 500))
    console.log('Muestra texto (chars 5000-5500):', fullText.substring(5000, 5500))

    if (fullText.length < 1000) {
      throw new Error(
        `PDF text extraction failed: only ${fullText.length} chars extracted from ${numPages} pages`
      )
    }

    const result = await analyzeLogbookWithClaude({
      fullText,
      numPages,
    })

    await supabase
      .from('logbook_jobs')
      .update({
        source_system: result.source_system,
        source_system_label: result.source_system_label,
        source_pages: result.pages_detected ?? numPages ?? null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', jobId)

    if (result.source_system === 'NOT_A_LOGBOOK') {
      await supabase
        .from('logbook_jobs')
        .update({
          status: 'failed',
          error_message:
            `Documento no reconocido como logbook: ${result.document_notes || '—'}`,
          updated_at: new Date().toISOString(),
        })
        .eq('id', jobId)
      return NextResponse.json({ ok: true, note: 'not_a_logbook' })
    }

    if (!result.entries?.length) {
      await supabase
        .from('logbook_jobs')
        .update({
          status: 'failed',
          error_message: 'No se extrajeron entradas del PDF',
          updated_at: new Date().toISOString(),
        })
        .eq('id', jobId)
      return NextResponse.json({ ok: true, note: 'no_entries' })
    }

    await mergeEntries(result, jobId, job.technician_id, supabase, {
      sourceFilename: job.source_filename,
      sourcePages: result.pages_detected,
    })

    await recalculateAnalysis(job.technician_id, supabase)

    await supabase
      .from('logbook_jobs')
      .update({
        status: 'completed',
        updated_at: new Date().toISOString(),
      })
      .eq('id', jobId)

    return NextResponse.json({ ok: true })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error)
    await supabase
      .from('logbook_jobs')
      .update({
        status: 'failed',
        error_message: msg,
        updated_at: new Date().toISOString(),
      })
      .eq('id', jobId)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
