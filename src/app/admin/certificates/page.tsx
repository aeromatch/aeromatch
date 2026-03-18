'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Logo } from '@/components/ui/Logo'

interface Certificate {
  id: string
  technician_id: string
  reference_id: string
  status: 'pending' | 'checked' | 'rejected'
  pdf_storage_path: string
  generated_at: string
  checked_at: string | null
  checked_by: string | null
  technicianName: string
  technicianEmail: string
  licenseCategory: string[]
  aircraftTypes: string[]
}

export default function AdminCertificatesPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [authorized, setAuthorized] = useState(false)
  const [certificates, setCertificates] = useState<Certificate[]>([])
  const [filter, setFilter] = useState<'all' | 'pending' | 'checked' | 'rejected'>('pending')
  const [updating, setUpdating] = useState<string | null>(null)
  const [viewingPdf, setViewingPdf] = useState<{ url: string; name: string } | null>(null)

  useEffect(() => {
    checkAuth()
  }, [])

  useEffect(() => {
    if (authorized) {
      fetchCertificates()
    }
  }, [authorized, filter])

  const checkAuth = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      router.push('/auth')
      return
    }

    const res = await fetch('/api/admin/metrics')
    if (res.ok) {
      setAuthorized(true)
    } else {
      router.push('/dashboard')
    }
    setLoading(false)
  }

  const fetchCertificates = async () => {
    const res = await fetch(`/api/certificates?status=${filter}`)
    if (res.ok) {
      const data = await res.json()
      setCertificates(data.certificates || [])
    }
  }

  const handleStatusChange = async (certId: string, newStatus: 'checked' | 'rejected' | 'pending') => {
    setUpdating(certId)
    try {
      const res = await fetch(`/api/certificates/${certId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })

      if (res.ok) {
        fetchCertificates()
      }
    } catch (error) {
      console.error('Error updating certificate:', error)
    } finally {
      setUpdating(null)
    }
  }

  const handleViewPdf = async (certId: string) => {
    try {
      const res = await fetch(`/api/certificates/${certId}/download`)
      if (res.ok) {
        const data = await res.json()
        setViewingPdf({ url: data.downloadUrl, name: data.fileName })
      }
    } catch (error) {
      console.error('Error getting PDF URL:', error)
    }
  }

  const handleDownloadPdf = async (certId: string, referenceId: string) => {
    try {
      const res = await fetch(`/api/certificates/${certId}/download`)
      if (res.ok) {
        const data = await res.json()
        const link = document.createElement('a')
        link.href = data.downloadUrl
        link.download = data.fileName
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      }
    } catch (error) {
      console.error('Error downloading PDF:', error)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'checked':
        return (
          <span className="px-2 py-1 rounded-full text-xs bg-green-500/20 text-green-400 border border-green-500/30">
            ✅ Checked
          </span>
        )
      case 'rejected':
        return (
          <span className="px-2 py-1 rounded-full text-xs bg-red-500/20 text-red-400 border border-red-500/30">
            ❌ Rejected
          </span>
        )
      default:
        return (
          <span className="px-2 py-1 rounded-full text-xs bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
            ⏳ Pending
          </span>
        )
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
            <span className="text-gold-400 font-semibold">Admin · Certificates</span>
          </div>
          <div className="flex items-center gap-4">
            <a href="/admin" className="text-steel-400 hover:text-white text-sm">
              ← Admin Panel
            </a>
            <a href="/dashboard" className="text-steel-400 hover:text-white text-sm">
              Dashboard
            </a>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Title and Stats */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white mb-2">
            📋 AMX Certificates Management
          </h1>
          <p className="text-steel-400">
            Review and approve technician documentation summaries
          </p>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-4 mb-6">
          <span className="text-steel-400 text-sm">Filter:</span>
          {(['pending', 'checked', 'rejected', 'all'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                filter === f
                  ? 'bg-gold-500/20 text-gold-400 border border-gold-500/30'
                  : 'bg-navy-800 text-steel-400 border border-steel-700 hover:border-steel-600'
              }`}
            >
              {f === 'pending' ? '⏳ Pending' :
               f === 'checked' ? '✅ Checked' :
               f === 'rejected' ? '❌ Rejected' : '📋 All'}
            </button>
          ))}
        </div>

        {/* Certificates List */}
        <div className="space-y-4">
          {certificates.length === 0 ? (
            <div className="text-center py-12 text-steel-500">
              No certificates found in this category
            </div>
          ) : (
            certificates.map(cert => (
              <div
                key={cert.id}
                className="p-5 rounded-xl border border-steel-700 bg-navy-800/30 hover:border-steel-600 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {/* Header row */}
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-gold-400 font-mono font-bold">
                        {cert.reference_id}
                      </span>
                      {getStatusBadge(cert.status)}
                    </div>

                    {/* Technician info */}
                    <h3 className="text-white font-medium mb-1">
                      {cert.technicianName}
                    </h3>
                    <p className="text-sm text-steel-400 mb-3">
                      {cert.technicianEmail}
                    </p>

                    {/* Licenses & Aircraft */}
                    <div className="flex flex-wrap gap-2 mb-3">
                      {cert.licenseCategory?.map(lic => (
                        <span key={lic} className="px-2 py-0.5 bg-gold-500/10 border border-gold-500/30 rounded text-xs text-gold-400">
                          {lic}
                        </span>
                      ))}
                      {cert.aircraftTypes?.slice(0, 3).map(ac => (
                        <span key={ac} className="px-2 py-0.5 bg-navy-700 border border-steel-600 rounded text-xs text-steel-300">
                          {ac}
                        </span>
                      ))}
                      {cert.aircraftTypes?.length > 3 && (
                        <span className="text-xs text-steel-500">+{cert.aircraftTypes.length - 3} más</span>
                      )}
                    </div>

                    {/* Dates */}
                    <p className="text-xs text-steel-500">
                      Generated: {new Date(cert.generated_at).toLocaleString()}
                      {cert.checked_at && (
                        <> · Checked: {new Date(cert.checked_at).toLocaleString()}</>
                      )}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2 ml-4">
                    <button
                      onClick={() => handleViewPdf(cert.id)}
                      className="btn-secondary text-sm py-2"
                    >
                      👁️ View PDF
                    </button>
                    <button
                      onClick={() => handleDownloadPdf(cert.id, cert.reference_id)}
                      className="btn-secondary text-sm py-2"
                    >
                      ⬇️ Download
                    </button>
                    
                    {cert.status === 'pending' && (
                      <>
                        <button
                          onClick={() => handleStatusChange(cert.id, 'checked')}
                          disabled={updating === cert.id}
                          className="py-2 px-4 rounded-lg bg-green-500/10 border border-green-500/30 text-green-400 text-sm font-medium hover:bg-green-500/20 transition-colors disabled:opacity-50"
                        >
                          {updating === cert.id ? '...' : '✅ Mark Checked'}
                        </button>
                        <button
                          onClick={() => handleStatusChange(cert.id, 'rejected')}
                          disabled={updating === cert.id}
                          className="py-2 px-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm font-medium hover:bg-red-500/20 transition-colors disabled:opacity-50"
                        >
                          {updating === cert.id ? '...' : '❌ Reject'}
                        </button>
                      </>
                    )}

                    {cert.status === 'checked' && (
                      <button
                        onClick={() => handleStatusChange(cert.id, 'pending')}
                        disabled={updating === cert.id}
                        className="py-2 px-4 rounded-lg bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 text-sm font-medium hover:bg-yellow-500/20 transition-colors disabled:opacity-50"
                      >
                        {updating === cert.id ? '...' : '↩️ Revert to Pending'}
                      </button>
                    )}

                    {cert.status === 'rejected' && (
                      <button
                        onClick={() => handleStatusChange(cert.id, 'pending')}
                        disabled={updating === cert.id}
                        className="py-2 px-4 rounded-lg bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 text-sm font-medium hover:bg-yellow-500/20 transition-colors disabled:opacity-50"
                      >
                        {updating === cert.id ? '...' : '↩️ Review Again'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </main>

      {/* PDF Viewer Modal */}
      {viewingPdf && (
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setViewingPdf(null)}
        >
          <div 
            className="bg-navy-900 border border-steel-700 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-steel-700 flex items-center justify-between">
              <h3 className="text-white font-medium">{viewingPdf.name}</h3>
              <div className="flex items-center gap-3">
                <a 
                  href={viewingPdf.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-gold-400 hover:text-gold-300 text-sm"
                >
                  Open in new tab ↗
                </a>
                <button 
                  onClick={() => setViewingPdf(null)}
                  className="text-steel-400 hover:text-white"
                >
                  ✕
                </button>
              </div>
            </div>
            <div className="h-[70vh] bg-navy-950">
              <iframe 
                src={viewingPdf.url} 
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
