import { createClient } from '@supabase/supabase-js'
import {
  sendCompanySignupAdminNotice,
  sendCompanyWelcomeEmail,
  type SupportedLanguage,
} from '@/lib/email/companyWelcome'

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

function normalizeLanguage(raw: unknown): SupportedLanguage {
  return raw === 'en' ? 'en' : 'es'
}

export type DispatchCompanyWelcomeResult =
  | { ok: true; sent: true }
  | { ok: true; skipped: 'not_company' | 'already_sent' | 'no_email' | 'no_profile' }

/**
 * Idempotente: envia bienvenida + aviso admin si role=company y welcome_email_sent_at es null.
 * Se dispara desde /auth/callback (confirmacion de email u OAuth) y desde /onboarding/role.
 */
export async function dispatchCompanyWelcomeIfNeeded(userId: string): Promise<DispatchCompanyWelcomeResult> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  }

  const admin = createClient(url, key)

  const { data: profile, error: selErr } = await admin
    .from('profiles')
    .select('id, email, full_name, role, welcome_email_sent_at, preferred_language, created_at')
    .eq('id', userId)
    .maybeSingle()

  if (selErr || !profile) {
    return { ok: true, skipped: 'no_profile' }
  }

  if (profile.role !== 'company') {
    return { ok: true, skipped: 'not_company' }
  }

  if (profile.welcome_email_sent_at) {
    return { ok: true, skipped: 'already_sent' }
  }

  const email = profile.email?.trim()
  if (!email) {
    return { ok: true, skipped: 'no_email' }
  }

  // Nombre de empresa: companies.name (si ya completo onboarding) o full_name del profile
  const { data: company } = await admin
    .from('companies')
    .select('name')
    .eq('user_id', userId)
    .maybeSingle()

  const companyName = company?.name?.trim() || profile.full_name?.trim() || null
  const language = normalizeLanguage(profile.preferred_language)
  const appBase = (process.env.NEXT_PUBLIC_APP_URL || 'https://app.aeromatch.eu').replace(/\/$/, '')
  const searchUrl = `${appBase}/search`
  const registeredAt = profile.created_at ? new Date(profile.created_at) : new Date()
  const displayName = companyName || email

  await sendCompanyWelcomeEmail({
    to: email,
    companyName,
    searchUrl,
    language,
  })
  await sendCompanySignupAdminNotice({
    companyName: displayName,
    contactEmail: email,
    registeredAt,
    supabaseProfilesLink: getSupabaseProfilesDashboardUrl(profile.id),
  })

  const { error: upErr } = await admin
    .from('profiles')
    .update({ welcome_email_sent_at: new Date().toISOString() })
    .eq('id', userId)
    .is('welcome_email_sent_at', null)

  if (upErr) {
    console.error('dispatchCompanyWelcome: update welcome_email_sent_at failed', upErr)
  }

  return { ok: true, sent: true }
}
