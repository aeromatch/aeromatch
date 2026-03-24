import type { SupabaseClient } from '@supabase/supabase-js'
import { generateCertificatePdf } from '@/lib/certificates/generatePdf'

/**
 * Marca como verificados en BD los documentos que el técnico subió y aún no estaban revisados.
 * El PDF usa status === 'verified' para pintar la pill "Checked".
 */
export async function promoteTechnicianDocumentsToVerified(
  serviceClient: SupabaseClient,
  technicianId: string,
  verifiedByUserId: string
): Promise<{ error: Error | null }> {
  const { error } = await serviceClient
    .from('documents')
    .update({
      status: 'verified',
      verified_at: new Date().toISOString(),
      verified_by: verifiedByUserId,
    })
    .eq('technician_id', technicianId)
    .in('status', ['uploaded', 'pending_verification'])

  if (error) {
    return { error: new Error(error.message) }
  }
  return { error: null }
}

type CertPdfRow = {
  reference_id: string
  pdf_storage_path: string | null
  generated_at: string
}

/**
 * Regenera el PDF del certificado AMX y lo sube a Storage.
 * Si no pasas `certOverride`, usa el último certificado del técnico por fecha.
 */
export async function regenerateAmxCertificateStoragePdf(
  serviceClient: SupabaseClient,
  technicianId: string,
  certificateStatus: 'pending' | 'checked' | 'rejected',
  certOverride?: CertPdfRow
): Promise<{ error: Error | null }> {
  let cert: CertPdfRow | null = certOverride ?? null

  if (!cert) {
    const { data: fetched, error: certErr } = await serviceClient
      .from('amx_certificates')
      .select('reference_id, pdf_storage_path, generated_at')
      .eq('technician_id', technicianId)
      .order('generated_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (certErr) {
      return { error: new Error(certErr.message) }
    }
    cert = fetched
  }

  if (!cert?.pdf_storage_path) {
    return { error: null }
  }

  const { data: technician, error: techErr } = await serviceClient
    .from('technicians')
    .select(
      'user_id, license_category, aircraft_types, years_experience, is_available, specialties, languages, own_tools, right_to_work_uk, driving_license'
    )
    .eq('user_id', technicianId)
    .single()

  if (techErr || !technician) {
    return { error: techErr ? new Error(techErr.message) : new Error('Technician not found') }
  }

  const { data: profile } = await serviceClient
    .from('profiles')
    .select('full_name')
    .eq('id', technicianId)
    .single()

  const { data: documents } = await serviceClient
    .from('documents')
    .select('doc_type, status, expires_on')
    .eq('technician_id', technicianId)

  const pdfBytes = await generateCertificatePdf({
    referenceId: cert.reference_id,
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
    documents: (documents || []).map((d) => ({
      docType: d.doc_type,
      status: d.status,
      expiresOn: d.expires_on,
    })),
    generatedAt: new Date(cert.generated_at),
    certificateStatus,
  })

  const { error: uploadError } = await serviceClient.storage
    .from('certificates')
    .upload(cert.pdf_storage_path, Buffer.from(pdfBytes), {
      contentType: 'application/pdf',
      upsert: true,
    })

  if (uploadError) {
    return { error: new Error(uploadError.message) }
  }
  return { error: null }
}
