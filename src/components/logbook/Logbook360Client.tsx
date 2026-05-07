'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Download, Printer, RefreshCw } from 'lucide-react'
import { LogbookUpload } from '@/components/logbook/LogbookUpload'
import { LogbookWidget } from '@/components/logbook/LogbookWidget'
import { ManualLogbookSection } from '@/components/logbook/ManualLogbookSection'

type AnalysisRow = {
  analysis_json: Record<string, unknown>
  entries_total: number | null
  last_updated: string | null
  html_report_path?: string | null
  html_report_uploaded_at?: string | null
} | null

type LogbookDoc = {
  id: string
  file_name: string | null
  storage_path: string
  created_at: string
  logbook_sources?: { id: string }[] | null
}

type Tab = 'view' | 'manual'

function JobPoller({
  jobId,
  onComplete,
}: {
  jobId: string
  onComplete: () => void
}) {
  useEffect(() => {
    const t = setInterval(async () => {
      const res = await fetch(`/api/logbook/status/${jobId}`)
      if (!res.ok) return
      const data = await res.json()
      if (data.status === 'completed' || data.status === 'failed') {
        clearInterval(t)
        onComplete()
      }
    }, 3000)
    return () => clearInterval(t)
  }, [jobId, onComplete])

  return <p className="text-xs text-steel-400 mt-2">Procesando análisis…</p>
}

export function Logbook360Client({
  initialAnalysis,
  logbookDocs,
  technicianName,
}: {
  initialAnalysis: AnalysisRow | null
  logbookDocs: LogbookDoc[]
  technicianName: string
}) {
  const [analysis, setAnalysis] = useState<AnalysisRow>(initialAnalysis)
  const [activeJobId, setActiveJobId] = useState<string | null>(null)
  const [confirmingDelete, setConfirmingDelete] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  // El HTML report se sirve directamente desde /api/logbook/report (con
  // Content-Type: text/html). No necesitamos signed URL: el endpoint
  // valida la sesion y proxy del Storage con headers correctos.
  const reportSrc = '/api/logbook/report?inline=1'
  const iframeRef = useRef<HTMLIFrameElement | null>(null)

  const [tab, setTab] = useState<Tab>('view')

  const hasHtmlReport = Boolean(analysis?.html_report_path)
  const json = analysis?.analysis_json as Record<string, unknown> | undefined
  const hasAnalysis =
    !!json &&
    typeof json === 'object' &&
    'summary' in json &&
    Number((json as { summary?: { total_entries?: number } }).summary?.total_entries || 0) > 0

  const reloadAnalysis = useCallback(async () => {
    const res = await fetch('/api/logbook/current')
    const data = await res.json()
    if (data?.analysis_json) {
      setAnalysis((prev) => ({
        analysis_json: data.analysis_json,
        entries_total: data.entries_total,
        last_updated: data.last_updated,
        html_report_path: prev?.html_report_path ?? null,
        html_report_uploaded_at: prev?.html_report_uploaded_at ?? null,
      }))
    }
  }, [])

  async function handleDelete(doc: LogbookDoc) {
    const sourceId = doc.logbook_sources?.[0]?.id
    setDeleting(true)
    try {
      const url = sourceId ? `/api/logbook/source/${sourceId}` : `/api/logbook/document/${doc.id}`
      const res = await fetch(url, { method: 'DELETE' })
      if (!res.ok) return
      setConfirmingDelete(null)
      window.location.reload()
    } finally {
      setDeleting(false)
    }
  }

  function handlePrint() {
    if (!iframeRef.current) return
    try {
      iframeRef.current.contentWindow?.focus()
      iframeRef.current.contentWindow?.print()
    } catch (err) {
      console.error('print failed', err)
    }
  }

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 lg:px-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-medium text-white flex items-center gap-2">
            logBook360
            <span className="text-[10px] px-1.5 py-0.5 rounded border border-gold-500/40 text-gold-500">
              beta
            </span>
          </h1>
          <p className="text-xs text-steel-400 mt-1">
            {technicianName} · Análisis de tu experiencia de mantenimiento.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-steel-700/40 mb-6 flex gap-6">
        <button
          type="button"
          onClick={() => setTab('view')}
          className={`pb-2 text-xs font-medium transition-colors border-b-2 ${
            tab === 'view'
              ? 'border-gold-500 text-gold-400'
              : 'border-transparent text-steel-400 hover:text-white'
          }`}
        >
          Vista
        </button>
        <button
          type="button"
          onClick={() => setTab('manual')}
          className={`pb-2 text-xs font-medium transition-colors border-b-2 ${
            tab === 'manual'
              ? 'border-gold-500 text-gold-400'
              : 'border-transparent text-steel-400 hover:text-white'
          }`}
        >
          Añadir entradas
        </button>
      </div>

      {tab === 'view' && (
        <>
          {hasHtmlReport ? (
            <div className="rounded-xl border border-steel-700/40 bg-navy-900 overflow-hidden">
              <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-b border-steel-700/40 bg-navy-900/70">
                <div className="text-xs text-steel-400">
                  logBook360 ·{' '}
                  <span className="text-white">{technicianName}</span>
                  {analysis?.html_report_uploaded_at && (
                    <span className="text-steel-600 ml-2">
                      · Actualizado{' '}
                      {new Date(analysis.html_report_uploaded_at).toLocaleDateString('es-ES')}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handlePrint}
                    className="flex items-center gap-1.5 text-xs text-steel-300 border border-steel-700/40 rounded-md px-3 py-1.5 hover:bg-steel-700/20"
                  >
                    <Printer size={12} />
                    Imprimir / PDF
                  </button>
                  <a
                    href="/api/logbook/report?download=1"
                    className="flex items-center gap-1.5 text-xs text-gold-500 border border-gold-500/30 rounded-md px-3 py-1.5 hover:bg-gold-500/10"
                  >
                    <Download size={12} />
                    Descargar HTML
                  </a>
                </div>
              </div>

              <iframe
                ref={iframeRef}
                src={reportSrc}
                className="w-full border-0 bg-white"
                style={{ height: 'calc(100vh - 220px)', minHeight: '600px' }}
                title="logBook360"
              />
            </div>
          ) : hasAnalysis ? (
            <div className="rounded-xl border border-steel-700/40 bg-navy-900/40 p-5">
              <LogbookWidget analysis={json!} />
            </div>
          ) : (
            <div className="rounded-xl border border-steel-700/40 bg-navy-900 p-10 text-center">
              <div className="text-3xl mb-2">📋</div>
              <p className="text-white text-sm font-medium mb-1">
                Tu logBook360 está en preparación
              </p>
              <p className="text-steel-500 text-xs max-w-md mx-auto mb-5">
                Sube tu logbook en la pestaña <strong className="text-steel-400">Documentos</strong> y
                lo analizaremos automáticamente. También puedes empezar a añadir entradas
                manualmente.
              </p>
              <div className="flex items-center justify-center gap-3">
                <a
                  href="/dashboard/documents"
                  className="text-xs px-4 py-2 border border-steel-700/40 text-steel-300 rounded-md hover:bg-steel-700/20"
                >
                  Ir a Documentos
                </a>
                <button
                  type="button"
                  onClick={() => setTab('manual')}
                  className="text-xs px-4 py-2 bg-gold-500 text-navy-950 font-semibold rounded-md hover:bg-gold-400"
                >
                  Añadir entrada manual
                </button>
              </div>
            </div>
          )}

          {/* Logbooks subidos (solo si no hay HTML report, mantenemos flujo de PDFs) */}
          {!hasHtmlReport && logbookDocs.length > 0 && (
            <div className="mt-6">
              <div className="text-xs font-medium text-steel-400 uppercase tracking-wider mb-3">
                Logbooks subidos (perfil)
              </div>
              <div className="flex flex-col gap-2">
                {logbookDocs.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between gap-2 bg-navy-900 border border-steel-700/40 rounded-lg px-4 py-3"
                  >
                    <div className="min-w-0">
                      <span className="text-xs text-white block truncate">
                        {doc.file_name || '—'}
                      </span>
                      <span className="text-xs text-steel-600">
                        {new Date(doc.created_at).toLocaleDateString('es-ES')}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className="flex items-center gap-1.5 text-xs text-steel-600 border border-steel-700/30 rounded-md px-3 py-1 opacity-60 cursor-not-allowed"
                        title="Análisis en mantenimiento"
                      >
                        <RefreshCw size={11} />
                        En mantenimiento
                      </span>
                      {confirmingDelete === doc.id ? (
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-steel-400">¿Eliminar?</span>
                          <button
                            type="button"
                            onClick={() => handleDelete(doc)}
                            disabled={deleting}
                            className="text-xs text-error-400 border border-error-500/30 rounded-md px-2 py-1 hover:bg-error-500/10 transition-colors"
                          >
                            {deleting ? '…' : 'Sí'}
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmingDelete(null)}
                            className="text-xs text-steel-400 border border-steel-700/40 rounded-md px-2 py-1 hover:bg-steel-700/20 transition-colors"
                          >
                            No
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setConfirmingDelete(doc.id)}
                          className="text-xs text-steel-500 border border-steel-700/40 rounded-md px-2 py-1 hover:text-error-400 hover:border-error-500/30 transition-colors"
                        >
                          Eliminar
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Subida de PDF (mantener funcionalidad existente) si no hay HTML report */}
          {!hasHtmlReport && (
            <div className="mt-6 border border-steel-700/40 rounded-xl p-5 bg-navy-900/50">
              <div className="text-xs font-medium text-steel-300 mb-1">
                Añadir otro logbook (PDF)
              </div>
              <div className="text-xs text-steel-500 mb-4">
                Puedes subir PDFs exportados de AMOS, TRAX o logbook EASA manual. Las entradas se
                fusionan sin duplicados (misma fecha + WO + ATA).
              </div>
              <LogbookUpload
                onComplete={reloadAnalysis}
                onJobCreated={(id) => setActiveJobId(id)}
              />
            </div>
          )}

          {activeJobId && (
            <JobPoller
              jobId={activeJobId}
              onComplete={() => {
                setActiveJobId(null)
                reloadAnalysis()
              }}
            />
          )}
        </>
      )}

      {tab === 'manual' && <ManualLogbookSection onChange={reloadAnalysis} />}
    </div>
  )
}
