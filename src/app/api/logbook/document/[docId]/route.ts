import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { deleteLogbookSourceById, findSourceIdForDocument } from '@/lib/logbook/deleteSource'
import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ docId: string }> }
) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { docId } = await params
  const serviceSupabase = createServiceClient()

  const { data: doc, error: docErr } = await supabase
    .from('documents')
    .select('id, storage_path')
    .eq('id', docId)
    .eq('technician_id', user.id)
    .maybeSingle()

  if (docErr || !doc) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const linkedSourceId = await findSourceIdForDocument(serviceSupabase, user.id, doc)
  if (linkedSourceId) {
    const result = await deleteLogbookSourceById(serviceSupabase, user.id, linkedSourceId)
    if ('error' in result) {
      if (result.error === 'Not found') {
        return NextResponse.json({ error: 'Not found' }, { status: 404 })
      }
      return NextResponse.json({ error: result.error }, { status: 500 })
    }
    return NextResponse.json({ ok: true })
  }

  const { error: rmErr } = await serviceSupabase.storage.from('documents').remove([doc.storage_path])
  if (rmErr) {
    console.error('logbook document delete storage:', rmErr.message)
  }

  const { error: delErr } = await serviceSupabase.from('documents').delete().eq('id', docId)
  if (delErr) {
    return NextResponse.json({ error: delErr.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
