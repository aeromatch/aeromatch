'use client'

import { useState, useEffect, useCallback } from 'react'

type Segment =
  | 'all_technicians'
  | 'technicians_no_availability'
  | 'technicians_verified'
  | 'technicians_unverified'
  | 'all_companies'

const SEGMENT_LABELS: Record<Segment, string> = {
  all_technicians: 'Todos los técnicos',
  technicians_no_availability: 'Técnicos sin disponibilidad activa',
  technicians_verified: 'Técnicos verificados (AMX checked)',
  technicians_unverified: 'Técnicos no verificados',
  all_companies: 'Todas las empresas',
}

type HistoryRow = {
  id: string
  subject: string
  segment: string
  recipients_count: number
  errors_count: number
  status: string
  scheduled_at: string | null
  created_at: string
}

export function MailingTab() {
  const [segment, setSegment] = useState<Segment>('all_technicians')
  const [recipientCount, setRecipientCount] = useState<number | null>(null)
  const [loadingCount, setLoadingCount] = useState(false)
  const [manualEmail, setManualEmail] = useState('')

  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [ctaText, setCtaText] = useState('')
  const [ctaUrl, setCtaUrl] = useState('')

  const [scheduledAt, setScheduledAt] = useState('')

  const [previewing, setPreviewing] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [sending, setSending] = useState(false)
  const [result, setResult] = useState<{ sent: number; errors: number; scheduled?: boolean } | null>(null)

  const [history, setHistory] = useState<HistoryRow[]>([])

  const fetchCount = useCallback(async (seg: Segment) => {
    setLoadingCount(true)
    try {
      const res = await fetch(`/api/admin/mailing?action=count&segment=${seg}`)
      if (res.ok) {
        const data = await res.json()
        setRecipientCount(data.count ?? 0)
      }
    } finally {
      setLoadingCount(false)
    }
  }, [])

  const fetchHistory = useCallback(async () => {
    const res = await fetch('/api/admin/mailing?action=history')
    if (res.ok) {
      const data = await res.json()
      setHistory(data.rows ?? [])
    }
  }, [])

  useEffect(() => {
    fetchCount(segment)
  }, [segment, fetchCount])

  useEffect(() => {
    fetchHistory()
  }, [fetchHistory])

  async function handleSend() {
    setSending(true)
    setResult(null)
    try {
      const payload: Record<string, unknown> = { segment, subject, body, cta_text: ctaText || undefined, cta_url: ctaUrl || undefined }
      if (manualEmail.trim()) payload.manual_email = manualEmail.trim()
      if (scheduledAt) payload.scheduled_at = new Date(scheduledAt).toISOString()
      const res = await fetch('/api/admin/mailing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (data.scheduled) {
        setResult({ sent: 0, errors: 0, scheduled: true })
      } else {
        setResult({ sent: data.sent ?? 0, errors: data.errors ?? 0 })
      }
      setConfirmOpen(false)
      fetchHistory()
    } finally {
      setSending(false)
    }
  }

  const previewHtml = buildPreviewHtml(subject, body, ctaText, ctaUrl)
  const isManualMode = manualEmail.trim().length > 0
  const canSend = subject.trim() && body.trim() && (isManualMode || (recipientCount && recipientCount > 0))

  return (
    <div className="space-y-8">
      {/* Segment selector */}
      <div className="bg-navy-900 border border-steel-700/40 rounded-xl p-5">
        <h3 className="text-sm font-semibold text-white mb-3">Destinatarios</h3>
        <div className="flex flex-col gap-2">
          {(Object.keys(SEGMENT_LABELS) as Segment[]).map((seg) => (
            <label key={seg} className="flex items-center gap-3 cursor-pointer">
              <input
                type="radio"
                name="segment"
                value={seg}
                checked={segment === seg}
                onChange={() => setSegment(seg)}
                className="accent-gold-500"
              />
              <span className="text-sm text-steel-300">{SEGMENT_LABELS[seg]}</span>
            </label>
          ))}
        </div>
        <div className="mt-3 text-xs text-steel-500">
          {loadingCount ? 'Contando…' : `${recipientCount ?? '—'} destinatarios`}
        </div>

        <div className="mt-4 pt-4 border-t border-steel-700/30">
          <label className="block text-xs text-steel-400 mb-1">Envío manual (prueba o unitario)</label>
          <input
            type="email"
            value={manualEmail}
            onChange={(e) => setManualEmail(e.target.value)}
            placeholder="email@ejemplo.com — deja vacío para usar el segmento"
            className="w-full bg-navy-950 border border-steel-700/50 rounded-lg px-3 py-2 text-sm text-white placeholder:text-steel-600 focus:outline-none focus:border-gold-500/50"
          />
          {isManualMode && (
            <p className="text-xs text-gold-400 mt-1">Se enviará solo a este email, ignorando el segmento.</p>
          )}
        </div>
      </div>

      {/* Email fields */}
      <div className="bg-navy-900 border border-steel-700/40 rounded-xl p-5 space-y-4">
        <h3 className="text-sm font-semibold text-white">Contenido del email</h3>
        <div>
          <label className="block text-xs text-steel-400 mb-1">Asunto</label>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Asunto del email"
            className="w-full bg-navy-950 border border-steel-700/50 rounded-lg px-3 py-2 text-sm text-white placeholder:text-steel-600 focus:outline-none focus:border-gold-500/50"
          />
        </div>
        <div>
          <label className="block text-xs text-steel-400 mb-1">Cuerpo</label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={8}
            placeholder="Escribe el contenido del email. Usa [nombre] para personalizar."
            className="w-full bg-navy-950 border border-steel-700/50 rounded-lg px-3 py-2 text-sm text-white placeholder:text-steel-600 focus:outline-none focus:border-gold-500/50 resize-y"
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-steel-400 mb-1">Texto botón CTA (opcional)</label>
            <input
              type="text"
              value={ctaText}
              onChange={(e) => setCtaText(e.target.value)}
              placeholder="Ej: Ver mi perfil"
              className="w-full bg-navy-950 border border-steel-700/50 rounded-lg px-3 py-2 text-sm text-white placeholder:text-steel-600 focus:outline-none focus:border-gold-500/50"
            />
          </div>
          <div>
            <label className="block text-xs text-steel-400 mb-1">URL del botón (opcional)</label>
            <input
              type="text"
              value={ctaUrl}
              onChange={(e) => setCtaUrl(e.target.value)}
              placeholder="https://aeromatch.eu/..."
              className="w-full bg-navy-950 border border-steel-700/50 rounded-lg px-3 py-2 text-sm text-white placeholder:text-steel-600 focus:outline-none focus:border-gold-500/50"
            />
          </div>
        </div>
        <div>
          <label className="block text-xs text-steel-400 mb-1">Programar envío (opcional)</label>
          <input
            type="datetime-local"
            value={scheduledAt}
            onChange={(e) => setScheduledAt(e.target.value)}
            className="w-full sm:w-auto bg-navy-950 border border-steel-700/50 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-gold-500/50"
          />
          {scheduledAt && (
            <div className="flex items-center gap-2 mt-1">
              <p className="text-xs text-gold-400">Se enviará el {new Date(scheduledAt).toLocaleString('es-ES')}</p>
              <button type="button" onClick={() => setScheduledAt('')} className="text-xs text-steel-500 hover:text-white">✕</button>
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => setPreviewing(!previewing)}
          className="text-sm border border-steel-600/50 text-steel-300 rounded-lg px-4 py-2 hover:bg-steel-700/20 transition-colors"
        >
          {previewing ? 'Ocultar previsualización' : 'Previsualizar'}
        </button>
        <button
          type="button"
          disabled={!canSend}
          onClick={() => setConfirmOpen(true)}
          className="text-sm bg-gold-500 text-navy-950 font-semibold rounded-lg px-5 py-2 hover:bg-gold-400 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {scheduledAt ? 'Programar' : 'Enviar'}
        </button>
      </div>

      {result && (
        <div className="text-sm p-3 rounded-lg border border-steel-700/40 bg-navy-900">
          {result.scheduled
            ? <span className="text-gold-400 font-semibold">Programado para {new Date(scheduledAt).toLocaleString('es-ES')}</span>
            : <>Enviados: <span className="text-green-400 font-semibold">{result.sent}</span>
              {result.errors > 0 && (
                <> · Errores: <span className="text-error-400 font-semibold">{result.errors}</span></>
              )}
            </>
          }
        </div>
      )}

      {/* Preview */}
      {previewing && (
        <div className="border border-steel-700/40 rounded-xl overflow-hidden">
          <div className="text-xs text-steel-500 px-4 py-2 bg-navy-900 border-b border-steel-700/40">
            Vista previa del email
          </div>
          <div
            className="bg-white"
            dangerouslySetInnerHTML={{ __html: previewHtml }}
          />
        </div>
      )}

      {/* Confirm modal */}
      {confirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-navy-900 border border-steel-700/50 rounded-2xl p-6 max-w-md w-full mx-4 space-y-4">
            <h3 className="text-white font-semibold">{scheduledAt ? 'Confirmar programación' : 'Confirmar envío'}</h3>
            <p className="text-sm text-steel-300">
              {isManualMode
                ? <>Vas a {scheduledAt ? 'programar' : 'enviar'} este email a <span className="text-gold-400 font-semibold">{manualEmail}</span>.{scheduledAt && <> Fecha: <span className="text-gold-400">{new Date(scheduledAt).toLocaleString('es-ES')}</span>.</>} ¿Confirmar?</>
                : <>Vas a {scheduledAt ? 'programar' : 'enviar'} este email a <span className="text-gold-400 font-semibold">{recipientCount}</span> destinatarios.{scheduledAt && <> Fecha: <span className="text-gold-400">{new Date(scheduledAt).toLocaleString('es-ES')}</span>.</>} ¿Confirmar?</>
              }
            </p>
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => setConfirmOpen(false)}
                className="text-sm text-steel-400 border border-steel-700/40 rounded-lg px-4 py-2 hover:bg-steel-700/20 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSend}
                disabled={sending}
                className="text-sm bg-gold-500 text-navy-950 font-semibold rounded-lg px-5 py-2 hover:bg-gold-400 transition-colors disabled:opacity-60"
              >
                {sending ? 'Enviando…' : 'Confirmar envío'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* History */}
      {history.length > 0 && (
        <div className="bg-navy-900 border border-steel-700/40 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-white mb-3">Historial de envíos</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="text-steel-500 border-b border-steel-700/40">
                  <th className="py-2 pr-4">Fecha</th>
                  <th className="py-2 pr-4">Asunto</th>
                  <th className="py-2 pr-4">Segmento</th>
                  <th className="py-2 pr-4">Estado</th>
                  <th className="py-2 pr-4 text-right">Enviados</th>
                  <th className="py-2 text-right">Errores</th>
                </tr>
              </thead>
              <tbody>
                {history.map((row) => (
                  <tr key={row.id} className="border-b border-steel-800/40">
                    <td className="py-2 pr-4 text-steel-400">
                      {new Date(row.created_at).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="py-2 pr-4 text-white truncate max-w-[200px]">{row.subject}</td>
                    <td className="py-2 pr-4 text-steel-400">{SEGMENT_LABELS[row.segment as Segment] ?? row.segment}</td>
                    <td className="py-2 pr-4">
                      {row.status === 'scheduled' ? (
                        <span className="text-gold-400">Programado {row.scheduled_at ? new Date(row.scheduled_at).toLocaleString('es-ES', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : ''}</span>
                      ) : row.status === 'sending' ? (
                        <span className="text-blue-400">Enviando…</span>
                      ) : (
                        <span className="text-green-400">Enviado</span>
                      )}
                    </td>
                    <td className="py-2 pr-4 text-right text-green-400">{row.recipients_count}</td>
                    <td className="py-2 text-right text-error-400">{row.errors_count || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

function buildPreviewHtml(subject: string, body: string, ctaText: string, ctaUrl: string): string {
  const bodyHtml = (body || 'Tu mensaje aquí…')
    .replace(/\n/g, '<br/>')
    .replace(/\[nombre\]/gi, '<strong>Carlos</strong>')

  const ctaBlock = ctaText && ctaUrl
    ? `<tr><td style="padding:24px 40px 0">
        <a href="${ctaUrl}" style="display:inline-block;background:#C9A24D;color:#0B132B;padding:12px 28px;border-radius:8px;font-weight:700;text-decoration:none;font-size:14px">${ctaText}</a>
       </td></tr>`
    : ''

  return `
    <div style="background:#0B132B;padding:32px 0;font-family:system-ui,-apple-system,sans-serif">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;background:#111827;border-radius:12px;overflow:hidden">
        <tr>
          <td style="background:#0B132B;padding:24px 40px;border-bottom:1px solid #1e293b">
            <img src="https://aeromatch.eu/logo-email.svg" alt="aeroMatch" width="180" style="max-width:180px;height:auto"/>
          </td>
        </tr>
        <tr>
          <td style="padding:32px 40px 8px">
            <p style="color:#94a3b8;font-size:13px;margin:0 0 4px">Asunto: <strong style="color:#fff">${subject || '(sin asunto)'}</strong></p>
          </td>
        </tr>
        <tr>
          <td style="padding:8px 40px 0">
            <p style="color:#e2e8f0;font-size:15px;margin:0 0 8px">Hola <strong>Carlos</strong>,</p>
            <p style="color:#cbd5e1;font-size:14px;line-height:1.7;margin:0">${bodyHtml}</p>
          </td>
        </tr>
        ${ctaBlock}
        <tr>
          <td style="padding:32px 40px;border-top:1px solid #1e293b;margin-top:24px">
            <p style="color:#475569;font-size:11px;margin:0">aeroMatch · aeromatch.eu</p>
          </td>
        </tr>
      </table>
    </div>`
}
