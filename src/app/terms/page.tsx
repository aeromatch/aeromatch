import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Términos',
  description: 'Términos y condiciones de uso de aeroMatch.',
  alternates: { canonical: 'https://aeromatch.eu/terms' },
  robots: { index: true, follow: true },
}

export default function TermsPage() {
  return (
    <div className="flex min-h-screen flex-col bg-navy-950">
      <iframe
        title="Términos y condiciones"
        src="/terms.html"
        className="min-h-[100vh] w-full flex-1 border-0"
      />
    </div>
  )
}
