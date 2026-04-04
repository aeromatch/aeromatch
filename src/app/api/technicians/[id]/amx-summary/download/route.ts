import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { buildDocumentIntegrityPayload } from '@/lib/certificates/finalizeAmxVerification'
import { generateCertificatePdf } from '@/lib/certificates/generatePdf'

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: technicianId } = await params
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const serviceClient = getServiceClient()

    const { data: actorProfile } = await serviceClient
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const isCompany = actorProfile?.role === 'company'
    const isOwnProfile = user.id === technicianId

    if (!isCompany && !isOwnProfile) {
      return NextResponse.json({ error: 'Only companies or the technician can download this summary' }, { status: 403 })
    }

    const { data: technician, error: techError } = await serviceClient
      .from('technicians')
      .select(`
        user_id,
        license_category,
        aircraft_types,
        specialties,
        languages,
        years_experience,
        contract_type_preference,
        own_tools,
        right_to_work_uk,
        driving_license,
        is_available,
        verification_status
      `)
      .eq('user_id', technicianId)
      .single()

    if (techError || !technician) {
      return NextResponse.json({ error: 'Technician not found' }, { status: 404 })
    }

    const { data: profile } = await serviceClient
      .from('profiles')
      .select('full_name')
      .eq('id', technicianId)
      .single()

    const displayName = isCompany
      ? 'Anonymous — full identity after job offer'
      : (profile?.full_name || 'Unknown Technician')

    const { data: documents } = await serviceClient
      .from('documents')
      .select('doc_type, status, expires_on, file_hash, verified_at')
      .eq('technician_id', technicianId)

    const { data: latestCert } = await serviceClient
      .from('amx_certificates')
      .select('reference_id, status, generated_at')
      .eq('technician_id', technicianId)
      .order('generated_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    const fallbackAmxId = `AMX-${technicianId.substring(0, 8).toUpperCase()}`
    const referenceId = latestCert?.reference_id ?? fallbackAmxId

    const certificateStatus: 'pending' | 'checked' | 'rejected' =
      latestCert?.status === 'checked'
        ? 'checked'
        : latestCert?.status === 'rejected'
          ? 'rejected'
          : 'pending'

    const docRows = documents || []
    const documentIntegrity = buildDocumentIntegrityPayload(docRows, certificateStatus)

    const pdfBytes = await generateCertificatePdf({
      referenceId,
      technician: {
        fullName: displayName,
        licenseCategory: technician.license_category || [],
        aircraftTypes: technician.aircraft_types || [],
        yearsExperience: technician.years_experience,
        specialties: technician.specialties || [],
        languages: technician.languages || [],
        contractPreference: technician.contract_type_preference,
        ownTools: technician.own_tools || false,
        rightToWorkUk: technician.right_to_work_uk || false,
        drivingLicense: technician.driving_license || false,
        isAvailable: technician.is_available || false,
      },
      documents: docRows.map((d) => ({
        docType: d.doc_type,
        status: d.status,
        expiresOn: d.expires_on,
      })),
      generatedAt: latestCert?.generated_at ? new Date(latestCert.generated_at) : new Date(),
      certificateStatus,
      documentIntegrity,
    })

    const safeRef = referenceId.replace(/[^\w.-]+/g, '_')
    const filename = `${safeRef}-summary.pdf`

    return new NextResponse(Buffer.from(pdfBytes), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('AMX Summary download error:', error)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
