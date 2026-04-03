'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { AppLayout } from '@/components/ui/AppLayout'
import { AcceptJobModal } from '@/components/requests/AcceptJobModal'
import { RatingModal, RatingData } from '@/components/ratings/RatingModal'
import { useLanguage } from '@/lib/i18n/LanguageContext'
import { AMXSummaryModal } from '@/components/search/AMXSummaryModal'

interface JobRequest {
  id: string
  company_id: string
  technician_id: string
  final_client_name: string
  work_location: string
  contract_type: string
  start_date: string
  end_date: string
  notes: string | null
  status: string
  created_at: string
  country_code?: string
  daily_rate_gross?: number
  company_name?: string
  technician_name?: string
  rated?: boolean
  requires_right_to_work_uk?: boolean
  // Workflow data (for accepted jobs)
  work_mode?: string
  umbrella_provider_name?: string
  uk_eligibility_mode?: string
  has_logbook?: boolean
  is_test?: boolean
}

export default function RequestsPage() {
  const router = useRouter()
  const supabase = createClient()
  const { language } = useLanguage()

  const [profile, setProfile] = useState<any>(null)
  const [technicianData, setTechnicianData] = useState<any>(null)
  const [requests, setRequests] = useState<JobRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  
  // Accept modal state
  const [acceptModalOpen, setAcceptModalOpen] = useState(false)
  const [selectedRequest, setSelectedRequest] = useState<JobRequest | null>(null)
  
  // Rating modal state
  const [ratingModalOpen, setRatingModalOpen] = useState(false)
  const [ratingRequest, setRatingRequest] = useState<JobRequest | null>(null)
  const [showAMXModal, setShowAMXModal] = useState(false)
  const [amxRequest, setAmxRequest] = useState<JobRequest | null>(null)

  // Delete confirmation modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [requestToDelete, setRequestToDelete] = useState<JobRequest | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [rejectModalOpen, setRejectModalOpen] = useState(false)
  const [rejectingRequest, setRejectingRequest] = useState<JobRequest | null>(null)
  const [rejectionReason, setRejectionReason] = useState('')

  const labels = {
    title: language === 'es' ? 'Solicitudes Recibidas' : 'Received Requests',
    titleCompany: language === 'es' ? 'Mis Solicitudes' : 'My Requests',
    loading: language === 'es' ? 'Cargando...' : 'Loading...',
    noRequests: language === 'es' ? 'No hay solicitudes' : 'No requests',
    searchTechnicians: language === 'es' ? 'Buscar Técnicos' : 'Search Technicians',
    period: language === 'es' ? 'Período' : 'Period',
    contractType: language === 'es' ? 'Tipo de contrato' : 'Contract type',
    shortTerm: language === 'es' ? 'Corto plazo' : 'Short-term',
    longTerm: language === 'es' ? 'Largo plazo' : 'Long-term',
    notes: language === 'es' ? 'Notas' : 'Notes',
    accept: language === 'es' ? 'Aceptar' : 'Accept',
    reject: language === 'es' ? 'Rechazar' : 'Reject',
    processing: language === 'es' ? 'Procesando...' : 'Processing...',
    created: language === 'es' ? 'Creada' : 'Created',
    pending: language === 'es' ? 'Pendiente' : 'Pending',
    accepted: language === 'es' ? 'Aceptada' : 'Accepted',
    rejected: language === 'es' ? 'Rechazada' : 'Rejected',
    cancelled: language === 'es' ? 'Cancelada' : 'Cancelled',
    workMode: language === 'es' ? 'Modalidad' : 'Work Mode',
    selfEmployed: language === 'es' ? 'Autónomo' : 'Self-employed',
    umbrella: language === 'es' ? 'Umbrella' : 'Umbrella',
    umbrellaInsurance: language === 'es' ? 'Umbrella + Seguro' : 'Umbrella + Insurance',
    umbrellaProvider: language === 'es' ? 'Proveedor' : 'Provider',
    rateNow: language === 'es' ? 'Valorar técnico' : 'Rate technician',
    ratingPending: language === 'es' ? '¡Trabajo finalizado! Valora al técnico' : 'Job completed! Rate the technician',
    rated: language === 'es' ? 'Valorado' : 'Rated',
    completed: language === 'es' ? 'Completado' : 'Completed',
    ukEligibilityWarning: language === 'es' 
      ? '⚠️ Se requiere elegibilidad laboral en UK. AeroMatch no sponsoriza visados ni ofrece seguro directamente en esta fase. Debes gestionar la elegibilidad mediante:\n• Umbrella/EoR (MoR y seguro bajo términos del proveedor), O\n• Sponsorship de visado o Right to Work UK por tu cuenta.'
      : '⚠️ UK Work Eligibility Required. This job requires legal Right to Work in the UK to execute the contract. AeroMatch does NOT sponsor VISAs or provide insurance directly at this stage. You must arrange eligibility via:\n• Umbrella/EoR (MoR billing + insurance under provider terms), OR\n• VISA sponsorship / Right to Work UK independently.',
    ukRtw: language === 'es' ? 'Right to Work UK' : 'UK Right to Work',
    required: language === 'es' ? 'Requerido' : 'Required',
    deleteRequest: language === 'es' ? 'Eliminar solicitud' : 'Delete request',
    deleteConfirmTitle: language === 'es' ? '¿Eliminar solicitud?' : 'Delete request?',
    deleteConfirmText: language === 'es'
      ? 'Esta acción no se puede deshacer. La solicitud se eliminará definitivamente.'
      : 'This action cannot be undone. The request will be permanently deleted.',
    delete: language === 'es' ? 'Eliminar' : 'Delete',
    cancel: language === 'es' ? 'Cancelar' : 'Cancel',
    cannotDeleteAccepted: language === 'es' ? 'No se puede eliminar una solicitud aceptada' : 'Cannot delete an accepted request',
    rejectModalTitle: language === 'es' ? 'Rechazar oferta' : 'Reject offer',
    rejectModalBody: language === 'es' ? 'Lamentablemente no puedo aceptar la oferta en este momento.' : 'Unfortunately I cannot accept this offer right now.',
    rejectModalFooter: language === 'es' ? 'Quedo disponible para futuras oportunidades.' : 'I remain available for future opportunities.',
    rejectReasonLabel: language === 'es' ? 'Motivo (mínimo 10 caracteres)' : 'Reason (minimum 10 characters)',
    confirmReject: language === 'es' ? 'Confirmar rechazo' : 'Confirm rejection',
  }

  const workModeLabels: Record<string, string> = {
    self_employed: labels.selfEmployed,
    umbrella: labels.umbrella,
    umbrella_with_insurance: labels.umbrellaInsurance,
  }

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/auth')
      return
    }

    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    setProfile(profileData)

    // Load requests based on role
    if (profileData?.role === 'technician') {
      // Load technician data to check right_to_work_uk and verification_status
      const { data: techData } = await supabase
        .from('technicians')
        .select('right_to_work_uk, verification_status, availability_status')
        .eq('user_id', user.id)
        .single()
      
      setTechnicianData(techData)

      const { data: requestsData } = await supabase
        .from('job_requests')
        .select('*')
        .eq('technician_id', user.id)
        .neq('status', 'draft')
        .order('created_at', { ascending: false })

      // For accepted requests, load workflow data
      if (requestsData) {
        const acceptedIds = requestsData.filter(r => r.status === 'accepted').map(r => r.id)
        
        if (acceptedIds.length > 0) {
          const { data: workflowData } = await supabase
            .from('job_acceptance_workflow')
            .select(`
              job_request_id,
              work_mode,
              umbrella_providers (name)
            `)
            .in('job_request_id', acceptedIds)

          const techIds = [...new Set(requestsData.map(r => r.technician_id))]
          const { data: logbookDocs } = await supabase
            .from('documents')
            .select('technician_id')
            .eq('doc_type', 'logbook')
            .in('technician_id', techIds)
          const hasLogbookSet = new Set((logbookDocs || []).map((d: any) => d.technician_id))

          // Merge workflow data into requests
          const enrichedRequests = requestsData.map(req => {
            const workflow = workflowData?.find((w: any) => w.job_request_id === req.id)
            return {
              ...req,
              work_mode: workflow?.work_mode,
              umbrella_provider_name: (workflow as any)?.umbrella_providers?.name,
              has_logbook: hasLogbookSet.has(req.technician_id),
            }
          })
          setRequests(enrichedRequests)
        } else {
          setRequests(requestsData)
        }
      }
    } else {
      const { data: requestsData } = await supabase
        .from('job_requests')
        .select('*')
        .eq('company_id', user.id)
        .order('created_at', { ascending: false })

      // For companies, also load workflow data for accepted requests
      if (requestsData) {
        const acceptedIds = requestsData.filter(r => r.status === 'accepted').map(r => r.id)
        
        if (acceptedIds.length > 0) {
          const { data: workflowData } = await supabase
            .from('job_acceptance_workflow')
            .select(`
              job_request_id,
              work_mode,
              umbrella_providers (name)
            `)
            .in('job_request_id', acceptedIds)

          const enrichedRequests = requestsData.map(req => {
            const workflow = workflowData?.find((w: any) => w.job_request_id === req.id)
            return {
              ...req,
              work_mode: workflow?.work_mode,
              umbrella_provider_name: (workflow as any)?.umbrella_providers?.name,
            }
          })
          setRequests(enrichedRequests)
        } else {
          setRequests(requestsData)
        }
      }
    }

    setLoading(false)
  }

  const handleAcceptClick = (request: JobRequest) => {
    setSelectedRequest(request)
    setAcceptModalOpen(true)
  }

  const handleAccepted = () => {
    // Reload data after acceptance
    loadData()
  }

  const openRejectModal = (request: JobRequest) => {
    setRejectingRequest(request)
    setRejectionReason('')
    setRejectModalOpen(true)
  }

  const handleReject = async () => {
    if (!rejectingRequest) return
    if ((rejectionReason || '').trim().length < 10) {
      setError(language === 'es' ? 'El motivo debe tener al menos 10 caracteres' : 'Reason must be at least 10 characters')
      return
    }

    const requestId = rejectingRequest.id
    setUpdating(requestId)
    setError(null)

    try {
      const response = await fetch(`/api/job-requests/${requestId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'rejected', rejection_reason: rejectionReason.trim() })
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error)

      // Update local state
      setRequests(requests.map(r => 
        r.id === requestId ? { ...r, status: 'rejected' } : r
      ))
      setRejectModalOpen(false)
      setRejectingRequest(null)
      setRejectionReason('')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setUpdating(null)
    }
  }

  const handleRateClick = (request: JobRequest) => {
    setRatingRequest(request)
    setRatingModalOpen(true)
  }

  const handleSubmitRating = async (rating: RatingData) => {
    if (!ratingRequest) return

    const response = await fetch('/api/ratings/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jobRequestId: ratingRequest.id,
        technicianId: ratingRequest.technician_id,
        ...rating
      })
    })

    const data = await response.json()
    if (!response.ok) throw new Error(data.error)

    // Update local state to mark as rated
    setRequests(requests.map(r => 
      r.id === ratingRequest.id ? { ...r, rated: true } : r
    ))
  }

  // Check if a job should show rating prompt (accepted + end_date passed + not rated)
  const shouldShowRatingPrompt = (request: JobRequest) => {
    if (request.is_test || request.status !== 'accepted' || request.rated) return false
    const endDate = new Date(request.end_date)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return endDate < today
  }

  // Handle delete click (company only)
  const handleDeleteClick = (request: JobRequest) => {
    setRequestToDelete(request)
    setDeleteModalOpen(true)
  }

  // Confirm delete
  const confirmDelete = async () => {
    if (!requestToDelete) return

    setDeleting(true)
    setError(null)

    try {
      const response = await fetch(`/api/job-requests/${requestToDelete.id}`, {
        method: 'DELETE',
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error)

      // Update local state - remove or mark as cancelled
      setRequests(requests.filter(r => r.id !== requestToDelete.id))
      setDeleteModalOpen(false)
      setRequestToDelete(null)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setDeleting(false)
    }
  }

  // Check if request can be deleted
  const canDeleteRequest = (request: JobRequest) => {
    const status = (request.status || '').toLowerCase()
    if (request.is_test) return true
    if (status === 'rejected' || status === 'cancelled') return true
    // Allow deleting accepted requests only after they are completed (end_date passed)
    if (status === 'accepted') {
      const endDate = new Date(request.end_date)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      return endDate < today
    }
    return false
  }

  const getStatusBadge = (request: JobRequest) => {
    // Check if should show as completed (end date passed)
    if (request.status === 'accepted') {
      const endDate = new Date(request.end_date)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      if (endDate < today) {
        if (request.rated) {
          return <span className="chip-success">{labels.rated} ✓</span>
        }
        return <span className="chip-gold">{labels.completed}</span>
      }
      return <span className="chip-success">{labels.accepted}</span>
    }
    
    switch (request.status) {
      case 'pending':
        return <span className="chip-warning">{labels.pending}</span>
      case 'rejected':
        return <span className="chip-error">{labels.rejected}</span>
      case 'cancelled':
        return <span className="chip text-steel-500">{labels.cancelled}</span>
      default:
        return <span className="chip">{request.status}</span>
    }
  }

  if (loading) {
    return (
      <AppLayout userEmail={profile?.email} userRole={profile?.role}>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-steel-400">{labels.loading}</div>
        </div>
      </AppLayout>
    )
  }

  const isTechnician = profile?.role === 'technician'

  return (
    <AppLayout userEmail={profile?.email} userRole={profile?.role}>
      <div className="p-6 lg:p-8 max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-white mb-6">
          {isTechnician ? labels.title : labels.titleCompany}
        </h1>

        {error && (
          <div className="mb-6 p-4 rounded-lg bg-error-600/20 border border-error-500/30 text-error-400">
            {error}
          </div>
        )}

        {requests.length === 0 ? (
          <div className="card p-8 text-center">
            <svg className="w-12 h-12 text-steel-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
            <p className="text-steel-400">{labels.noRequests}</p>
            {!isTechnician && (
              <button
                onClick={() => router.push('/search')}
                className="btn-primary mt-4"
              >
                {labels.searchTechnicians}
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {requests.map((request) => (
              <div 
                key={request.id} 
                className={`
                  ${request.status === 'pending' ? 'request-card-pending' : 
                    request.status === 'accepted' ? 'request-card-accepted' : 
                    request.status === 'rejected' ? 'request-card-rejected' : 'request-card'}
                `}
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-white">{request.final_client_name}</h3>
                    <p className="text-sm text-steel-400">{request.work_location}</p>
                    {request.is_test && (
                      <p className="text-xs text-gold-400 mt-1">
                        {language === 'es' ? 'Oferta de prueba (sin efectos reales)' : 'Test offer (no real effects)'}
                      </p>
                    )}
                  </div>
                  {getStatusBadge(request)}
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                  <div>
                    <p className="text-steel-500">{labels.period}</p>
                    <p className="text-white">
                      {new Date(request.start_date).toLocaleDateString(language === 'es' ? 'es-ES' : 'en-GB')} - {new Date(request.end_date).toLocaleDateString(language === 'es' ? 'es-ES' : 'en-GB')}
                    </p>
                  </div>
                  <div>
                    <p className="text-steel-500">{labels.contractType}</p>
                    <p className="text-white">
                      {request.contract_type === 'short-term' ? labels.shortTerm : labels.longTerm}
                    </p>
                  </div>
                </div>

                {request.notes && (
                  <div className="mb-4">
                    <p className="text-steel-500 text-sm">{labels.notes}</p>
                    <p className="text-steel-300 text-sm">{request.notes}</p>
                  </div>
                )}

                {/* Work Mode Info (for accepted jobs) */}
                {request.status === 'accepted' && request.work_mode && (
                  <div className="mb-4 p-3 rounded-lg bg-navy-800/50 border border-steel-700/30">
                    <div className="flex items-center gap-4 text-sm">
                      <div>
                        <span className="text-steel-500">{labels.workMode}: </span>
                        <span className="text-gold-400 font-medium">
                          {workModeLabels[request.work_mode] || request.work_mode}
                        </span>
                      </div>
                      {request.umbrella_provider_name && (
                        <div>
                          <span className="text-steel-500">{labels.umbrellaProvider}: </span>
                          <span className="text-white">{request.umbrella_provider_name}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {!isTechnician && request.status === 'accepted' && (
                  <div className="mb-4 flex gap-2">
                    <button
                      onClick={() => {
                        setAmxRequest(request)
                        setShowAMXModal(true)
                      }}
                      className="btn-secondary flex-1 text-center"
                    >
                      {language === 'es' ? 'Ver AMX' : 'View AMX'}
                    </button>
                    <a
                      href={`/api/technicians/${request.technician_id}/logbook/download`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`btn-secondary flex-1 text-center ${request.has_logbook ? '' : 'opacity-50 pointer-events-none'}`}
                    >
                      {language === 'es' ? 'Ver Logbook' : 'View Logbook'}
                    </a>
                  </div>
                )}

                {/* UK Right to Work Warning for technicians on pending requests */}
                {isTechnician && request.status === 'pending' && request.requires_right_to_work_uk && technicianData?.right_to_work_uk !== true && (
                  <div className="mb-4 p-4 rounded-xl bg-warning-500/10 border border-warning-500/30">
                    <div className="flex items-start gap-3">
                      <span className="text-xl">⚠️</span>
                      <div>
                        <p className="text-white font-medium mb-2">
                          {language === 'es' ? 'Se requiere elegibilidad laboral en UK' : 'UK Work Eligibility Required'}
                        </p>
                        <p className="text-sm text-steel-300 whitespace-pre-line">
                          {language === 'es' 
                            ? 'Este trabajo requiere Right to Work legal en UK para ejecutar el contrato. AeroMatch NO sponsoriza visados ni provee seguro directamente.\n\nDebes gestionar la elegibilidad mediante:\n• Umbrella/EoR (facturación MoR + seguro bajo términos del proveedor), O\n• Sponsorship de visado / Right to Work UK independiente.'
                            : 'This job requires legal Right to Work in the UK to execute the contract. AeroMatch does NOT sponsor VISAs or provide insurance directly.\n\nYou must arrange eligibility via:\n• Umbrella/EoR (MoR billing + insurance under provider terms), OR\n• VISA sponsorship / Right to Work UK independently.'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* UK RTW badge if required */}
                {request.requires_right_to_work_uk && (
                  <div className="mb-4">
                    <span className="chip-warning text-xs">
                      🇬🇧 {labels.ukRtw} {labels.required}
                    </span>
                  </div>
                )}

                {/* Action buttons for pending requests (technician only) */}
                {isTechnician && request.status === 'pending' && (
                  <div className="flex gap-3 pt-4 border-t border-steel-700/30">
                    <button
                      onClick={() => handleAcceptClick(request)}
                      disabled={updating === request.id}
                      className="btn-primary flex-1"
                    >
                      {labels.accept}
                    </button>
                    <button
                      onClick={() => openRejectModal(request)}
                      disabled={updating === request.id}
                      className="btn-danger flex-1"
                    >
                      {updating === request.id ? labels.processing : labels.reject}
                    </button>
                  </div>
                )}

                {isTechnician && request.is_test && request.status !== 'pending' && (
                  <div className="mt-4 p-3 rounded-lg bg-success-500/10 border border-success-500/30 text-success-300 text-sm">
                    {language === 'es'
                      ? '¡Perfecto! Así es exactamente como funciona cuando recibes una oferta real. Tu respuesta no ha generado ningún efecto.'
                      : 'Perfect! This is exactly how real offers work. Your response generated no real effects.'}
                  </div>
                )}

                {/* Rating prompt for companies (job completed + not rated) */}
                {!isTechnician && shouldShowRatingPrompt(request) && (
                  <div className="mt-4 p-4 rounded-xl bg-gradient-to-r from-gold-500/10 to-gold-500/5 border border-gold-500/30">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">⭐</span>
                        <div>
                          <p className="text-white font-medium">{labels.ratingPending}</p>
                          <p className="text-xs text-steel-400">
                            {language === 'es' 
                              ? 'Tu valoración ayuda a otros a encontrar buenos técnicos'
                              : 'Your rating helps others find great technicians'}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleRateClick(request)}
                        className="btn-primary"
                      >
                        {labels.rateNow}
                      </button>
                    </div>
                  </div>
                )}

                {/* Delete button (technicians + companies) */}
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-steel-700/30">
                  <p className="text-xs text-steel-600">
                    {labels.created}: {new Date(request.created_at).toLocaleDateString(language === 'es' ? 'es-ES' : 'en-GB')}
                  </p>
                  
                  {canDeleteRequest(request) && (
                    <button
                      onClick={() => handleDeleteClick(request)}
                      className="text-xs text-steel-500 hover:text-error-400 transition-colors flex items-center gap-1"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      {labels.deleteRequest}
                    </button>
                  )}
                  
                  {!canDeleteRequest(request) && request.status === 'accepted' && (
                    <span className="text-xs text-steel-600 italic">
                      {labels.cannotDeleteAccepted}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Accept Job Modal */}
      {selectedRequest && (
        <AcceptJobModal
          isOpen={acceptModalOpen}
          onClose={() => {
            setAcceptModalOpen(false)
            setSelectedRequest(null)
          }}
          jobRequest={selectedRequest}
          onAccepted={handleAccepted}
          technicianHasRightToWorkUK={technicianData?.right_to_work_uk === true}
          technicianVerificationStatus={technicianData?.verification_status || 'unverified'}
          initialPresentationMessage={profile?.presentation_message_template || undefined}
        />
      )}

      {/* Reject Modal */}
      {rejectModalOpen && rejectingRequest && (
        <div className="modal-overlay" onClick={() => setRejectModalOpen(false)}>
          <div className="modal p-6 max-w-lg" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-bold text-white mb-4">{labels.rejectModalTitle}</h3>
            <p className="text-steel-300 mb-2">{labels.rejectModalBody}</p>
            <label className="label">{labels.rejectReasonLabel}</label>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="textarea h-28"
              placeholder={language === 'es' ? 'Escribe el motivo...' : 'Write your reason...'}
            />
            <p className="text-steel-300 mt-2">{labels.rejectModalFooter}</p>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setRejectModalOpen(false)} className="btn-secondary flex-1">
                {labels.cancel}
              </button>
              <button
                onClick={handleReject}
                disabled={updating === rejectingRequest.id || rejectionReason.trim().length < 10}
                className="btn-danger flex-1"
              >
                {updating === rejectingRequest.id ? labels.processing : labels.confirmReject}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rating Modal (for companies) */}
      {ratingRequest && (
        <RatingModal
          isOpen={ratingModalOpen}
          onClose={() => {
            setRatingModalOpen(false)
            setRatingRequest(null)
          }}
          technicianName={ratingRequest.technician_name || 'Técnico'}
          jobTitle={ratingRequest.final_client_name}
          onSubmit={handleSubmitRating}
        />
      )}

      {amxRequest && (
        <AMXSummaryModal
          isOpen={showAMXModal}
          onClose={() => {
            setShowAMXModal(false)
            setAmxRequest(null)
          }}
          technicianId={amxRequest.technician_id}
          techId={amxRequest.technician_id.substring(0, 8).toUpperCase()}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && requestToDelete && (
        <div className="modal-overlay" onClick={() => setDeleteModalOpen(false)}>
          <div className="modal p-6 max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-full bg-error-500/10 flex items-center justify-center">
                <svg className="w-6 h-6 text-error-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">{labels.deleteConfirmTitle}</h3>
                <p className="text-sm text-steel-400">{labels.deleteConfirmText}</p>
              </div>
            </div>

            <div className="p-4 rounded-lg bg-navy-800/50 border border-steel-700/30 mb-6">
              <p className="text-white font-medium">{requestToDelete.final_client_name}</p>
              <p className="text-sm text-steel-400">{requestToDelete.work_location}</p>
              <p className="text-xs text-steel-500 mt-1">
                {new Date(requestToDelete.start_date).toLocaleDateString()} - {new Date(requestToDelete.end_date).toLocaleDateString()}
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setDeleteModalOpen(false)
                  setRequestToDelete(null)
                }}
                className="btn-secondary flex-1"
                disabled={deleting}
              >
                {labels.cancel}
              </button>
              <button
                onClick={confirmDelete}
                disabled={deleting}
                className="flex-1 px-4 py-2 rounded-lg bg-error-600 hover:bg-error-500 text-white font-medium transition-colors disabled:opacity-50"
              >
                {deleting ? labels.processing : labels.delete}
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  )
}
