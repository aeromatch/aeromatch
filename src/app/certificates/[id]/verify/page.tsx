import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

type Props = { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  return {
    title: 'Verificación AMX',
    robots: { index: true, follow: true },
    openGraph: {
      title: 'Verificación de certificado aeroMatch',
      url: `https://aeromatch.eu/certificates/${id}/verify`,
    },
  }
}

export default async function CertificateVerifyPage({ params }: Props) {
  const { id } = await params
  const service = getServiceClient()

  const { data: certificate, error } = await service
    .from('amx_certificates')
    .select('id, reference_id, status, technician_id')
    .eq('id', id)
    .maybeSingle()

  if (error || !certificate) {
    notFound()
  }

  const { data: docs } = await service
    .from('documents')
    .select('id, doc_type, file_hash, verified_at')
    .eq('technician_id', certificate.technician_id)
    .order('created_at', { ascending: false })

  const verified = certificate.status === 'checked'
  const rows = docs || []

  return (
    <div className="min-h-screen bg-navy-950 px-4 py-12 text-steel-200">
      <div className="mx-auto max-w-lg rounded-2xl border border-steel-800/50 bg-navy-900/80 p-8 shadow-xl">
        <p className="text-xs font-semibold uppercase tracking-wider text-gold-500">aeroMatch</p>
        <h1 className="mt-2 text-xl font-bold text-white">Integridad documental</h1>
        <p className="mt-1 font-mono text-lg text-gold-400">{certificate.reference_id}</p>
        <p className="mt-4">
          Estado:{' '}
          <span className={verified ? 'font-semibold text-green-400' : 'font-semibold text-amber-400'}>
            {verified ? 'Verificado (checked)' : 'No verificado / pendiente'}
          </span>
        </p>
        <div className="mt-6 border-t border-steel-800 pt-6">
          <p className="text-sm font-medium text-steel-400">Documentos</p>
          <ul className="mt-3 space-y-2 text-sm">
            {rows.length === 0 ? (
              <li className="text-steel-500">Sin documentos registrados.</li>
            ) : (
              rows.map((d) => (
                <li key={d.id} className="rounded-lg bg-navy-950/80 px-3 py-2">
                  <span className="text-white">{d.doc_type}</span>
                  {d.file_hash ? (
                    <span className="mt-1 block font-mono text-xs text-steel-500 break-all">
                      SHA-256: {d.file_hash}
                    </span>
                  ) : (
                    <span className="mt-1 block text-xs text-steel-600">Sin hash en archivo</span>
                  )}
                  {d.verified_at && (
                    <span className="mt-1 block text-xs text-steel-600">
                      Verificado: {new Date(d.verified_at).toLocaleString('es-ES')}
                    </span>
                  )}
                </li>
              ))
            )}
          </ul>
        </div>
        <p className="mt-8 text-center text-xs text-steel-600">
          <Link href="/" className="text-gold-500 hover:underline">
            aeromatch.eu
          </Link>
        </p>
      </div>
    </div>
  )
}
