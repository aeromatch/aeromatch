'use client'

import { useEffect, useRef, useState } from 'react'

const MAX_HTML_BYTES = 2 * 1024 * 1024

type ReportStatus = {
  has_report: boolean
  html_report_uploaded_at: string | null
}

type Props = {
  technicianId: string
  technicianName?: string
  /**
   * Estado inicial que ya viene en el listado de admin (evita una peticion
   * por fila). Si se pasa, no hacemos fetch al montar.
   */
  initialHasReport?: boolean
  initialUploadedAt?: string | null
  /** Callback opcional cuando cambia el estado tras upload/delete. */
  onChange?: (next: { hasReport: boolean; uploadedAt: string | null }) => void
}

export function LogbookReportUploadButton({
  technicianId,
  technicianName,
  initialHasReport,
  initialUploadedAt,
  onChange,
}: Props) {
  const hasInitialStatus = typeof initialHasReport === 'boolean'

  const [status, setStatus] = useState<ReportStatus | null>(
    hasInitialStatus
      ? { has_report: !!initialHasReport, html_report_uploaded_at: initialUploadedAt ?? null }
      : null,
  )
  const [loadingStatus, setLoadingStatus] = useState(!hasInitialStatus)
  const [open, setOpen] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [feedback, setFeedback] = useState<{ kind: 'ok' | 'err'; msg: string } | null>(null)
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  async function fetchStatus() {
    setLoadingStatus(true)
    try {
      const res = await fetch(
        `/api/admin/logbook/upload-report?technician_id=${encodeURIComponent(technicianId)}`,
      )
      if (res.ok) {
        const data = await res.json()
        const next: ReportStatus = {
          has_report: Boolean(data.has_report),
          html_report_uploaded_at: data.html_report_uploaded_at ?? null,
        }
        setStatus(next)
        onChange?.({ hasReport: next.has_report, uploadedAt: next.html_report_uploaded_at })
      } else {
        setStatus({ has_report: false, html_report_uploaded_at: null })
      }
    } finally {
      setLoadingStatus(false)
    }
  }

  useEffect(() => {
    if (hasInitialStatus) return
    void fetchStatus()
  }, [technicianId])

  // Si el padre actualiza initialHasReport (ej. tras refetch del listado),
  // sincronizamos el estado local.
  useEffect(() => {
    if (!hasInitialStatus) return
    setStatus({
      has_report: !!initialHasReport,
      html_report_uploaded_at: initialUploadedAt ?? null,
    })
  }, [initialHasReport, initialUploadedAt, hasInitialStatus])

  function openModal() {
    setOpen(true)
    setFile(null)
    setFeedback(null)
    setConfirmingDelete(false)
  }

  function closeModal() {
    if (uploading || deleting) return
    setOpen(false)
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] || null
    setFeedback(null)
    if (!f) {
      setFile(null)
      return
    }
    if (f.size > MAX_HTML_BYTES) {
      setFeedback({
        kind: 'err',
        msg: `El archivo supera ${MAX_HTML_BYTES / 1024 / 1024} MB.`,
      })
      setFile(null)
      return
    }
    const lower = f.name.toLowerCase()
    if (!lower.endsWith('.html') && !lower.endsWith('.htm')) {
      setFeedback({ kind: 'err', msg: 'Solo se permiten archivos .html' })
      setFile(null)
      return
    }
    setFile(f)
  }

  async function handleUpload() {
    if (!file) return
    setUploading(true)
    setFeedback(null)
    try {
      const formData = new FormData()
      formData.append('technician_id', technicianId)
      formData.append('file', file, file.name)

      const res = await fetch('/api/admin/logbook/upload-report', {
        method: 'POST',
        body: formData,
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setFeedback({ kind: 'err', msg: data.error || 'Error al subir el archivo' })
        return
      }
      setFeedback({ kind: 'ok', msg: 'logBook360 subido correctamente.' })
      setFile(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
      const uploadedAt: string = data.html_report_uploaded_at || new Date().toISOString()
      setStatus({ has_report: true, html_report_uploaded_at: uploadedAt })
      onChange?.({ hasReport: true, uploadedAt })
    } finally {
      setUploading(false)
    }
  }

  async function handleDelete() {
    setDeleting(true)
    setFeedback(null)
    try {
      const res = await fetch(
        `/api/admin/logbook/upload-report?technician_id=${encodeURIComponent(technicianId)}`,
        { method: 'DELETE' },
      )
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setFeedback({ kind: 'err', msg: data.error || 'Error al borrar el archivo' })
        return
      }
      setFeedback({ kind: 'ok', msg: 'logBook360 eliminado.' })
      setConfirmingDelete(false)
      setStatus({ has_report: false, html_report_uploaded_at: null })
      onChange?.({ hasReport: false, uploadedAt: null })
    } finally {
      setDeleting(false)
    }
  }

  const hasReport = !!status?.has_report
  const buttonLabel = hasReport ? '✓ logBook360' : '↑ logBook360'
  const buttonClass = hasReport
    ? 'px-2 py-1 rounded bg-green-500/15 border border-green-500/40 text-green-300 text-xs font-semibold'
    : 'px-2 py-1 rounded bg-gold-500/10 border border-gold-500/30 text-gold-300 text-xs'

  const tooltip =
    hasReport && status?.html_report_uploaded_at
      ? `Subido: ${new Date(status.html_report_uploaded_at).toLocaleString('es-ES')}`
      : 'Subir logBook360 (HTML)'

  return (
    <>
      <button
        type="button"
        onClick={openModal}
        disabled={loadingStatus}
        title={tooltip}
        className={`${buttonClass} disabled:opacity-50`}
      >
        {loadingStatus ? '...' : buttonLabel}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
          onClick={closeModal}
        >
          <div
            className="bg-navy-900 border border-steel-700 rounded-2xl max-w-md w-full mx-4 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5 border-b border-steel-700 flex items-center justify-between">
              <div>
                <h3 className="text-white font-semibold text-base">Subir logBook360</h3>
                {technicianName && (
                  <p className="text-xs text-steel-400 mt-0.5">{technicianName}</p>
                )}
              </div>
              <button
                onClick={closeModal}
                disabled={uploading || deleting}
                className="text-steel-400 hover:text-white disabled:opacity-50"
                aria-label="Cerrar"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-4">
              {status?.has_report && status.html_report_uploaded_at && (
                <div className="text-xs text-steel-400 bg-navy-950 border border-steel-700/40 rounded-lg p-3">
                  Ya hay un logBook360 subido el{' '}
                  <span className="text-white">
                    {new Date(status.html_report_uploaded_at).toLocaleString('es-ES')}
                  </span>
                  . Si subes otro, se sobrescribirá.
                </div>
              )}

              <div>
                <label className="block text-xs text-steel-400 mb-2">
                  Archivo .html (máx. {MAX_HTML_BYTES / 1024 / 1024} MB)
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".html,.htm,text/html"
                  onChange={handleFileChange}
                  disabled={uploading}
                  className="block w-full text-xs text-steel-300 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-medium file:bg-gold-500/10 file:text-gold-400 hover:file:bg-gold-500/20 file:cursor-pointer"
                />
                {file && (
                  <p className="text-xs text-steel-500 mt-2">
                    {file.name} · {(file.size / 1024).toFixed(1)} KB
                  </p>
                )}
              </div>

              {feedback && (
                <div
                  className={`text-xs rounded-md p-2.5 ${
                    feedback.kind === 'ok'
                      ? 'bg-green-500/10 border border-green-500/30 text-green-300'
                      : 'bg-red-500/10 border border-red-500/30 text-red-300'
                  }`}
                >
                  {feedback.msg}
                </div>
              )}

              {confirmingDelete ? (
                <div className="flex items-center gap-2 justify-end pt-2 border-t border-steel-700/40">
                  <span className="text-xs text-steel-300 mr-auto">¿Eliminar el HTML actual?</span>
                  <button
                    type="button"
                    onClick={() => setConfirmingDelete(false)}
                    disabled={deleting}
                    className="text-xs px-3 py-1.5 border border-steel-700/40 text-steel-400 rounded-md hover:bg-steel-700/20"
                  >
                    No
                  </button>
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={deleting}
                    className="text-xs px-3 py-1.5 bg-red-500/20 border border-red-500/30 text-red-300 rounded-md hover:bg-red-500/30 disabled:opacity-60"
                  >
                    {deleting ? 'Eliminando…' : 'Sí, eliminar'}
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2 justify-end pt-2 border-t border-steel-700/40">
                  {status?.has_report && (
                    <button
                      type="button"
                      onClick={() => setConfirmingDelete(true)}
                      disabled={uploading}
                      className="text-xs px-3 py-1.5 mr-auto text-red-300 hover:text-red-200 hover:underline disabled:opacity-60"
                    >
                      Eliminar actual
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={closeModal}
                    disabled={uploading}
                    className="text-xs px-3 py-1.5 border border-steel-700/40 text-steel-400 rounded-md hover:bg-steel-700/20"
                  >
                    Cerrar
                  </button>
                  <button
                    type="button"
                    onClick={handleUpload}
                    disabled={!file || uploading}
                    className="text-xs px-4 py-1.5 bg-gold-500 text-navy-950 font-semibold rounded-md hover:bg-gold-400 disabled:opacity-50"
                  >
                    {uploading ? 'Subiendo…' : 'Subir'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
