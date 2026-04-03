import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { LanguageProvider } from '@/lib/i18n/LanguageContext'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'AeroMatch - Certified Technical Talent, Available When You Need It',
  description: 'AeroMatch connects verified aircraft maintenance technicians with MROs, airlines, and aviation companies. Availability-first matching for EASA, FAA, and UK CAA licensed professionals.',
  keywords: 'aviation, aircraft maintenance, EASA, FAA, B1, B2, A&P, MRO, technician, hiring, staffing',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        <LanguageProvider>
          {children}
        </LanguageProvider>
      </body>
    </html>
  )
}
