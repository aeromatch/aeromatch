import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { DashboardView } from '@/components/dashboard/DashboardView'

export default async function DashboardPage() {
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

  if (!profile) {
    redirect('/onboarding/role')
  }

  // Redirect to onboarding only if not completed
  // For technicians: simplified onboarding just asks for name
  // For companies: full onboarding with company details
  if (!profile.onboarding_completed) {
    if (profile.role === 'technician') {
      redirect('/onboarding/technician')
    } else if (profile.role === 'company') {
      redirect('/onboarding/company')
    } else {
      redirect('/onboarding/role')
    }
  }

  const isTechnician = profile.role === 'technician'

  // Get additional data based on role
  let technicianData = null
  let companyData = null
  let availabilitySlots: any[] = []
  let pendingRequests: any[] = []

  if (isTechnician) {
    const { data: tech } = await supabase
      .from('technicians')
      .select('*')
      .eq('user_id', user.id)
      .single()
    technicianData = tech

    if (tech) {
      const { data: slots } = await supabase
        .from('availability_slots')
        .select('id, start_date, end_date')
        .eq('technician_id', user.id)
        .gte('end_date', new Date().toISOString().split('T')[0])
        .order('start_date', { ascending: true })
      availabilitySlots = slots || []

      const { data: requests } = await supabase
        .from('job_requests')
        .select('*')
        .eq('technician_id', user.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
      pendingRequests = requests || []
    }
  } else {
    const { data: company } = await supabase
      .from('companies')
      .select('*')
      .eq('user_id', user.id)
      .single()
    companyData = company

    if (company) {
      const { data: requests } = await supabase
        .from('job_requests')
        .select('*')
        .eq('company_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5)
      pendingRequests = requests || []
    }
  }

  return (
    <DashboardView
      profile={profile}
      technician={technicianData}
      company={companyData}
      availabilitySlots={availabilitySlots}
      pendingRequests={pendingRequests}
    />
  )
}
