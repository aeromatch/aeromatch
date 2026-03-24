import { createClient } from '@supabase/supabase-js'
import {
  buildTechnicianGreeting,
  sendTechnicianSignupAdminNotice,
  sendTechnicianWelcomeEmail,
} from '@/lib/email/technicianWelcome'

function getSupabaseProfilesDashboardUrl(profileId: string): string {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!supabaseUrl) {
    return '(configura NEXT_PUBLIC_SUPABASE_URL)'
  }
  try {
    const host = new URL(supabaseUrl).hostname
    if (!host.endsWith('.supabase.co')) {
      return supabaseUrl
    }
    const ref = host.replace('.supabase.co', '')
    const filter = encodeURIComponent(`id.eq.${profileId}`)
    return `https://supabase.com/dashboard/project/${ref}/editor?schema=public&table=profiles&filter=${filter}`
  } catch {
    return supabaseUrl
  }
}

export type DispatchWelcomeResult =
  | { ok: true; sent: true }
  | { ok: true; skipped: 'not_technician' | 'already_sent' | 'no_email' | 'no_profile' }

/**
 * Idempotente: envía bienvenida + aviso admin si role=technician y welcome_email_sent_at es null.
 */
export async function dispatchTechnicianWelcomeIfNeeded(userId: string): Promise<DispatchWelcomeResult> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  }

  const admin = createClient(url, key)

  const { data: profile, error: selErr } = await admin
    .from('profiles')
    .select('id, email, full_name, role, welcome_email_sent_at, created_at')
    .eq('id', userId)
    .maybeSingle()

  if (selErr || !profile) {
    return { ok: true, skipped: 'no_profile' }
  }

  if (profile.role !== 'technician') {
    return { ok: true, skipped: 'not_technician' }
  }

  if (profile.welcome_email_sent_at) {
    return { ok: true, skipped: 'already_sent' }
  }

  const email = profile.email?.trim()
  if (!email) {
    return { ok: true, skipped: 'no_email' }
  }

  const { data: tech } = await admin
    .from('technicians')
    .select('first_name')
    .eq('user_id', userId)
    .maybeSingle()

  const greetingLine = buildTechnicianGreeting(tech?.first_name, profile.full_name)
  const appBase = (process.env.NEXT_PUBLIC_APP_URL || 'https://app.aeromatch.eu').replace(/\/$/, '')
  const completeProfileUrl = `${appBase}/profile`
  const registeredAt = profile.created_at ? new Date(profile.created_at) : new Date()
  const displayName = profile.full_name?.trim() || email

  await sendTechnicianWelcomeEmail({
    to: email,
    greetingLine,
    completeProfileUrl,
  })
  await sendTechnicianSignupAdminNotice({
    technicianName: displayName,
    technicianEmail: email,
    registeredAt,
    supabaseProfilesLink: getSupabaseProfilesDashboardUrl(profile.id),
  })

  const { error: upErr } = await admin
    .from('profiles')
    .update({ welcome_email_sent_at: new Date().toISOString() })
    .eq('id', userId)
    .is('welcome_email_sent_at', null)

  if (upErr) {
    console.error('dispatchTechnicianWelcome: update welcome_email_sent_at failed', upErr)
  }

  return { ok: true, sent: true }
}
