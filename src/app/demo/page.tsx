'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

// Redirect demo to preview
export default function DemoPage() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/preview')
  }, [router])

  return (
    <div className="min-h-screen bg-navy-950 flex items-center justify-center">
      <div className="text-steel-400">Redirecting...</div>
    </div>
  )
}
