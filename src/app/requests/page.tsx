'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { AppLayout } from '@/components/ui/AppLayout'
import { AcceptJobModal } from '@/components/requests/AcceptJobModal'
import { RatingModal, RatingData } from '@/components/ratings/RatingModal'
import { useLanguage } from '@/lib/i18n/LanguageContext'

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
  // Workflow data (for accepted jobs)
  work_mode?: string
  umbrella_provider_name?: string
}

export default function RequestsPage() {
  const router = useRouter()
  const supabase = createClient()
  const { language } = useLanguage()

  const [profile, setProfile] = useState<any>(null)
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
    workMode: language === 'es' ? 'Modalidad' : 'Work Mode',
    selfEmployed: language === 'es' ? 'Autónomo' : 'Self-employed',
    umbrella: language === 'es' ? 'Umbrella' : 'Umbrella',
    umbrellaInsurance: language === 'es' ? 'Umbrella + Seguro' : 'Umbrella + Insurance',
    umbrellaProvider: language === 'es' ? 'Proveedor' : 'Provider',
    rateNow: language === 'es' ? 'Valorar técnico' : 'Rate technician',
    ratingPending: language === 'es' ? '¡Trabajo finalizado! Valora al técnico' : 'Job completed! Rate the technician',
    rated: language === 'es' ? 'Valorado' : 'Rated',
    completed: language === 'es' ? 'Completado' : 'Completed',
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
      const { data: requestsData } = await supabase
        .from('job_requests')
        .select('*')
        .eq('technician_id', user.id)
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

          // Merge workflow data into requests
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

  const handleReject = async (requestId: string) => {
    setUpdating(requestId)
    setError(null)

    try {
      const response = await fetch(`/api/job-requests/${requestId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'rejected' })
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error)

      // Update local state
      setRequests(requests.map(r => 
        r.id === requestId ? { ...r, status: 'rejected' } : r
      ))
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
    if (request.status !== 'accepted' || request.rated) return false
    const endDate = new Date(request.end_date)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return endDate < today
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
                      onClick={() => handleReject(request.id)}
                      disabled={updating === request.id}
                      className="btn-danger flex-1"
                    >
                      {updating === request.id ? labels.processing : labels.reject}
                    </button>
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

                <p className="text-xs text-steel-600 mt-4">
                  {labels.created}: {new Date(request.created_at).toLocaleDateString(language === 'es' ? 'es-ES' : 'en-GB')}
                </p>
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
        />
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
    </AppLayout>
  )
}
