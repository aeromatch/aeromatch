'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { AppLayout } from '@/components/ui/AppLayout'

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
  company_name?: string
  technician_name?: string
}

export default function RequestsPage() {
  const router = useRouter()
  const supabase = createClient()

  const [profile, setProfile] = useState<any>(null)
  const [requests, setRequests] = useState<JobRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

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

      setRequests(requestsData || [])
    } else {
      const { data: requestsData } = await supabase
        .from('job_requests')
        .select('*')
        .eq('company_id', user.id)
        .order('created_at', { ascending: false })

      setRequests(requestsData || [])
    }

    setLoading(false)
  }

  const handleUpdateStatus = async (requestId: string, newStatus: 'accepted' | 'rejected') => {
    setUpdating(requestId)
    setError(null)

    try {
      const response = await fetch(`/api/job-requests/${requestId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error)

      // Update local state
      setRequests(requests.map(r => 
        r.id === requestId ? { ...r, status: newStatus } : r
      ))
    } catch (err: any) {
      setError(err.message)
    } finally {
      setUpdating(null)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <span className="chip-warning">Pendiente</span>
      case 'accepted':
        return <span className="chip-success">Aceptada</span>
      case 'rejected':
        return <span className="chip-error">Rechazada</span>
      default:
        return <span className="chip">{status}</span>
    }
  }

  if (loading) {
    return (
      <AppLayout userEmail={profile?.email} userRole={profile?.role}>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-steel-400">Cargando...</div>
        </div>
      </AppLayout>
    )
  }

  const isTechnician = profile?.role === 'technician'

  return (
    <AppLayout userEmail={profile?.email} userRole={profile?.role}>
      <div className="p-6 lg:p-8 max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-white mb-6">
          {isTechnician ? 'Solicitudes Recibidas' : 'Mis Solicitudes'}
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
            <p className="text-steel-400">No hay solicitudes</p>
            {!isTechnician && (
              <button
                onClick={() => router.push('/search')}
                className="btn-primary mt-4"
              >
                Buscar Técnicos
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
                  {getStatusBadge(request.status)}
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                  <div>
                    <p className="text-steel-500">Período</p>
                    <p className="text-white">
                      {new Date(request.start_date).toLocaleDateString('es-ES')} - {new Date(request.end_date).toLocaleDateString('es-ES')}
                    </p>
                  </div>
                  <div>
                    <p className="text-steel-500">Tipo de contrato</p>
                    <p className="text-white">
                      {request.contract_type === 'short-term' ? 'Corto plazo' : 'Largo plazo'}
                    </p>
                  </div>
                </div>

                {request.notes && (
                  <div className="mb-4">
                    <p className="text-steel-500 text-sm">Notas</p>
                    <p className="text-steel-300 text-sm">{request.notes}</p>
                  </div>
                )}

                {isTechnician && request.status === 'pending' && (
                  <div className="flex gap-3 pt-4 border-t border-steel-700/30">
                    <button
                      onClick={() => handleUpdateStatus(request.id, 'accepted')}
                      disabled={updating === request.id}
                      className="btn-primary flex-1"
                    >
                      {updating === request.id ? 'Procesando...' : 'Aceptar'}
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(request.id, 'rejected')}
                      disabled={updating === request.id}
                      className="btn-danger flex-1"
                    >
                      Rechazar
                    </button>
                  </div>
                )}

                <p className="text-xs text-steel-600 mt-4">
                  Creada: {new Date(request.created_at).toLocaleDateString('es-ES')}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  )
}

