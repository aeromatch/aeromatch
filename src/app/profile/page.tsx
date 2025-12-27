import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { MyProfileView } from '@/components/profile/MyProfileView'

export default async function MyProfilePage() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/auth')
  }

  // Get profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'technician') {
    redirect('/dashboard')
  }

  // Get technician data
  const { data: technician } = await supabase
    .from('technicians')
    .select('*')
    .eq('user_id', user.id)
    .single()

  // Get documents
  const { data: documents } = await supabase
    .from('documents')
    .select('*')
    .eq('technician_id', user.id)

  // Get availability slots
  const { data: slots } = await supabase
    .from('availability_slots')
    .select('id, start_date, end_date')
    .eq('technician_id', user.id)
    .gte('end_date', new Date().toISOString().split('T')[0])
    .order('start_date', { ascending: true })

  return (
    <MyProfileView
      profile={profile}
      technician={technician}
      documents={documents || []}
      availabilitySlots={slots || []}
    />
  )
}

