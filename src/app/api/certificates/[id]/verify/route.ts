import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

/**
 * Verificación pública de integridad AMX (sin autenticación).
 * GET /api/certificates/[id]/verify — id = UUID de `amx_certificates`.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const serviceClient = getServiceClient()

    const { data: certificate, error: certError } = await serviceClient
      .from('amx_certificates')
      .select('id, reference_id, status, technician_id')
      .eq('id', id)
      .maybeSingle()

    if (certError || !certificate) {
      return NextResponse.json({ error: 'Certificate not found' }, { status: 404 })
    }

    const verified = certificate.status === 'checked'

    const { data: docs, error: docsError } = await serviceClient
      .from('documents')
      .select('doc_type, file_hash, verified_at')
      .eq('technician_id', certificate.technician_id)
      .order('created_at', { ascending: false })

    if (docsError) {
      console.error('certificate verify: documents query', docsError)
      return NextResponse.json({ error: 'Failed to load documents' }, { status: 500 })
    }

    const documents = (docs || []).map((d) => ({
      type: d.doc_type,
      hash: d.file_hash,
      verified_at: d.verified_at,
    }))

    return NextResponse.json({
      amx_code: certificate.reference_id,
      verified,
      documents,
    })
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Unknown error'
    console.error('GET /api/certificates/[id]/verify:', e)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
