import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'
import {
  hashDocumentFilesBeforeVerification,
  promoteTechnicianDocumentsToVerified,
  regenerateAmxCertificateStoragePdf,
} from '@/lib/certificates/finalizeAmxVerification'

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

    const { data: certificate, error } = await serviceClient
      .from('amx_certificates')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !certificate) {
      return NextResponse.json({ error: 'Certificate not found' }, { status: 404 })
    }

    // Non-admin can only access their own certificate
    if (!isAdmin && certificate.technician_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Get technician info
    const { data: profile } = await serviceClient
      .from('profiles')
      .select('full_name, email')
      .eq('id', certificate.technician_id)
      .single()

    return NextResponse.json({
      certificate: {
        ...certificate,
        technicianName: profile?.full_name || 'Unknown',
        technicianEmail: profile?.email || 'Unknown',
      }
    })

  } catch (error: any) {
    console.error('Certificate GET error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user || !ADMIN_EMAILS.includes(user.email?.toLowerCase() || '')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const body = await request.json()
    const { status } = body

    if (!status || !['pending', 'checked', 'rejected'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    const serviceClient = getServiceClient()

    // Get current certificate to get technician_id and reference_id
    const { data: existingCert } = await serviceClient
      .from('amx_certificates')
      .select('*')
      .eq('id', id)
      .single()

    if (!existingCert) {
      return NextResponse.json({ error: 'Certificate not found' }, { status: 404 })
    }

    const updateData: any = { status }

    if (status === 'checked') {
      updateData.checked_at = new Date().toISOString()
      updateData.checked_by = user.id
    } else {
      updateData.checked_at = null
      updateData.checked_by = null
    }

    // Mismo resultado que "Verificar" en admin: documentos verificados + técnico AMX verified
    if (status === 'checked') {
      await hashDocumentFilesBeforeVerification(serviceClient, existingCert.technician_id)

      const { error: promoErr } = await promoteTechnicianDocumentsToVerified(
        serviceClient,
        existingCert.technician_id,
        user.id
      )
      if (promoErr) {
        console.error('promoteTechnicianDocumentsToVerified:', promoErr)
      }

      const { data: techRow } = await serviceClient
        .from('technicians')
        .select('is_available')
        .eq('user_id', existingCert.technician_id)
        .single()

      const techUpd: Record<string, unknown> = {
        verification_status: 'verified',
        verified_at: new Date().toISOString(),
      }
      if (techRow?.is_available) {
        techUpd.availability_status = 'available_verified'
      }
      const { error: techErr } = await serviceClient
        .from('technicians')
        .update(techUpd)
        .eq('user_id', existingCert.technician_id)
      if (techErr) {
        console.error('sync technician verified from certificate PATCH:', techErr)
      }
    }

    const { data: certificate, error } = await serviceClient
      .from('amx_certificates')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating certificate:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const { error: regenErr } = await regenerateAmxCertificateStoragePdf(
      serviceClient,
      existingCert.technician_id,
      status,
      {
        id: existingCert.id,
        reference_id: existingCert.reference_id,
        pdf_storage_path: existingCert.pdf_storage_path,
        generated_at: existingCert.generated_at,
      }
    )
    if (regenErr) {
      console.error('regenerateAmxCertificateStoragePdf:', regenErr)
    }

    return NextResponse.json({
      success: true,
      certificate,
    })

  } catch (error: any) {
    console.error('Certificate PATCH error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
