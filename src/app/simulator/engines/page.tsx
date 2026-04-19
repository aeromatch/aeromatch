'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AppLayout } from '@/components/ui/AppLayout'
import { createClient } from '@/lib/supabase/client'
import {
  BOOKS,
  ENGINE_SECTION,
  computeBookProgressFromLocalStorage,
  type Question,
} from '@/lib/simulator'
import { useLanguage } from '@/lib/i18n/LanguageContext'

type EngineBook = (typeof BOOKS)[number] & {
  engineSection?: boolean
  engineTag?: 'CEO' | 'NEO'
  comingSoon?: boolean
}

async function fetchBookQuestions(bookId: string): Promise<Question[]> {
  const res = await fetch(`/data/${bookId}.json`, { cache: 'no-store' })
  if (!res.ok) return []
  const json = await res.json()
  if (Array.isArray(json)) return json as Question[]
  if (json && Array.isArray((json as any).questions)) {
    return (json as any).questions as Question[]
  }
  return []
}

export default function EnginesSelectorPage() {
  const supabase = useMemo(() => createClient(), [])
  const router = useRouter()
  const { language } = useLanguage()
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [loadingAuth, setLoadingAuth] = useState(true)

  const engines = useMemo(
    () =>
      ENGINE_SECTION.bookIds
        .map((id) => (BOOKS as readonly EngineBook[]).find((b) => b.id === id))
        .filter(Boolean) as EngineBook[],
    []
  )

  const [counts, setCounts] = useState<
    Record<string, { total: number; answered: number; loading: boolean }>
  >(() => {
    const initial: Record<string, { total: number; answered: number; loading: boolean }> = {}
    for (const e of engines) initial[e.id] = { total: 0, answered: 0, loading: true }
    return initial
  })

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
      const updates: typeof counts = { ...counts }
      await Promise.all(
        engines.map(async (e) => {
          const qs = await fetchBookQuestions(e.id)
          updates[e.id] = {
            total: qs.length,
            answered: computeBookProgressFromLocalStorage(e.id).answered,
            loading: false,
          }
        })
      )
      setCounts(updates)
    }
    run()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (loadingAuth) {
    return (
      <AppLayout userEmail={userEmail || undefined} userRole={undefined as any}>
        <div className="p-6 lg:p-8 max-w-5xl mx-auto">
          <div className="card p-8 text-center text-steel-400">Loading…</div>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout userEmail={userEmail || undefined} userRole={undefined as any}>
      <div className="p-6 lg:p-8 max-w-5xl mx-auto">
        <div className="mb-6">
          <Link
            href="/simulator?course=a320"
            className="text-sm text-gold-400 hover:text-gold-300"
          >
            ← {language === 'en' ? 'Back to A320' : 'Volver a A320'}
          </Link>
          <div className="mt-3 flex items-center gap-3">
            <EngineIcon className="w-8 h-8 text-gold-400" />
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white">
                {ENGINE_SECTION.sectionTitle}
              </h1>
              <p className="text-steel-400 mt-1 text-sm">
                {ENGINE_SECTION.sectionSubtitle}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {engines.map((engine) => {
            const c = counts[engine.id]
            const total = c?.total ?? 0
            const answered = c?.answered ?? 0
            const comingSoon = engine.comingSoon === true
            const disabled = comingSoon || (total === 0 && !c?.loading)

            const cardInner = (
              <>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-2xl font-bold text-gold-400">{engine.name}</p>
                    <p className="text-xs text-steel-400 mt-1">{engine.description}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    {engine.engineTag && (
                      <span
                        className={`text-[11px] px-2 py-0.5 rounded-full border ${
                          engine.engineTag === 'CEO'
                            ? 'bg-navy-800/60 border-steel-700/40 text-steel-300'
                            : 'bg-gold-500/10 border-gold-500/30 text-gold-300'
                        }`}
                      >
                        {engine.engineTag}
                      </span>
                    )}
                    {comingSoon && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-steel-700/20 border border-steel-700/40 text-steel-400">
                        {language === 'en' ? 'Coming soon' : 'Próximamente'}
                      </span>
                    )}
                  </div>
                </div>

                <div className="mt-4 p-3 rounded-lg bg-navy-800/40 border border-steel-700/30">
                  <p className="text-xs text-steel-400">
                    {language === 'en' ? 'Questions' : 'Preguntas'}
                  </p>
                  <p className="text-sm text-white mt-1">
                    {c?.loading
                      ? 'Loading…'
                      : total > 0
                      ? `${answered}/${total} ${
                          language === 'en' ? 'answered' : 'respondidas'
                        }`
                      : language === 'en'
                      ? 'No questions yet'
                      : 'Aún sin preguntas'}
                  </p>
                </div>

                <div className="mt-4 flex items-center justify-between text-xs text-steel-500">
                  <span>{engine.atas.length} ATAs</span>
                  {!disabled && (
                    <span className="text-gold-400 group-hover:text-gold-300 transition-colors">
                      {language === 'en' ? 'Open →' : 'Abrir →'}
                    </span>
                  )}
                </div>
              </>
            )

            if (disabled) {
              return (
                <div
                  key={engine.id}
                  className="p-5 rounded-xl border border-steel-700/20 bg-navy-900/20 opacity-60 cursor-not-allowed"
                >
                  {cardInner}
                </div>
              )
            }

            return (
              <Link
                key={engine.id}
                href={`/simulator/engines/${engine.id}`}
                className="card-action p-5 group"
              >
                {cardInner}
              </Link>
            )
          })}
        </div>
      </div>
    </AppLayout>
  )
}

function EngineIcon({ className = '' }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="3" />
      <path d="M12 3v4" />
      <path d="M12 17v4" />
      <path d="M3 12h4" />
      <path d="M17 12h4" />
      <path d="M5.6 5.6l2.8 2.8" />
      <path d="M15.6 15.6l2.8 2.8" />
      <path d="M18.4 5.6l-2.8 2.8" />
      <path d="M8.4 15.6l-2.8 2.8" />
    </svg>
  )
}
