'use client'

import { useState, useEffect, useCallback } from 'react'
import { Download, RefreshCw } from 'lucide-react'
import { LogbookUpload } from '@/components/logbook/LogbookUpload'
import { LogbookWidget } from '@/components/logbook/LogbookWidget'

type AnalysisRow = {
  analysis_json: Record<string, unknown>
  entries_total: number | null
  last_updated: string | null
} | null

type LogbookDoc = {
  id: string
  file_name: string | null
  storage_path: string
  created_at: string
  logbook_sources?: { id: string }[] | null
}

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

  return (
    <p className="text-xs text-steel-400 mt-2">
      Procesando análisis…
    </p>
  )
}

export function Logbook360Client({
  initialAnalysis,
  logbookDocs,
}: {
  initialAnalysis: AnalysisRow | null
  logbookDocs: LogbookDoc[]
}) {
  const [analysis, setAnalysis] = useState(initialAnalysis)
  const [analyzing, setAnalyzing] = useState(false)
  const [activeJobId, setActiveJobId] = useState<string | null>(null)
  const [confirmingDelete, setConfirmingDelete] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  const reloadAnalysis = useCallback(async () => {
    const res = await fetch('/api/logbook/current')
    const data = await res.json()
    if (data?.analysis_json) {
      setAnalysis({
        analysis_json: data.analysis_json,
        entries_total: data.entries_total,
        last_updated: data.last_updated,
      })
    }
  }, [])

  async function analyzeExisting(storagePath: string) {
    setAnalyzing(true)
    try {
      const res = await fetch('/api/logbook/analyze-existing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storage_path: storagePath }),
      })
      const data = await res.json()
      if (data.job_id) setActiveJobId(data.job_id)
    } finally {
      setAnalyzing(false)
    }
  }

  async function handleDelete(doc: LogbookDoc) {
    const sourceId = doc.logbook_sources?.[0]?.id
    setDeleting(true)
    try {
      const url = sourceId
        ? `/api/logbook/source/${sourceId}`
        : `/api/logbook/document/${doc.id}`
      const res = await fetch(url, { method: 'DELETE' })
      if (!res.ok) return
      setConfirmingDelete(null)
      window.location.reload()
    } finally {
      setDeleting(false)
    }
  }

  const json = analysis?.analysis_json

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 lg:px-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-xl font-medium text-white flex items-center gap-2">
            logBook360
            <span className="text-[10px] px-1.5 py-0.5 rounded border border-gold-500/40 text-gold-500">
              beta
            </span>
          </h1>
          <p className="text-xs text-steel-400 mt-1">
            Análisis automático de tu experiencia de mantenimiento (primera impresión, no registro
            legal).
          </p>
        </div>
        {json && (
          <a
            href="/api/logbook/pdf-download"
            className="flex items-center justify-center gap-2 text-xs text-gold-500 border border-gold-500/30 rounded-md px-3 py-1.5 hover:bg-gold-500/10 transition-colors"
          >
            <Download size={13} />
            Descargar PDF
          </a>
        )}
      </div>

      {json ? (
        <div className="mb-8 rounded-xl border border-steel-700/40 bg-navy-900/40 p-5">
          <LogbookWidget analysis={json} />
        </div>
      ) : (
        <div className="mb-8 rounded-xl border border-steel-700/40 bg-navy-900 p-8 text-center">
          <p className="text-steel-400 text-sm mb-1">Aún no hay análisis generado</p>
          <p className="text-steel-600 text-xs">
            Sube un PDF de logbook y pulsa <strong className="text-steel-400">Analizar</strong>, o
            analiza un documento que ya subiste en Documentos.
          </p>
        </div>
      )}

      {logbookDocs.length > 0 && (
        <div className="mb-6">
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
                  <span className="text-xs text-white block truncate">{doc.file_name || '—'}</span>
                  <span className="text-xs text-steel-600">
                    {new Date(doc.created_at).toLocaleDateString('es-ES')}
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => analyzeExisting(doc.storage_path)}
                    disabled={analyzing}
                    className="flex items-center gap-1.5 text-xs text-gold-500 border border-gold-500/30 rounded-md px-3 py-1 hover:bg-gold-500/10 transition-colors disabled:opacity-50"
                  >
                    <RefreshCw size={11} className={analyzing ? 'animate-spin' : ''} />
                    {analyzing ? '…' : 'Analizar'}
                  </button>
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

      <div className="border border-steel-700/40 rounded-xl p-5 bg-navy-900/50">
        <div className="text-xs font-medium text-steel-300 mb-1">Añadir otro logbook</div>
        <div className="text-xs text-steel-500 mb-4">
          Puedes subir PDFs exportados de AMOS, TRAX o logbook EASA manual. Las entradas se fusionan
          sin duplicados (misma fecha + WO + ATA).
        </div>
        <LogbookUpload
          onComplete={reloadAnalysis}
          onJobCreated={(id) => setActiveJobId(id)}
        />
      </div>

      {activeJobId && (
        <JobPoller
          jobId={activeJobId}
          onComplete={() => {
            setActiveJobId(null)
            reloadAnalysis()
          }}
        />
      )}
    </div>
  )
}
