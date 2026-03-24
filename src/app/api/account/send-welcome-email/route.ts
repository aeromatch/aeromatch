import { NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { dispatchTechnicianWelcomeIfNeeded } from '@/lib/email/dispatchTechnicianWelcome'

export const runtime = 'nodejs'

/**
 * Envía una sola vez el email de bienvenida al técnico (y aviso a admin).
 * Idempotente vía welcome_email_sent_at en profiles.
 */
export async function POST() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const result = await dispatchTechnicianWelcomeIfNeeded(user.id)
    if ('skipped' in result) {
      return NextResponse.json({ ok: true, skipped: result.skipped })
    }
    return NextResponse.json({ ok: true, sent: true })
  } catch (e: unknown) {
    console.error('send-welcome-email:', e)
    const message = e instanceof Error ? e.message : 'Send failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
