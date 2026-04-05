import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data } = await supabase
    .from('logbook_analysis')
    .select('analysis_json, entries_total, last_updated')
    .eq('technician_id', user.id)
    .maybeSingle()

  return NextResponse.json(data ?? {})
}
