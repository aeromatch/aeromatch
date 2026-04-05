import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const formData = await req.formData()
  const file = formData.get('file')
  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: 'No file' }, { status: 400 })
  }

  const sanitized = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
  const storagePath = `logbooks/${user.id}/${Date.now()}-${sanitized}`

  const { error: uploadError } = await supabase.storage.from('documents').upload(storagePath, file)
  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 })
  }

  const { data: job, error: jobError } = await supabase
    .from('logbook_jobs')
    .insert({
      technician_id: user.id,
      source_filename: file.name,
      storage_path: storagePath,
      status: 'pending',
    })
    .select('id, storage_path')
    .single()

  if (jobError || !job) {
    return NextResponse.json({ error: jobError?.message || 'Job create failed' }, { status: 500 })
  }

  return NextResponse.json({
    job_id: job.id,
    storage_path: job.storage_path,
    status: 'pending',
  })
}
