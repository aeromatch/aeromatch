import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import {
  buildTechnicianGreeting,
  sendTechnicianSignupAdminNotice,
  sendTechnicianWelcomeEmail,
} from '@/lib/email/technicianWelcome'

export const runtime = 'nodejs'

function getSupabaseProfilesDashboardUrl(profileId: string): string {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!supabaseUrl) {
    return '(configura NEXT_PUBLIC_SUPABASE_URL en el proyecto)'
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

/**
 * Invocado por el trigger en public.profiles (pg_net).
 * No usar desde el navegador: requiere cabecera x-aeromatch-welcome-secret.
 */
export async function POST(request: Request) {
  const expected = process.env.WELCOME_EMAIL_WEBHOOK_SECRET
  if (!expected) {
    console.error('welcome-technician: WELCOME_EMAIL_WEBHOOK_SECRET no configurado')
    return NextResponse.json({ error: 'Server misconfigured' }, { status: 503 })
  }

  const secret = request.headers.get('x-aeromatch-welcome-secret')
  if (!secret || secret !== expected) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: {
    profile_id?: string
    email?: string
    full_name?: string | null
    registered_at?: string | null
  }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const profileId = body.profile_id
  const email = body.email?.trim()
  if (!profileId || !email) {
    return NextResponse.json({ error: 'profile_id and email required' }, { status: 400 })
  }

  const serviceUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceUrl || !serviceKey) {
    return NextResponse.json({ error: 'Server misconfigured' }, { status: 503 })
  }

  const supabase = createClient(serviceUrl, serviceKey)
  const { data: tech } = await supabase
    .from('technicians')
    .select('first_name')
    .eq('user_id', profileId)
    .maybeSingle()

  const greetingLine = buildTechnicianGreeting(tech?.first_name, body.full_name)

  const appBase = (process.env.NEXT_PUBLIC_APP_URL || 'https://app.aeromatch.eu').replace(/\/$/, '')
  const completeProfileUrl = `${appBase}/profile`

  const registeredAt = body.registered_at ? new Date(body.registered_at) : new Date()

  const displayName = body.full_name?.trim() || email

  try {
    await sendTechnicianWelcomeEmail({
      to: email,
      greetingLine,
      completeProfileUrl,
    })
    await sendTechnicianSignupAdminNotice({
      technicianName: displayName,
      technicianEmail: email,
      registeredAt,
      supabaseProfilesLink: getSupabaseProfilesDashboardUrl(profileId),
    })
  } catch (e: unknown) {
    console.error('welcome-technician:', e)
    const message = e instanceof Error ? e.message : 'Send failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
