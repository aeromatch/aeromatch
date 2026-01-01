'use client'

import { useState } from 'react'
import { useLanguage } from '@/lib/i18n/LanguageContext'

interface RatingModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (rating: RatingData) => Promise<void>
  technicianName: string
  jobTitle: string
}

export interface RatingData {
  overall: number
  reliability?: number
  skillsMatch?: number
  communication?: number
  safetyCompliance?: number
  privateComment?: string
}

function StarRating({ 
  value, 
  onChange, 
  label 
}: { 
  value: number
  onChange: (v: number) => void
  label: string
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-steel-300">{label}</span>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            className={`w-8 h-8 flex items-center justify-center transition-colors ${
              star <= value ? 'text-gold-400' : 'text-steel-600 hover:text-steel-400'
            }`}
          >
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          </button>
        ))}
      </div>
    </div>
  )
}

export function RatingModal({ isOpen, onClose, onSubmit, technicianName, jobTitle }: RatingModalProps) {
  const { language } = useLanguage()
  const [overall, setOverall] = useState(0)
  const [reliability, setReliability] = useState(0)
  const [skillsMatch, setSkillsMatch] = useState(0)
  const [communication, setCommunication] = useState(0)
  const [safetyCompliance, setSafetyCompliance] = useState(0)
  const [privateComment, setPrivateComment] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const labels = {
    title: language === 'es' ? 'Valorar técnico' : 'Rate Technician',
    subtitle: language === 'es' ? 'Tu valoración ayuda a otros a encontrar buenos técnicos' : 'Your rating helps others find great technicians',
    overall: language === 'es' ? 'Valoración general' : 'Overall Rating',
    overallRequired: language === 'es' ? '(requerido)' : '(required)',
    reliability: language === 'es' ? 'Fiabilidad' : 'Reliability',
    skillsMatch: language === 'es' ? 'Habilidades técnicas' : 'Technical Skills',
    communication: language === 'es' ? 'Comunicación' : 'Communication',
    safetyCompliance: language === 'es' ? 'Cumplimiento de seguridad' : 'Safety Compliance',
    privateComment: language === 'es' ? 'Comentario privado (solo visible para el técnico)' : 'Private comment (only visible to technician)',
    privateCommentPlaceholder: language === 'es' ? 'Escribe un comentario para el técnico...' : 'Write a comment for the technician...',
    submit: language === 'es' ? 'Enviar valoración' : 'Submit Rating',
    cancel: language === 'es' ? 'Cancelar' : 'Cancel',
    processing: language === 'es' ? 'Enviando...' : 'Submitting...',
    errorOverall: language === 'es' ? 'Por favor selecciona una valoración general' : 'Please select an overall rating',
  }

  const handleSubmit = async () => {
    if (overall === 0) {
      setError(labels.errorOverall)
      return
    }

    setLoading(true)
    setError(null)

    try {
      await onSubmit({
        overall,
        reliability: reliability || undefined,
        skillsMatch: skillsMatch || undefined,
        communication: communication || undefined,
        safetyCompliance: safetyCompliance || undefined,
        privateComment: privateComment || undefined,
      })
      onClose()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-navy-900 border border-steel-700 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="p-6">
          {/* Header */}
          <div className="mb-6">
            <h2 className="text-xl font-bold text-white">{labels.title}</h2>
            <p className="text-sm text-steel-400 mt-1">{technicianName} • {jobTitle}</p>
            <p className="text-xs text-steel-500 mt-2">{labels.subtitle}</p>
          </div>

          {/* Overall Rating - Required */}
          <div className="mb-6 p-4 bg-navy-800/50 rounded-xl border border-steel-700/50">
            <div className="flex items-center gap-2 mb-3">
              <span className="font-medium text-white">{labels.overall}</span>
              <span className="text-xs text-gold-400">{labels.overallRequired}</span>
            </div>
            <div className="flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setOverall(star)}
                  className={`w-12 h-12 flex items-center justify-center transition-all ${
                    star <= overall 
                      ? 'text-gold-400 scale-110' 
                      : 'text-steel-600 hover:text-steel-400'
                  }`}
                >
                  <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                </button>
              ))}
            </div>
          </div>

          {/* Optional Ratings */}
          <div className="space-y-4 mb-6">
            <StarRating value={reliability} onChange={setReliability} label={labels.reliability} />
            <StarRating value={skillsMatch} onChange={setSkillsMatch} label={labels.skillsMatch} />
            <StarRating value={communication} onChange={setCommunication} label={labels.communication} />
            <StarRating value={safetyCompliance} onChange={setSafetyCompliance} label={labels.safetyCompliance} />
          </div>

          {/* Private Comment */}
          <div className="mb-6">
            <label className="block text-sm text-steel-300 mb-2">{labels.privateComment}</label>
            <textarea
              value={privateComment}
              onChange={(e) => setPrivateComment(e.target.value)}
              placeholder={labels.privateCommentPlaceholder}
              className="w-full px-4 py-3 bg-navy-800 border border-steel-700 rounded-xl text-white placeholder-steel-500 focus:outline-none focus:border-gold-500 resize-none"
              rows={3}
            />
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-error-600/20 border border-error-500/30 text-error-400 text-sm">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-4 py-3 rounded-xl border border-steel-600 text-steel-300 hover:text-white hover:border-steel-500 transition-colors"
            >
              {labels.cancel}
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading || overall === 0}
              className="flex-1 btn-primary-filled justify-center"
            >
              {loading ? labels.processing : labels.submit}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

