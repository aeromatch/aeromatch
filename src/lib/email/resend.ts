import { Resend } from 'resend'

// Resend client - only initialize if API key is available
const resend = process.env.RESEND_API_KEY 
  ? new Resend(process.env.RESEND_API_KEY) 
  : null
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://aeromatch.eu'

interface JobRequestEmailData {
  technicianEmail: string
  technicianName: string
  companyName: string
  contactName?: string
  finalClient: string
  workLocation: string
  startDate: string
  endDate: string
  contractType: string
  notes?: string
  requiresRightToWorkUk?: boolean
  companyOfferMessage?: string
  isAog?: boolean
  responseDeadline?: string
  requiredAircraftType?: string
  /** Email de demostración (oferta de prueba desde el dashboard) — copy y asunto específicos */
  isDemoOffer?: boolean
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function formatMultiline(text?: string) {
  if (!text) return ''
  return escapeHtml(text).replace(/\n/g, '<br>')
}

function normalizeOfferMessage(text?: string) {
  if (!text) return ''
  const blocked = [
    /^Empresa:\s*Empresa\s*$/i,
    /^Ubicaci[oó]n:\s*\[lugar del trabajo\]\s*$/i,
    /^Cliente final:\s*\[cliente\]\s*$/i,
    /^Tipo de contrato:\s*short-term\s*$/i,
  ]
  return text
    .split('\n')
    .filter((line) => !blocked.some((re) => re.test(line.trim())))
    .join('\n')
    .trim()
}

function buildDemoOfferEmailHtml(opts: {
  technicianName: string
  finalClient: string
  workLocation: string
  dateRangeLabel: string
  contractTypeLabel: string
}) {
  const { technicianName, finalClient, workLocation, dateRangeLabel, contractTypeLabel } = opts
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #0B132B; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0B132B; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #1A2642; border-radius: 16px; overflow: hidden; border: 1px solid #3A4A6B;">
          <tr>
            <td style="background: #1A2642; padding: 40px 30px 30px; text-align: center; border-bottom: 3px solid #C9A24D;">
              <img src="${APP_URL}/logo-email.svg" alt="aeroMatch" width="180" style="display:block;margin:0 auto 8px;max-width:180px;height:auto;" />
            </td>
          </tr>
          <tr>
            <td style="padding: 40px 30px;">
              <p style="color: #8899AA; font-size: 16px; margin: 0 0 20px;">
                Hola <strong style="color: #ffffff;">${escapeHtml(technicianName)}</strong>,
              </p>
              <p style="color: #8899AA; font-size: 16px; margin: 0 0 24px; line-height: 1.6;">
                Una empresa ha visto tu perfil en aeroMatch y quiere contactarte.
              </p>
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0B132B; border-radius: 12px; border: 1px solid #3A4A6B; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 22px;">
                    <p style="margin: 0 0 10px; color: #E6EDF7; font-size: 15px;"><strong style="color: #6B809A;">Empresa:</strong> ${escapeHtml(finalClient)}</p>
                    <p style="margin: 0 0 10px; color: #E6EDF7; font-size: 15px;"><strong style="color: #6B809A;">Ubicación:</strong> ${escapeHtml(workLocation)}</p>
                    <p style="margin: 0 0 10px; color: #E6EDF7; font-size: 15px;"><strong style="color: #6B809A;">Fechas:</strong> ${escapeHtml(dateRangeLabel)}</p>
                    <p style="margin: 0; color: #E6EDF7; font-size: 15px;"><strong style="color: #6B809A;">Tipo:</strong> ${escapeHtml(contractTypeLabel)}</p>
                  </td>
                </tr>
              </table>
              <p style="color: #8899AA; font-size: 16px; margin: 0 0 28px; line-height: 1.6;">
                Entra a tu perfil para ver los detalles y decidir si aceptas o rechazas.
              </p>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="${APP_URL}/requests"
                       style="display: inline-block; background: linear-gradient(135deg, #C9A24D 0%, #D4B366 100%); color: #0B132B; text-decoration: none; padding: 16px 40px; border-radius: 10px; font-weight: bold; font-size: 16px;">
                      👉 Ver solicitud
                    </a>
                  </td>
                </tr>
              </table>
              <p style="color: #6B809A; font-size: 13px; margin: 28px 0 0; line-height: 1.6; font-style: italic;">
                *Nota: Esta es una oferta de demostración para que conozcas el flujo de aeroMatch. No tiene ningún efecto real.*
              </p>
              <p style="color: #8899AA; font-size: 15px; margin: 32px 0 0;">
                Un saludo,<br />
                <strong style="color: #C9A24D;">Raúl · aeroMatch</strong>
              </p>
            </td>
          </tr>
          <tr>
            <td style="background-color: #0B132B; padding: 25px 30px; border-top: 1px solid #3A4A6B;">
              <p style="color: #6B809A; font-size: 12px; margin: 0; text-align: center;">
                © aeroMatch · aeromatch.eu
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`
}

export type AmxVerificationReadyEmailData = {
  to: string
  fullName: string
  amxReferenceId: string
  technicianId: string
}

function buildAmxVerificationReadyEmailHtml(data: AmxVerificationReadyEmailData): string {
  const { fullName, amxReferenceId, technicianId } = data
  const base = APP_URL.replace(/\/$/, '')
  const docsUrl = `${base}/profile/documents`
  const profilePublicUrl = `${base}/technician/${technicianId}`
  const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(profilePublicUrl)}`

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #0B132B; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0B132B; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #1A2642; border-radius: 16px; overflow: hidden; border: 1px solid #3A4A6B;">
          <tr>
            <td style="background: #1A2642; padding: 40px 30px 30px; text-align: center; border-bottom: 3px solid #C9A24D;">
              <img src="${base}/logo-email.svg" alt="aeroMatch" width="180" style="display:block;margin:0 auto 8px;max-width:180px;height:auto;" />
            </td>
          </tr>
          <tr>
            <td style="padding: 40px 30px 28px;">
              <h1 style="color: #ffffff; font-size: 22px; margin: 0 0 10px; font-weight: 700;">
                Tu perfil ha sido verificado.
              </h1>
              <p style="color: #8899AA; font-size: 16px; margin: 0 0 28px; line-height: 1.5;">
                Ya eres visible para empresas en aeroMatch.
              </p>
              <p style="color: #E6EDF7; font-size: 16px; margin: 0 0 18px; line-height: 1.65;">
                Hola <strong style="color: #ffffff;">${escapeHtml(fullName)}</strong>,
              </p>
              <p style="color: #8899AA; font-size: 15px; margin: 0 0 16px; line-height: 1.65;">
                Hemos revisado tu documentación y todo está en orden.
                A partir de ahora tu perfil aparece en los resultados
                de búsqueda de MROs, operadoras y contractors que
                buscan técnicos con tu perfil.
              </p>
              <p style="color: #8899AA; font-size: 15px; margin: 0 0 28px; line-height: 1.65;">
                Tu Certificado AMX — <strong style="color: #C9A24D;">${escapeHtml(amxReferenceId)}</strong> — está disponible
                para descarga en tu perfil.
              </p>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="${docsUrl}"
                       style="display: inline-block; background: linear-gradient(135deg, #C9A24D 0%, #D4B366 100%); color: #0B132B; text-decoration: none; padding: 16px 32px; border-radius: 10px; font-weight: bold; font-size: 15px;">
                      Descargar mi certificado AMX
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="background-color: #0B132B; padding: 28px 30px; border-top: 1px solid #3A4A6B;">
              <p style="color: #C9A24D; font-size: 13px; font-weight: 700; margin: 0 0 12px; text-transform: uppercase; letter-spacing: 0.06em;">
                Comparte tu verificación
              </p>
              <p style="color: #8899AA; font-size: 14px; margin: 0 0 22px; line-height: 1.65;">
                Los técnicos verificados generan más confianza.
                Comparte tu certificado AMX en LinkedIn para que
                empresas y reclutadores sepan que estás verificado
                y disponible.
              </p>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="${linkedInUrl}"
                       style="display: inline-block; background: transparent; color: #C9A24D; text-decoration: none; padding: 14px 28px; border-radius: 10px; font-weight: 700; font-size: 14px; border: 2px solid #C9A24D;">
                      Compartir en LinkedIn →
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="background-color: #0B132B; padding: 22px 30px 28px; border-top: 1px solid #3A4A6B;">
              <p style="color: #6B809A; font-size: 12px; margin: 0 0 8px; text-align: center;">
                aeroMatch · aeromatch.eu
              </p>
              <p style="color: #5a6a7a; font-size: 11px; margin: 0; text-align: center; line-height: 1.5;">
                Este email confirma la verificación manual de tus
                documentos por el equipo de aeroMatch.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`
}

/**
 * Email al técnico cuando un admin verifica documentos y el AMX pasa a checked.
 * No lanzar errores al caller: usar try/catch en la ruta si hace falta.
 */
export async function sendAmxVerificationReadyEmail(data: AmxVerificationReadyEmailData): Promise<void> {
  if (!resend) {
    console.warn('sendAmxVerificationReadyEmail: RESEND_API_KEY not set')
    return
  }
  const from = process.env.RESEND_FROM_EMAIL || 'aeroMatch <onboarding@resend.dev>'
  const html = buildAmxVerificationReadyEmailHtml(data)
  await resend.emails.send({
    from,
    to: data.to,
    subject: '✓ Tu certificado AMX está listo — aeroMatch',
    html,
  })
}

export async function sendJobRequestNotification(data: JobRequestEmailData) {
  const {
    technicianEmail,
    technicianName,
    companyName,
    contactName,
    finalClient,
    workLocation,
    startDate,
    endDate,
    contractType,
    notes,
    requiresRightToWorkUk,
    companyOfferMessage
    ,isAog
    ,responseDeadline
    ,requiredAircraftType
    ,isDemoOffer
  } = data
  const cleanedOfferMessage = normalizeOfferMessage(companyOfferMessage)

  const contractTypeLabel = contractType === 'short-term' ? 'Corto plazo' : 'Largo plazo'

  const demoDateRangeLabel = (() => {
    const s = new Date(startDate)
    const e = new Date(endDate)
    const a = s.toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })
    const b = e.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })
    return `${a} — ${b}`
  })()
  
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('es-ES', { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    })
  }

  const htmlContent = isDemoOffer
    ? buildDemoOfferEmailHtml({
        technicianName,
        finalClient: finalClient || 'Demo Airlines',
        workLocation,
        dateRangeLabel: demoDateRangeLabel,
        contractTypeLabel,
      })
    : `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #0B132B; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0B132B; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #1A2642; border-radius: 16px; overflow: hidden; border: 1px solid #3A4A6B;">
          
          <!-- Header -->
          <tr>
            <td style="background: #1A2642; padding: 40px 30px 30px; text-align: center; border-bottom: 3px solid #C9A24D;">
              <img src="${APP_URL}/logo-email.svg" alt="AeroMatch" width="180" style="display:block;margin:0 auto 8px;max-width:180px;height:auto;" />
              <p style="margin: 0; color: #6B809A; font-size: 13px; letter-spacing: 2px; text-transform: uppercase;">
                Nueva oportunidad de trabajo
              </p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <p style="color: #8899AA; font-size: 16px; margin: 0 0 20px;">
                Hola <strong style="color: #ffffff;">${technicianName}</strong>,
              </p>
              
              <p style="color: #8899AA; font-size: 16px; margin: 0 0 30px;">
                <strong style="color: #C9A24D;">${companyName}</strong> te ha enviado una solicitud de trabajo:
              </p>

              ${cleanedOfferMessage ? `
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 20px; background-color: #111B35; border-radius: 12px; border-left: 4px solid #C9A24D; border: 1px solid #3A4A6B;">
                <tr>
                  <td style="padding: 20px;">
                    <p style="margin: 0 0 8px; color: #C9A24D; font-size: 13px; text-transform: uppercase; letter-spacing: 1px;">Mensaje de oferta</p>
                    <p style="margin: 0; color: #E6EDF7; font-size: 15px; line-height: 1.6;">${formatMultiline(cleanedOfferMessage)}</p>
                  </td>
                </tr>
              </table>
              ` : ''}

              <!-- Job Details Card -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0B132B; border-radius: 12px; border: 1px solid #3A4A6B;">
                <tr>
                  <td style="padding: 25px;">
                    
                    <table width="100%" cellpadding="0" cellspacing="0">
                      ${contactName ? `
                      <tr>
                        <td style="padding: 8px 0;">
                          <span style="color: #6B809A; font-size: 13px;">Persona de contacto</span><br>
                          <span style="color: #ffffff; font-size: 16px; font-weight: 500;">👤 ${escapeHtml(contactName)}</span>
                        </td>
                      </tr>
                      ` : ''}
                      ${finalClient?.trim() ? `
                      <tr>
                        <td style="padding: 8px 0;">
                          <span style="color: #6B809A; font-size: 13px;">Cliente final</span><br>
                          <span style="color: #ffffff; font-size: 16px; font-weight: 500;">🏢 ${escapeHtml(finalClient)}</span>
                        </td>
                      </tr>
                      ` : ''}
                      ${workLocation?.trim() ? `
                      <tr>
                        <td style="padding: 8px 0;">
                          <span style="color: #6B809A; font-size: 13px;">Ubicación</span><br>
                          <span style="color: #ffffff; font-size: 16px; font-weight: 500;">📍 ${escapeHtml(workLocation)}</span>
                        </td>
                      </tr>
                      ` : ''}
                      <tr>
                        <td style="padding: 8px 0;">
                          <span style="color: #6B809A; font-size: 13px;">Fechas</span><br>
                          <span style="color: #ffffff; font-size: 16px; font-weight: 500;">📅 ${formatDate(startDate)} - ${formatDate(endDate)}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0;">
                          <span style="color: #6B809A; font-size: 13px;">Tipo de contrato</span><br>
                          <span style="color: #C9A24D; font-size: 16px; font-weight: 500;">${contractTypeLabel}</span>
                        </td>
                      </tr>
                      ${notes ? `
                      <tr>
                        <td style="padding: 12px 0 0;">
                          <span style="color: #6B809A; font-size: 13px;">Notas adicionales</span><br>
                          <span style="color: #8899AA; font-size: 14px; font-style: italic;">"${formatMultiline(notes)}"</span>
                        </td>
                      </tr>
                      ` : ''}
                    </table>

                  </td>
                </tr>
              </table>
              
              ${requiresRightToWorkUk ? `
              <!-- UK Right to Work Warning -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-top: 20px; background-color: #3D2607; border-radius: 12px; border: 1px solid #B07D2B;">
                <tr>
                  <td style="padding: 20px;">
                    <p style="color: #E6B84F; font-size: 15px; font-weight: bold; margin: 0 0 10px;">
                      🇬🇧 ⚠️ Requiere Right to Work UK
                    </p>
                    <p style="color: #D4A03D; font-size: 13px; margin: 0;">
                      Este trabajo requiere elegibilidad laboral legal en UK. Deberás gestionar la elegibilidad mediante Umbrella/EoR o sponsorship de visado. Podrás seleccionar tu método al aceptar la solicitud.
                    </p>
                  </td>
                </tr>
              </table>
              ` : ''}

              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-top: 30px;">
                <tr>
                  <td align="center">
                    <a href="${APP_URL}/requests" 
                       style="display: inline-block; background: linear-gradient(135deg, #C9A24D 0%, #D4B366 100%); color: #0B132B; text-decoration: none; padding: 16px 40px; border-radius: 10px; font-weight: bold; font-size: 16px;">
                      Ver solicitud y responder
                    </a>
                  </td>
                </tr>
              </table>

              <p style="color: #6B809A; font-size: 14px; margin: 30px 0 0; text-align: center;">
                Accede a tu panel de AeroMatch para aceptar o rechazar esta solicitud.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #0B132B; padding: 25px 30px; border-top: 1px solid #3A4A6B;">
              <p style="color: #6B809A; font-size: 12px; margin: 0; text-align: center;">
                © 2025 AeroMatch · Conectando talento aeronáutico · aeromatch.eu
              </p>
              <p style="color: #5A6E8A; font-size: 11px; margin: 10px 0 0; text-align: center;">
                Recibes este email porque tienes una cuenta en AeroMatch.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`

  // Skip if Resend is not configured
  if (!resend) {
    console.error('❌ EMAIL FAILED: RESEND_API_KEY not configured in environment')
    console.error('  RESEND_API_KEY exists:', !!process.env.RESEND_API_KEY)
    console.error('  NODE_ENV:', process.env.NODE_ENV)
    return { success: false, error: 'Email service not configured - RESEND_API_KEY missing' }
  }

  // Validate email address
  if (!technicianEmail || !technicianEmail.includes('@')) {
    console.error('❌ EMAIL FAILED: Invalid technician email:', technicianEmail)
    return { success: false, error: 'Invalid technician email address' }
  }

  console.log('📧 Attempting to send email via Resend...')
  console.log('  To:', technicianEmail)
  console.log('  From: aeroMatch <matchrequest@aeromatch.eu>')
  const subject = isDemoOffer
    ? 'Tienes una nueva solicitud de trabajo en aeroMatch 🔧'
    : isAog
      ? `🚨 AOG — Se necesita ${requiredAircraftType || 'técnico'} en ${workLocation} — Responde antes de ${responseDeadline || ''}`.trim()
      : `🛫 Nueva solicitud de trabajo de ${companyName}`

  console.log('  Subject:', subject)
  console.log('  API Key prefix:', process.env.RESEND_API_KEY?.substring(0, 10) + '...')

  try {
    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'aeroMatch <onboarding@resend.dev>',
      to: technicianEmail,
      subject,
      html: htmlContent,
    })

    if (error) {
      console.error('❌ Resend API error:', JSON.stringify(error))
      return { success: false, error }
    }

    console.log('✅ Email sent successfully! ID:', data?.id)
    return { success: true, data }
  } catch (error: any) {
    console.error('❌ Email send exception:', error?.message || error)
    return { success: false, error }
  }
}

interface PositionCoveredEmailData {
  technicianEmail: string
  technicianName: string
  companyName: string
}

interface OfferExpiredEmailData {
  technicianEmail: string
  technicianName: string
  companyName: string
}

interface AdminOfferExpiredEmailData {
  requestId: string
  technicianName: string
  companyName: string
}

interface AdminAogLaunchedEmailData {
  companyName: string
  workLocation: string
  startDate: string
  endDate: string
  contractType: string
  positionsNeeded: number
}

interface CompanyNoAcceptanceEmailData {
  companyEmail: string
  companyName: string
}

interface CompanyOfferRejectedEmailData {
  companyEmail: string
  companyName: string
  technicianName: string
  rejectionReason: string
  hasNextTechnician: boolean
}

interface AdminOfferRejectedEmailData {
  technicianName: string
  companyName: string
  rejectionReason: string
  hasNextTechnician: boolean
}

export async function sendPositionCoveredNotification(data: PositionCoveredEmailData) {
  if (!resend) return { success: false, error: 'Email service not configured' }
  if (!data.technicianEmail || !data.technicianEmail.includes('@')) {
    return { success: false, error: 'Invalid technician email address' }
  }

  try {
    const { error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'aeroMatch <onboarding@resend.dev>',
      to: data.technicianEmail,
      subject: 'Posición cubierta — AeroMatch',
      html: `
      <div style="font-family:Inter,Arial,sans-serif;background:#0B132B;padding:24px;color:#fff;">
        <img src="${APP_URL}/logo-email.svg" alt="AeroMatch" width="180" style="display:block;max-width:180px;height:auto;margin-bottom:12px;" />
        <p>Hola ${escapeHtml(data.technicianName)},</p>
        <p>Te informamos de que la posición para la que fuiste contactado por ${escapeHtml(data.companyName)} ha sido cubierta.</p>
        <p>Tu perfil sigue activo y visible para futuras oportunidades.</p>
        <p>Un saludo,<br/>AeroMatch</p>
      </div>
      `
    })
    return { success: !error, error }
  } catch (error) {
    return { success: false, error }
  }
}

export async function sendOfferExpiredNotification(data: OfferExpiredEmailData) {
  if (!resend) return { success: false, error: 'Email service not configured' }
  if (!data.technicianEmail || !data.technicianEmail.includes('@')) {
    return { success: false, error: 'Invalid technician email address' }
  }

  try {
    const { error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'aeroMatch <onboarding@resend.dev>',
      to: data.technicianEmail,
      subject: 'Oferta expirada — AeroMatch',
      html: `
      <div style="font-family:Inter,Arial,sans-serif;background:#0B132B;padding:24px;color:#fff;">
        <img src="${APP_URL}/logo-email.svg" alt="AeroMatch" width="180" style="display:block;max-width:180px;height:auto;margin-bottom:12px;" />
        <p>Hola ${escapeHtml(data.technicianName)},</p>
        <p>La oferta de ${escapeHtml(data.companyName)} para la que fuiste contactado ha expirado por no recibir respuesta en el plazo indicado.</p>
        <p>Te recomendamos mantener tu disponibilidad actualizada para no perder futuras oportunidades.</p>
        <p>Un saludo,<br/>AeroMatch</p>
      </div>
      `
    })
    return { success: !error, error }
  } catch (error) {
    return { success: false, error }
  }
}

export async function sendAdminOfferExpiredNotification(data: AdminOfferExpiredEmailData) {
  if (!resend) return { success: false, error: 'Email service not configured' }
  try {
    const { error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'aeroMatch <onboarding@resend.dev>',
      to: 'raul@aeromatch.eu',
      subject: `Oferta caducada #${data.requestId}`,
      html: `
      <div style="font-family:Inter,Arial,sans-serif;background:#0B132B;padding:20px;color:#fff;">
        <img src="${APP_URL}/logo-email.svg" alt="AeroMatch" width="180" style="display:block;max-width:180px;height:auto;margin-bottom:12px;" />
        <h3>Oferta caducada sin respuesta</h3>
        <p><strong>Solicitud:</strong> ${escapeHtml(data.requestId)}</p>
        <p><strong>Técnico:</strong> ${escapeHtml(data.technicianName)}</p>
        <p><strong>Empresa:</strong> ${escapeHtml(data.companyName)}</p>
      </div>
      `
    })
    return { success: !error, error }
  } catch (error) {
    return { success: false, error }
  }
}

export async function sendAdminAogLaunchedNotification(data: AdminAogLaunchedEmailData) {
  if (!resend) return { success: false, error: 'Email service not configured' }
  try {
    const { error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'aeroMatch <onboarding@resend.dev>',
      to: 'raul@aeromatch.eu',
      subject: `🚨 AOG lanzado — ${data.companyName}`,
      html: `
      <div style="font-family:Inter,Arial,sans-serif;background:#0B132B;padding:20px;color:#fff;">
        <img src="${APP_URL}/logo-email.svg" alt="AeroMatch" width="180" style="display:block;max-width:180px;height:auto;margin-bottom:12px;" />
        <h3>Nuevo AOG lanzado</h3>
        <p><strong>Empresa:</strong> ${escapeHtml(data.companyName)}</p>
        <p><strong>Ubicación:</strong> ${escapeHtml(data.workLocation)}</p>
        <p><strong>Fechas:</strong> ${escapeHtml(data.startDate)} - ${escapeHtml(data.endDate)}</p>
        <p><strong>Contrato:</strong> ${escapeHtml(data.contractType)}</p>
        <p><strong>Técnicos necesarios:</strong> ${data.positionsNeeded}</p>
      </div>
      `
    })
    return { success: !error, error }
  } catch (error) {
    return { success: false, error }
  }
}

export async function sendCompanyNoAcceptanceNotification(data: CompanyNoAcceptanceEmailData) {
  if (!resend) return { success: false, error: 'Email service not configured' }
  if (!data.companyEmail || !data.companyEmail.includes('@')) {
    return { success: false, error: 'Invalid company email address' }
  }
  try {
    const { error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'aeroMatch <onboarding@resend.dev>',
      to: data.companyEmail,
      subject: 'Sin aceptación de técnicos — AeroMatch',
      html: `
      <div style="font-family:Inter,Arial,sans-serif;background:#0B132B;padding:20px;color:#fff;">
        <img src="${APP_URL}/logo-email.svg" alt="AeroMatch" width="180" style="display:block;max-width:180px;height:auto;margin-bottom:12px;" />
        <p>Hola ${escapeHtml(data.companyName)},</p>
        <p>La solicitud ha finalizado sin aceptación de técnicos en los plazos establecidos.</p>
        <p>Puedes lanzar una nueva solicitud ajustando fechas, ubicación o requisitos.</p>
        <p>Un saludo,<br/>AeroMatch</p>
      </div>
      `
    })
    return { success: !error, error }
  } catch (error) {
    return { success: false, error }
  }
}

export async function sendCompanyOfferRejectedNotification(data: CompanyOfferRejectedEmailData) {
  if (!resend) return { success: false, error: 'Email service not configured' }
  if (!data.companyEmail || !data.companyEmail.includes('@')) {
    return { success: false, error: 'Invalid company email address' }
  }
  try {
    const { error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'aeroMatch <onboarding@resend.dev>',
      to: data.companyEmail,
      subject: `Oferta rechazada — ${data.technicianName} — AeroMatch`,
      html: `
      <div style="font-family:Inter,Arial,sans-serif;background:#0B132B;padding:20px;color:#fff;">
        <img src="${APP_URL}/logo-email.svg" alt="AeroMatch" width="180" style="display:block;max-width:180px;height:auto;margin-bottom:12px;" />
        <p>Hola ${escapeHtml(data.companyName)},</p>
        <p><strong>${escapeHtml(data.technicianName)}</strong> ha rechazado tu oferta de trabajo.</p>
        <p>Motivo indicado por el técnico:</p>
        <p style="font-style:italic;">"${formatMultiline(data.rejectionReason)}"</p>
        ${data.hasNextTechnician ? '<p>AeroMatch buscará automáticamente el siguiente técnico disponible en tu lista de preferencia.</p>' : ''}
        <p>Un saludo,<br/>AeroMatch</p>
      </div>
      `
    })
    return { success: !error, error }
  } catch (error) {
    return { success: false, error }
  }
}

export async function sendAdminOfferRejectedNotification(data: AdminOfferRejectedEmailData) {
  if (!resend) return { success: false, error: 'Email service not configured' }
  try {
    const { error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'aeroMatch <onboarding@resend.dev>',
      to: 'raul@aeromatch.eu',
      subject: `Oferta rechazada — ${data.technicianName} — AeroMatch`,
      html: `
      <div style="font-family:Inter,Arial,sans-serif;background:#0B132B;padding:20px;color:#fff;">
        <img src="${APP_URL}/logo-email.svg" alt="AeroMatch" width="180" style="display:block;max-width:180px;height:auto;margin-bottom:12px;" />
        <p><strong>${escapeHtml(data.technicianName)}</strong> ha rechazado una oferta de <strong>${escapeHtml(data.companyName)}</strong>.</p>
        <p>Motivo:</p>
        <p style="font-style:italic;">"${formatMultiline(data.rejectionReason)}"</p>
        <p>Siguiente técnico disponible: ${data.hasNextTechnician ? 'Sí' : 'No'}</p>
      </div>
      `
    })
    return { success: !error, error }
  } catch (error) {
    return { success: false, error }
  }
}

interface AdminJobAcceptedEmailData {
  requestId: string
  technicianName: string
  companyName: string
  startDate: string
  endDate: string
  contractType: string
}

interface CompanyJobAcceptedEmailData {
  companyEmail: string
  companyName: string
  technicianName: string
  requestId: string
  finalClientName: string
  workLocation: string
  startDate: string
  endDate: string
  contractType: string
  readableRequestId: string
  technicianPresentationMessage?: string
  technicianExperienceYears?: number | null
  technicianSpecialties?: string[]
  technicianLicenses?: string[]
  technicianTypeRatings?: string[]
  technicianEmail?: string
  technicianPhone?: string
  hasLogbook?: boolean
}

export async function sendAdminJobAcceptedNotification(data: AdminJobAcceptedEmailData) {
  if (!resend) return { success: false, error: 'Email service not configured' }
  try {
    const { error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'aeroMatch <onboarding@resend.dev>',
      to: 'raul@aeromatch.eu',
      subject: `Oferta aceptada #${data.requestId}`,
      html: `
        <div style="font-family:Inter,Arial,sans-serif;background:#0B132B;padding:20px;color:#fff;">
          <img src="${APP_URL}/logo-email.svg" alt="AeroMatch" width="180" style="display:block;max-width:180px;height:auto;margin-bottom:12px;" />
          <h3>Oferta aceptada</h3>
          <p><strong>Solicitud:</strong> ${data.requestId}</p>
          <p><strong>Tecnico:</strong> ${data.technicianName}</p>
          <p><strong>Empresa:</strong> ${data.companyName}</p>
          <p><strong>Fechas:</strong> ${data.startDate} - ${data.endDate}</p>
          <p><strong>Tipo contrato:</strong> ${data.contractType}</p>
        </div>
      `
    })
    return { success: !error, error }
  } catch (error) {
    return { success: false, error }
  }
}

export async function sendCompanyJobAcceptedNotification(data: CompanyJobAcceptedEmailData) {
  if (!resend) return { success: false, error: 'Email service not configured' }
  if (!data.companyEmail || !data.companyEmail.includes('@')) {
    return { success: false, error: 'Invalid company email address' }
  }

  const contractTypeLabel = data.contractType === 'short-term' ? 'Corto plazo' : 'Largo plazo'
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
  }

  try {
    const { error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'aeroMatch <onboarding@resend.dev>',
      to: data.companyEmail,
      subject: `✅ ${data.technicianName} ha aceptado tu oferta`,
      html: `
      <body style="margin:0;padding:0;background-color:#0B132B;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0B132B;padding:40px 20px;">
          <tr><td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background-color:#1A2642;border-radius:16px;overflow:hidden;border:1px solid #3A4A6B;">
              <tr>
                <td style="padding:34px 30px;border-bottom:3px solid #C9A24D;">
                  <img src="${APP_URL}/logo-email.svg" alt="AeroMatch" width="180" style="display:block;max-width:180px;height:auto;" />
                  <p style="margin:8px 0 0;color:#6B809A;font-size:13px;letter-spacing:1px;text-transform:uppercase;">Oferta aceptada</p>
                </td>
              </tr>
              <tr>
                <td style="padding:30px;">
                  <p style="margin:0 0 14px;color:#8899AA;font-size:16px;">Hola <strong style="color:#fff;">${data.companyName}</strong>,</p>
                  <p style="margin:0 0 20px;color:#8899AA;font-size:16px;"><strong style="color:#C9A24D;">${escapeHtml(data.technicianName)}</strong> ha aceptado tu oferta en AeroMatch.</p>
                  ${data.technicianPresentationMessage ? `
                    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;background-color:#111B35;border-radius:12px;border-left:4px solid #C9A24D;border:1px solid #3A4A6B;">
                      <tr><td style="padding:20px;">
                        <p style="margin:0 0 8px;color:#C9A24D;font-size:13px;text-transform:uppercase;letter-spacing:1px;">Mensaje de presentación del técnico</p>
                        <p style="margin:0;color:#E6EDF7;font-size:15px;line-height:1.6;">${formatMultiline(data.technicianPresentationMessage)}</p>
                      </td></tr>
                    </table>
                  ` : ''}
                  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0B132B;border-radius:12px;border:1px solid #3A4A6B;">
                    <tr><td style="padding:20px;">
                      <p style="margin:0 0 8px;color:#6B809A;font-size:13px;">Solicitud</p>
                      <p style="margin:0 0 12px;color:#fff;font-size:15px;">${data.readableRequestId}</p>
                      <p style="margin:0 0 8px;color:#6B809A;font-size:13px;">Cliente final</p>
                      <p style="margin:0 0 12px;color:#fff;font-size:15px;">${escapeHtml(data.finalClientName)}</p>
                      <p style="margin:0 0 8px;color:#6B809A;font-size:13px;">Ubicación</p>
                      <p style="margin:0 0 12px;color:#fff;font-size:15px;">📍 ${escapeHtml(data.workLocation)}</p>
                      <p style="margin:0 0 8px;color:#6B809A;font-size:13px;">Fechas</p>
                      <p style="margin:0 0 12px;color:#fff;font-size:15px;">${formatDate(data.startDate)} - ${formatDate(data.endDate)}</p>
                      <p style="margin:0 0 8px;color:#6B809A;font-size:13px;">Tipo de contrato</p>
                      <p style="margin:0;color:#C9A24D;font-size:15px;">${contractTypeLabel}</p>
                      ${typeof data.technicianExperienceYears === 'number' ? `<p style="margin:12px 0 8px;color:#6B809A;font-size:13px;">Años de experiencia</p><p style="margin:0 0 12px;color:#fff;font-size:15px;">${data.technicianExperienceYears}</p>` : ''}
                      ${data.technicianSpecialties?.length ? `<p style="margin:0 0 8px;color:#6B809A;font-size:13px;">Especialidades</p><p style="margin:0 0 12px;color:#fff;font-size:15px;">${escapeHtml(data.technicianSpecialties.join(', '))}</p>` : ''}
                      ${data.technicianLicenses?.length ? `<p style="margin:0 0 8px;color:#6B809A;font-size:13px;">Licencias</p><p style="margin:0 0 12px;color:#fff;font-size:15px;">${escapeHtml(data.technicianLicenses.join(', '))}</p>` : ''}
                      ${data.technicianTypeRatings?.length ? `<p style="margin:0 0 8px;color:#6B809A;font-size:13px;">Type ratings</p><p style="margin:0 0 12px;color:#fff;font-size:15px;">${escapeHtml(data.technicianTypeRatings.join(', '))}</p>` : ''}
                      ${data.technicianEmail ? `<p style="margin:0 0 8px;color:#6B809A;font-size:13px;">Email de contacto</p><p style="margin:0 0 12px;color:#fff;font-size:15px;">${escapeHtml(data.technicianEmail)}</p>` : ''}
                      ${data.technicianPhone ? `<p style="margin:0 0 8px;color:#6B809A;font-size:13px;">Teléfono</p><p style="margin:0 0 12px;color:#fff;font-size:15px;">${escapeHtml(data.technicianPhone)}</p>` : ''}
                      ${data.hasLogbook ? `<p style="margin:0;color:#C9A24D;font-size:14px;">📖 Technical Logbook disponible para consulta.</p>` : ''}
                    </td></tr>
                  </table>
                </td>
              </tr>
            </table>
          </td></tr>
        </table>
      </body>
      `
    })

    return { success: !error, error }
  } catch (error) {
    return { success: false, error }
  }
}

interface AdminJobCompletedEmailData extends AdminJobAcceptedEmailData {
  ratingSummary: string
}

export async function sendAdminJobCompletedNotification(data: AdminJobCompletedEmailData) {
  if (!resend) return { success: false, error: 'Email service not configured' }
  try {
    const { error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'aeroMatch <onboarding@resend.dev>',
      to: 'raul@aeromatch.eu',
      subject: `Contratacion completada #${data.requestId}`,
      html: `
        <div style="font-family:Inter,Arial,sans-serif;background:#0B132B;padding:20px;color:#fff;">
          <img src="${APP_URL}/logo-email.svg" alt="AeroMatch" width="180" style="display:block;max-width:180px;height:auto;margin-bottom:12px;" />
          <h3>Contratacion completada</h3>
          <p><strong>Solicitud:</strong> ${data.requestId}</p>
          <p><strong>Tecnico:</strong> ${data.technicianName}</p>
          <p><strong>Empresa:</strong> ${data.companyName}</p>
          <p><strong>Fechas:</strong> ${data.startDate} - ${data.endDate}</p>
          <p><strong>Tipo contrato:</strong> ${data.contractType}</p>
          <p><strong>Valoracion:</strong> ${data.ratingSummary}</p>
        </div>
      `
    })
    return { success: !error, error }
  } catch (error) {
    return { success: false, error }
  }
}

