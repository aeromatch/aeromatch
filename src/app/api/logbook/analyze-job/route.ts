import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

/** Inicia el procesamiento asíncrono de un job (tras subir PDF). */
export async function POST(req: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json().catch(() => ({}))
  const jobId = body.job_id as string | undefined
  if (!jobId) {
    return NextResponse.json({ error: 'job_id required' }, { status: 400 })
  }

  const { data: job, error } = await supabase
    .from('logbook_jobs')
    .select('id, technician_id, storage_path, status')
    .eq('id', jobId)
    .eq('technician_id', user.id)
    .single()

  if (error || !job?.storage_path) {
    return NextResponse.json({ error: 'Job not found' }, { status: 404 })
  }

  if (job.status === 'processing') {
    return NextResponse.json({ ok: true, job_id: job.id, status: 'processing' })
  }

  const base = (process.env.NEXT_PUBLIC_APP_URL || '').replace(/\/$/, '')
  if (!base) {
    return NextResponse.json({ error: 'NEXT_PUBLIC_APP_URL not configured' }, { status: 500 })
  }

  const secret = process.env.CRON_SECRET
  if (!secret) {
    return NextResponse.json({ error: 'CRON_SECRET not configured' }, { status: 500 })
  }

  fetch(`${base}/api/logbook/process`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${secret}`,
    },
    body: JSON.stringify({ job_id: job.id, storage_path: job.storage_path }),
  }).catch((e) => console.error('logbook process trigger', e))

  return NextResponse.json({ ok: true, job_id: job.id, status: 'pending' })
}
