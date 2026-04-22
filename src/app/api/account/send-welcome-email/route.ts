import { NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { dispatchTechnicianWelcomeIfNeeded } from '@/lib/email/dispatchTechnicianWelcome'
import { dispatchCompanyWelcomeIfNeeded } from '@/lib/email/dispatchCompanyWelcome'

export const runtime = 'nodejs'

/**
 * Envia una sola vez el email de bienvenida al usuario recien registrado
 * (tecnico o empresa) y el aviso a admin. Idempotente via welcome_email_sent_at
 * en profiles. El dispatcher de cada rol se salta solo si no aplica.
 */
export async function POST() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const [techRes, companyRes] = await Promise.allSettled([
      dispatchTechnicianWelcomeIfNeeded(user.id),
      dispatchCompanyWelcomeIfNeeded(user.id),
    ])

    const summary = {
      technician:
        techRes.status === 'fulfilled'
          ? techRes.value
          : { error: techRes.reason instanceof Error ? techRes.reason.message : String(techRes.reason) },
      company:
        companyRes.status === 'fulfilled'
          ? companyRes.value
          : { error: companyRes.reason instanceof Error ? companyRes.reason.message : String(companyRes.reason) },
    }

    return NextResponse.json({ ok: true, ...summary })
  } catch (e: unknown) {
    console.error('send-welcome-email:', e)
    const message = e instanceof Error ? e.message : 'Send failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
