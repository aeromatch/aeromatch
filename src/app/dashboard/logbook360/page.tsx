import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AppLayout } from '@/components/ui/AppLayout'
import { Logbook360Client } from '@/components/logbook/Logbook360Client'

export default async function LogBook360Page() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/auth')

  const { data: profile } = await supabase
    .from('profiles')
    .select('email, role')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/onboarding/role')
  if (profile.role !== 'technician') redirect('/dashboard')

  const { data: analysis } = await supabase
    .from('logbook_analysis')
    .select('analysis_json, entries_total, last_updated')
    .eq('technician_id', user.id)
    .maybeSingle()

  const { data: logbookDocs } = await supabase
    .from('documents')
    .select('id, file_name, storage_path, created_at')
    .eq('technician_id', user.id)
    .eq('doc_type', 'logbook')
    .order('created_at', { ascending: false })

  return (
    <AppLayout userEmail={profile.email} userRole="technician">
      <Logbook360Client initialAnalysis={analysis} logbookDocs={logbookDocs || []} />
    </AppLayout>
  )
}
