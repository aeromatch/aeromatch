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

export function buildTechnicianGreeting(
  firstNameFromTechnician: string | null | undefined,
  fullNameFromProfile: string | null | undefined,
  lang: SupportedLanguage = 'es',
): string {
  const t = firstNameFromTechnician?.trim()
  const f = fullNameFromProfile?.trim()
  if (lang === 'en') {
    if (t) return `Hi ${t},`
    if (f) return `Hi ${f},`
    return 'Hi,'
  }
  if (t) return `Hola ${t},`
  if (f) return `Hola ${f},`
  return 'Hola,'
}

type TechnicianWelcomeCopy = {
  subject: string
  thanks: string
  beforeProfile: string
  valueTitle: string
  paragraphContractors: string
  paragraphNotSearching: string
  activateBold: string
  noContactLine: string
  paragraphTDS: string
  tdsBold: string
  tdsTail: string
  ctaLabel: string
  signOff: string
  signatureRole: string
}

const COPY: Record<SupportedLanguage, TechnicianWelcomeCopy> = {
  es: {
    subject: 'Bienvenido a aeroMatch — una cosa importante antes de empezar',
    thanks: 'Gracias por registrarte en aeroMatch.',
    beforeProfile:
      'Antes de que completes tu perfil quiero explicarte cómo funciona para que le saques el máximo partido.',
    valueTitle: 'aeroMatch es una bolsa de disponibilidad, no una bolsa de empleo.',
    paragraphContractors:
      'Cuando tu perfil está completo y visible, los contractors pueden encontrarte y contactarte para oportunidades que encajan con tu experiencia y habilitaciones.',
    paragraphNotSearching:
      'Si ahora mismo no estás buscando nada o no quieres recibir contactos — no hay problema. Dentro de tu perfil tienes una pestaña de disponibilidad. Puedes ocultarte hasta que estés listo.',
    activateBold: 'Actívate cuando estés disponible. Ocúltate cuando no.',
    noContactLine: 'Nadie te contacta hasta que tú lo decidas.',
    paragraphTDS: 'Cuando completes tu perfil, aeroMatch genera automáticamente tu ',
    tdsBold: 'Technician Documentation Summary',
    tdsTail:
      ' — tu documentación prerevisada y lista para cuando llegue la oportunidad. Sin emails de ida y vuelta. Sin esperas.',
    ctaLabel: 'Completa tu perfil',
    signOff: 'Cualquier duda estoy aquí.',
    signatureRole: 'Fundador · aeroMatch',
  },
  en: {
    subject: 'Welcome to aeroMatch — one important thing before you start',
    thanks: 'Thank you for signing up to aeroMatch.',
    beforeProfile:
      "Before you complete your profile I want to explain how it works so you get the most out of it.",
    valueTitle: 'aeroMatch is an availability pool, not a job board.',
    paragraphContractors:
      'When your profile is complete and visible, contractors can find and contact you for opportunities that match your experience and ratings.',
    paragraphNotSearching:
      "If you're not actively looking right now or you don't want to be contacted — no problem. Inside your profile there's an availability tab. You can hide yourself until you're ready.",
    activateBold: "Turn yourself on when you're available. Turn yourself off when you're not.",
    noContactLine: "No one contacts you until you decide.",
    paragraphTDS: 'When you complete your profile, aeroMatch automatically generates your ',
    tdsBold: 'Technician Documentation Summary',
    tdsTail:
      ' — your pre-reviewed documentation, ready for when the opportunity comes. No back and forth emails. No waiting.',
    ctaLabel: 'Complete your profile',
    signOff: "Any questions, I'm here.",
    signatureRole: 'Founder · aeroMatch',
  },
}

export async function sendTechnicianWelcomeEmail(params: {
  to: string
  greetingLine: string
  completeProfileUrl: string
  language?: SupportedLanguage
}): Promise<void> {
  if (!resend) {
    console.warn('technicianWelcome: RESEND_API_KEY not set, skipping welcome email')
    return
  }

  const lang: SupportedLanguage = params.language === 'en' ? 'en' : 'es'
  const copy = COPY[lang]
  const from = process.env.WELCOME_EMAIL_FROM || DEFAULT_FROM
  const logoUrl = 'https://aeromatch.eu/logo-email.png'

  const text = `${params.greetingLine}

${copy.thanks}

${copy.beforeProfile}

${copy.valueTitle}

${copy.paragraphContractors}

${copy.paragraphNotSearching}

${copy.activateBold}

${copy.noContactLine}

${copy.paragraphTDS}${copy.tdsBold}${copy.tdsTail}

${copy.ctaLabel}: ${params.completeProfileUrl}

${copy.signOff}

Raúl Sánchez
${copy.signatureRole}
raul@aeromatch.eu`

  const url = escapeHtml(params.completeProfileUrl)

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
<p style="color:#E0E6EC;font-size:16px;margin:0 0 16px;">${escapeHtml(params.greetingLine)}</p>
<p style="color:#8899AA;font-size:15px;line-height:1.55;margin:0 0 14px;">${escapeHtml(copy.thanks)}</p>
<p style="color:#8899AA;font-size:15px;line-height:1.55;margin:0 0 14px;">${escapeHtml(copy.beforeProfile)}</p>
<p style="color:#8899AA;font-size:15px;line-height:1.55;margin:0 0 14px;"><strong style="color:#C9A24D;">${escapeHtml(copy.valueTitle)}</strong></p>
<p style="color:#8899AA;font-size:15px;line-height:1.55;margin:0 0 14px;">${escapeHtml(copy.paragraphContractors)}</p>
<p style="color:#8899AA;font-size:15px;line-height:1.55;margin:0 0 14px;">${escapeHtml(copy.paragraphNotSearching)}</p>
<p style="color:#8899AA;font-size:15px;line-height:1.55;margin:0 0 14px;"><strong style="color:#fff;">${escapeHtml(copy.activateBold)}</strong></p>
<p style="color:#8899AA;font-size:15px;line-height:1.55;margin:0 0 14px;">${escapeHtml(copy.noContactLine)}</p>
<p style="color:#8899AA;font-size:15px;line-height:1.55;margin:0 0 20px;">${escapeHtml(copy.paragraphTDS)}<strong style="color:#fff;">${escapeHtml(copy.tdsBold)}</strong>${escapeHtml(copy.tdsTail)}</p>
<p style="margin:0 0 24px;"><a href="${url}" style="display:inline-block;background:#C9A24D;color:#0B132B;text-decoration:none;font-weight:600;padding:12px 22px;border-radius:10px;">${escapeHtml(copy.ctaLabel)}</a></p>
<p style="color:#6B809A;font-size:14px;line-height:1.5;margin:0;">${escapeHtml(copy.signOff)}<br/><br/>
Raúl Sánchez<br/>
${escapeHtml(copy.signatureRole)}<br/>
<a href="mailto:raul@aeromatch.eu" style="color:#C9A24D;">raul@aeromatch.eu</a></p>
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
    console.error('technicianWelcome: Resend error', error)
    throw new Error(String(error.message || error))
  }
}

export async function sendTechnicianSignupAdminNotice(params: {
  technicianName: string
  technicianEmail: string
  registeredAt: Date
  supabaseProfilesLink: string
}): Promise<void> {
  if (!resend) {
    console.warn('technicianWelcome: RESEND_API_KEY not set, skipping admin notice')
    return
  }

  const from = process.env.WELCOME_EMAIL_FROM || DEFAULT_FROM
  const to = 'raul@aeromatch.eu'
  const when = params.registeredAt.toLocaleString('es-ES', { timeZone: 'Europe/Madrid' })

  const text = `Nuevo técnico registrado en aeroMatch

Nombre: ${params.technicianName}
Email: ${params.technicianEmail}
Fecha y hora (Madrid): ${when}

Perfil en Supabase (tabla profiles):
${params.supabaseProfilesLink}`

  const { error } = await resend.emails.send({
    from,
    to,
    subject: `Nuevo técnico: ${params.technicianEmail}`,
    text,
    html: `<p><strong>Nuevo técnico registrado</strong></p>
<ul>
<li><strong>Nombre:</strong> ${escapeHtml(params.technicianName)}</li>
<li><strong>Email:</strong> ${escapeHtml(params.technicianEmail)}</li>
<li><strong>Fecha y hora (Madrid):</strong> ${escapeHtml(when)}</li>
</ul>
<p><a href="${escapeHtml(params.supabaseProfilesLink)}">Abrir tabla profiles en Supabase (filtro por id)</a></p>`,
  })

  if (error) {
    console.error('technicianWelcome admin: Resend error', error)
    throw new Error(String(error.message || error))
  }
}
