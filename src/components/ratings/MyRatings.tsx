'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useLanguage } from '@/lib/i18n/LanguageContext'

interface Rating {
  id: string
  overall: number
  reliability: number | null
  skills_match: number | null
  communication: number | null
  safety_compliance: number | null
  private_comment: string | null
  created_at: string
}

export function MyRatings() {
  const { language } = useLanguage()
  const [ratings, setRatings] = useState<Rating[]>([])
  const [loading, setLoading] = useState(true)
  const [averages, setAverages] = useState({
    overall: 0,
    reliability: 0,
    skillsMatch: 0,
    communication: 0,
    safetyCompliance: 0,
    total: 0,
  })

  const labels = {
    title: language === 'es' ? 'Mis Valoraciones' : 'My Reviews',
    noRatings: language === 'es' ? 'Aún no tienes valoraciones' : 'You have no reviews yet',
    average: language === 'es' ? 'Promedio' : 'Average',
    totalReviews: language === 'es' ? 'valoraciones' : 'reviews',
    overall: language === 'es' ? 'General' : 'Overall',
    reliability: language === 'es' ? 'Fiabilidad' : 'Reliability',
    skillsMatch: language === 'es' ? 'Habilidades' : 'Skills',
    communication: language === 'es' ? 'Comunicación' : 'Communication',
    safetyCompliance: language === 'es' ? 'Seguridad' : 'Safety',
    privateComment: language === 'es' ? 'Comentario de la empresa' : 'Company feedback',
  }

  useEffect(() => {
    loadRatings()
  }, [])

  const loadRatings = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) return

    const { data } = await supabase
      .from('job_ratings')
      .select('*')
      .eq('rated_user_id', user.id)
      .order('created_at', { ascending: false })

    if (data && data.length > 0) {
      setRatings(data)
      
      // Calculate averages
      const total = data.length
      const overallSum = data.reduce((sum, r) => sum + r.overall, 0)
      const reliabilitySum = data.filter(r => r.reliability).reduce((sum, r) => sum + (r.reliability || 0), 0)
      const reliabilityCount = data.filter(r => r.reliability).length
      const skillsSum = data.filter(r => r.skills_match).reduce((sum, r) => sum + (r.skills_match || 0), 0)
      const skillsCount = data.filter(r => r.skills_match).length
      const commSum = data.filter(r => r.communication).reduce((sum, r) => sum + (r.communication || 0), 0)
      const commCount = data.filter(r => r.communication).length
      const safetySum = data.filter(r => r.safety_compliance).reduce((sum, r) => sum + (r.safety_compliance || 0), 0)
      const safetyCount = data.filter(r => r.safety_compliance).length

      setAverages({
        overall: overallSum / total,
        reliability: reliabilityCount > 0 ? reliabilitySum / reliabilityCount : 0,
        skillsMatch: skillsCount > 0 ? skillsSum / skillsCount : 0,
        communication: commCount > 0 ? commSum / commCount : 0,
        safetyCompliance: safetyCount > 0 ? safetySum / safetyCount : 0,
        total,
      })
    }
    setLoading(false)
  }

  const renderStars = (value: number) => {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <svg
            key={star}
            className={`w-4 h-4 ${star <= Math.round(value) ? 'text-gold-400' : 'text-steel-600'}`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="card p-6">
        <h3 className="text-lg font-semibold text-white mb-4">{labels.title}</h3>
        <div className="text-steel-400">Loading...</div>
      </div>
    )
  }

  return (
    <div className="card p-6">
      <h3 className="text-lg font-semibold text-white mb-4">{labels.title}</h3>

      {ratings.length === 0 ? (
        <p className="text-steel-500 text-sm">{labels.noRatings}</p>
      ) : (
        <>
          {/* Averages Summary */}
          <div className="mb-6 p-4 bg-navy-800/50 rounded-xl border border-steel-700/50">
            <div className="flex items-center gap-3 mb-3">
              <div className="text-3xl font-bold text-gold-400">{averages.overall.toFixed(1)}</div>
              {renderStars(averages.overall)}
              <span className="text-sm text-steel-400">
                ({averages.total} {labels.totalReviews})
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              {averages.reliability > 0 && (
                <div className="flex justify-between">
                  <span className="text-steel-400">{labels.reliability}</span>
                  <span className="text-white">{averages.reliability.toFixed(1)}</span>
                </div>
              )}
              {averages.skillsMatch > 0 && (
                <div className="flex justify-between">
                  <span className="text-steel-400">{labels.skillsMatch}</span>
                  <span className="text-white">{averages.skillsMatch.toFixed(1)}</span>
                </div>
              )}
              {averages.communication > 0 && (
                <div className="flex justify-between">
                  <span className="text-steel-400">{labels.communication}</span>
                  <span className="text-white">{averages.communication.toFixed(1)}</span>
                </div>
              )}
              {averages.safetyCompliance > 0 && (
                <div className="flex justify-between">
                  <span className="text-steel-400">{labels.safetyCompliance}</span>
                  <span className="text-white">{averages.safetyCompliance.toFixed(1)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Individual Ratings */}
          <div className="space-y-4">
            {ratings.map((rating) => (
              <div key={rating.id} className="p-4 bg-navy-800/30 rounded-lg border border-steel-700/30">
                <div className="flex items-center justify-between mb-2">
                  {renderStars(rating.overall)}
                  <span className="text-xs text-steel-500">
                    {new Date(rating.created_at).toLocaleDateString(language === 'es' ? 'es-ES' : 'en-GB')}
                  </span>
                </div>
                {rating.private_comment && (
                  <div className="mt-3 pt-3 border-t border-steel-700/30">
                    <p className="text-xs text-steel-400 mb-1">{labels.privateComment}:</p>
                    <p className="text-sm text-steel-200 italic">"{rating.private_comment}"</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

