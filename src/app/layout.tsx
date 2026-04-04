import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { LanguageProvider } from '@/lib/i18n/LanguageContext'

const inter = Inter({ subsets: ['latin'] })

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebSite',
      name: 'aeroMatch',
      url: 'https://aeromatch.eu',
      description:
        'Plataforma europea de contratación para técnicos de mantenimiento aeronáutico con licencia EASA',
    },
    {
      '@type': 'JobBoard',
      name: 'aeroMatch',
      url: 'https://aeromatch.eu',
      sameAs: ['https://www.linkedin.com/company/aeromatch'],
    },
  ],
}

export const metadata: Metadata = {
  metadataBase: new URL('https://aeromatch.eu'),
  title: {
    default: 'aeroMatch',
    template: '%s | aeroMatch',
  },
  description:
    'Plataforma europea para técnicos de mantenimiento aeronáutico EASA B1/B2. Conecta con MROs y operadoras sin intermediarios.',
  openGraph: {
    siteName: 'aeroMatch',
    locale: 'es_ES',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <LanguageProvider>
          {children}
        </LanguageProvider>
      </body>
    </html>
  )
}
