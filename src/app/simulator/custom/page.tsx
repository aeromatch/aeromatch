'use client'

import Link from 'next/link'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AppLayout } from '@/components/ui/AppLayout'
import { createClient } from '@/lib/supabase/client'
import { useLanguage } from '@/lib/i18n/LanguageContext'
import {
  BOOKS,
  addAnsweredIds,
  buildCustomExamSessionQuestionsMultiBook,
  setAnsweredIds,
  shuffleQuestionOptionsForSession,
  type CustomExamSelection,
  type Question,
} from '@/lib/simulator'

const PASS_THRESHOLD = 0.75
const SECONDS_PER_QUESTION = 90

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

function clampInt(value: any, min: number, max: number) {
  const n = Math.floor(Number(value) || 0)
  return Math.min(max, Math.max(min, n))
}

export default function SimulatorCustomExamPage() {
  const supabase = useMemo(() => createClient(), [])
  const router = useRouter()
  const { language } = useLanguage()

  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [loadingAuth, setLoadingAuth] = useState(true)

  const [loadingQuestions, setLoadingQuestions] = useState(false)
  const [questionsByBook, setQuestionsByBook] = useState<Record<string, Question[]>>({})

  const [countsBySelectionKey, setCountsBySelectionKey] = useState<Record<string, number>>({})

  const [error, setError] = useState<string | null>(null)

  const [examStarted, setExamStarted] = useState(false)
  const [loadingExam, setLoadingExam] = useState(false)
  const [sessionQuestions, setSessionQuestions] = useState<Question[]>([])
  const [willResetByBookAta, setWillResetByBookAta] = useState<Record<string, Record<string, boolean>>>({})

  const [idx, setIdx] = useState(0)
  const [selected, setSelected] = useState<'a' | 'b' | 'c' | null>(null)
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null)
  const [showAnswer, setShowAnswer] = useState(false)
  const [score, setScore] = useState(0)
  const [answeredThisSessionByBookAta, setAnsweredThisSessionByBookAta] = useState<
    Record<string, Record<string, string[]>>
  >({})
  const [finished, setFinished] = useState(false)

  const [breakdown, setBreakdown] = useState<Record<string, { correct: number; total: number }>>({})
  const [sessionSeed, setSessionSeed] = useState<string>('')

  const ataRows = useMemo(() => {
    const rows: {
      key: string
      bookId: string
      bookName: string
      ataCode: string
      ataDescription: string
      available: number
    }[] = []
    for (const b of BOOKS) {
      const qs = questionsByBook[b.id] || []
      const availableByAta = new Map<string, number>()
      for (const ata of b.atas) availableByAta.set(ata.code, 0)
      for (const q of qs) {
        if (!q?.ata) continue
        if (availableByAta.has(q.ata)) availableByAta.set(q.ata, (availableByAta.get(q.ata) || 0) + 1)
      }
      for (const ata of b.atas) {
        const available = availableByAta.get(ata.code) || 0
        rows.push({
          key: `${b.id}:${ata.code}`,
          bookId: b.id,
          bookName: b.name,
          ataCode: ata.code,
          ataDescription: ata.description,
          available,
        })
      }
    }
    // Sort: numeric ATA then book name
    return rows.sort((a, b) => (a.ataCode === b.ataCode ? a.bookName.localeCompare(b.bookName) : a.ataCode.localeCompare(b.ataCode)))
  }, [questionsByBook])

  const totalSelectedQuestions = useMemo(() => {
    return Object.values(countsBySelectionKey).reduce((a, b) => a + (Number(b) || 0), 0)
  }, [countsBySelectionKey])

  const totalSeconds = useMemo(() => {
    return Math.max(0, totalSelectedQuestions * SECONDS_PER_QUESTION)
  }, [totalSelectedQuestions])

  const [secondsLeft, setSecondsLeft] = useState<number>(0)
  const timerRef = useRef<number | null>(null)
  const formatTime = (s: number) => {
    const mm = Math.floor(s / 60)
    const ss = s % 60
    return `${mm}:${String(ss).padStart(2, '0')}`
  }

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
      setLoadingQuestions(true)
      const entries = await Promise.all(
        BOOKS.map(async (b) => {
          const qs = await fetchBookQuestions(b.id)
          return [b.id, qs] as const
        })
      )
      const next: Record<string, Question[]> = {}
      for (const [id, qs] of entries) next[id] = qs
      setQuestionsByBook(next)
      setLoadingQuestions(false)
    }
    run()
  }, [])

  const resetExamState = () => {
    setExamStarted(false)
    setLoadingExam(false)
    setSessionQuestions([])
    setWillResetByBookAta({})
    setIdx(0)
    setSelected(null)
    setIsCorrect(null)
    setShowAnswer(false)
    setScore(0)
    setAnsweredThisSessionByBookAta({})
    setFinished(false)
    setBreakdown({})
    setSecondsLeft(0)
    if (timerRef.current) {
      window.clearInterval(timerRef.current)
      timerRef.current = null
    }
  }

  useEffect(() => {
    if (!examStarted) return
    if (secondsLeft <= 0) return
    if (timerRef.current) return

    timerRef.current = window.setInterval(() => {
      setSecondsLeft((s) => {
        const next = s - 1
        if (next <= 0) {
          if (timerRef.current) {
            window.clearInterval(timerRef.current)
            timerRef.current = null
          }
          return 0
        }
        return next
      })
    }, 1000)
  }, [examStarted, secondsLeft])

  // Timer end: finish immediately
  useEffect(() => {
    if (!examStarted) return
    if (finished) return
    if (secondsLeft > 0) return
    // When time is up, end the exam (remaining unanswered count as incorrect)
    setFinished(true)
  }, [examStarted, finished, secondsLeft])

  const startExam = async () => {
    setError(null)
    const selections: CustomExamSelection[] = []
    for (const row of ataRows) {
      const need = clampInt(countsBySelectionKey[row.key], 0, 9999)
      if (need <= 0) continue
      if (need > row.available) {
        setError(`ATA ${row.ataCode} (${row.bookName}) no tiene suficientes preguntas: ${need}/${row.available}.`)
        return
      }
      selections.push({ bookId: row.bookId, ataCode: row.ataCode, count: need })
    }
    if (selections.length === 0) {
      setError(language === 'en' ? 'Select at least one ATA (set a number > 0).' : 'Selecciona al menos un ATA (pon un número > 0).')
      return
    }

    setLoadingExam(true)
    const { sessionQuestions: sq, willResetByBookAta: resets } = buildCustomExamSessionQuestionsMultiBook({
      selections,
      questionsByBook,
    })

    const nextSeed = `${Date.now()}_${Math.random().toString(16).slice(2)}`
    setSessionSeed(nextSeed)
    const shuffledSq = sq.map((qq) => shuffleQuestionOptionsForSession({ question: qq, sessionSeed: nextSeed }))

    const expected = selections.reduce((a, b) => a + b.count, 0)
    if (shuffledSq.length !== expected) {
      setLoadingExam(false)
      setError(language === 'en' ? 'Could not build the exam with the requested size.' : 'No se pudo construir el examen con el tamaño solicitado.')
      return
    }

    // Initialize breakdown totals
    const bd: Record<string, { correct: number; total: number }> = {}
    for (const q of shuffledSq) {
      const key = `${q.book}:${q.ata}`
      if (!bd[key]) bd[key] = { correct: 0, total: 0 }
      bd[key].total += 1
    }

    setWillResetByBookAta(resets)
    setSessionQuestions(shuffledSq)
    setBreakdown(bd)
    setExamStarted(true)
    setFinished(false)
    setIdx(0)
    setSelected(null)
    setIsCorrect(null)
    setShowAnswer(false)
    setScore(0)
    setAnsweredThisSessionByBookAta({})
    setSecondsLeft(expected * SECONDS_PER_QUESTION)
    setLoadingExam(false)
  }

  const totalInSession = sessionQuestions.length
  const current = sessionQuestions[idx]
  const percent = totalInSession > 0 ? score / totalInSession : 0
  const passed = percent >= PASS_THRESHOLD

  const saveProgressAndBack = () => {
    // Persist answered IDs per book/ATA
    for (const [bookId, ataMap] of Object.entries(answeredThisSessionByBookAta)) {
      for (const [ata, ids] of Object.entries(ataMap)) {
        if (ids.length > 0) addAnsweredIds(bookId, ata, ids)
      }
    }
    // Reset rotation for book/ATA that consumed their remainder
    for (const [bookId, ataMap] of Object.entries(willResetByBookAta)) {
      for (const [ata, shouldReset] of Object.entries(ataMap)) {
        if (shouldReset) setAnsweredIds(bookId, ata, [])
      }
    }
    router.push('/simulator?course=a320')
  }

  const onChoose = (choice: 'a' | 'b' | 'c') => {
    if (!current || showAnswer) return
    setSelected(choice)
    const ok = choice === current.correct_answer
    setIsCorrect(ok)
    setShowAnswer(true)
    setAnsweredThisSessionByBookAta((prev) => {
      const b = current.book
      const ata = current.ata
      const next = { ...prev }
      const bookMap = next[b] ? { ...next[b] } : {}
      const arr = bookMap[ata] ? [...bookMap[ata]] : []
      if (current.id) arr.push(current.id)
      bookMap[ata] = arr
      next[b] = bookMap
      return next
    })
    if (ok) {
      setScore((s) => s + 1)
      setBreakdown((prev) => {
        const next = { ...prev }
        const key = `${current.book}:${current.ata}`
        if (!next[key]) next[key] = { correct: 0, total: 0 }
        next[key] = { ...next[key], correct: next[key].correct + 1 }
        return next
      })
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
    // Same configuration; rebuild a new session with rotation rules.
    resetExamState()
    void startExam()
  }

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
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <Link href="/simulator?course=a320" className="text-sm text-gold-400 hover:text-gold-300">
              ← {language === 'en' ? 'Back' : 'Volver'}
            </Link>
            <h1 className="text-2xl font-bold text-white mt-2">Custom Exam</h1>
            <p className="text-sm text-steel-400 mt-1">
              {language === 'en'
                ? 'Select ATAs across all books, choose questions per ATA, and start a timed exam (90s per question).'
                : 'Selecciona ATAs de todos los books, elige preguntas por ATA, y empieza un examen con tiempo (90s por pregunta).'}
            </p>
          </div>
          <span className="text-[11px] px-2 py-0.5 rounded-full bg-navy-800/60 border border-steel-700/40 text-steel-300">
            /simulator/custom
          </span>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl border border-error-500/30 bg-error-600/10 text-error-200 text-sm">
            {error}
          </div>
        )}

        {!examStarted && (
          <div className="card p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-white">
                  {language === 'en' ? 'Select ATAs and questions per ATA' : 'Selecciona ATAs y preguntas por ATA'}
                </h2>
                <p className="text-sm text-steel-400 mt-1">
                  {language === 'en'
                    ? 'Set a number (free) on each ATA you want to include. Total and time are calculated automatically.'
                    : 'Pon un número (libre) en cada ATA que quieras incluir. Total y tiempo se calculan automáticamente.'}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-steel-500">Data</p>
                <p className="text-sm text-white">{loadingQuestions ? 'Loading…' : 'Ready'}</p>
              </div>
            </div>

            <div className="mt-5 grid gap-3 lg:grid-cols-3">
              <div className="p-4 rounded-xl bg-navy-800/40 border border-steel-700/30">
                <p className="text-xs text-steel-400">{language === 'en' ? 'Total questions' : 'Total de preguntas'}</p>
                <p className="text-2xl font-bold text-white mt-1">{totalSelectedQuestions}</p>
                <p className="text-xs text-steel-500 mt-2">
                  {language === 'en' ? 'Time' : 'Tiempo'}: {formatTime(totalSeconds)} (90s/{language === 'en' ? 'question' : 'pregunta'})
                </p>
              </div>
              <div className="p-4 rounded-xl bg-navy-800/40 border border-steel-700/30 lg:col-span-2">
                <p className="text-xs text-steel-400">{language === 'en' ? 'Quick presets (optional)' : 'Presets rápidos (opcional)'}</p>
                <p className="text-xs text-steel-500 mt-1">
                  {language === 'en'
                    ? 'You can replicate EASA real exam sizes by setting ATAs manually.'
                    : 'Puedes replicar el tamaño real EASA ajustando manualmente los ATAs.'}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {[
                    { label: 'Book 2 = 48', hint: '48 total' },
                    { label: 'Book 3 = 32', hint: '32 total' },
                    { label: 'Book 4 = 36', hint: '36 total' },
                    { label: 'Book 5 = 40', hint: '40 total' },
                  ].map((p) => (
                    <span
                      key={p.label}
                      className="text-[11px] px-2 py-0.5 rounded-full bg-navy-900/60 border border-steel-700/40 text-steel-300"
                    >
                      {p.label}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-5 overflow-hidden rounded-xl border border-steel-700/30">
              <div className="grid grid-cols-12 gap-2 px-4 py-3 bg-navy-900/60 text-xs text-steel-400">
                <div className="col-span-2">Book</div>
                <div className="col-span-2">ATA</div>
                <div className="col-span-5">{language === 'en' ? 'Description' : 'Descripción'}</div>
                <div className="col-span-2 text-right">{language === 'en' ? 'Available' : 'Disponibles'}</div>
                <div className="col-span-1 text-right">{language === 'en' ? 'Pick' : 'Elegir'}</div>
              </div>
              <div className="divide-y divide-steel-700/20">
                {ataRows.map((row) => {
                  const val = clampInt(countsBySelectionKey[row.key], 0, row.available)
                  const disabled = loadingQuestions || row.available === 0
                  return (
                    <div key={row.key} className="grid grid-cols-12 gap-2 px-4 py-3 bg-navy-800/30">
                      <div className="col-span-2 text-xs text-steel-300">{row.bookName}</div>
                      <div className="col-span-2 text-sm font-semibold text-gold-300">{row.ataCode}</div>
                      <div className="col-span-5 text-xs text-steel-400">{row.ataDescription}</div>
                      <div className="col-span-2 text-right text-xs text-steel-300">{row.available}</div>
                      <div className="col-span-1 text-right">
                        <input
                          type="number"
                          min={0}
                          max={row.available}
                          disabled={disabled}
                          value={val}
                          onChange={(e) =>
                            setCountsBySelectionKey((prev) => ({
                              ...prev,
                              [row.key]: clampInt(e.target.value, 0, row.available),
                            }))
                          }
                          className="w-16 px-2 py-1 rounded-lg bg-navy-900/50 border border-steel-700/30 text-white text-xs text-right disabled:opacity-50"
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="mt-6 flex items-center justify-between">
              <button
                className="btn-secondary"
                onClick={() => {
                  setCountsBySelectionKey({})
                  setError(null)
                }}
              >
                {language === 'en' ? 'Clear' : 'Limpiar'}
              </button>
              <button onClick={startExam} className="btn-primary-filled" disabled={loadingExam || loadingQuestions}>
                {loadingExam ? 'Starting…' : 'Start exam'}
              </button>
            </div>
          </div>
        )}

        {/* Exam UI */}
        {examStarted && (
          <div>
            <div className="mb-6">
              <div className="flex items-center justify-between gap-4">
                <button onClick={saveProgressAndBack} className="btn-secondary">
                  {language === 'en' ? 'Back (save progress)' : 'Volver (guardar progreso)'}
                </button>
                <div className="flex items-center gap-2">
                  <span className="text-xs px-2 py-0.5 rounded-full bg-gold-500/10 border border-gold-500/30 text-gold-300">
                    Custom Exam
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-navy-800/60 border border-steel-700/40 text-steel-300">
                    Pass ≥75%
                  </span>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full border ${
                      secondsLeft <= 30
                        ? 'bg-error-600/20 border-error-500/30 text-error-200'
                        : 'bg-navy-800/60 border-steel-700/40 text-steel-200'
                    }`}
                  >
                    ⏱ {formatTime(secondsLeft)}
                  </span>
                </div>
              </div>
            </div>

            {totalInSession === 0 ? (
              <div className="card p-8">
                <h2 className="text-xl font-semibold text-white">No questions available</h2>
                <p className="text-steel-400 mt-2">Please go back and adjust your configuration.</p>
                <div className="mt-6">
                  <button
                    onClick={() => {
                      resetExamState()
                    }}
                    className="btn-primary-filled"
                  >
                    Back
                  </button>
                </div>
              </div>
            ) : finished ? (
              <div className="card p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-semibold text-white">
                      {language === 'en' ? 'Session complete' : 'Sesión completada'}
                    </h2>
                    <p className="text-steel-400 mt-1">
                      {language === 'en' ? 'Score' : 'Puntuación'}:{' '}
                      <span className="text-white font-semibold">{score}/{totalInSession}</span> (
                      <span className="text-white font-semibold">{Math.round(percent * 100)}%</span>)
                    </p>
                  </div>
                  <span
                    className={`text-xs px-3 py-1 rounded-full border ${
                      passed ? 'bg-success-500/10 border-success-500/30 text-success-300' : 'bg-error-600/20 border-error-500/30 text-error-300'
                    }`}
                  >
                    {passed ? 'PASS (≥75%)' : 'FAIL (<75%)'}
                  </span>
                </div>

                <div className="mt-6">
                  <h3 className="text-white font-semibold mb-2">
                    {language === 'en' ? 'Score breakdown by ATA' : 'Desglose por ATA'}
                  </h3>
                  <div className="space-y-2">
                    {Object.entries(breakdown)
                      .sort(([a], [b]) => a.localeCompare(b))
                      .map(([key, s]) => {
                        const [bId, ata] = key.split(':')
                        const bookName = BOOKS.find((b) => b.id === bId)?.name || bId
                        return (
                        <div key={key} className="p-4 rounded-lg bg-navy-800/50 border border-steel-700/30 flex items-center justify-between">
                          <div>
                            <p className="text-sm text-white font-semibold">
                              {bookName} • ATA {ata}
                            </p>
                            <p className="text-xs text-steel-500">
                              {language === 'en' ? 'Weak ATA if accuracy is low' : 'ATA débil si el % es bajo'}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-white font-semibold">
                              {s.correct}/{s.total}
                            </p>
                            <p className="text-xs text-steel-500">{s.total > 0 ? `${Math.round((s.correct / s.total) * 100)}%` : '—'}</p>
                          </div>
                        </div>
                      )})}
                  </div>
                </div>

                <div className="mt-6 flex flex-wrap gap-3">
                  <button onClick={tryAgain} className="btn-secondary">
                    {language === 'en' ? 'Try again (same config)' : 'Reintentar (misma configuración)'}
                  </button>
                  <button onClick={saveProgressAndBack} className="btn-primary-filled">
                    {language === 'en' ? 'Back (save progress)' : 'Volver (guardar progreso)'}
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
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-gold-500/10 border border-gold-500/30 text-gold-300">
                        {BOOKS.find((b) => b.id === current.book)?.name || current.book} • ATA {current.ata}
                      </span>
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
                        {isCorrect ? (language === 'en' ? 'Correct' : 'Correcto') : (language === 'en' ? 'Incorrect' : 'Incorrecto')}
                      </p>
                      <p className="text-xs text-steel-500 mt-2">{language === 'en' ? 'Justification' : 'Justificación'}</p>
                      <p className="text-sm text-steel-200 mt-1 whitespace-pre-line">{current.justification}</p>
                    </div>
                  )}

                  <div className="mt-6 flex items-center justify-between gap-3">
                    <button onClick={saveProgressAndBack} className="btn-secondary">
                      {language === 'en' ? 'Back (save progress)' : 'Volver (guardar progreso)'}
                    </button>
                    <button onClick={onNext} disabled={!showAnswer} className="btn-primary-filled disabled:opacity-50">
                      {language === 'en' ? 'Next' : 'Siguiente'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {!examStarted && (
          <div className="mt-8 p-4 rounded-xl bg-navy-900/40 border border-steel-700/30 text-xs text-steel-500">
            Rotation note: this mode uses the same <code className="text-steel-300">localStorage</code> tracking keys as regular mode
            (per-book, per-ATA). If an ATA is exhausted during a custom exam, it will reset for the next time.
          </div>
        )}
      </div>
    </AppLayout>
  )
}

