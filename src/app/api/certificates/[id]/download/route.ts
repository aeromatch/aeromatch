import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'
import {
  buildDocumentIntegrityPayload,
  fetchDocumentsRowsForAmxPdf,
} from '@/lib/certificates/finalizeAmxVerification'
import { generateCertificatePdf } from '@/lib/certificates/generatePdf'
import { buildAmxCertificateDocumentRows } from '@/lib/certificates/expectedAmxDocuments'

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim().toLowerCase())

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
    const { id } = await params
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const serviceClient = getServiceClient()
    const isAdmin = ADMIN_EMAILS.includes(user.email?.toLowerCase() || '')

    // Get certificate
    const { data: certificate, error } = await serviceClient
      .from('amx_certificates')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !certificate) {
      return NextResponse.json({ error: 'Certificate not found' }, { status: 404 })
    }

    // Check authorization: admin o el técnico dueño del certificado
    const isOwner = certificate.technician_id === user.id
    if (!isAdmin && !isOwner) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Técnicos: pueden descargar borrador (pending) y revisado (checked), no rechazado
    if (!isAdmin && isOwner) {
      if (certificate.status === 'rejected') {
        return NextResponse.json(
          { error: 'Certificate rejected — download not available' },
          { status: 403 }
        )
      }
      if (certificate.status !== 'pending' && certificate.status !== 'checked') {
        return NextResponse.json(
          { error: 'Certificate not available for download' },
          { status: 403 }
        )
      }
    }

    // Get technician data to regenerate PDF
    const { data: technician } = await serviceClient
      .from('technicians')
      .select('user_id, license_category, aircraft_types, years_experience, is_available, specialties, languages, own_tools, right_to_work_uk, driving_license, experience_amos, experience_trax')
      .eq('user_id', certificate.technician_id)
      .single()

    const { data: profile } = await serviceClient
      .from('profiles')
      .select('full_name')
      .eq('id', certificate.technician_id)
      .single()

    if (!technician) {
      return NextResponse.json({ error: 'Technician not found' }, { status: 404 })
    }

    const certStatus = certificate.status as 'pending' | 'checked' | 'rejected'
    const docRows = await fetchDocumentsRowsForAmxPdf(serviceClient, certificate.technician_id)
    const documentIntegrity = buildDocumentIntegrityPayload(docRows, certStatus)
    const amxDocumentRows = buildAmxCertificateDocumentRows(
      {
        license_category: technician.license_category,
        aircraft_types: technician.aircraft_types,
      },
      docRows.map((d) => ({
        doc_type: d.doc_type,
        status: d.status,
        verified_at: d.verified_at,
      }))
    )

    const pdfBytes = await generateCertificatePdf({
      referenceId: certificate.reference_id,
      certificateId: certificate.id,
      technician: {
        fullName: profile?.full_name || 'Unknown Technician',
        licenseCategory: technician.license_category || [],
        aircraftTypes: technician.aircraft_types || [],
        yearsExperience: technician.years_experience,
        specialties: technician.specialties || [],
        languages: technician.languages || [],
        ownTools: technician.own_tools || false,
        rightToWorkUk: technician.right_to_work_uk || false,
        drivingLicense: technician.driving_license || false,
        isAvailable: technician.is_available || false,
        experienceAmos: !!technician.experience_amos,
        experienceTrax: !!technician.experience_trax,
      },
      documents: docRows.map(d => ({
        docType: d.doc_type,
        status: d.status,
        expiresOn: d.expires_on,
      })),
      amxDocumentRows,
      generatedAt: new Date(certificate.generated_at),
      certificateStatus: certStatus,
      documentIntegrity,
    })

    // Return PDF directly as binary
    return new NextResponse(Buffer.from(pdfBytes), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${certificate.reference_id}.pdf"`,
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        Pragma: 'no-cache',
      },
    })

  } catch (error: any) {
    console.error('Certificate download error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
