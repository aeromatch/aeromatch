'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AppLayout } from '@/components/ui/AppLayout'
import { createClient } from '@/lib/supabase/client'
import { BOOKS, computeBookProgressFromLocalStorage, type Question } from '@/lib/simulator'
import { useAccess } from '@/hooks/useAccess'
import { UpgradeBanner } from '@/components/ui/UpgradeBanner'
import { useLanguage } from '@/lib/i18n/LanguageContext'

type BookProgress = Record<
  string,
  {
    answered: number
    total: number
    loading: boolean
  }
>

async function fetchBookQuestions(bookId: string): Promise<Question[]> {
  const res = await fetch(`/data/${bookId}.json`, { cache: 'no-store' })
  if (!res.ok) return []
  const json = await res.json()
  if (Array.isArray(json)) return json as Question[]
  if (json && Array.isArray((json as any).questions)) return (json as any).questions as Question[]
  return []
}

export default function SimulatorBookSelectorPage() {
  const supabase = useMemo(() => createClient(), [])
  const router = useRouter()
  const { language } = useLanguage()
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [loadingAuth, setLoadingAuth] = useState(true)
  const { hasAccess: canTrial } = useAccess('simulatorTrial')
  const [bannerOpen, setBannerOpen] = useState(true)
  const [activeCourse, setActiveCourse] = useState<'a320' | null>(null)

  const [progress, setProgress] = useState<BookProgress>(() => {
    const initial: BookProgress = {}
    for (const b of BOOKS) {
      initial[b.id] = { answered: 0, total: 0, loading: true }
    }
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
    // Keep A320 course selected when coming from deep links like /simulator?course=a320
    try {
      const sp = new URLSearchParams(window.location.search)
      const course = sp.get('course')
      if (course === 'a320') setActiveCourse('a320')
    } catch {}
  }, [])

  useEffect(() => {
    const run = async () => {
      const updates: BookProgress = { ...progress }
      await Promise.all(
        BOOKS.map(async (b) => {
          const qs = await fetchBookQuestions(b.id)
          const answered = computeBookProgressFromLocalStorage(b.id).answered
          updates[b.id] = { answered, total: qs.length, loading: false }
        })
      )
      setProgress(updates)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    run()
  }, [])

  const bankTotal = Object.values(progress).reduce((sum, p) => sum + (p?.total || 0), 0)

  if (loadingAuth) {
    return (
      <AppLayout userEmail={userEmail || undefined} userRole={undefined as any}>
        <div className="p-6 lg:p-8 max-w-6xl mx-auto">
          <div className="card p-8 text-center text-steel-400">Loading…</div>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout userEmail={userEmail || undefined} userRole={undefined as any}>
      <div className="p-6 lg:p-8 max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-white">AeroMatch 147</h1>
          <p className="text-steel-400 mt-2">Training &amp; Resources for EASA Part-66 technicians,</p>
          <div className="mt-4 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold-500/10 border border-gold-500/30 text-gold-300 text-xs">
            <span className="font-semibold">EASA Part-66</span>
            <span className="text-steel-400">•</span>
            <span>Question-based practice</span>
          </div>
        </div>

        {bannerOpen && (
          <div className="mb-6">
            <UpgradeBanner
              feature="simulatorTrial"
              showContinue
              showTopRightContinue
              onContinue={() => {
                setBannerOpen(false)
              }}
              continueLabel={language === 'en' ? 'Continue' : 'Continuar'}
            />
          </div>
        )}

        {activeCourse === null ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={() => setActiveCourse('a320')}
              className="card-action p-5 group text-left"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-white font-semibold truncate">
                    {language === 'en' ? 'A320 Type Rating Exam Simulator' : 'Simulador de Examen A320 Type Rating'}
                  </p>
                  <p className="text-xs text-steel-500 mt-1">
                    {language === 'en' ? 'Question bank:' : 'Banco de:'}{' '}
                    <span className="text-white font-semibold">{bankTotal}</span>{' '}
                    {language === 'en' ? 'questions' : 'preguntas'}
                  </p>
                </div>
                <span className="shrink-0 text-[11px] px-2 py-0.5 rounded-full bg-navy-800/60 border border-steel-700/40 text-steel-300">
                  A320
                </span>
              </div>

              <div className="mt-4 p-3 rounded-lg bg-navy-800/40 border border-steel-700/30">
                <p className="text-xs text-steel-400">{language === 'en' ? 'Includes' : 'Incluye'}</p>
                <p className="text-sm text-white mt-1">{language === 'en' ? 'Books + Custom Exam' : 'Books + Examen personalizado'}</p>
                <p className="text-xs text-steel-500 mt-2">
                  {language === 'en'
                    ? '75% pass • rotation tracking • timed custom exam'
                    : '75% aprobado • rotación • examen personalizado con tiempo'}
                </p>
              </div>

              <div className="mt-4 flex items-center justify-between text-xs text-steel-500">
                <span>{canTrial ? (language === 'en' ? 'Available' : 'Disponible') : (language === 'en' ? 'Beta access' : 'Acceso beta')}</span>
                <span className="text-gold-400 group-hover:text-gold-300 transition-colors">
                  {language === 'en' ? 'Enter →' : 'Entrar →'}
                </span>
              </div>
            </button>

            <div className="card p-5 border border-steel-700/30 bg-navy-900/20">
              <p className="text-white font-semibold">B737NG</p>
              <p className="text-xs text-steel-500 mt-1">{language === 'en' ? 'Coming soon' : 'Próximamente'}</p>
              <p className="text-xs text-steel-500 mt-3">B1 → B2</p>
            </div>
          </div>
        ) : (
          <>
            <div className="mb-6 flex items-center justify-between gap-4">
              <button onClick={() => setActiveCourse(null)} className="btn-secondary">
                {language === 'en' ? '← Courses' : '← Cursos'}
              </button>
              <span className="text-xs text-steel-500">A320</span>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              <Link href="/simulator/custom" className="card-action p-5 group">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-white font-semibold truncate">Custom Exam</p>
                    <p className="text-xs text-steel-500 mt-1">
                      {language === 'en' ? 'Custom per-ATA exam with timer' : 'Examen por ATA con tiempo'}
                    </p>
                  </div>
                  <span className="shrink-0 text-[11px] px-2 py-0.5 rounded-full bg-gold-500/10 border border-gold-500/30 text-gold-300">
                    New
                  </span>
                </div>
                <div className="mt-4 flex items-center justify-between text-xs text-steel-500">
                  <span>Custom</span>
                  <span className="text-gold-400 group-hover:text-gold-300 transition-colors">Open →</span>
                </div>
              </Link>

              {BOOKS.map((b) => {
                const p = progress[b.id]
                const answered = p?.answered ?? 0
                const total = p?.total ?? 0
                const hasQuestions = total > 0
                return (
                  <Link key={b.id} href={`/simulator/${b.id}`} className="card-action p-5 group">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-white font-semibold truncate">{b.name}</p>
                        <p className="text-xs text-steel-500 mt-1">{b.description}</p>
                      </div>
                      <span className="shrink-0 text-[11px] px-2 py-0.5 rounded-full bg-navy-800/60 border border-steel-700/40 text-steel-300">
                        {b.phase}
                      </span>
                    </div>
                    <div className="mt-4 p-3 rounded-lg bg-navy-800/40 border border-steel-700/30">
                      <p className="text-xs text-steel-400">Progress</p>
                      <p className="text-sm text-white mt-1">
                        {p?.loading ? 'Loading…' : `${answered}/${total} questions answered`}
                      </p>
                      {!hasQuestions && !p?.loading && (
                        <p className="text-xs text-warning-400 mt-2">No questions available yet</p>
                      )}
                    </div>
                    <div className="mt-4 flex items-center justify-between text-xs text-steel-500">
                      <span>{b.atas.length} ATAs</span>
                      <span className="text-gold-400 group-hover:text-gold-300 transition-colors">Open →</span>
                    </div>
                  </Link>
                )
              })}
            </div>
          </>
        )}
      </div>
    </AppLayout>
  )
}

