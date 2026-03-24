import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { generateCertificatePdf } from '@/lib/certificates/generatePdf'
import {
  promoteTechnicianDocumentsToVerified,
  regenerateAmxCertificateStoragePdf,
} from '@/lib/certificates/finalizeAmxVerification'
import { Resend } from 'resend'

// Admin emails from environment
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim().toLowerCase())
const NOTIFICATION_EMAIL = 'raul@aeromatch.eu'

// Service role client for admin operations
function getServiceClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  return createClient(supabaseUrl, serviceKey)
}

// GET: List technicians with verification info and their documents
export async function GET(request: Request) {
  try {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user || !ADMIN_EMAILS.includes(user.email?.toLowerCase() || '')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const serviceClient = getServiceClient()
    const { searchParams } = new URL(request.url)
    const filter = searchParams.get('filter') || 'all' // all, pending, verified, unverified

    // Get all technicians with their profile info and documents
    let query = serviceClient
      .from('technicians')
      .select(`
        user_id,
        verification_status,
        availability_status,
        verified_at,
        verification_notes,
        license_category,
        aircraft_types,
        is_available
      `)

    // Apply filter
    if (filter === 'pending') {
      query = query.eq('verification_status', 'pending')
    } else if (filter === 'verified') {
      query = query.eq('verification_status', 'verified')
    } else if (filter === 'unverified') {
      query = query.eq('verification_status', 'unverified')
    }

    const { data: technicians, error: techError } = await query

    if (techError) {
      console.error('Error fetching technicians:', techError)
      return NextResponse.json({ error: techError.message }, { status: 500 })
    }

    // Get profiles for these technicians
    const techIds = technicians?.map(t => t.user_id) || []
    
    const { data: profiles } = await serviceClient
      .from('profiles')
      .select('id, email, full_name')
      .in('id', techIds)

    // Get documents for these technicians
    const { data: documents } = await serviceClient
      .from('documents')
      .select('id, technician_id, doc_type, status, storage_path, expires_on, created_at')
      .in('technician_id', techIds)
      .order('created_at', { ascending: false })

    // Combine data
    const result = technicians?.map(tech => {
      const profile = profiles?.find(p => p.id === tech.user_id)
      const techDocs = documents?.filter(d => d.technician_id === tech.user_id) || []
      
      return {
        id: tech.user_id,
        email: profile?.email || 'Unknown',
        fullName: profile?.full_name || '-',
        verificationStatus: tech.verification_status || 'unverified',
        availabilityStatus: tech.availability_status || 'hidden',
        verifiedAt: tech.verified_at,
        verificationNotes: tech.verification_notes,
        licenseCategory: tech.license_category || [],
        aircraftTypes: tech.aircraft_types || [],
        isAvailable: tech.is_available,
        documents: techDocs.map(d => ({
          id: d.id,
          docType: d.doc_type,
          status: d.status,
          storagePath: d.storage_path,
          expiresOn: d.expires_on,
          createdAt: d.created_at,
        })),
        docsCount: techDocs.length,
      }
    }) || []

    // Sort: pending first, then unverified with docs, then others
    result.sort((a, b) => {
      const order: Record<string, number> = { pending: 0, unverified: 1, verified: 2, rejected: 3 }
      const aOrder = order[a.verificationStatus] ?? 4
      const bOrder = order[b.verificationStatus] ?? 4
      if (aOrder !== bOrder) return aOrder - bOrder
      // Within same status, sort by docs count (more docs first)
      return b.docsCount - a.docsCount
    })

    return NextResponse.json({ technicians: result })
  } catch (error: any) {
    console.error('Admin verification GET error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST: Update technician verification status
export async function POST(request: Request) {
  try {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user || !ADMIN_EMAILS.includes(user.email?.toLowerCase() || '')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const body = await request.json()
    const { technicianId, status, notes } = body

    if (!technicianId || !status) {
      return NextResponse.json({ error: 'technicianId and status required' }, { status: 400 })
    }

    if (!['unverified', 'pending', 'verified', 'rejected'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    const serviceClient = getServiceClient()

    // Build update object
    const updateData: any = {
      verification_status: status,
      verification_notes: notes || null,
    }

    // If verifying, set verified_at and update availability_status
    if (status === 'verified') {
      updateData.verified_at = new Date().toISOString()
      // If technician has is_available=true, upgrade to available_verified
      const { data: tech } = await serviceClient
        .from('technicians')
        .select('is_available')
        .eq('user_id', technicianId)
        .single()
      
      if (tech?.is_available) {
        updateData.availability_status = 'available_verified'
      }
    } else if (status === 'rejected' || status === 'unverified') {
      updateData.verified_at = null
      // Downgrade to available_unverified if was verified
      const { data: tech } = await serviceClient
        .from('technicians')
        .select('availability_status')
        .eq('user_id', technicianId)
        .single()
      
      if (tech?.availability_status === 'available_verified') {
        updateData.availability_status = 'available_unverified'
      }
    }

    const { error: updateError } = await serviceClient
      .from('technicians')
      .update(updateData)
      .eq('user_id', technicianId)

    if (updateError) {
      console.error('Error updating verification:', updateError)
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    // Generate certificate when status changes to 'pending'
    let certificateGenerated = false
    let certificateError = null
    
    if (status === 'pending') {
      try {
        // Check if certificate already exists
        const { data: existingCert } = await serviceClient
          .from('amx_certificates')
          .select('id, status')
          .eq('technician_id', technicianId)
          .order('generated_at', { ascending: false })
          .limit(1)
          .single()

        if (existingCert && existingCert.status === 'pending') {
          console.log('Certificate already pending for technician:', technicianId)
        } else {
          // Get technician data
          const { data: technician } = await serviceClient
            .from('technicians')
            .select('user_id, license_category, aircraft_types, years_experience, is_available, specialties, languages, own_tools, right_to_work_uk, driving_license')
            .eq('user_id', technicianId)
            .single()

          // Get profile data
          const { data: profile } = await serviceClient
            .from('profiles')
            .select('full_name, email')
            .eq('id', technicianId)
            .single()

          // Get documents
          const { data: documents } = await serviceClient
            .from('documents')
            .select('doc_type, status, expires_on')
            .eq('technician_id', technicianId)

          if (technician) {
            // Generate reference ID
            const { data: refData } = await serviceClient.rpc('generate_amx_reference_id')
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
              },
              documents: (documents || []).map(d => ({
                docType: d.doc_type,
                status: d.status,
                expiresOn: d.expires_on,
              })),
              generatedAt: new Date(),
              certificateStatus: 'pending',
            })

            // Upload PDF to Storage
            const storagePath = `${technicianId}/${referenceId}.pdf`
            const { error: uploadError } = await serviceClient
              .storage
              .from('certificates')
              .upload(storagePath, Buffer.from(pdfBytes), {
                contentType: 'application/pdf',
                upsert: true,
              })

            if (uploadError) {
              console.error('Error uploading PDF:', uploadError)
              certificateError = uploadError.message
            } else {
              // Insert certificate record
              const { error: insertError } = await serviceClient
                .from('amx_certificates')
                .insert({
                  technician_id: technicianId,
                  reference_id: referenceId,
                  pdf_storage_path: storagePath,
                  status: 'pending',
                })

              if (insertError) {
                console.error('Error inserting certificate:', insertError)
                certificateError = insertError.message
              } else {
                certificateGenerated = true
                console.log('Certificate generated:', referenceId)

                // Send notification email
                if (process.env.RESEND_API_KEY) {
                  try {
                    const resend = new Resend(process.env.RESEND_API_KEY)
                    await resend.emails.send({
                      from: process.env.RESEND_FROM_EMAIL || 'aeroMatch <onboarding@resend.dev>',
                      to: NOTIFICATION_EMAIL,
                      subject: `📋 Nuevo certificado AMX: ${referenceId}`,
                      html: `<p>Nuevo certificado pendiente de revisión.</p><p><strong>Técnico:</strong> ${profile?.full_name || 'Unknown'}</p><p><strong>Email:</strong> ${profile?.email}</p><p><a href="https://app.aeromatch.eu/admin/certificates">Revisar certificado</a></p>`,
                    })
                  } catch (emailErr) {
                    console.error('Email notification failed:', emailErr)
                  }
                }
              }
            }
          }
        }
      } catch (certErr: any) {
        console.error('Error generating certificate:', certErr)
        certificateError = certErr.message
      }
    }

    // When verified: documentos -> verified (PDF "Checked"), certificado -> checked, PDF en Storage
    let certificateChecked = false
    if (status === 'verified') {
      try {
        const { error: promoErr } = await promoteTechnicianDocumentsToVerified(
          serviceClient,
          technicianId,
          user.id
        )
        if (promoErr) {
          console.error('promoteTechnicianDocumentsToVerified:', promoErr)
        }

        const { data: cert } = await serviceClient
          .from('amx_certificates')
          .select('id, status, reference_id, pdf_storage_path, generated_at')
          .eq('technician_id', technicianId)
          .order('generated_at', { ascending: false })
          .limit(1)
          .maybeSingle()

        if (cert) {
          if (cert.status !== 'checked') {
            const { error: certUpdateError } = await serviceClient
              .from('amx_certificates')
              .update({
                status: 'checked',
                checked_at: new Date().toISOString(),
                checked_by: user.id,
              })
              .eq('id', cert.id)

            if (!certUpdateError) {
              certificateChecked = true
              console.log('Certificate marked as checked:', cert.id)
            }
          }

          const { error: regenErr } = await regenerateAmxCertificateStoragePdf(
            serviceClient,
            technicianId,
            'checked',
            {
              reference_id: cert.reference_id,
              pdf_storage_path: cert.pdf_storage_path,
              generated_at: cert.generated_at,
            }
          )
          if (regenErr) {
            console.error('regenerateAmxCertificateStoragePdf:', regenErr)
          }
        }
      } catch (certErr) {
        console.error('Error updating certificate status:', certErr)
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: `Technician ${status === 'verified' ? 'verified' : status}`,
      certificateGenerated,
      certificateChecked,
      certificateError,
    })
  } catch (error: any) {
    console.error('Admin verification POST error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}




