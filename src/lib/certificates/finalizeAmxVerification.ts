import { createHash } from 'crypto'
import type { SupabaseClient } from '@supabase/supabase-js'
import { generateCertificatePdf } from '@/lib/certificates/generatePdf'

/**
 * Descarga documentos pendientes desde Storage, SHA-256 del fichero → `file_hash`.
 * Fallos: solo log, no bloquea la verificación.
 */
export async function hashDocumentFilesBeforeVerification(
  serviceClient: SupabaseClient,
  technicianId: string
): Promise<void> {
  const { data: docs, error } = await serviceClient
    .from('documents')
    .select('id, storage_path')
    .eq('technician_id', technicianId)
    .in('status', ['uploaded', 'pending_verification'])
    .not('storage_path', 'is', null)

  if (error) {
    console.error('hashDocumentFilesBeforeVerification: query failed', error)
    return
  }

  for (const doc of docs || []) {
    const storagePath = doc.storage_path as string
    try {
      const { data: blob, error: dlErr } = await serviceClient.storage
        .from('documents')
        .download(storagePath)
      if (dlErr || !blob) {
        console.error('hash doc download failed:', doc.id, dlErr)
        continue
      }
      const buf = Buffer.from(await blob.arrayBuffer())
      const hash = createHash('sha256').update(buf).digest('hex')
      const { error: upErr } = await serviceClient
        .from('documents')
        .update({ file_hash: hash })
        .eq('id', doc.id)
      if (upErr) {
        console.error('hash doc update failed:', doc.id, upErr)
      }
    } catch (e) {
      console.error('hash document file failed:', doc.id, e)
    }
  }
}

export function buildDocumentIntegrityPayload(
  documents: { file_hash: string | null; verified_at: string | null }[],
  certificateStatus: 'pending' | 'checked' | 'rejected'
):
  | {
      fullFingerprintHex: string
      verifiedAt: Date
    }
  | undefined {
  if (certificateStatus !== 'checked') {
    return undefined
  }
  const hashes = documents
    .map((d) => d.file_hash)
    .filter((h): h is string => typeof h === 'string' && h.length > 0)
    .sort()
  if (hashes.length === 0) {
    return undefined
  }
  const fullFingerprintHex = createHash('sha256').update(hashes.join('|')).digest('hex')
  const verifiedTimes = documents
    .filter((d) => d.verified_at)
    .map((d) => new Date(d.verified_at!).getTime())
  const verifiedAt =
    verifiedTimes.length > 0 ? new Date(Math.max(...verifiedTimes)) : new Date()
  return { fullFingerprintHex, verifiedAt }
}

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
  id: string
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
      .select('id, reference_id, pdf_storage_path, generated_at')
      .eq('technician_id', technicianId)
      .order('generated_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (certErr) {
      return { error: new Error(certErr.message) }
    }
    cert = fetched as CertPdfRow | null
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
    .select('doc_type, status, expires_on, file_hash, verified_at')
    .eq('technician_id', technicianId)

  const docRows = documents || []
  const documentIntegrity = buildDocumentIntegrityPayload(docRows, certificateStatus)

  const pdfBytes = await generateCertificatePdf({
    referenceId: cert.reference_id,
    certificateId: cert.id,
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
    documents: docRows.map((d) => ({
      docType: d.doc_type,
      status: d.status,
      expiresOn: d.expires_on,
    })),
    generatedAt: new Date(cert.generated_at),
    certificateStatus,
    documentIntegrity,
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
