import { createHash } from 'crypto'
import type { SupabaseClient } from '@supabase/supabase-js'
import { generateCertificatePdf } from '@/lib/certificates/generatePdf'
import {
  buildAmxCertificateDocumentRows,
  normalizeDocStatus,
} from '@/lib/certificates/expectedAmxDocuments'

/**
 * Descarga documentos pendientes desde Storage, SHA-256 del fichero → `file_hash`.
 * Fallos: solo log, no bloquea la verificación.
 */
function hasStoragePath(p: unknown): boolean {
  return typeof p === 'string' && p.trim().length > 0
}

export async function hashDocumentFilesBeforeVerification(
  serviceClient: SupabaseClient,
  technicianId: string
): Promise<void> {
  const q1 = await serviceClient
    .from('documents')
    .select('id, storage_path, status, is_deleted')
    .eq('technician_id', technicianId)

  const q2 = q1.error
    ? await serviceClient.from('documents').select('id, storage_path, status').eq('technician_id', technicianId)
    : null

  const docs = (q2?.data ?? q1.data) as Record<string, unknown>[] | null
  const error = q2 ? q2.error : q1.error

  if (error) {
    console.error('hashDocumentFilesBeforeVerification: query failed', error)
    return
  }

  const toHash = (docs || []).filter((d: Record<string, unknown>) => {
    if (d.is_deleted === true) return false
    if (!hasStoragePath(d.storage_path)) return false
    return normalizeDocStatus(d.status as string) !== 'checked'
  })

  for (const doc of toHash) {
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

/** Filas para PDF / huella: tolera BD sin columnas nuevas; excluye soft-deletes. */
export type DocumentRowForAmxPdf = {
  doc_type: string
  status: string
  expires_on: string | null
  file_hash: string | null
  verified_at: string | null
}

export async function fetchDocumentsRowsForAmxPdf(
  serviceClient: SupabaseClient,
  technicianId: string
): Promise<DocumentRowForAmxPdf[]> {
  const { data, error } = await serviceClient
    .from('documents')
    .select('*')
    .eq('technician_id', technicianId)

  if (error) {
    console.error('fetchDocumentsRowsForAmxPdf: select * failed', error)
    const { data: fallback, error: err2 } = await serviceClient
      .from('documents')
      .select('doc_type, status, expires_on, verified_at')
      .eq('technician_id', technicianId)
    if (err2) {
      console.error('fetchDocumentsRowsForAmxPdf: fallback failed', err2)
      return []
    }
    return (fallback || []).map((d: Record<string, unknown>) => ({
      doc_type: String(d.doc_type),
      status: normalizeDocStatus(d.status as string) || String(d.status),
      expires_on: (d.expires_on as string | null) ?? null,
      file_hash: null,
      verified_at: (d.verified_at as string | null) ?? null,
    }))
  }

  return (data || [])
    .filter((d: { is_deleted?: boolean }) => d.is_deleted !== true)
    .map((d: Record<string, unknown>) => ({
      doc_type: String(d.doc_type),
      status: normalizeDocStatus(d.status as string) || String(d.status),
      expires_on: (d.expires_on as string | null) ?? null,
      file_hash: (d.file_hash as string | null) ?? null,
      verified_at: (d.verified_at as string | null) ?? null,
    }))
}

export function buildDocumentIntegrityPayload(
  documents: { file_hash: string | null; verified_at: string | null; status: string }[],
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
    .filter((d) => normalizeDocStatus(d.status) === 'checked')
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
 * Marca como checked los documentos subidos del técnico al verificar en admin.
 * Selecciona por `id` en código (evita fallos de filtros encadenados en PostgREST y status con basura en BD).
 * Solo filas con `storage_path` no vacío; excluye soft-delete; cualquier status distinto de `checked` (normalizado).
 */
export async function promoteTechnicianDocumentsToVerified(
  serviceClient: SupabaseClient,
  technicianId: string,
  verifiedByUserId: string
): Promise<{ error: Error | null; updatedCount?: number }> {
  const payload = {
    status: 'checked' as const,
    verified_at: new Date().toISOString(),
    verified_by: verifiedByUserId,
  }

  type DocCand = {
    id: string
    status?: string | null
    storage_path?: string | null
    is_deleted?: boolean | null
  }

  const sel = await serviceClient
    .from('documents')
    .select('id, status, storage_path, is_deleted')
    .eq('technician_id', technicianId)

  let candidates: DocCand[] | null
  let selErr = sel.error

  if (selErr) {
    const fallback = await serviceClient
      .from('documents')
      .select('id, status, storage_path')
      .eq('technician_id', technicianId)
    candidates = fallback.data as DocCand[] | null
    selErr = fallback.error
  } else {
    candidates = sel.data as DocCand[] | null
  }

  if (selErr) {
    return { error: new Error(selErr.message) }
  }

  const ids = (candidates || [])
    .filter((r) => {
      if (r.is_deleted === true) return false
      if (!hasStoragePath(r.storage_path)) return false
      return normalizeDocStatus(r.status) !== 'checked'
    })
    .map((r) => r.id)

  if (ids.length === 0) {
    console.warn(
      'promoteTechnicianDocumentsToVerified: 0 candidate rows for technician',
      technicianId,
      '(already checked, no file, or deleted)'
    )
    return { error: null, updatedCount: 0 }
  }

  const { data, error } = await serviceClient.from('documents').update(payload).in('id', ids).select('id')

  if (error) {
    console.error('promoteTechnicianDocumentsToVerified: update failed', error.message, { technicianId, ids })
    return { error: new Error(error.message) }
  }

  const updatedCount = data?.length ?? 0
  if (updatedCount === 0) {
    console.warn('promoteTechnicianDocumentsToVerified: update returned 0 rows', technicianId, ids)
  }

  return { error: null, updatedCount }
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

  const docRows = await fetchDocumentsRowsForAmxPdf(serviceClient, technicianId)
  const documentIntegrity = buildDocumentIntegrityPayload(docRows, certificateStatus)
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
    amxDocumentRows,
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
