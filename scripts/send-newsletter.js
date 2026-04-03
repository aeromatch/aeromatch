/* eslint-disable no-console */

const fs = require('fs')
const path = require('path')
const { createClient } = require('@supabase/supabase-js')
const { Resend } = require('resend')

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms))
}

function loadEnvLocal() {
  // Minimal .env.local loader (avoids adding deps)
  const envPath = path.join(process.cwd(), '.env.local')
  if (!fs.existsSync(envPath)) return
  const raw = fs.readFileSync(envPath, 'utf8')
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const idx = trimmed.indexOf('=')
    if (idx === -1) continue
    const key = trimmed.slice(0, idx).trim()
    let value = trimmed.slice(idx + 1).trim()
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1)
    }
    if (!process.env[key]) process.env[key] = value
  }
}

function getArgValue(name) {
  const argv = process.argv.slice(2)
  const idx = argv.findIndex((a) => a === name || a.startsWith(`${name}=`))
  if (idx === -1) return null
  const a = argv[idx]
  if (a.includes('=')) return a.split('=').slice(1).join('=')
  return argv[idx + 1] || null
}

function hasFlag(name) {
  const argv = process.argv.slice(2)
  return argv.includes(name)
}

async function main() {
  loadEnvLocal()

  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
  const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY
  const RESEND_API_KEY = process.env.RESEND_API_KEY

  if (!SUPABASE_URL) throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL in env')
  if (!SERVICE_ROLE) throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY in env')
  if (!RESEND_API_KEY) throw new Error('Missing RESEND_API_KEY in env')

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
  const resend = new Resend(RESEND_API_KEY)

  const htmlPath = path.join(process.cwd(), 'aeromatch-newsletter.html')
  if (!fs.existsSync(htmlPath)) throw new Error(`Missing ${htmlPath}`)
  let html = fs.readFileSync(htmlPath, 'utf8')

  // Use the same logo behavior as transactional emails:
  // an absolute URL to /public/logo-email.svg (small + email-client friendly).
  const APP_URL = (process.env.NEXT_PUBLIC_APP_URL || 'https://aeromatch.eu').replace(/\/+$/, '')
  const logoUrl = `${APP_URL}/logo-email.svg`
  html = html.replace(/__AEROMATCH_LOGO_URL__/g, logoUrl)

  const FROM = process.env.RESEND_FROM_EMAIL || 'Raúl de aeroMatch <raul@aeromatch.eu>'
  const SUBJECT = 'aeroMatch — todo lo que hay disponible para ti ahora mismo'

  const toOverride = getArgValue('--to')
  const limitRaw = getArgValue('--limit')
  const limit = limitRaw ? Math.max(1, Math.floor(Number(limitRaw) || 0)) : null
  const dryRun = !hasFlag('--send')

  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('id, email, role')
    .eq('role', 'technician')
    .limit(5000)

  if (error) throw error

  const list = (profiles || []).slice(0, limit || undefined)

  let sent = 0
  let failed = 0
  const failures = []

  if (dryRun) {
    console.log('[DRY RUN] No emails will be sent. Use --send to actually send.')
  }
  if (toOverride) {
    console.log(`[MODE] Single recipient override: ${toOverride}`)
  }
  if (limit) {
    console.log(`[MODE] Limit: ${limit}`)
  }

  for (const p of list) {
    const userId = p.id
    let email = (p.email || '').trim()
    if (!email) {
      // Fallback: ask auth admin (only when missing)
      const { data: u, error: ue } = await supabase.auth.admin.getUserById(userId)
      if (ue) {
        failed++
        failures.push({ userId, email: null, error: `auth.getUserById: ${ue.message}` })
        continue
      }
      email = (u?.user?.email || '').trim()
    }

    if (!email || !email.includes('@')) {
      failed++
      failures.push({ userId, email: email || null, error: 'missing/invalid email' })
      continue
    }

    const recipient = (toOverride || email).trim()
    try {
      if (dryRun) {
        console.log(`[DRY RUN] Would send to: ${recipient} (profile: ${userId})`)
      } else {
        const { error: sendErr } = await resend.emails.send({
          from: FROM,
          to: recipient,
          subject: SUBJECT,
          html,
        })
        if (sendErr) {
          failed++
          failures.push({ userId, email: recipient, error: JSON.stringify(sendErr) })
        } else {
          sent++
        }
      }
    } catch (e) {
      failed++
      failures.push({ userId, email: recipient, error: e?.message || String(e) })
    }

    await sleep(200)
  }

  console.log(`\nDone. Sent: ${sent}. Failed: ${failed}. Total: ${list.length}.`)
  if (failures.length) {
    console.log('\nFailures:')
    for (const f of failures) console.log(`- ${f.userId} (${f.email || 'no-email'}): ${f.error}`)
  }
}

main().catch((e) => {
  console.error('Fatal:', e?.message || e)
  process.exitCode = 1
})

