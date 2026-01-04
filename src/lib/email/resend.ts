import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

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
    notes
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
<body style="margin: 0; padding: 0; background-color: #0a1628; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0a1628; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #111d32; border-radius: 16px; overflow: hidden;">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #c9a227 0%, #e8c547 100%); padding: 30px; text-align: center;">
              <h1 style="margin: 0; color: #0a1628; font-size: 28px; font-weight: bold;">
                ✈️ AeroMatch
              </h1>
              <p style="margin: 10px 0 0; color: #0a1628; font-size: 14px; opacity: 0.8;">
                Nueva oportunidad de trabajo
              </p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <p style="color: #94a3b8; font-size: 16px; margin: 0 0 20px;">
                Hola <strong style="color: #ffffff;">${technicianName}</strong>,
              </p>
              
              <p style="color: #94a3b8; font-size: 16px; margin: 0 0 30px;">
                <strong style="color: #c9a227;">${companyName}</strong> te ha enviado una solicitud de trabajo:
              </p>

              <!-- Job Details Card -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0a1628; border-radius: 12px; border: 1px solid #1e3a5f;">
                <tr>
                  <td style="padding: 25px;">
                    
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding: 8px 0;">
                          <span style="color: #64748b; font-size: 13px;">Cliente final</span><br>
                          <span style="color: #ffffff; font-size: 16px; font-weight: 500;">${finalClient}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0;">
                          <span style="color: #64748b; font-size: 13px;">Ubicación</span><br>
                          <span style="color: #ffffff; font-size: 16px; font-weight: 500;">📍 ${workLocation}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0;">
                          <span style="color: #64748b; font-size: 13px;">Fechas</span><br>
                          <span style="color: #ffffff; font-size: 16px; font-weight: 500;">📅 ${formatDate(startDate)} - ${formatDate(endDate)}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0;">
                          <span style="color: #64748b; font-size: 13px;">Tipo de contrato</span><br>
                          <span style="color: #c9a227; font-size: 16px; font-weight: 500;">${contractTypeLabel}</span>
                        </td>
                      </tr>
                      ${notes ? `
                      <tr>
                        <td style="padding: 12px 0 0;">
                          <span style="color: #64748b; font-size: 13px;">Notas adicionales</span><br>
                          <span style="color: #94a3b8; font-size: 14px; font-style: italic;">"${notes}"</span>
                        </td>
                      </tr>
                      ` : ''}
                    </table>

                  </td>
                </tr>
              </table>

              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-top: 30px;">
                <tr>
                  <td align="center">
                    <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://aeromatch.es'}/requests" 
                       style="display: inline-block; background: linear-gradient(135deg, #c9a227 0%, #e8c547 100%); color: #0a1628; text-decoration: none; padding: 16px 40px; border-radius: 10px; font-weight: bold; font-size: 16px;">
                      Ver solicitud y responder
                    </a>
                  </td>
                </tr>
              </table>

              <p style="color: #64748b; font-size: 14px; margin: 30px 0 0; text-align: center;">
                Accede a tu panel de AeroMatch para aceptar o rechazar esta solicitud.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #0a1628; padding: 25px 30px; border-top: 1px solid #1e3a5f;">
              <p style="color: #64748b; font-size: 12px; margin: 0; text-align: center;">
                © 2025 AeroMatch · Conectando talento aeronáutico
              </p>
              <p style="color: #475569; font-size: 11px; margin: 10px 0 0; text-align: center;">
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

  try {
    const { data, error } = await resend.emails.send({
      from: 'AeroMatch <notificaciones@aeromatch.es>',
      to: technicianEmail,
      subject: `🛫 Nueva solicitud de trabajo de ${companyName}`,
      html: htmlContent,
    })

    if (error) {
      console.error('Resend error:', error)
      return { success: false, error }
    }

    console.log('Email sent successfully:', data)
    return { success: true, data }
  } catch (error) {
    console.error('Email send error:', error)
    return { success: false, error }
  }
}

