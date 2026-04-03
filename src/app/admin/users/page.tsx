'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AppLayout } from '@/components/ui/AppLayout'
import { createClient } from '@/lib/supabase/client'

type Row = {
  id: string
  fullName: string | null
  email: string | null
  plan: 'free' | 'basic' | 'premium'
  role: string | null
  createdAt: string
}

export default function AdminUsersPage() {
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])

  const [loading, setLoading] = useState(true)
  const [authorized, setAuthorized] = useState(false)
  const [query, setQuery] = useState('')
  const [rows, setRows] = useState<Row[]>([])
  const [savingId, setSavingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const run = async () => {
      const { data } = await supabase.auth.getUser()
      if (!data.user) {
        router.push('/auth')
        return
      }
      // Same auth logic as /admin: rely on admin endpoints (supports ADMIN_EMAILS + role=admin)
      const res = await fetch('/api/admin/metrics')
      if (!res.ok) {
        router.push('/dashboard')
        return
      }
      setAuthorized(true)
      setLoading(false)
    }
    run()
  }, [router, supabase])

  useEffect(() => {
    const run = async () => {
      if (!authorized) return
      setError(null)
      const res = await fetch('/api/admin/users?type=all')
      if (!res.ok) {
        setError('No autorizado o error cargando usuarios.')
        return
      }
      const json = await res.json()
      setRows((json.users || []) as Row[])
    }
    run()
  }, [authorized])

  const filtered = rows.filter((r) => {
    const q = query.trim().toLowerCase()
    if (!q) return true
    return (
      (r.fullName || '').toLowerCase().includes(q) ||
      (r.email || '').toLowerCase().includes(q)
    )
  })

  const setPlan = async (userId: string, plan: Row['plan']) => {
    setSavingId(userId)
    setError(null)
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'set_plan', userId, plan }),
      })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        throw new Error(j.error || 'Error actualizando plan')
      }
      setRows((prev) => prev.map((r) => (r.id === userId ? { ...r, plan } : r)))
    } catch (e: any) {
      setError(e?.message || 'Error actualizando plan')
    } finally {
      setSavingId(null)
    }
  }

  if (loading) {
    return (
      <AppLayout userEmail={undefined} userRole={undefined as any}>
        <div className="p-6 lg:p-8 max-w-6xl mx-auto">
          <div className="card p-8 text-center text-steel-400">Loading…</div>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout userEmail={undefined} userRole={undefined as any}>
      <div className="p-6 lg:p-8 max-w-6xl mx-auto">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Admin • Users</h1>
            <p className="text-sm text-steel-400 mt-1">Gestiona el plan de acceso (free/basic/premium).</p>
          </div>
          <div className="w-full max-w-sm">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar por nombre o email…"
              className="input w-full"
            />
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-lg bg-error-600/20 border border-error-500/30 text-error-400">
            {error}
          </div>
        )}

        <div className="overflow-x-auto card p-0">
          <table className="min-w-full text-sm">
            <thead className="bg-navy-900/60 border-b border-steel-700/30">
              <tr className="text-left text-steel-300">
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Plan</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-steel-700/20">
              {filtered.map((r) => (
                <tr key={r.id} className="text-steel-200">
                  <td className="px-4 py-3 text-white font-medium">{r.fullName || '—'}</td>
                  <td className="px-4 py-3 text-steel-300">{r.email || '—'}</td>
                  <td className="px-4 py-3">
                    <select
                      className="px-3 py-2 rounded-lg bg-navy-900/50 border border-steel-700/30 text-white"
                      value={r.plan}
                      disabled={savingId === r.id}
                      onChange={(e) => setPlan(r.id, e.target.value as Row['plan'])}
                    >
                      <option value="free">free</option>
                      <option value="basic">basic</option>
                      <option value="premium">premium</option>
                    </select>
                  </td>
                  <td className="px-4 py-3 text-steel-300">{r.role || '—'}</td>
                  <td className="px-4 py-3 text-steel-400">
                    {r.createdAt ? new Date(r.createdAt).toLocaleDateString('en-GB') : '—'}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td className="px-4 py-8 text-center text-steel-500" colSpan={5}>
                    No results
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AppLayout>
  )
}

