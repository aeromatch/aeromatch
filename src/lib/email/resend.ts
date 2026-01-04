import { Resend } from 'resend'

// Resend client - only initialize if API key is available
const resend = process.env.RESEND_API_KEY 
  ? new Resend(process.env.RESEND_API_KEY) 
  : null

interface JobRequestEmailData {
  technicianEmail: string
  technicianName: string
  companyName: string
  finalClient: string
  workLocation: string
  startDate: string
  endDate: string
  contractType: string
  notes?: string
  requiresRightToWorkUk?: boolean
}

export async function sendJobRequestNotification(data: JobRequestEmailData) {
  const {
    technicianEmail,
    technicianName,
    companyName,
    finalClient,
    workLocation,
    startDate,
    endDate,
    contractType,
    notes,
    requiresRightToWorkUk
  } = data

  const contractTypeLabel = contractType === 'short-term' ? 'Corto plazo' : 'Largo plazo'
  
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('es-ES', { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    })
  }

  const htmlContent = `
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
            <td style="background: linear-gradient(180deg, #263666 0%, #1A2642 100%); padding: 35px 30px; text-align: center; border-bottom: 2px solid #C9A24D;">
              <!-- Logo SVG -->
              <svg width="200" height="62" viewBox="0 0 396 122.95" xmlns="http://www.w3.org/2000/svg" style="display: block; margin: 0 auto 15px;">
                <path fill="#C9A24D" d="M34.98,70.43c-.05.54-.03,1.39.48,2.08.95,1.28,3.08,1.4,4.12,1.14,17.79-4.42,30.7-8.02,32.82-9.11,1.21-.63,2.06-1.54,2.06-1.54,1.04-1.13,1.47-2.37,1.72-3.2,1.28-4.34.61-7.84,1.19-7.96.42-.09,1.05,1.68,2.25,4.53,1.26,2.99,3.85,7.53,4.21,9.32.75,2.81.26,3.95,0,4.42-.45.81-1.11,1.25-1.43,1.45-6.57,4.21-12.19,7.08-12.19,7.08-7.89,4.2-23.23,11.94-32.85,16.72-4.08,2-6.43,3.1-9.72,5.26-1.19.78-10.51,6.88-9.55,9.03.35.79,1.78.3,9.43.34,5.02.11,10.26.18,14.98-.18,16.59-11.37,50.94-20.74,63.23.29,1.72-.2,14.97-.16,15.39-.12,6.51.08,7.98.19,8.57-.81.54-.91,0-2.06-1.47-5.41-14.48-32.46-26.14-60.23-43.61-92.4-4.27-.81-11.5-.73-15.71.17"/>
                <text fill="#C9A24D" font-family="Inter, Arial, sans-serif" font-size="48" font-weight="700" x="126.06" y="83.55">aero</text>
                <text fill="#FFFFFF" font-family="Inter, Arial, sans-serif" font-size="48" font-weight="700" x="232.97" y="83.55">Match</text>
              </svg>
              <p style="margin: 0; color: #8899AA; font-size: 14px;">
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

              <!-- Job Details Card -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0B132B; border-radius: 12px; border: 1px solid #3A4A6B;">
                <tr>
                  <td style="padding: 25px;">
                    
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding: 8px 0;">
                          <span style="color: #6B809A; font-size: 13px;">Cliente final</span><br>
                          <span style="color: #ffffff; font-size: 16px; font-weight: 500;">${finalClient}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0;">
                          <span style="color: #6B809A; font-size: 13px;">Ubicación</span><br>
                          <span style="color: #ffffff; font-size: 16px; font-weight: 500;">📍 ${workLocation}</span>
                        </td>
                      </tr>
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
                          <span style="color: #8899AA; font-size: 14px; font-style: italic;">"${notes}"</span>
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
                    <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://app.aeromatch.eu'}/requests" 
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
    console.log('❌ Email skipped: RESEND_API_KEY not configured')
    console.log('RESEND_API_KEY exists:', !!process.env.RESEND_API_KEY)
    return { success: false, error: 'Email service not configured' }
  }

  console.log('📧 Attempting to send email...')
  console.log('  To:', technicianEmail)
  console.log('  From: aeroMatch <matchrequest@aeromatch.eu>')
  console.log('  Subject:', `🛫 Nueva solicitud de trabajo de ${companyName}`)

  try {
    const { data, error } = await resend.emails.send({
      from: 'aeroMatch <matchrequest@aeromatch.eu>',
      to: technicianEmail,
      subject: `🛫 Nueva solicitud de trabajo de ${companyName}`,
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

