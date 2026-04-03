'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Logo } from '@/components/ui/Logo'

interface Metrics {
  totalTechnicians: number
  totalCompanies: number
  totalJobRequests: number
  totalAccepted: number
  totalCompleted: number
  totalRatings: number
  totalFoundingPremium: number
  techsWithDocs: number
  techsWithAvailability: number
  totalDocuments: number
}

interface Technician {
  id: string
  email: string
  fullName: string
  createdAt: string
  hasCapabilities: boolean
  docsCount: number
  availCount: number
  hasPremium: boolean
  premiumExpires?: string
  profileActive?: boolean
}

interface Company {
  id: string
  email: string
  fullName: string
  companyName?: string
  companyType?: string
  createdAt: string
  totalJobs: number
  acceptedJobs: number
}

interface VerificationTechnician {
  id: string
  email: string
  fullName: string
  verificationStatus: 'unverified' | 'pending' | 'verified' | 'rejected'
  availabilityStatus: string
  verifiedAt: string | null
  verificationNotes: string | null
  licenseCategory: string[]
  aircraftTypes: string[]
  isAvailable: boolean
  documents: {
    id: string
    docType: string
    status: string
    storagePath: string
    expiresOn: string | null
    createdAt: string
  }[]
  docsCount: number
}

interface Certificate {
  id: string
  reference_id: string
  status: 'pending' | 'checked' | 'rejected'
  generated_at: string
  checked_at: string | null
}

export default function AdminPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [authorized, setAuthorized] = useState(false)
  const [activeTab, setActiveTab] = useState<'metrics' | 'verification' | 'technicians' | 'companies'>('metrics')
  const [metrics, setMetrics] = useState<Metrics | null>(null)
  const [technicians, setTechnicians] = useState<Technician[]>([])
  const [companies, setCompanies] = useState<Company[]>([])
  
  // Verification tab state
  const [verificationList, setVerificationList] = useState<VerificationTechnician[]>([])
  const [verificationFilter, setVerificationFilter] = useState<'all' | 'pending' | 'unverified' | 'verified'>('all')
  const [selectedTech, setSelectedTech] = useState<VerificationTechnician | null>(null)
  const [verifying, setVerifying] = useState(false)
  const [verifyNotes, setVerifyNotes] = useState('')
  const [viewingDoc, setViewingDoc] = useState<{ url: string; type: string } | null>(null)
  const [loadingDoc, setLoadingDoc] = useState<string | null>(null)
  
  // Certificate state
  const [selectedCertificate, setSelectedCertificate] = useState<Certificate | null>(null)
  const [loadingCertificate, setLoadingCertificate] = useState(false)
  const [viewingCertPdf, setViewingCertPdf] = useState<string | null>(null)
  const [userActionLoading, setUserActionLoading] = useState<string | null>(null)

  useEffect(() => {
    checkAuth()
  }, [])

  useEffect(() => {
    if (authorized) {
      if (activeTab === 'metrics') fetchMetrics()
      if (activeTab === 'technicians') fetchTechnicians()
      if (activeTab === 'companies') fetchCompanies()
      if (activeTab === 'verification') fetchVerificationList()
    }
  }, [authorized, activeTab, verificationFilter])

  const checkAuth = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      router.push('/auth')
      return
    }

    // Check with metrics endpoint (will return 403 if not admin)
    const res = await fetch('/api/admin/metrics')
    if (res.ok) {
      setAuthorized(true)
    } else {
      router.push('/dashboard')
    }
    setLoading(false)
  }

  const fetchMetrics = async () => {
    const res = await fetch('/api/admin/metrics')
    if (res.ok) {
      const data = await res.json()
      setMetrics(data)
    }
  }

  const fetchTechnicians = async () => {
    const res = await fetch('/api/admin/users?type=technicians')
    if (res.ok) {
      const data = await res.json()
      setTechnicians(data.users || [])
    }
  }

  const fetchCompanies = async () => {
    const res = await fetch('/api/admin/users?type=companies')
    if (res.ok) {
      const data = await res.json()
      setCompanies(data.users || [])
    }
  }

  const fetchVerificationList = async () => {
    const res = await fetch(`/api/admin/verification?filter=${verificationFilter}`)
    if (res.ok) {
      const data = await res.json()
      setVerificationList(data.technicians || [])
    }
  }

  const handleViewDocument = async (docId: string) => {
    setLoadingDoc(docId)
    try {
      const res = await fetch(`/api/admin/documents/${docId}`)
      if (res.ok) {
        const data = await res.json()
        setViewingDoc({ url: data.url, type: data.docType })
      }
    } catch (err) {
      console.error('Error loading document:', err)
    } finally {
      setLoadingDoc(null)
    }
  }

  const handleVerify = async (status: 'verified' | 'rejected' | 'pending') => {
    if (!selectedTech) return
    setVerifying(true)

    try {
      const res = await fetch('/api/admin/verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          technicianId: selectedTech.id,
          status,
          notes: verifyNotes || null,
        }),
      })

      if (res.ok) {
        // Refresh list
        fetchVerificationList()
        // Refresh certificate (may have been generated)
        if (selectedTech) {
          await fetchCertificateForTech(selectedTech.id)
        }
        // Keep modal open to show updated certificate
        // Update the selected tech status locally
        setSelectedTech(prev => prev ? { ...prev, verificationStatus: status } : null)
      }
    } catch (err) {
      console.error('Error updating verification:', err)
    } finally {
      setVerifying(false)
    }
  }

  const getDocTypeLabel = (docType: string) => {
    const labels: Record<string, string> = {
      easa_license: 'Licencia EASA',
      uk_license: 'Licencia UK CAA',
      faa_ap: 'FAA A&P',
      passport: 'Pasaporte',
      cv: 'CV',
      medical: 'Certificado Médico',
      training: 'Certificado Formación',
    }
    // Handle aircraft type docs
    if (docType.startsWith('type_') && docType.endsWith('_theory')) {
      return `Teórico: ${docType.replace('type_', '').replace('_theory', '').toUpperCase()}`
    }
    if (docType.startsWith('type_') && docType.endsWith('_practical')) {
      return `Práctico: ${docType.replace('type_', '').replace('_practical', '').toUpperCase()}`
    }
    return labels[docType] || docType
  }

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'verified': return 'bg-green-500/20 text-green-400 border-green-500/30'
      case 'pending': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
      case 'rejected': return 'bg-red-500/20 text-red-400 border-red-500/30'
      default: return 'bg-steel-700/50 text-steel-400 border-steel-600/30'
    }
  }

  const fetchCertificateForTech = async (techId: string) => {
    setLoadingCertificate(true)
    setSelectedCertificate(null)
    try {
      const res = await fetch(
        `/api/certificates?technician_id=${encodeURIComponent(techId)}`,
        { credentials: 'include' }
      )
      if (!res.ok) {
        console.error('Certificate fetch failed', res.status)
        return
      }
      const data = await res.json()
      const list = data.certificates || []
      if (list.length > 0) {
        const c = list[0]
        setSelectedCertificate({
          id: c.id,
          reference_id: c.reference_id,
          status: c.status,
          generated_at: c.generated_at,
          checked_at: c.checked_at ?? null,
        })
      }
    } catch (err) {
      console.error('Error fetching certificate:', err)
    } finally {
      setLoadingCertificate(false)
    }
  }

  const handleSelectTech = async (tech: VerificationTechnician) => {
    setSelectedTech(tech)
    setVerifyNotes(tech.verificationNotes || '')
    fetchCertificateForTech(tech.id)
  }

  const handleViewCertPdf = async () => {
    if (!selectedCertificate) return
    try {
      const res = await fetch(`/api/certificates/${selectedCertificate.id}/download`)
      if (!res.ok) throw new Error('Error fetching PDF')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      setViewingCertPdf(url)
    } catch (err) {
      console.error('Error viewing certificate:', err)
      alert('Error al cargar el certificado')
    }
  }

  const handleDownloadCertPdf = async () => {
    if (!selectedCertificate) return
    try {
      const res = await fetch(`/api/certificates/${selectedCertificate.id}/download`)
      if (!res.ok) throw new Error('Error fetching PDF')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${selectedCertificate.reference_id}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Error downloading certificate:', err)
      alert('Error al descargar el certificado')
    }
  }

  const handleBlockTechnician = async (userId: string) => {
    if (!confirm('¿Bloquear este técnico? Se ocultará de las búsquedas.')) return
    setUserActionLoading(`block-${userId}`)
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, action: 'block' })
      })
      if (!res.ok) throw new Error('Error bloqueando usuario')
      fetchTechnicians()
    } catch (err) {
      console.error(err)
      alert('No se pudo bloquear el usuario')
    } finally {
      setUserActionLoading(null)
    }
  }

  const handleDeleteTechnician = async (userId: string) => {
    if (!confirm('¿Eliminar completamente este usuario? Esta acción es irreversible.')) return
    setUserActionLoading(`delete-${userId}`)
    try {
      const res = await fetch(`/api/admin/users?userId=${encodeURIComponent(userId)}`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error('Error eliminando usuario')
      fetchTechnicians()
    } catch (err) {
      console.error(err)
      alert('No se pudo eliminar el usuario')
    } finally {
      setUserActionLoading(null)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-navy-950 flex items-center justify-center">
        <div className="text-steel-400">Loading...</div>
      </div>
    )
  }

  if (!authorized) {
    return null
  }

  return (
    <div className="min-h-screen bg-navy-950">
      {/* Header */}
      <header className="border-b border-steel-800 bg-navy-900/50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Logo size="sm" />
            <span className="text-gold-400 font-semibold">Admin Panel</span>
          </div>
          <a href="/dashboard" className="text-steel-400 hover:text-white text-sm">
            ← Back to Dashboard
          </a>
        </div>
      </header>

      {/* Tabs */}
      <div className="border-b border-steel-800">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex gap-6">
            {(['metrics', 'verification', 'technicians', 'companies'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-4 px-2 border-b-2 font-medium transition-colors ${
                  activeTab === tab
                    ? 'border-gold-500 text-gold-400'
                    : 'border-transparent text-steel-400 hover:text-white'
                }`}
              >
                {tab === 'verification' ? '🔍 Verificación' : tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {activeTab === 'metrics' && metrics && (
          <div className="space-y-6">
            {/* Main metrics */}
            <div>
              <h3 className="text-steel-400 text-sm font-medium mb-3">Usuarios</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <MetricCard label="Técnicos" value={metrics.totalTechnicians} />
                <MetricCard label="Empresas" value={metrics.totalCompanies} />
                <MetricCard label="Premium Activos" value={metrics.totalFoundingPremium} highlight />
              </div>
            </div>

            {/* Profile completion metrics */}
            <div>
              <h3 className="text-steel-400 text-sm font-medium mb-3">Completitud de Perfiles</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <MetricCard label="Con Documentos" value={metrics.techsWithDocs} subtitle={`de ${metrics.totalTechnicians}`} />
                <MetricCard label="Con Disponibilidad" value={metrics.techsWithAvailability} subtitle={`de ${metrics.totalTechnicians}`} />
                <MetricCard label="Total Documentos" value={metrics.totalDocuments} />
              </div>
            </div>

            {/* Job metrics */}
            <div>
              <h3 className="text-steel-400 text-sm font-medium mb-3">Actividad de Trabajos</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <MetricCard label="Solicitudes" value={metrics.totalJobRequests} />
                <MetricCard label="Aceptadas" value={metrics.totalAccepted} />
                <MetricCard label="Completadas" value={metrics.totalCompleted} />
                <MetricCard label="Valoraciones" value={metrics.totalRatings} />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'verification' && (
          <div className="space-y-6">
            {/* Filters */}
            <div className="flex items-center gap-4">
              <span className="text-steel-400 text-sm">Filtrar:</span>
              {(['all', 'pending', 'unverified', 'verified'] as const).map(filter => (
                <button
                  key={filter}
                  onClick={() => setVerificationFilter(filter)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    verificationFilter === filter
                      ? 'bg-gold-500/20 text-gold-400 border border-gold-500/30'
                      : 'bg-navy-800 text-steel-400 border border-steel-700 hover:border-steel-600'
                  }`}
                >
                  {filter === 'all' ? 'Todos' : 
                   filter === 'pending' ? '⏳ Pendientes' :
                   filter === 'unverified' ? '❓ Sin verificar' : '✅ Verificados'}
                </button>
              ))}
            </div>

            {/* List */}
            <div className="space-y-4">
              {verificationList.length === 0 ? (
                <div className="text-center py-12 text-steel-500">
                  No hay técnicos en esta categoría
                </div>
              ) : (
                verificationList.map(tech => (
                  <div 
                    key={tech.id}
                    className="p-5 rounded-xl border border-steel-700 bg-navy-800/30 hover:border-steel-600 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-white font-medium">{tech.fullName || tech.email}</h3>
                          <span className={`px-2 py-0.5 rounded-full text-xs border ${getStatusBadgeColor(tech.verificationStatus)}`}>
                            {tech.verificationStatus === 'verified' ? '✅ Verificado' :
                             tech.verificationStatus === 'pending' ? '⏳ Pendiente' :
                             tech.verificationStatus === 'rejected' ? '❌ Rechazado' : '❓ Sin verificar'}
                          </span>
                        </div>
                        <p className="text-sm text-steel-400">{tech.email}</p>
                        
                        {/* Licenses & Aircraft */}
                        <div className="flex flex-wrap gap-2 mt-3">
                          {tech.licenseCategory?.map(lic => (
                            <span key={lic} className="px-2 py-0.5 bg-gold-500/10 border border-gold-500/30 rounded text-xs text-gold-400">
                              {lic}
                            </span>
                          ))}
                          {tech.aircraftTypes?.slice(0, 3).map(ac => (
                            <span key={ac} className="px-2 py-0.5 bg-navy-700 border border-steel-600 rounded text-xs text-steel-300">
                              {ac}
                            </span>
                          ))}
                          {tech.aircraftTypes?.length > 3 && (
                            <span className="text-xs text-steel-500">+{tech.aircraftTypes.length - 3} más</span>
                          )}
                        </div>

                        {/* Documents count */}
                        <p className="text-sm text-steel-500 mt-2">
                          📄 {tech.docsCount} documento{tech.docsCount !== 1 ? 's' : ''} subido{tech.docsCount !== 1 ? 's' : ''}
                        </p>
                      </div>

                      <button
                        onClick={() => handleSelectTech(tech)}
                        className="btn-primary"
                      >
                        Revisar
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'technicians' && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-steel-700">
                  <th className="text-left py-3 px-4 text-steel-400 font-medium">Email</th>
                  <th className="text-left py-3 px-4 text-steel-400 font-medium">Name</th>
                  <th className="text-center py-3 px-4 text-steel-400 font-medium">Capabilities</th>
                  <th className="text-center py-3 px-4 text-steel-400 font-medium">Docs</th>
                  <th className="text-center py-3 px-4 text-steel-400 font-medium">Avail</th>
                  <th className="text-center py-3 px-4 text-steel-400 font-medium">Premium</th>
                  <th className="text-center py-3 px-4 text-steel-400 font-medium">Estado</th>
                  <th className="text-center py-3 px-4 text-steel-400 font-medium">Acciones</th>
                  <th className="text-left py-3 px-4 text-steel-400 font-medium">Registered</th>
                </tr>
              </thead>
              <tbody>
                {technicians.map(t => (
                  <tr key={t.id} className="border-b border-steel-800 hover:bg-navy-800/30">
                    <td className="py-3 px-4 text-white">{t.email}</td>
                    <td className="py-3 px-4 text-steel-300">{t.fullName || '-'}</td>
                    <td className="py-3 px-4 text-center">
                      <StatusBadge ok={t.hasCapabilities} />
                    </td>
                    <td className="py-3 px-4 text-center text-steel-300">{t.docsCount}</td>
                    <td className="py-3 px-4 text-center text-steel-300">{t.availCount}</td>
                    <td className="py-3 px-4 text-center">
                      {t.hasPremium ? (
                        <span className="text-gold-400 text-xs">✓ Premium</span>
                      ) : (
                        <span className="text-steel-500">-</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {t.profileActive === false ? (
                        <span className="text-red-400 text-xs">Bloqueado</span>
                      ) : (
                        <span className="text-green-400 text-xs">Activo</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleBlockTechnician(t.id)}
                          disabled={userActionLoading === `block-${t.id}` || t.profileActive === false}
                          className="px-2 py-1 rounded bg-yellow-500/10 border border-yellow-500/30 text-yellow-300 text-xs disabled:opacity-50"
                        >
                          Bloquear
                        </button>
                        <button
                          onClick={() => handleDeleteTechnician(t.id)}
                          disabled={userActionLoading === `delete-${t.id}`}
                          className="px-2 py-1 rounded bg-red-500/10 border border-red-500/30 text-red-300 text-xs disabled:opacity-50"
                        >
                          Eliminar
                        </button>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-steel-400 text-xs">
                      {new Date(t.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {technicians.length === 0 && (
              <p className="text-steel-500 text-center py-8">No technicians found</p>
            )}
          </div>
        )}

        {activeTab === 'companies' && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-steel-700">
                  <th className="text-left py-3 px-4 text-steel-400 font-medium">Email</th>
                  <th className="text-left py-3 px-4 text-steel-400 font-medium">Company</th>
                  <th className="text-left py-3 px-4 text-steel-400 font-medium">Type</th>
                  <th className="text-center py-3 px-4 text-steel-400 font-medium">Jobs</th>
                  <th className="text-center py-3 px-4 text-steel-400 font-medium">Accepted</th>
                  <th className="text-left py-3 px-4 text-steel-400 font-medium">Registered</th>
                </tr>
              </thead>
              <tbody>
                {companies.map(c => (
                  <tr key={c.id} className="border-b border-steel-800 hover:bg-navy-800/30">
                    <td className="py-3 px-4 text-white">{c.email}</td>
                    <td className="py-3 px-4 text-steel-300">{c.companyName || '-'}</td>
                    <td className="py-3 px-4 text-steel-400 text-xs">{c.companyType || '-'}</td>
                    <td className="py-3 px-4 text-center text-steel-300">{c.totalJobs}</td>
                    <td className="py-3 px-4 text-center text-steel-300">{c.acceptedJobs}</td>
                    <td className="py-3 px-4 text-steel-400 text-xs">
                      {new Date(c.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {companies.length === 0 && (
              <p className="text-steel-500 text-center py-8">No companies found</p>
            )}
          </div>
        )}
      </main>

      {/* Verification Modal */}
      {selectedTech && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-navy-900 border border-steel-700 rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="p-6 border-b border-steel-700 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-white">{selectedTech.fullName || selectedTech.email}</h2>
                <p className="text-sm text-steel-400">{selectedTech.email}</p>
              </div>
              <button 
                onClick={() => {
                  setSelectedTech(null)
                  setSelectedCertificate(null)
                }}
                className="text-steel-400 hover:text-white"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {/* Current Status */}
              <div className="mb-6 p-4 rounded-xl bg-navy-800/50 border border-steel-700/50">
                <div className="flex items-center gap-4">
                  <span className="text-steel-400 text-sm">Estado actual:</span>
                  <span className={`px-3 py-1 rounded-full text-sm border ${getStatusBadgeColor(selectedTech.verificationStatus)}`}>
                    {selectedTech.verificationStatus === 'verified' ? '✅ Verificado' :
                     selectedTech.verificationStatus === 'pending' ? '⏳ Pendiente' :
                     selectedTech.verificationStatus === 'rejected' ? '❌ Rechazado' : '❓ Sin verificar'}
                  </span>
                  {selectedTech.verifiedAt && (
                    <span className="text-xs text-steel-500">
                      desde {new Date(selectedTech.verifiedAt).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>

              {/* Licenses & Aircraft */}
              <div className="mb-6">
                <h4 className="text-sm font-medium text-steel-400 mb-2">Licencias y Aeronaves</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedTech.licenseCategory?.map(lic => (
                    <span key={lic} className="px-2 py-1 bg-gold-500/10 border border-gold-500/30 rounded text-sm text-gold-400">
                      {lic}
                    </span>
                  ))}
                  {selectedTech.aircraftTypes?.map(ac => (
                    <span key={ac} className="px-2 py-1 bg-navy-700 border border-steel-600 rounded text-sm text-steel-300">
                      {ac}
                    </span>
                  ))}
                </div>
              </div>

              {/* Documents */}
              <div className="mb-6">
                <h4 className="text-sm font-medium text-steel-400 mb-3">
                  Documentos ({selectedTech.documents.length})
                </h4>
                {selectedTech.documents.length === 0 ? (
                  <p className="text-steel-500 text-sm">No ha subido documentos</p>
                ) : (
                  <div className="space-y-2">
                    {selectedTech.documents.map(doc => (
                      <div 
                        key={doc.id}
                        className="flex items-center justify-between p-3 rounded-lg bg-navy-800 border border-steel-700/50"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-lg">📄</span>
                          <div>
                            <p className="text-white text-sm font-medium">{getDocTypeLabel(doc.docType)}</p>
                            <p className="text-xs text-steel-500">
                              Subido: {new Date(doc.createdAt).toLocaleDateString()}
                              {doc.expiresOn && ` • Expira: ${new Date(doc.expiresOn).toLocaleDateString()}`}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleViewDocument(doc.id)}
                          disabled={loadingDoc === doc.id}
                          className="btn-secondary text-sm py-1.5"
                        >
                          {loadingDoc === doc.id ? '...' : '👁️ Ver'}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* AMX Certificate Section */}
              <div className="mb-6 p-4 rounded-xl bg-navy-800/50 border border-steel-700/50">
                <h4 className="text-sm font-medium text-steel-400 mb-3 flex items-center gap-2">
                  📜 Certificado AMX
                </h4>
                {loadingCertificate ? (
                  <p className="text-steel-500 text-sm">Cargando...</p>
                ) : selectedCertificate ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-4 flex-wrap">
                      <span className="text-white font-mono text-sm">{selectedCertificate.reference_id}</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs border ${
                        selectedCertificate.status === 'checked' ? 'bg-green-500/20 text-green-400 border-green-500/30' :
                        selectedCertificate.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' :
                        'bg-red-500/20 text-red-400 border-red-500/30'
                      }`}>
                        {selectedCertificate.status === 'checked' ? '✅ Revisado' :
                         selectedCertificate.status === 'pending' ? '⏳ Pendiente' : '❌ Rechazado'}
                      </span>
                      <span className="text-xs text-steel-500">
                        Generado: {new Date(selectedCertificate.generated_at).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      <button
                        onClick={handleViewCertPdf}
                        className="px-3 py-1.5 text-sm bg-navy-700 border border-steel-600 rounded-lg text-steel-300 hover:text-white hover:border-steel-500 transition-colors"
                      >
                        👁️ Ver PDF
                      </button>
                      <button
                        onClick={handleDownloadCertPdf}
                        className="px-3 py-1.5 text-sm bg-navy-700 border border-steel-600 rounded-lg text-steel-300 hover:text-white hover:border-steel-500 transition-colors"
                      >
                        ⬇️ Descargar
                      </button>
                    </div>
                    {selectedCertificate.status === 'pending' && (
                      <p className="text-xs text-steel-500 mt-2">
                        💡 El certificado se marcará como "Revisado" automáticamente al hacer clic en "Verificar"
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-steel-400 text-sm">
                      Aún no hay certificado AMX. Pulsa <strong className="text-steel-300">Pendiente</strong> para generarlo; después podrás <strong className="text-steel-300">ver y descargar el PDF</strong> aquí (mismo PDF que en el perfil del técnico).
                    </p>
                    <button
                      type="button"
                      onClick={() => selectedTech && fetchCertificateForTech(selectedTech.id)}
                      disabled={loadingCertificate}
                      className="px-3 py-1.5 text-sm bg-navy-700 border border-steel-600 rounded-lg text-steel-300 hover:text-white hover:border-steel-500 transition-colors disabled:opacity-50"
                    >
                      {loadingCertificate ? '…' : '🔄 Comprobar de nuevo'}
                    </button>
                  </div>
                )}
              </div>

              {/* Notes */}
              <div className="mb-6">
                <label className="text-sm font-medium text-steel-400 mb-2 block">
                  Notas de verificación (opcional)
                </label>
                <textarea
                  value={verifyNotes}
                  onChange={(e) => setVerifyNotes(e.target.value)}
                  placeholder="Añade notas sobre la verificación..."
                  className="w-full px-4 py-3 bg-navy-800 border border-steel-700 rounded-lg text-white text-sm focus:border-gold-500 focus:outline-none"
                  rows={3}
                />
              </div>
            </div>

            {/* Modal Footer - Actions */}
            <div className="p-6 border-t border-steel-700 bg-navy-900/50">
              <div className="flex gap-3">
                <button
                  onClick={() => handleVerify('rejected')}
                  disabled={verifying}
                  className="flex-1 py-3 px-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 font-medium hover:bg-red-500/20 transition-colors disabled:opacity-50"
                >
                  ❌ Rechazar
                </button>
                <button
                  onClick={() => handleVerify('pending')}
                  disabled={verifying}
                  className="flex-1 py-3 px-4 rounded-xl bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 font-medium hover:bg-yellow-500/20 transition-colors disabled:opacity-50"
                >
                  ⏳ Pendiente
                </button>
                <button
                  onClick={() => handleVerify('verified')}
                  disabled={verifying}
                  className="flex-1 py-3 px-4 rounded-xl bg-green-500/10 border border-green-500/30 text-green-400 font-medium hover:bg-green-500/20 transition-colors disabled:opacity-50"
                >
                  ✅ Verificar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Document Viewer Modal */}
      {viewingDoc && (
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60] flex items-center justify-center p-4"
          onClick={() => setViewingDoc(null)}
        >
          <div 
            className="bg-navy-900 border border-steel-700 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-steel-700 flex items-center justify-between">
              <h3 className="text-white font-medium">{getDocTypeLabel(viewingDoc.type)}</h3>
              <div className="flex items-center gap-3">
                <a 
                  href={viewingDoc.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-gold-400 hover:text-gold-300 text-sm"
                >
                  Abrir en nueva pestaña ↗
                </a>
                <button 
                  onClick={() => setViewingDoc(null)}
                  className="text-steel-400 hover:text-white"
                >
                  ✕
                </button>
              </div>
            </div>
            <div className="h-[70vh] bg-navy-950">
              <iframe 
                src={viewingDoc.url} 
                className="w-full h-full"
                title="Document viewer"
              />
            </div>
          </div>
        </div>
      )}

      {/* Certificate PDF Viewer Modal */}
      {viewingCertPdf && (
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[70] flex items-center justify-center p-4"
          onClick={() => {
            URL.revokeObjectURL(viewingCertPdf)
            setViewingCertPdf(null)
          }}
        >
          <div 
            className="bg-navy-900 border border-steel-700 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-steel-700 flex items-center justify-between">
              <h3 className="text-white font-medium">📜 Certificado AMX - {selectedCertificate?.reference_id}</h3>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleDownloadCertPdf}
                  className="text-gold-400 hover:text-gold-300 text-sm"
                >
                  ⬇️ Descargar
                </button>
                <button 
                  onClick={() => {
                    URL.revokeObjectURL(viewingCertPdf)
                    setViewingCertPdf(null)
                  }}
                  className="text-steel-400 hover:text-white"
                >
                  ✕
                </button>
              </div>
            </div>
            <div className="h-[70vh] bg-navy-950">
              <iframe 
                src={viewingCertPdf} 
                className="w-full h-full"
                title="Certificate PDF viewer"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function MetricCard({ label, value, highlight, subtitle }: { label: string, value: number, highlight?: boolean, subtitle?: string }) {
  return (
    <div className={`p-6 rounded-xl border ${highlight ? 'border-gold-500/50 bg-gold-500/5' : 'border-steel-700 bg-navy-800/30'}`}>
      <p className="text-steel-400 text-sm mb-1">{label}</p>
      <div className="flex items-baseline gap-2">
        <p className={`text-3xl font-bold ${highlight ? 'text-gold-400' : 'text-white'}`}>{value}</p>
        {subtitle && <span className="text-steel-500 text-sm">{subtitle}</span>}
      </div>
    </div>
  )
}

function StatusBadge({ ok }: { ok: boolean }) {
  return ok ? (
    <span className="text-success-400">✓</span>
  ) : (
    <span className="text-steel-500">✗</span>
  )
}
