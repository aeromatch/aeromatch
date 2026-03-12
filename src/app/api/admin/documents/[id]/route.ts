import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'

// Admin emails from environment
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim().toLowerCase())

// Service role client for admin operations
function getServiceClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  return createClient(supabaseUrl, serviceKey)
}

// GET: Get signed URL for document viewing
export async function GET(
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

    const serviceClient = getServiceClient()

    // Get document info
    const { data: doc, error: docError } = await serviceClient
      .from('documents')
      .select('storage_path, doc_type')
      .eq('id', id)
      .single()

    if (docError || !doc) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    // Generate signed URL (valid for 1 hour)
    const { data: signedUrl, error: urlError } = await serviceClient
      .storage
      .from('documents')
      .createSignedUrl(doc.storage_path, 3600)

    if (urlError || !signedUrl) {
      console.error('Error creating signed URL:', urlError)
      return NextResponse.json({ error: 'Could not generate URL' }, { status: 500 })
    }

    return NextResponse.json({ 
      url: signedUrl.signedUrl,
      docType: doc.doc_type,
    })
  } catch (error: any) {
    console.error('Admin document GET error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}



