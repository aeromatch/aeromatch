import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 401 })
    }

    // Verify user is a company
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'company') {
      return NextResponse.json({ error: 'Only companies can view AMX summaries' }, { status: 403 })
    }

    // Get technician data
    const { data: technician, error: techError } = await supabase
      .from('technicians')
      .select(`
        user_id,
        license_category,
        aircraft_types,
        specialties,
        own_tools,
        right_to_work_uk,
        uk_license,
        languages,
        years_experience,
        contract_type_preference,
        verification_status,
        availability_status,
        verified_at
      `)
      .eq('user_id', id)
      .single()

    if (techError || !technician) {
      return NextResponse.json({ error: 'Technician not found' }, { status: 404 })
    }

    // Get documents for verification checklist
    const { data: documents } = await supabase
      .from('documents')
      .select('doc_type, status, created_at')
      .eq('technician_id', id)

    // Build verification checklist
    const docTypes = documents?.map(d => d.doc_type) || []
    const verifiedDocs = documents?.filter(d => d.status === 'verified') || []
    const uploadedDocs = documents?.filter(d => d.status === 'uploaded' || d.status === 'pending_verification') || []

    // License documents
    const hasLicense = docTypes.some(dt => ['easa_license', 'uk_license', 'faa_ap'].includes(dt))
    const licenseVerified = verifiedDocs.some(d => ['easa_license', 'uk_license', 'faa_ap'].includes(d.doc_type))

    // Type ratings documents
    const aircraftDocs: { aircraft: string; theory: string; practical: string }[] = []
    for (const aircraft of technician.aircraft_types || []) {
      const theoryKey = `type_${aircraft.toLowerCase()}_theory`
      const practicalKey = `type_${aircraft.toLowerCase()}_practical`
      
      const theoryDoc = documents?.find(d => d.doc_type === theoryKey)
      const practicalDoc = documents?.find(d => d.doc_type === practicalKey)
      
      aircraftDocs.push({
        aircraft,
        theory: theoryDoc?.status === 'verified' ? 'verified' : 
                theoryDoc?.status ? 'pending' : 'missing',
        practical: practicalDoc?.status === 'verified' ? 'verified' :
                   practicalDoc?.status ? 'pending' : 'missing'
      })
    }

    // Build AMX summary
    const summary = {
      amxId: `AMX-${id.substring(0, 8).toUpperCase()}`,
      generatedAt: new Date().toISOString(),
      
      // Verification status
      verificationStatus: technician.verification_status || 'unverified',
      availabilityStatus: technician.availability_status || 'hidden',
      verifiedAt: technician.verified_at,
      isVerified: technician.verification_status === 'verified',
      
      // Capabilities
      licenses: technician.license_category || [],
      aircraftTypes: technician.aircraft_types || [],
      specialties: technician.specialties || [],
      languages: technician.languages || [],
      
      // Experience
      yearsExperience: technician.years_experience,
      contractPreference: technician.contract_type_preference || 'both',
      
      // Operational flags
      ownTools: technician.own_tools || false,
      rightToWorkUk: technician.right_to_work_uk || false,
      ukLicense: technician.uk_license || false,
      
      // Verification checklist
      verificationChecklist: {
        license: {
          status: licenseVerified ? 'verified' : hasLicense ? 'pending' : 'missing',
          label: 'Aviation License (EASA/UK/FAA)'
        },
        aircraftRatings: aircraftDocs,
        documentsTotal: documents?.length || 0,
        documentsVerified: verifiedDocs.length,
        documentsPending: uploadedDocs.length
      }
    }

    return NextResponse.json({ summary })
  } catch (error: any) {
    console.error('AMX Summary error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}


