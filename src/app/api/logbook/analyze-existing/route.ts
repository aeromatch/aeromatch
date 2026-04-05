import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

/** Analiza un PDF ya guardado en `documents` (mismo storage que perfil documentos). */
export async function POST(req: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { storage_path } = await req.json()
  if (!storage_path || typeof storage_path !== 'string') {
    return NextResponse.json({ error: 'storage_path required' }, { status: 400 })
  }

  const { data: doc, error: docErr } = await supabase
    .from('documents')
    .select('id, file_name, storage_path')
    .eq('storage_path', storage_path)
    .eq('technician_id', user.id)
    .maybeSingle()

  if (docErr || !doc) {
    return NextResponse.json({ error: 'Document not found' }, { status: 404 })
  }

  const { data: job, error: jobErr } = await supabase
    .from('logbook_jobs')
    .insert({
      technician_id: user.id,
      source_filename: doc.file_name,
      storage_path: doc.storage_path,
      status: 'pending',
    })
    .select('id')
    .single()

  if (jobErr || !job) {
    return NextResponse.json({ error: jobErr?.message || 'Job failed' }, { status: 500 })
  }

  const base = (process.env.NEXT_PUBLIC_APP_URL || '').replace(/\/$/, '')
  const secret = process.env.CRON_SECRET
  if (!base || !secret) {
    return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 })
  }

  fetch(`${base}/api/logbook/process`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${secret}`,
    },
    body: JSON.stringify({ job_id: job.id, storage_path: doc.storage_path }),
  }).catch((e) => console.error('logbook process', e))

  return NextResponse.json({ job_id: job.id, status: 'pending' })
}
