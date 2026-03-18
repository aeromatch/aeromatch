import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'

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

    // Check authorization
    if (!isAdmin && certificate.technician_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Technicians can only download checked certificates
    if (!isAdmin && certificate.status !== 'checked') {
      return NextResponse.json({ 
        error: 'Certificate not yet approved for download' 
      }, { status: 403 })
    }

    if (!certificate.pdf_storage_path) {
      return NextResponse.json({ error: 'PDF not found' }, { status: 404 })
    }

    // Generate signed URL for download
    const { data: signedUrl, error: urlError } = await serviceClient
      .storage
      .from('certificates')
      .createSignedUrl(certificate.pdf_storage_path, 300) // 5 minutes expiry

    if (urlError || !signedUrl) {
      console.error('Error creating signed URL:', urlError)
      return NextResponse.json({ error: 'Failed to generate download URL' }, { status: 500 })
    }

    return NextResponse.json({
      downloadUrl: signedUrl.signedUrl,
      fileName: `${certificate.reference_id}.pdf`,
    })

  } catch (error: any) {
    console.error('Certificate download error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
