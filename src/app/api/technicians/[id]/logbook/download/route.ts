import { createClient as createServiceClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

function getServiceClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: technicianId } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const service = getServiceClient()
    const { data: profile } = await service
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const isOwnProfile = user.id === technicianId
    const isCompany = profile?.role === 'company'

    if (!isOwnProfile && isCompany) {
      const { data: accepted } = await service
        .from('job_requests')
        .select('id')
        .eq('company_id', user.id)
        .eq('technician_id', technicianId)
        .eq('status', 'accepted')
        .limit(1)
        .maybeSingle()
      if (!accepted) {
        return NextResponse.json({ error: 'No accepted request with technician' }, { status: 403 })
      }
    }

    if (!isOwnProfile && !isCompany) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { data: logbook } = await service
      .from('documents')
      .select('storage_path, file_name')
      .eq('technician_id', technicianId)
      .eq('doc_type', 'logbook')
      .maybeSingle()

    if (!logbook?.storage_path) {
      return NextResponse.json({ error: 'Logbook not found' }, { status: 404 })
    }

    const { data: fileData, error: downloadError } = await service.storage
      .from('documents')
      .download(logbook.storage_path)

    if (downloadError || !fileData) {
      return NextResponse.json({ error: 'Unable to download logbook' }, { status: 500 })
    }

    const arrayBuffer = await fileData.arrayBuffer()
    return new NextResponse(Buffer.from(arrayBuffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${logbook.file_name || 'technical-logbook.pdf'}"`
      }
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
