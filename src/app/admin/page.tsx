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

export default function AdminPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [authorized, setAuthorized] = useState(false)
  const [activeTab, setActiveTab] = useState<'metrics' | 'technicians' | 'companies'>('metrics')
  const [metrics, setMetrics] = useState<Metrics | null>(null)
  const [technicians, setTechnicians] = useState<Technician[]>([])
  const [companies, setCompanies] = useState<Company[]>([])

  useEffect(() => {
    checkAuth()
  }, [])

  useEffect(() => {
    if (authorized) {
      if (activeTab === 'metrics') fetchMetrics()
      if (activeTab === 'technicians') fetchTechnicians()
      if (activeTab === 'companies') fetchCompanies()
    }
  }, [authorized, activeTab])

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
            {(['metrics', 'technicians', 'companies'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-4 px-2 border-b-2 font-medium transition-colors ${
                  activeTab === tab
                    ? 'border-gold-500 text-gold-400'
                    : 'border-transparent text-steel-400 hover:text-white'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
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

