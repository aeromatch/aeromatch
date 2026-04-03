'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { AppLayout } from '@/components/ui/AppLayout'
import { createClient } from '@/lib/supabase/client'
import { useAccess } from '@/hooks/useAccess'
import { UpgradeBanner } from '@/components/ui/UpgradeBanner'
import {
  addAnsweredIds,
  buildExamSessionQuestions,
  getBook,
  setAnsweredIds,
  shuffleQuestionOptionsForSession,
  type Question,
} from '@/lib/simulator'

const PASS_THRESHOLD = 0.75

async function fetchBookQuestions(bookId: string): Promise<Question[]> {
  const res = await fetch(`/data/${bookId}.json`, { cache: 'no-store' })
  if (!res.ok) return []
  const json = await res.json()
  if (Array.isArray(json)) return json as Question[]
  if (json && Array.isArray((json as any).questions)) return (json as any).questions as Question[]
  return []
}

function answerLabel(k: 'a' | 'b' | 'c') {
  return k.toUpperCase()
}

export default function SimulatorExamSessionPage() {
  const supabase = useMemo(() => createClient(), [])
  const router = useRouter()
  const params = useParams<{ book: string; ata: string }>()
  const bookId = params?.book
  const ataCode = params?.ata
  const { hasAccess: hasFullAccess } = useAccess('simulatorFull')
  const [trialUsed, setTrialUsed] = useState(false)

  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [loadingAuth, setLoadingAuth] = useState(true)

  const [loading, setLoading] = useState(true)
  const [allQuestions, setAllQuestions] = useState<Question[]>([])
  const [sessionQuestions, setSessionQuestions] = useState<Question[]>([])
  const [willResetAfterSession, setWillResetAfterSession] = useState(false)

  const [idx, setIdx] = useState(0)
  const [selected, setSelected] = useState<'a' | 'b' | 'c' | null>(null)
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null)
  const [showAnswer, setShowAnswer] = useState(false)
  const [score, setScore] = useState(0)
  const [answeredThisSession, setAnsweredThisSession] = useState<string[]>([])
  const [failed, setFailed] = useState<
    { id: string; question: string; correct: 'a' | 'b' | 'c'; your?: 'a' | 'b' | 'c' }[]
  >([])

  const [finished, setFinished] = useState(false)
  const [sessionSeed, setSessionSeed] = useState<string>('')

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
    try {
      const used = typeof window !== 'undefined' && window.localStorage.getItem('simulator_trial_used') === 'true'
      setTrialUsed(!!used)
    } catch {
      setTrialUsed(false)
    }
  }, [])

  const startNewSession = (questions: Question[]) => {
    if (!bookId || !ataCode) return
    const nextSeed = `${Date.now()}_${Math.random().toString(16).slice(2)}`
    setSessionSeed(nextSeed)
    const { sessionQuestions: sq, willResetAfterSession: reset } = buildExamSessionQuestions({
      bookId,
      ataCode,
      questions,
      sessionSize: 20,
    })
    setSessionQuestions(sq.map((qq) => shuffleQuestionOptionsForSession({ question: qq, sessionSeed: nextSeed })))
    setWillResetAfterSession(reset)
    setIdx(0)
    setSelected(null)
    setIsCorrect(null)
    setShowAnswer(false)
    setScore(0)
    setAnsweredThisSession([])
    setFailed([])
    setFinished(false)
  }

  useEffect(() => {
    const run = async () => {
      if (!bookId) return
      setLoading(true)
      const qs = await fetchBookQuestions(bookId)
      setAllQuestions(qs)
      setLoading(false)
      // Gate after trial is used (unless user has full access)
      if (trialUsed && !hasFullAccess) {
        setSessionQuestions([])
        return
      }
      startNewSession(qs)
    }
    run()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookId, ataCode, trialUsed, hasFullAccess])

  if (loadingAuth) {
    return (
      <AppLayout userEmail={userEmail || undefined} userRole={undefined as any}>
        <div className="p-6 lg:p-8 max-w-3xl mx-auto">
          <div className="card p-8 text-center text-steel-400">Loading…</div>
        </div>
      </AppLayout>
    )
  }

  if (!bookId || !ataCode || !book) {
    return (
      <AppLayout userEmail={userEmail || undefined} userRole={undefined as any}>
        <div className="p-6 lg:p-8 max-w-3xl mx-auto">
          <div className="card p-8">
            <p className="text-error-400">Invalid route.</p>
            <Link href="/simulator?course=a320" className="text-gold-400 hover:text-gold-300 text-sm mt-4 inline-block">
              ← Back
            </Link>
          </div>
        </div>
      </AppLayout>
    )
  }

  if (trialUsed && !hasFullAccess) {
    return (
      <AppLayout userEmail={userEmail || undefined} userRole={undefined as any}>
        <div className="p-6 lg:p-8 max-w-3xl mx-auto">
          <UpgradeBanner feature="simulatorFull" />
        </div>
      </AppLayout>
    )
  }

  const totalInSession = sessionQuestions.length
  const current = sessionQuestions[idx]

  const saveProgressAndBack = () => {
    if (answeredThisSession.length > 0) {
      addAnsweredIds(bookId, ataCode, answeredThisSession)
    }
    if (willResetAfterSession) {
      // After consuming the remainder, reset rotation for next time.
      setAnsweredIds(bookId, ataCode, [])
    }
    router.push(`/simulator/${bookId}`)
  }

  const onChoose = (choice: 'a' | 'b' | 'c') => {
    if (!current || showAnswer) return
    // Consume trial on first real interaction
    if (!hasFullAccess && !trialUsed) {
      try {
        window.localStorage.setItem('simulator_trial_used', 'true')
      } catch {}
      setTrialUsed(true)
    }
    setSelected(choice)
    const ok = choice === current.correct_answer
    setIsCorrect(ok)
    setShowAnswer(true)
    setAnsweredThisSession((prev) => (current?.id ? [...prev, current.id] : prev))
    if (ok) {
      setScore((s) => s + 1)
    } else {
      setFailed((prev) => [
        ...prev,
        { id: current.id, question: current.question, correct: current.correct_answer, your: choice },
      ])
    }
  }

  const onNext = () => {
    if (!showAnswer) return
    if (idx + 1 >= totalInSession) {
      setFinished(true)
      return
    }
    setIdx((i) => i + 1)
    setSelected(null)
    setIsCorrect(null)
    setShowAnswer(false)
  }

  const tryAgain = () => {
    // Reset ONLY the current session view/score. Does not touch rotation tracking.
    startNewSession(allQuestions)
  }

  const percent = totalInSession > 0 ? score / totalInSession : 0
  const passed = percent >= PASS_THRESHOLD

  return (
    <AppLayout userEmail={userEmail || undefined} userRole={undefined as any}>
      <div className="p-6 lg:p-8 max-w-3xl mx-auto">
        <div className="mb-6">
          <div className="flex items-center justify-between gap-4">
            <Link href={`/simulator/${bookId}`} className="text-sm text-gold-400 hover:text-gold-300">
              ← Back to ATAs
            </Link>
            <div className="flex items-center gap-2">
              <span className="text-xs px-2 py-0.5 rounded-full bg-gold-500/10 border border-gold-500/30 text-gold-300">
                {book.name} • ATA {ataCode}
              </span>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="card p-8 text-center text-steel-400">Loading questions…</div>
        ) : totalInSession === 0 ? (
          <div className="card p-8">
            <h2 className="text-xl font-semibold text-white">No questions available yet</h2>
            <p className="text-steel-400 mt-2">
              This ATA currently has 0 questions in <code className="text-steel-300">/public/data/{bookId}.json</code>.
            </p>
            <div className="mt-6">
              <button onClick={saveProgressAndBack} className="btn-secondary">
                Back to ATAs
              </button>
            </div>
          </div>
        ) : finished ? (
          <div className="card p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-white">Session complete</h2>
                <p className="text-steel-400 mt-1">
                  Score: <span className="text-white font-semibold">{score}/{totalInSession}</span> (
                  <span className="text-white font-semibold">{Math.round(percent * 100)}%</span>)
                </p>
              </div>
              <span
                className={`text-xs px-3 py-1 rounded-full border ${
                  passed
                    ? 'bg-success-500/10 border-success-500/30 text-success-300'
                    : 'bg-error-600/20 border-error-500/30 text-error-300'
                }`}
              >
                {passed ? 'PASS (≥75%)' : 'FAIL (<75%)'}
              </span>
            </div>

            {failed.length > 0 && (
              <div className="mt-6">
                <h3 className="text-white font-semibold mb-2">Review failed questions</h3>
                <div className="space-y-3">
                  {failed.map((f) => (
                    <div key={f.id} className="p-4 rounded-lg bg-navy-800/50 border border-steel-700/30">
                      <p className="text-sm text-steel-200">{f.question}</p>
                      <p className="text-xs text-steel-500 mt-2">
                        Correct answer: <span className="text-gold-300 font-semibold">{answerLabel(f.correct)}</span>
                        {f.your ? (
                          <>
                            {' '}
                            • Your answer: <span className="text-error-300 font-semibold">{answerLabel(f.your)}</span>
                          </>
                        ) : null}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-6 flex flex-wrap gap-3">
              <button onClick={tryAgain} className="btn-secondary">
                Try again
              </button>
              <button onClick={saveProgressAndBack} className="btn-primary-filled">
                Back to ATAs (save progress)
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Progress */}
            <div className="p-4 rounded-xl bg-navy-800/50 border border-steel-700/30">
              <div className="flex items-center justify-between">
                <p className="text-sm text-steel-300">
                  Question <span className="text-white font-semibold">{idx + 1}</span> of{' '}
                  <span className="text-white font-semibold">{totalInSession}</span>
                </p>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-navy-900/60 border border-steel-700/40 text-steel-300">
                    {current.category}
                  </span>
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-gold-500/10 border border-gold-500/30 text-gold-300">
                    L{current.level}
                  </span>
                </div>
              </div>
              <div className="mt-3 h-2 rounded-full bg-navy-900 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-gold-500 to-gold-400"
                  style={{ width: `${Math.round(((idx + 1) / totalInSession) * 100)}%` }}
                />
              </div>
            </div>

            {/* Question */}
            <div className="card p-6">
              <p className="text-xs text-steel-500 mb-2">{current.subtopic || `ATA ${current.ata}`}</p>
              <h2 className="text-lg font-semibold text-white leading-snug">{current.question}</h2>

              <div className="mt-5 grid gap-3">
                {(['a', 'b', 'c'] as const).map((k) => {
                  const text = current.options?.[k]
                  const chosen = selected === k
                  const correct = current.correct_answer === k
                  const state =
                    showAnswer && chosen
                      ? isCorrect
                        ? 'border-success-500/40 bg-success-500/10'
                        : 'border-error-500/40 bg-error-600/10'
                      : showAnswer && correct
                      ? 'border-success-500/30 bg-success-500/5'
                      : 'border-steel-700/30 bg-navy-800/40 hover:border-gold-500/40'

                  return (
                    <button
                      key={k}
                      onClick={() => onChoose(k)}
                      disabled={showAnswer}
                      className={`text-left p-4 rounded-xl border transition-all ${state}`}
                    >
                      <div className="flex items-start gap-3">
                        <span className="w-7 h-7 rounded-lg flex items-center justify-center bg-navy-900/60 border border-steel-700/30 text-gold-300 text-xs font-semibold">
                          {answerLabel(k)}
                        </span>
                        <span className="text-sm text-white">{text}</span>
                      </div>
                    </button>
                  )
                })}
              </div>

              {showAnswer && (
                <div className="mt-5 p-4 rounded-xl border bg-navy-800/40">
                  <p className={`text-sm font-semibold ${isCorrect ? 'text-success-300' : 'text-error-300'}`}>
                    {isCorrect ? 'Correct' : 'Incorrect'}
                  </p>
                  <p className="text-xs text-steel-500 mt-2">Justification</p>
                  <p className="text-sm text-steel-200 mt-1 whitespace-pre-line">{current.justification}</p>
                </div>
              )}

              <div className="mt-6 flex items-center justify-between gap-3">
                <button onClick={saveProgressAndBack} className="btn-secondary">
                  Back to ATAs (save progress)
                </button>
                <button onClick={onNext} disabled={!showAnswer} className="btn-primary-filled disabled:opacity-50">
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  )
}

