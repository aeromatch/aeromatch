'use client'

import { useState, useEffect, useRef, useCallback, type ChangeEvent } from 'react'

type JobStatus = {
  status: 'pending' | 'processing' | 'completed' | 'failed'
  source_system_label?: string | null
  error_message?: string | null
}

export function LogbookUpload({
  onComplete,
  onJobCreated,
}: {
  onComplete: () => void
  onJobCreated?: (jobId: string) => void
}) {
  const [uploading, setUploading] = useState(false)
  const [jobId, setJobId] = useState<string | null>(null)
  const [jobStatus, setJobStatus] = useState<JobStatus | null>(null)
  const [pendingAnalyze, setPendingAnalyze] = useState<{
    jobId: string
    storagePath: string
  } | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  const poll = useCallback(
    (id: string) => {
      stopPolling()
      intervalRef.current = setInterval(async () => {
        const res = await fetch(`/api/logbook/status/${id}`)
        if (!res.ok) return
        const data = (await res.json()) as JobStatus
        setJobStatus(data)
        if (data.status === 'completed') {
          stopPolling()
          setJobId(null)
          setPendingAnalyze(null)
          onComplete()
        }
        if (data.status === 'failed') {
          stopPolling()
        }
      }, 3000)
    },
    [onComplete, stopPolling]
  )

  useEffect(() => {
    return () => stopPolling()
  }, [stopPolling])

  async function startAnalyze(jid: string) {
    const res = await fetch('/api/logbook/analyze-job', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ job_id: jid }),
    })
    if (!res.ok) return
    setJobStatus({ status: 'processing' })
    poll(jid)
  }

  async function handleFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return

    setUploading(true)
    setJobStatus(null)
    try {
      const form = new FormData()
      form.append('file', file)
      const res = await fetch('/api/logbook/upload', { method: 'POST', body: form })
      const data = await res.json()
      if (data.job_id && data.storage_path) {
        setPendingAnalyze({ jobId: data.job_id, storagePath: data.storage_path })
        setJobId(data.job_id)
        onJobCreated?.(data.job_id)
      }
    } finally {
      setUploading(false)
    }
  }

  if (jobStatus?.status === 'completed') {
    return (
      <div className="text-xs text-success-400 flex items-center gap-2">
        <span>✓</span>
        <span>
          {jobStatus.source_system_label
            ? `${jobStatus.source_system_label} · análisis completado`
            : 'Logbook analizado correctamente'}
        </span>
      </div>
    )
  }

  if (jobStatus?.status === 'failed') {
    return (
      <div className="text-xs text-error-400">
        Error: {jobStatus.error_message || 'No se pudo analizar el documento'}
      </div>
    )
  }

  if (jobStatus?.status === 'pending' || jobStatus?.status === 'processing') {
    return (
      <div className="text-xs text-steel-400 flex items-center gap-2">
        <span className="inline-block animate-spin">⟳</span>
        <span>Analizando logbook…</span>
      </div>
    )
  }

  // TODO: reactivar cuando el análisis esté listo
  const ANALYSIS_DISABLED = true

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      {ANALYSIS_DISABLED ? (
        <span className="inline-block text-xs text-steel-500 border border-steel-700/30 rounded-md px-3 py-1.5">
          Análisis en mantenimiento — disponible próximamente
        </span>
      ) : (
        <>
          <label className="cursor-pointer">
            <input
              type="file"
              accept=".pdf"
              className="hidden"
              onChange={handleFile}
              disabled={uploading}
            />
            <span className="inline-block text-xs text-gold-500 border border-gold-500/30 rounded-md px-3 py-1.5 hover:bg-gold-500/10 transition-colors">
              {uploading ? 'Subiendo…' : '+ Subir logbook PDF'}
            </span>
          </label>
          {pendingAnalyze && (
            <button
              type="button"
              onClick={() => startAnalyze(pendingAnalyze.jobId)}
              className="text-xs text-gold-500 border border-gold-500/50 rounded-md px-3 py-1.5 hover:bg-gold-500/10 transition-colors"
            >
              Analizar
            </button>
          )}
        </>
      )}
    </div>
  )
}
