import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// DELETE: Cancel/delete a job request (company only)
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Get the request first
    const { data: existingRequest } = await supabase
      .from('job_requests')
      .select('*')
      .eq('id', id)
      .single()

    if (!existingRequest) {
      return NextResponse.json({ error: 'Solicitud no encontrada' }, { status: 404 })
    }

    // Only companies can delete their own requests
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'company') {
      return NextResponse.json({ error: 'Solo empresas pueden eliminar solicitudes' }, { status: 403 })
    }

    if (existingRequest.company_id !== user.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    // Check if request can be deleted
    // Only pending and rejected requests can be deleted
    // Accepted requests require different handling (controlled cancellation)
    if (existingRequest.status === 'accepted') {
      return NextResponse.json({ 
        error: 'No se puede eliminar una solicitud aceptada. Contacta con el técnico para cancelar.',
        error_code: 'CANNOT_DELETE_ACCEPTED'
      }, { status: 400 })
    }

    // Soft delete: Update status to 'cancelled' instead of hard delete
    const { data, error } = await supabase
      .from('job_requests')
      .update({ 
        status: 'cancelled',
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, request: data })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const { status } = body

    if (!['accepted', 'rejected', 'cancelled'].includes(status)) {
      return NextResponse.json({ error: 'Estado inválido' }, { status: 400 })
    }

    // Get the request first
    const { data: existingRequest } = await supabase
      .from('job_requests')
      .select('*')
      .eq('id', id)
      .single()

    if (!existingRequest) {
      return NextResponse.json({ error: 'Solicitud no encontrada' }, { status: 404 })
    }

    // Check permissions
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role === 'technician' && existingRequest.technician_id !== user.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    if (profile?.role === 'company' && existingRequest.company_id !== user.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    // BACKEND ENFORCEMENT: Block acceptance if technician is not verified
    if (status === 'accepted' && profile?.role === 'technician') {
      const { data: techData } = await supabase
        .from('technicians')
        .select('verification_status')
        .eq('user_id', user.id)
        .single()

      if (techData?.verification_status !== 'verified') {
        return NextResponse.json({ 
          error: 'Debes completar la verificación AMX para aceptar ofertas. Sube tus documentos para verificar tu perfil.',
          error_code: 'VERIFICATION_REQUIRED'
        }, { status: 403 })
      }
    }

    // Update status
    const { data, error } = await supabase
      .from('job_requests')
      .update({ 
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ request: data })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

