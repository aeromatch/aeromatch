import { Resend } from 'resend'

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null

const DEFAULT_FROM = 'Raúl · aeroMatch <raul@aeromatch.eu>'

export type SupportedLanguage = 'es' | 'en'

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function buildCompanyGreeting(companyName: string | null | undefined, lang: SupportedLanguage): string {
  const name = companyName?.trim()
  if (name) {
    return lang === 'es' ? `Hola ${name},` : `Hi ${name},`
  }
  return lang === 'es' ? 'Hola,' : 'Hi,'
}

// ---------- Copy ES / EN ----------

type CompanyWelcomeCopy = {
  subject: string
  intro: string
  paragraphValue: string
  howItWorksTitle: string
  bullets: string[]
  closing: string
  ctaLabel: string
  ctaHelper: string
  replyLine: string
  signatureRole: string
  signatureNote: string
}

const COPY: Record<SupportedLanguage, CompanyWelcomeCopy> = {
  es: {
    subject: 'Bienvenida a aeroMatch — tu búsqueda acaba de volverse más fácil',
    intro: 'Bienvenida a aeroMatch.',
    paragraphValue:
      'Ya tienes acceso a más de 100 técnicos EASA Part-66 verificados — con licencias B1, B2 y C, disponibilidad real y credenciales ya comprobadas.',
    howItWorksTitle: 'Así funciona:',
    bullets: [
      'Busca por licencia, type rating y disponibilidad',
      'Envía una solicitud directa al técnico',
      'El técnico acepta la solicitud y listo',
    ],
    closing: 'Sin ruido. Sin idas y venidas. La persona adecuada para el trabajo.',
    ctaLabel: 'Empezar mi primera búsqueda',
    ctaHelper: 'Si el botón no funciona, copia y pega este enlace en tu navegador:',
    replyLine: 'Cualquier duda, responde a este email — me llegará directamente a mí.',
    signatureRole: 'Fundador · aeroMatch',
    signatureNote: 'B1.1 / B2 · 20 años en Air Europa',
  },
  en: {
    subject: 'Welcome to aeroMatch — your search just got easier',
    intro: 'Welcome to aeroMatch.',
    paragraphValue:
      'You now have access to 100+ EASA Part-66 verified technicians — B1, B2 and C license holders with real availability, credentials already checked.',
    howItWorksTitle: "Here's how it works:",
    bullets: [
      'Search by license, type rating and availability',
      'Send a request directly to the technician',
      'The technician accepts the request and you\'re ready to go',
    ],
    closing: 'No noise. No back and forth. Just the right person for the job.',
    ctaLabel: 'Start my first search',
    ctaHelper: 'If the button does not work, copy and paste this link in your browser:',
    replyLine: "Any questions, reply to this email — you'll reach me directly.",
    signatureRole: 'Founder · aeroMatch',
    signatureNote: 'B1.1 / B2 · 20 years at Air Europa',
  },
}

// ---------- Email a la empresa ----------

export async function sendCompanyWelcomeEmail(params: {
  to: string
  companyName: string | null | undefined
  searchUrl: string
  language: SupportedLanguage
}): Promise<void> {
  if (!resend) {
    console.warn('companyWelcome: RESEND_API_KEY not set, skipping welcome email')
    return
  }

  const lang = params.language
  const copy = COPY[lang]
  const greeting = buildCompanyGreeting(params.companyName, lang)
  const from = process.env.WELCOME_EMAIL_FROM || DEFAULT_FROM
  const logoUrl = 'https://aeromatch.eu/logo-email.png'

  const bulletsText = copy.bullets.map(b => `— ${b}`).join('\n')

  const text = `${greeting}

${copy.intro}

${copy.paragraphValue}

${copy.howItWorksTitle}
${bulletsText}

${copy.closing}

${copy.ctaLabel}: ${params.searchUrl}

${copy.replyLine}

Raúl Sánchez
${copy.signatureRole}
${copy.signatureNote}
raul@aeromatch.eu`

  const ctaUrl = escapeHtml(params.searchUrl)
  const bulletsHtml = copy.bullets
    .map(
      b =>
        `<li style="color:#8899AA;font-size:15px;line-height:1.55;margin:0 0 8px;">${escapeHtml(b)}</li>`,
    )
    .join('')

  const html = `
<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#0B132B;font-family:system-ui,-apple-system,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#0B132B;padding:32px 16px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#1A2642;border-radius:16px;border:1px solid #3A4A6B;overflow:hidden;">
<tr><td style="padding:32px 28px 20px;border-bottom:3px solid #C9A24D;text-align:center;">
<img src="${logoUrl}" alt="aeroMatch" width="240" style="display:inline-block;max-width:240px;height:auto;border:0;outline:none;text-decoration:none;"/>
</td></tr>
<tr><td style="padding:28px;">
<p style="color:#E0E6EC;font-size:16px;margin:0 0 16px;">${escapeHtml(greeting)}</p>
<p style="color:#8899AA;font-size:15px;line-height:1.55;margin:0 0 14px;"><strong style="color:#fff;">${escapeHtml(copy.intro)}</strong></p>
<p style="color:#8899AA;font-size:15px;line-height:1.55;margin:0 0 18px;">${escapeHtml(copy.paragraphValue)}</p>
<p style="color:#E0E6EC;font-size:15px;line-height:1.55;margin:0 0 10px;"><strong>${escapeHtml(copy.howItWorksTitle)}</strong></p>
<ul style="margin:0 0 18px;padding-left:20px;">${bulletsHtml}</ul>
<p style="color:#8899AA;font-size:15px;line-height:1.55;margin:0 0 24px;"><strong style="color:#C9A24D;">${escapeHtml(copy.closing)}</strong></p>
<p style="margin:0 0 24px;text-align:center;">
  <a href="${ctaUrl}" style="display:inline-block;background:#C9A24D;color:#0B132B;text-decoration:none;font-weight:600;padding:14px 28px;border-radius:10px;">${escapeHtml(copy.ctaLabel)}</a>
</p>
<p style="color:#6B809A;font-size:13px;line-height:1.5;margin:16px 0 0;border-top:1px solid #2A3A5B;padding-top:16px;">${escapeHtml(copy.replyLine)}</p>
<p style="color:#6B809A;font-size:14px;line-height:1.5;margin:20px 0 0;">
Raúl Sánchez<br/>
${escapeHtml(copy.signatureRole)}<br/>
<span style="color:#8899AA;">${escapeHtml(copy.signatureNote)}</span><br/>
<a href="mailto:raul@aeromatch.eu" style="color:#C9A24D;">raul@aeromatch.eu</a>
</p>
</td></tr></table>
</td></tr></table>
</body></html>`

  const { error } = await resend.emails.send({
    from,
    to: params.to,
    subject: copy.subject,
    text,
    html,
  })

  if (error) {
    console.error('companyWelcome: Resend error', error)
    throw new Error(String(error.message || error))
  }
}

// ---------- Aviso a admin ----------

export async function sendCompanySignupAdminNotice(params: {
  companyName: string
  contactEmail: string
  registeredAt: Date
  supabaseProfilesLink: string
}): Promise<void> {
  if (!resend) {
    console.warn('companyWelcome: RESEND_API_KEY not set, skipping admin notice')
    return
  }

  const from = process.env.WELCOME_EMAIL_FROM || DEFAULT_FROM
  const to = 'raul@aeromatch.eu'
  const when = params.registeredAt.toLocaleString('es-ES', { timeZone: 'Europe/Madrid' })

  const text = `Nueva empresa registrada en aeroMatch

Nombre: ${params.companyName}
Email de contacto: ${params.contactEmail}
Fecha y hora (Madrid): ${when}

Perfil en Supabase (tabla profiles):
${params.supabaseProfilesLink}`

  const { error } = await resend.emails.send({
    from,
    to,
    subject: `Nueva empresa: ${params.contactEmail}`,
    text,
    html: `<p><strong>Nueva empresa registrada</strong></p>
<ul>
<li><strong>Nombre:</strong> ${escapeHtml(params.companyName)}</li>
<li><strong>Email de contacto:</strong> ${escapeHtml(params.contactEmail)}</li>
<li><strong>Fecha y hora (Madrid):</strong> ${escapeHtml(when)}</li>
</ul>
<p><a href="${escapeHtml(params.supabaseProfilesLink)}">Abrir tabla profiles en Supabase (filtro por id)</a></p>`,
  })

  if (error) {
    console.error('companyWelcome admin: Resend error', error)
    throw new Error(String(error.message || error))
  }
}
