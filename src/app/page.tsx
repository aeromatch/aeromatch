import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { HomePage } from '@/components/home/HomePage'

export const metadata: Metadata = {
  title: {
    absolute: 'aeroMatch — Técnicos de mantenimiento aeronáutico EASA',
  },
  description:
    'Plataforma europea para técnicos B1/B2 con licencia EASA. Conecta con MROs, operadoras y contractors. Sin intermediarios. Registro gratuito.',
  keywords:
    'técnico mantenimiento aeronáutico, EASA Part-66, B1 B2, MRO jobs, aircraft maintenance technician, empleo aeronáutico',
  openGraph: {
    title: 'aeroMatch — Las empresas te buscan a ti',
    description:
      'Plataforma de contratación para técnicos EASA B1/B2. Define tu disponibilidad. Recibe ofertas directas.',
    url: 'https://aeromatch.eu',
    siteName: 'aeroMatch',
    images: [{ url: '/og-image.png', width: 1200, height: 630 }],
    locale: 'es_ES',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'aeroMatch — Técnicos EASA sin intermediarios',
    description: 'Plataforma europea para técnicos B1/B2. Sin agencias. Sin CVs.',
    images: ['/og-image.png'],
  },
  alternates: {
    canonical: 'https://aeromatch.eu',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default async function Page() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return <HomePage isLoggedIn={!!user} />
}
