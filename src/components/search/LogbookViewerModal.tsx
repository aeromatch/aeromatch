'use client'

import { useEffect, useRef } from 'react'
import { Download, Printer, X } from 'lucide-react'
import { useLanguage } from '@/lib/i18n/LanguageContext'

type Props = {
  isOpen: boolean
  onClose: () => void
  technicianId: string
  technicianLabel?: string
  uploadedAt?: string | null
}

/**
 * Modal full-screen para mostrar el logBook360 HTML de un tecnico verificado.
 * Reutiliza /api/logbook/report (ya valida acceso y sirve el HTML con
 * Content-Type correcto + reglas de print inyectadas).
 */
export function LogbookViewerModal({
  isOpen,
  onClose,
  technicianId,
  technicianLabel,
  uploadedAt,
}: Props) {
  const { language } = useLanguage()
  const iframeRef = useRef<HTMLIFrameElement | null>(null)

  useEffect(() => {
    if (!isOpen) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const labels = {
    title: 'logBook360',
    verified: language === 'es' ? 'Verificado' : 'Verified',
    updated: language === 'es' ? 'Actualizado' : 'Updated',
    print: language === 'es' ? 'Imprimir / PDF' : 'Print / PDF',
    download: language === 'es' ? 'Descargar HTML' : 'Download HTML',
    close: language === 'es' ? 'Cerrar' : 'Close',
  }

  const src = `/api/logbook/report?technician_id=${encodeURIComponent(technicianId)}&inline=1`
  const downloadUrl = `/api/logbook/report?technician_id=${encodeURIComponent(
    technicianId,
  )}&download=1`

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
    <div
      className="fixed inset-0 z-[80] bg-black/85 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4"
      onClick={onClose}
    >
      <div
        className="bg-navy-900 border border-steel-700 rounded-2xl w-full max-w-7xl h-[95vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 border-b border-steel-700/40 bg-navy-900/70">
          <div className="flex items-center gap-3 min-w-0">
            <h2 className="text-base font-semibold text-white">{labels.title}</h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-medium border border-green-500/30 bg-green-500/10 text-green-400">
              ✓ {labels.verified}
            </span>
            {technicianLabel && (
              <span className="text-xs text-steel-400 truncate">· {technicianLabel}</span>
            )}
            {uploadedAt && (
              <span className="text-[11px] text-steel-500 hidden sm:inline">
                · {labels.updated}{' '}
                {new Date(uploadedAt).toLocaleDateString(language === 'es' ? 'es-ES' : 'en-GB')}
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
              {labels.print}
            </button>
            <a
              href={downloadUrl}
              className="flex items-center gap-1.5 text-xs text-gold-500 border border-gold-500/30 rounded-md px-3 py-1.5 hover:bg-gold-500/10"
            >
              <Download size={12} />
              {labels.download}
            </a>
            <button
              type="button"
              onClick={onClose}
              aria-label={labels.close}
              className="flex items-center justify-center w-8 h-8 rounded-md text-steel-400 hover:text-white hover:bg-steel-700/20"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Iframe */}
        <div className="flex-1 bg-white">
          <iframe
            ref={iframeRef}
            src={src}
            className="w-full h-full border-0 bg-white"
            title={`logBook360 · ${technicianLabel || technicianId}`}
          />
        </div>
      </div>
    </div>
  )
}
