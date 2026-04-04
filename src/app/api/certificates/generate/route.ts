import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { generateCertificatePdf } from '@/lib/certificates/generatePdf'
import { fetchDocumentsRowsForAmxPdf } from '@/lib/certificates/finalizeAmxVerification'
import { buildAmxCertificateDocumentRows } from '@/lib/certificates/expectedAmxDocuments'
import { Resend } from 'resend'

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim().toLowerCase())
const NOTIFICATION_EMAIL = 'raul@aeromatch.eu'

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function POST(request: Request) {
  try {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user || !ADMIN_EMAILS.includes(user.email?.toLowerCase() || '')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const body = await request.json()
    const { technicianId } = body

    if (!technicianId) {
      return NextResponse.json({ error: 'technicianId required' }, { status: 400 })
    }

    const serviceClient = getServiceClient()

    // Check if certificate already exists for this technician
    const { data: existingCert } = await serviceClient
      .from('amx_certificates')
      .select('id, reference_id, status')
      .eq('technician_id', technicianId)
      .order('generated_at', { ascending: false })
      .limit(1)
      .single()

    if (existingCert && existingCert.status === 'pending') {
      return NextResponse.json({ 
        error: 'Certificate already pending for this technician',
        certificate: existingCert
      }, { status: 409 })
    }

    // Get technician data
    const { data: technician, error: techError } = await serviceClient
      .from('technicians')
      .select(
        'user_id, license_category, aircraft_types, years_experience, is_available, specialties, languages, own_tools, right_to_work_uk, driving_license, experience_amos, experience_trax'
      )
      .eq('user_id', technicianId)
      .single()

    if (techError || !technician) {
      return NextResponse.json({ error: 'Technician not found' }, { status: 404 })
    }

    // Get profile data
    const { data: profile } = await serviceClient
      .from('profiles')
      .select('full_name, email')
      .eq('id', technicianId)
      .single()

    const docRowsForPdf = await fetchDocumentsRowsForAmxPdf(serviceClient, technicianId)
    const amxDocumentRows = buildAmxCertificateDocumentRows(
      {
        license_category: technician.license_category,
        aircraft_types: technician.aircraft_types,
      },
      docRowsForPdf.map((d) => ({
        doc_type: d.doc_type,
        status: d.status,
        verified_at: d.verified_at,
      }))
    )

    // Generate reference ID using database function
    const { data: refData, error: refError } = await serviceClient
      .rpc('generate_amx_reference_id')

    if (refError) {
      console.error('Error generating reference ID:', refError)
      return NextResponse.json({ error: 'Failed to generate reference ID' }, { status: 500 })
    }

    const referenceId = refData as string

    // Generate PDF
    const pdfBytes = await generateCertificatePdf({
      referenceId,
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
        experienceAmos: technician.experience_amos,
        experienceTrax: technician.experience_trax,
      },
      documents: docRowsForPdf.map(d => ({
        docType: d.doc_type,
        status: d.status,
        expiresOn: d.expires_on,
      })),
      amxDocumentRows,
      generatedAt: new Date(),
    })

    // Upload PDF to Supabase Storage
    const fileName = `${referenceId}.pdf`
    const storagePath = `${technicianId}/${fileName}`

    const { error: uploadError } = await serviceClient
      .storage
      .from('certificates')
      .upload(storagePath, pdfBytes, {
        contentType: 'application/pdf',
        upsert: true,
      })

    if (uploadError) {
      console.error('Error uploading PDF:', uploadError)
      return NextResponse.json({ error: 'Failed to upload PDF' }, { status: 500 })
    }

    // Insert certificate record
    const { data: certificate, error: insertError } = await serviceClient
      .from('amx_certificates')
      .insert({
        technician_id: technicianId,
        reference_id: referenceId,
        pdf_storage_path: storagePath,
        status: 'pending',
      })
      .select()
      .single()

    if (insertError) {
      console.error('Error inserting certificate:', insertError)
      return NextResponse.json({ error: 'Failed to create certificate record' }, { status: 500 })
    }

    // Send notification email to admin
    await sendAdminNotification({
      referenceId,
      technicianName: profile?.full_name || 'Unknown',
      technicianEmail: profile?.email || 'Unknown',
    })

    return NextResponse.json({
      success: true,
      certificate: {
        id: certificate.id,
        referenceId: certificate.reference_id,
        status: certificate.status,
        generatedAt: certificate.generated_at,
      }
    })

  } catch (error: any) {
    console.error('Certificate generation error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

async function sendAdminNotification(data: {
  referenceId: string
  technicianName: string
  technicianEmail: string
}) {
  if (!process.env.RESEND_API_KEY) {
    console.log('Skipping admin notification - RESEND_API_KEY not configured')
    return
  }

  const resend = new Resend(process.env.RESEND_API_KEY)

  try {
    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'aeroMatch <onboarding@resend.dev>',
      to: NOTIFICATION_EMAIL,
      subject: `📋 Nuevo certificado AMX pendiente: ${data.referenceId}`,
      html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f5f5f5; padding: 20px;">
  <div style="max-width: 500px; margin: 0 auto; background: white; border-radius: 12px; padding: 30px; border: 1px solid #e0e0e0;">
    <h1 style="color: #0B132B; margin: 0 0 20px; font-size: 20px;">
      📋 Nuevo Certificado AMX Pendiente
    </h1>
    
    <p style="color: #666; margin: 0 0 20px;">
      Se ha generado un nuevo certificado de documentación técnica que requiere revisión:
    </p>
    
    <div style="background: #f8f9fa; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
      <p style="margin: 0 0 10px;"><strong>Reference ID:</strong> ${data.referenceId}</p>
      <p style="margin: 0 0 10px;"><strong>Técnico:</strong> ${data.technicianName}</p>
      <p style="margin: 0;"><strong>Email:</strong> ${data.technicianEmail}</p>
    </div>
    
    <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://app.aeromatch.eu'}/admin" 
       style="display: inline-block; background: #C9A24D; color: #0B132B; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: bold;">
      Revisar en admin (Verificación)
    </a>
    
    <p style="color: #999; font-size: 12px; margin: 20px 0 0;">
      Este email fue enviado automáticamente por AeroMatch.
    </p>
  </div>
</body>
</html>
      `,
    })
    console.log('Admin notification sent for certificate:', data.referenceId)
  } catch (error) {
    console.error('Failed to send admin notification:', error)
  }
}
