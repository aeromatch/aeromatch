import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacidad',
  description: 'Política de privacidad de aeroMatch.',
  alternates: { canonical: 'https://aeromatch.eu/privacy' },
  robots: { index: true, follow: true },
}

export default function PrivacyPage() {
  return (
    <div className="flex min-h-screen flex-col bg-navy-950">
      <iframe
        title="Política de privacidad"
        src="/privacy.html"
        className="min-h-[100vh] w-full flex-1 border-0"
      />
    </div>
  )
}
