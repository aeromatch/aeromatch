import { Resend } from 'resend'

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null

const DEFAULT_FROM = 'Raúl · aeroMatch <raul@aeromatch.eu>'
const WELCOME_SUBJECT = 'Bienvenido a aeroMatch — una cosa importante antes de empezar'

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export function buildTechnicianGreeting(
  firstNameFromTechnician: string | null | undefined,
  fullNameFromProfile: string | null | undefined
): string {
  const t = firstNameFromTechnician?.trim()
  if (t) return `Hola ${t},`
  const f = fullNameFromProfile?.trim()
  if (f) return `Hola ${f},`
  return 'Hola,'
}

export async function sendTechnicianWelcomeEmail(params: {
  to: string
  greetingLine: string
  completeProfileUrl: string
}): Promise<void> {
  if (!resend) {
    console.warn('technicianWelcome: RESEND_API_KEY not set, skipping welcome email')
    return
  }

  const from = process.env.WELCOME_EMAIL_FROM || DEFAULT_FROM

  const text = `${params.greetingLine}

Gracias por registrarte en aeroMatch.

Antes de que completes tu perfil quiero explicarte cómo funciona para que le saques el máximo partido.

aeroMatch es una bolsa de disponibilidad, no una bolsa de empleo.

Cuando tu perfil está completo y visible, los contractors pueden encontrarte y contactarte para oportunidades que encajan con tu experiencia y habilitaciones.

Si ahora mismo no estás buscando nada o no quieres recibir contactos — no hay problema. Dentro de tu perfil tienes una pestaña de disponibilidad. Puedes ocultarte hasta que estés listo.

Actívate cuando estés disponible. Ocúltate cuando no.

Nadie te contacta hasta que tú lo decidas.

Cuando completes tu perfil, aeroMatch genera automáticamente tu Technician Documentation Summary — tu documentación prerevisada y lista para cuando llegue la oportunidad. Sin emails de ida y vuelta. Sin esperas.

Completa tu perfil: ${params.completeProfileUrl}

Cualquier duda estoy aquí.

Raúl Sánchez
Fundador · aeroMatch
raul@aeromatch.eu`

  const url = escapeHtml(params.completeProfileUrl)

  const html = `
<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#0B132B;font-family:system-ui,-apple-system,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#0B132B;padding:32px 16px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#1A2642;border-radius:16px;border:1px solid #3A4A6B;overflow:hidden;">
<tr><td style="padding:28px 28px 8px;border-bottom:3px solid #C9A24D;text-align:center;">
<p style="margin:0;font-size:36px;font-weight:700;"><span style="color:#C9A24D;">aero</span><span style="color:#fff;">Match</span></p>
</td></tr>
<tr><td style="padding:28px;">
<p style="color:#E0E6EC;font-size:16px;margin:0 0 16px;">${escapeHtml(params.greetingLine)}</p>
<p style="color:#8899AA;font-size:15px;line-height:1.55;margin:0 0 14px;">Gracias por registrarte en aeroMatch.</p>
<p style="color:#8899AA;font-size:15px;line-height:1.55;margin:0 0 14px;">Antes de que completes tu perfil quiero explicarte cómo funciona para que le saques el máximo partido.</p>
<p style="color:#8899AA;font-size:15px;line-height:1.55;margin:0 0 14px;"><strong style="color:#C9A24D;">aeroMatch es una bolsa de disponibilidad, no una bolsa de empleo.</strong></p>
<p style="color:#8899AA;font-size:15px;line-height:1.55;margin:0 0 14px;">Cuando tu perfil está completo y visible, los contractors pueden encontrarte y contactarte para oportunidades que encajan con tu experiencia y habilitaciones.</p>
<p style="color:#8899AA;font-size:15px;line-height:1.55;margin:0 0 14px;">Si ahora mismo no estás buscando nada o no quieres recibir contactos — no hay problema. Dentro de tu perfil tienes una pestaña de disponibilidad. Puedes ocultarte hasta que estés listo.</p>
<p style="color:#8899AA;font-size:15px;line-height:1.55;margin:0 0 14px;"><strong style="color:#fff;">Actívate cuando estés disponible. Ocúltate cuando no.</strong></p>
<p style="color:#8899AA;font-size:15px;line-height:1.55;margin:0 0 14px;">Nadie te contacta hasta que tú lo decidas.</p>
<p style="color:#8899AA;font-size:15px;line-height:1.55;margin:0 0 20px;">Cuando completes tu perfil, aeroMatch genera automáticamente tu <strong style="color:#fff;">Technician Documentation Summary</strong> — tu documentación prerevisada y lista para cuando llegue la oportunidad. Sin emails de ida y vuelta. Sin esperas.</p>
<p style="margin:0 0 24px;"><a href="${url}" style="display:inline-block;background:#C9A24D;color:#0B132B;text-decoration:none;font-weight:600;padding:12px 22px;border-radius:10px;">Completa tu perfil</a></p>
<p style="color:#6B809A;font-size:14px;line-height:1.5;margin:0;">Cualquier duda estoy aquí.<br/><br/>
Raúl Sánchez<br/>
Fundador · aeroMatch<br/>
<a href="mailto:raul@aeromatch.eu" style="color:#C9A24D;">raul@aeromatch.eu</a></p>
</td></tr></table>
</td></tr></table>
</body></html>`

  const { error } = await resend.emails.send({
    from,
    to: params.to,
    subject: WELCOME_SUBJECT,
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
