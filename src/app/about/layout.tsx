import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: {
    absolute: 'Sobre aeroMatch — Built by techs, for techs',
  },
  description:
    'Raúl Sánchez Burgos, técnico B1/B2 con 20 años en Air Europa, construyó aeroMatch para resolver el problema real de contratación en el sector aeronáutico.',
  keywords:
    'aeroMatch, mantenimiento aeronáutico, EASA, técnico B1 B2, Air Europa, contratación aviación',
  openGraph: {
    title: 'Sobre aeroMatch — Built by techs, for techs',
    description:
      'Construido por un técnico B1/B2 para conectar profesionales EASA con empresas, sin intermediarios.',
    url: 'https://aeromatch.eu/about',
    siteName: 'aeroMatch',
    images: [{ url: '/og-image.png', width: 1200, height: 630 }],
    locale: 'es_ES',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Sobre aeroMatch',
    description: 'Built by techs, for techs — la historia detrás de la plataforma.',
    images: ['/og-image.png'],
  },
  alternates: {
    canonical: 'https://aeromatch.eu/about',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function AboutLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
