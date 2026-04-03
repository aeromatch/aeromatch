'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { AppLayout } from '@/components/ui/AppLayout'
import { createClient } from '@/lib/supabase/client'
import { getBook, getAnsweredIds, type Question } from '@/lib/simulator'

async function fetchBookQuestions(bookId: string): Promise<Question[]> {
  const res = await fetch(`/data/${bookId}.json`, { cache: 'no-store' })
  if (!res.ok) return []
  const json = await res.json()
  if (Array.isArray(json)) return json as Question[]
  if (json && Array.isArray((json as any).questions)) return (json as any).questions as Question[]
  return []
}

export default function SimulatorAtaGridPage() {
  const supabase = useMemo(() => createClient(), [])
  const router = useRouter()
  const params = useParams<{ book: string }>()
  const bookId = params?.book

  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [loadingAuth, setLoadingAuth] = useState(true)
  const [loading, setLoading] = useState(true)
  const [questions, setQuestions] = useState<Question[]>([])

  const book = bookId ? getBook(bookId) : null

  useEffect(() => {
    const run = async () => {
      const { data } = await supabase.auth.getUser()
      if (!data.user) {
        router.push('/auth')
        return
      }
      setUserEmail(data.user.email || null)
      setLoadingAuth(false)
    }
    run()
  }, [router, supabase])

  useEffect(() => {
    const run = async () => {
      if (!bookId) return
      setLoading(true)
      const qs = await fetchBookQuestions(bookId)
      setQuestions(qs)
      setLoading(false)
    }
    run()
  }, [bookId])

  if (loadingAuth) {
    return (
      <AppLayout userEmail={userEmail || undefined} userRole={undefined as any}>
        <div className="p-6 lg:p-8 max-w-6xl mx-auto">
          <div className="card p-8 text-center text-steel-400">Loading…</div>
        </div>
      </AppLayout>
    )
  }

  if (!book) {
    return (
      <AppLayout userEmail={userEmail || undefined} userRole={undefined as any}>
        <div className="p-6 lg:p-8 max-w-6xl mx-auto">
          <div className="card p-8">
            <p className="text-error-400">Book not found.</p>
            <Link href="/simulator?course=a320" className="text-gold-400 hover:text-gold-300 text-sm mt-4 inline-block">
              ← Back
            </Link>
          </div>
        </div>
      </AppLayout>
    )
  }

  const totalByAta = new Map<string, number>()
  for (const ata of book.atas) totalByAta.set(ata.code, 0)
  for (const q of questions) {
    if (!q?.ata) continue
    if (totalByAta.has(q.ata)) totalByAta.set(q.ata, (totalByAta.get(q.ata) || 0) + 1)
  }

  return (
    <AppLayout userEmail={userEmail || undefined} userRole={undefined as any}>
      <div className="p-6 lg:p-8 max-w-6xl mx-auto">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <Link href="/simulator?course=a320" className="text-sm text-gold-400 hover:text-gold-300">
              ← Back
            </Link>
            <h1 className="text-2xl font-bold text-white mt-2">{book.name}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className="text-xs px-2 py-0.5 rounded-full bg-gold-500/10 border border-gold-500/30 text-gold-300">
                {book.phase}
              </span>
              <span className="text-xs text-steel-500">{book.description}</span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-steel-500">Data</p>
            <p className="text-sm text-white">{loading ? 'Loading…' : `${questions.length} questions`}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {book.atas.map((ata: { code: string; description: string }) => {
            const total = totalByAta.get(ata.code) || 0
            const answered = getAnsweredIds(book.id, ata.code).length
            const disabled = !loading && total === 0
            return (
              <Link
                key={ata.code}
                href={disabled ? '#' : `/simulator/${book.id}/${ata.code}`}
                onClick={(e) => {
                  if (disabled) e.preventDefault()
                }}
                className={`p-5 rounded-xl border transition-all ${
                  disabled
                    ? 'bg-navy-800/20 border-steel-700/20 opacity-50 cursor-not-allowed'
                    : 'card-action border-steel-700/30 hover:border-gold-500/40'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-3xl font-bold text-gold-400">{ata.code}</p>
                    <p className="text-xs text-steel-400 mt-1">{ata.description}</p>
                  </div>
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-navy-800/60 border border-steel-700/40 text-steel-300">
                    ATA
                  </span>
                </div>

                <div className="mt-4 p-3 rounded-lg bg-navy-800/40 border border-steel-700/30">
                  <p className="text-xs text-steel-400">Progress</p>
                  <p className="text-sm text-white mt-1">
                    {loading ? 'Loading…' : `${answered}/${total} answered`}
                  </p>
                  {!loading && total === 0 && <p className="text-xs text-warning-400 mt-2">No questions available yet</p>}
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </AppLayout>
  )
}

