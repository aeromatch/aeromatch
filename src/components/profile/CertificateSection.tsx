'use client'

import { useState } from 'react'
import { useLanguage } from '@/lib/i18n/LanguageContext'

interface Certificate {
  id: string
  reference_id: string
  status: 'pending' | 'checked' | 'rejected'
  generated_at: string
  checked_at: string | null
}

interface CertificateSectionProps {
  certificate: Certificate | null
}

export function CertificateSection({ certificate }: CertificateSectionProps) {
  const { language } = useLanguage()
  const [downloading, setDownloading] = useState(false)

  const labels = {
    es: {
      title: 'Certificado AMX',
      description: 'Tu resumen de documentación técnica verificada',
      noCertificate: 'Aún no tienes un certificado generado',
      noCertificateDesc: 'Se generará automáticamente cuando tu perfil sea revisado',
      pending: 'Pendiente de revisión',
      pendingDesc: 'Tu certificado está siendo revisado por el equipo de AeroMatch. Ya puedes descargarlo.',
      checked: 'Certificado verificado',
      checkedDesc: 'Tu documentación ha sido verificada. Puedes descargar tu certificado.',
      rejected: 'Certificado rechazado',
      rejectedDesc: 'Por favor, revisa tu documentación y contacta con soporte',
      download: 'Descargar PDF',
      referenceId: 'Reference ID',
      generatedAt: 'Generado',
      checkedAt: 'Verificado',
    },
    en: {
      title: 'AMX Certificate',
      description: 'Your verified technical documentation summary',
      noCertificate: 'No certificate generated yet',
      noCertificateDesc: 'It will be automatically generated when your profile is reviewed',
      pending: 'Pending review',
      pendingDesc: 'Your certificate is being reviewed by the AeroMatch team. You can already download it.',
      checked: 'Certificate verified',
      checkedDesc: 'Your documentation has been verified. You can download your certificate.',
      rejected: 'Certificate rejected',
      rejectedDesc: 'Please review your documentation and contact support',
      download: 'Download PDF',
      referenceId: 'Reference ID',
      generatedAt: 'Generated',
      checkedAt: 'Verified',
    }
  }

  const t = labels[language]

  const handleDownload = async () => {
    if (!certificate) return
    
    setDownloading(true)
    try {
      const res = await fetch(`/api/certificates/${certificate.id}/download`, {
        credentials: 'include',
      })
      if (!res.ok) {
        let msg = res.statusText
        try {
          const j = await res.json()
          if (j?.error) msg = j.error
        } catch {
          /* ignore */
        }
        throw new Error(msg || 'Error downloading certificate')
      }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${certificate.reference_id}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error downloading certificate:', error)
      alert(language === 'es' ? 'Error al descargar el certificado' : 'Error downloading certificate')
    } finally {
      setDownloading(false)
    }
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString(language === 'es' ? 'es-ES' : 'en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
  }

  // No certificate yet
  if (!certificate) {
    return (
      <div className="card p-5 mt-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-steel-700/30 flex items-center justify-center">
            <svg className="w-7 h-7 text-steel-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div>
            <h4 className="font-medium text-white">{t.title}</h4>
            <p className="text-sm text-steel-400">{t.noCertificate}</p>
            <p className="text-xs text-steel-500 mt-1">{t.noCertificateDesc}</p>
          </div>
        </div>
      </div>
    )
  }

  // Certificate exists
  const statusConfig = {
    pending: {
      icon: '⏳',
      bgColor: 'bg-yellow-500/10',
      borderColor: 'border-yellow-500/30',
      iconBg: 'bg-yellow-500/20',
      textColor: 'text-yellow-400',
      title: t.pending,
      description: t.pendingDesc,
    },
    checked: {
      icon: '✅',
      bgColor: 'bg-green-500/10',
      borderColor: 'border-green-500/30',
      iconBg: 'bg-green-500/20',
      textColor: 'text-green-400',
      title: t.checked,
      description: t.checkedDesc,
    },
    rejected: {
      icon: '❌',
      bgColor: 'bg-red-500/10',
      borderColor: 'border-red-500/30',
      iconBg: 'bg-red-500/20',
      textColor: 'text-red-400',
      title: t.rejected,
      description: t.rejectedDesc,
    },
  }

  const config = statusConfig[certificate.status]

  return (
    <div className={`card p-5 mt-6 ${config.bgColor} border ${config.borderColor}`}>
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <div className={`w-14 h-14 rounded-full ${config.iconBg} flex items-center justify-center text-2xl`}>
            {config.icon}
          </div>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h4 className="font-medium text-white">{t.title}</h4>
              <span className={`px-2 py-0.5 rounded text-xs font-medium ${config.textColor} ${config.bgColor} border ${config.borderColor}`}>
                {config.title}
              </span>
            </div>
            <p className="text-sm text-steel-400 mb-3">{config.description}</p>
            
            {/* Certificate details */}
            <div className="space-y-1 text-sm">
              <p className="text-steel-400">
                <span className="text-steel-500">{t.referenceId}:</span>{' '}
                <span className="font-mono text-gold-400">{certificate.reference_id}</span>
              </p>
              <p className="text-steel-500">
                {t.generatedAt}: {formatDate(certificate.generated_at)}
              </p>
              {certificate.checked_at && (
                <p className="text-steel-500">
                  {t.checkedAt}: {formatDate(certificate.checked_at)}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Download button - available for pending and checked certificates */}
        {(certificate.status === 'checked' || certificate.status === 'pending') && (
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="btn-primary flex items-center gap-2"
          >
            {downloading ? (
              <>
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                ...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                {t.download}
              </>
            )}
          </button>
        )}
      </div>
    </div>
  )
}
