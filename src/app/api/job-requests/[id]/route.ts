import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { sendAdminJobAcceptedNotification } from '@/lib/email/resend'
import { sendCompanyJobAcceptedNotification } from '@/lib/email/resend'
import { sendPositionCoveredNotification } from '@/lib/email/resend'
import { sendJobRequestNotification } from '@/lib/email/resend'
import { sendCompanyOfferRejectedNotification } from '@/lib/email/resend'
import { sendAdminOfferRejectedNotification } from '@/lib/email/resend'

function getAdminClient() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

function isCompletedByEndDate(endDateIso: string | null | undefined) {
  if (!endDateIso) return false
  const endDate = new Date(endDateIso)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return endDate < today
}

// DELETE: Permanently delete a job request (allowed only for certain statuses)
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

    // Determine role + ownership
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const role = profile?.role
    const isCompanyOwner = role === 'company' && existingRequest.company_id === user.id
    const isTechnicianOwner = role === 'technician' && existingRequest.technician_id === user.id

    if (!isCompanyOwner && !isTechnicianOwner) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    const status = String(existingRequest.status || '').toLowerCase()
    const isTest = !!existingRequest.is_test
    const canHardDelete =
      isTest ||
      status === 'rejected' ||
      status === 'cancelled' ||
      (status === 'accepted' && isCompletedByEndDate(existingRequest.end_date))

    if (!canHardDelete) {
      return NextResponse.json(
        { error: 'Esta solicitud no se puede eliminar en su estado actual', error_code: 'CANNOT_DELETE' },
        { status: 400 }
      )
    }

    // Permanently delete (service role bypasses RLS; FKs handle cascades)
    const adminClient = getAdminClient()
    const { error: delErr } = await adminClient.from('job_requests').delete().eq('id', id)
    if (delErr) return NextResponse.json({ error: delErr.message }, { status: 500 })
    return NextResponse.json({ success: true })
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
    const { status, technician_presentation_message, rejection_reason } = body

    if (!['accepted', 'rejected', 'cancelled'].includes(status)) {
      return NextResponse.json({ error: 'Estado inválido' }, { status: 400 })
    }

    if (status === 'rejected') {
      const reason = typeof rejection_reason === 'string' ? rejection_reason.trim() : ''
      if (!reason || reason.length < 10) {
        return NextResponse.json({ error: 'Debes indicar un motivo de al menos 10 caracteres' }, { status: 400 })
      }
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

    // BACKEND ENFORCEMENT: Block acceptance if technician is not verified (except ofertas de prueba)
    if (status === 'accepted' && profile?.role === 'technician' && !existingRequest.is_test) {
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
        rejection_reason: status === 'rejected'
          ? (typeof rejection_reason === 'string' ? rejection_reason : existingRequest.rejection_reason ?? null)
          : existingRequest.rejection_reason ?? null,
        technician_presentation_message: typeof technician_presentation_message === 'string'
          ? technician_presentation_message
          : existingRequest.technician_presentation_message ?? null,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (status === 'accepted') {
      // If this is a test request, do not trigger real side effects.
      if (existingRequest.is_test) {
        return NextResponse.json({ request: data, test_mode: true })
      }

      const groupId = existingRequest.request_group_id
      if (groupId) {
        const { data: groupRows } = await supabase
          .from('job_requests')
          .select('id, technician_id, status, positions_needed, positions_filled, preference_order')
          .eq('request_group_id', groupId)
          .order('preference_order', { ascending: true })

        const positionsNeeded = groupRows?.[0]?.positions_needed || 1
        const newPositionsFilled = Math.min(positionsNeeded, (groupRows?.[0]?.positions_filled || 0) + 1)

        await supabase
          .from('job_requests')
          .update({ positions_filled: newPositionsFilled, updated_at: new Date().toISOString() })
          .eq('request_group_id', groupId)

        if (newPositionsFilled >= positionsNeeded) {
          const remaining = (groupRows || []).filter((r: any) => r.id !== existingRequest.id && r.status === 'pending')
          if (remaining.length > 0) {
            await supabase
              .from('job_requests')
              .update({ status: 'cancelled', updated_at: new Date().toISOString() })
              .in('id', remaining.map((r: any) => r.id))

            const { data: remainingProfiles } = await supabase
              .from('profiles')
              .select('id, email, full_name')
              .in('id', remaining.map((r: any) => r.technician_id))

            const profileMap = new Map((remainingProfiles || []).map((p: any) => [p.id, p]))
            for (const row of remaining) {
              const p: any = profileMap.get(row.technician_id)
              if (!p?.email) continue
              await sendPositionCoveredNotification({
                technicianEmail: p.email,
                technicianName: p.full_name || 'Técnico',
                companyName: 'Empresa'
              })
            }
          }
        } else {
          const nextDraft = (groupRows || []).find((r: any) => r.status === 'draft')
          if (nextDraft) {
            const isAogGroup = !!existingRequest.is_aog
            const nextExpires = new Date(Date.now() + (isAogGroup ? 2 : 24) * 60 * 60 * 1000).toISOString()
            await supabase
              .from('job_requests')
              .update({ status: 'pending', expires_at: nextExpires, updated_at: new Date().toISOString() })
              .eq('id', nextDraft.id)

            const [{ data: nextTech }, { data: companyNameRow }, { data: companyProfileRow }] = await Promise.all([
              supabase.from('profiles').select('email, full_name').eq('id', nextDraft.technician_id).single(),
              supabase.from('companies').select('company_name').eq('user_id', existingRequest.company_id).single(),
              supabase.from('profiles').select('full_name').eq('id', existingRequest.company_id).single(),
            ])
            if (nextTech?.email) {
              await sendJobRequestNotification({
                technicianEmail: nextTech.email,
                technicianName: nextTech.full_name || 'Técnico',
                companyName: companyNameRow?.company_name || companyProfileRow?.full_name || 'Empresa',
                finalClient: existingRequest.final_client_name,
                workLocation: existingRequest.work_location,
                startDate: existingRequest.start_date,
                endDate: existingRequest.end_date,
                contractType: existingRequest.contract_type,
                notes: existingRequest.notes || undefined,
                companyOfferMessage: existingRequest.company_offer_message || undefined,
              })
            }
          }
        }
      }

      const [{ data: techProfile }, { data: techData }, { data: companyProfile }, { data: companyData }, { data: logbookDoc }] = await Promise.all([
        supabase.from('profiles').select('full_name, email').eq('id', existingRequest.technician_id).single(),
        supabase.from('technicians').select('*').eq('user_id', existingRequest.technician_id).single(),
        supabase.from('profiles').select('email').eq('id', existingRequest.company_id).single(),
        supabase.from('companies').select('company_name').eq('user_id', existingRequest.company_id).single(),
        supabase.from('documents').select('id').eq('technician_id', existingRequest.technician_id).eq('doc_type', 'logbook').limit(1).maybeSingle()
      ])
      const readableRequestId = `Solicitud #${existingRequest.id.substring(0, 8).toUpperCase()}`
      const technicianFullName =
        techProfile?.full_name ||
        [techData?.first_name, techData?.last_name].filter(Boolean).join(' ') ||
        'Técnico'

      await sendAdminJobAcceptedNotification({
        requestId: existingRequest.id,
        technicianName: technicianFullName,
        companyName: companyData?.company_name || companyProfile?.email || 'Empresa',
        startDate: existingRequest.start_date,
        endDate: existingRequest.end_date,
        contractType: existingRequest.contract_type
      })

      await sendCompanyJobAcceptedNotification({
        companyEmail: companyProfile?.email || '',
        companyName: companyData?.company_name || companyProfile?.email || 'Empresa',
        technicianName: technicianFullName,
        requestId: existingRequest.id,
        readableRequestId,
        finalClientName: existingRequest.final_client_name,
        workLocation: existingRequest.work_location,
        startDate: existingRequest.start_date,
        endDate: existingRequest.end_date,
        contractType: existingRequest.contract_type,
        technicianPresentationMessage: (typeof technician_presentation_message === 'string'
          ? technician_presentation_message
          : existingRequest.technician_presentation_message) || undefined,
        technicianExperienceYears: techData?.years_experience ?? null,
        technicianSpecialties: Array.isArray(techData?.specialties) ? techData.specialties : [],
        technicianLicenses: Array.isArray(techData?.license_category) ? techData.license_category : [],
        technicianTypeRatings: Array.isArray(techData?.aircraft_types) ? techData.aircraft_types : [],
        technicianEmail: techProfile?.email || undefined,
        technicianPhone: techData?.phone || undefined,
        hasLogbook: !!logbookDoc
      })
    }

    if (status === 'rejected') {
      const reason = (typeof rejection_reason === 'string' ? rejection_reason.trim() : '') || (existingRequest.rejection_reason || '')
      if (!existingRequest.is_test) {
        let hasNextTechnician = false
        let nextDraft: any = null

        if (existingRequest.request_group_id) {
          const { data: groupRows } = await supabase
            .from('job_requests')
            .select('id, status, technician_id')
            .eq('request_group_id', existingRequest.request_group_id)
            .order('preference_order', { ascending: true })

          nextDraft = (groupRows || []).find((r: any) => r.status === 'draft')
          hasNextTechnician = !!nextDraft
        }

        const [{ data: techProfile }, { data: companyProfile }, { data: companyData }] = await Promise.all([
          supabase.from('profiles').select('full_name').eq('id', existingRequest.technician_id).single(),
          supabase.from('profiles').select('email, full_name').eq('id', existingRequest.company_id).single(),
          supabase.from('companies').select('company_name').eq('user_id', existingRequest.company_id).single(),
        ])
        const technicianName = techProfile?.full_name || 'Técnico'
        const companyName = companyData?.company_name || companyProfile?.full_name || 'Empresa'

        if (companyProfile?.email) {
          await sendCompanyOfferRejectedNotification({
            companyEmail: companyProfile.email,
            companyName,
            technicianName,
            rejectionReason: reason,
            hasNextTechnician,
          })
        }
        await sendAdminOfferRejectedNotification({
          technicianName,
          companyName,
          rejectionReason: reason,
          hasNextTechnician,
        })

        if (nextDraft) {
          const nextExpires = new Date(Date.now() + (existingRequest.is_aog ? 2 : 24) * 60 * 60 * 1000).toISOString()
          await supabase
            .from('job_requests')
            .update({ status: 'pending', expires_at: nextExpires, updated_at: new Date().toISOString() })
            .eq('id', nextDraft.id)

          const [{ data: nextTech }, { data: companyNameRow }, { data: companyProfileRow }] = await Promise.all([
            supabase.from('profiles').select('email, full_name').eq('id', nextDraft.technician_id).single(),
            supabase.from('companies').select('company_name').eq('user_id', existingRequest.company_id).single(),
            supabase.from('profiles').select('full_name').eq('id', existingRequest.company_id).single(),
          ])
          if (nextTech?.email) {
            await sendJobRequestNotification({
              technicianEmail: nextTech.email,
              technicianName: nextTech.full_name || 'Técnico',
              companyName: companyNameRow?.company_name || companyProfileRow?.full_name || 'Empresa',
              finalClient: existingRequest.final_client_name,
              workLocation: existingRequest.work_location,
              startDate: existingRequest.start_date,
              endDate: existingRequest.end_date,
              contractType: existingRequest.contract_type,
              notes: existingRequest.notes || undefined,
              companyOfferMessage: existingRequest.company_offer_message || undefined,
            })
          }
        }
      }
    }

    return NextResponse.json({ request: data })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

