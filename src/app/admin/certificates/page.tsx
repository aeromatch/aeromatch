import { redirect } from 'next/navigation'

/** La gestión del certificado AMX está en /admin (pestaña Verificación). */
export default function AdminCertificatesRedirectPage() {
  redirect('/admin')
}
