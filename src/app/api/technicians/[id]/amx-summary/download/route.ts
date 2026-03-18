import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: technicianId } = await params
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const serviceClient = getServiceClient()

    // Check if user is a company OR the technician themselves
    const { data: profile } = await serviceClient
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const isCompany = profile?.role === 'company'
    const isOwnProfile = user.id === technicianId

    if (!isCompany && !isOwnProfile) {
      return NextResponse.json({ error: 'Only companies or the technician can download this summary' }, { status: 403 })
    }

    // Get technician data
    const { data: technician, error: techError } = await serviceClient
      .from('technicians')
      .select(`
        user_id,
        license_category,
        aircraft_types,
        specialties,
        languages,
        years_experience,
        contract_type_preference,
        own_tools,
        right_to_work_uk,
        uk_license,
        verification_status,
        availability_status,
        verified_at,
        is_available
      `)
      .eq('user_id', technicianId)
      .single()

    if (techError || !technician) {
      return NextResponse.json({ error: 'Technician not found' }, { status: 404 })
    }

    // Get documents summary
    const { data: documents } = await serviceClient
      .from('documents')
      .select('doc_type, status')
      .eq('technician_id', technicianId)

    // Generate AMX ID (anonymous format)
    const amxId = `AMX-${technicianId.substring(0, 8).toUpperCase()}`
    
    // Build verification checklist
    const basicLicenseTypes = ['easa_license', 'uk_license', 'faa_ap']
    const hasLicense = documents?.some(d => basicLicenseTypes.includes(d.doc_type))
    const verifiedLicense = documents?.some(d => basicLicenseTypes.includes(d.doc_type) && d.status === 'verified')
    
    const licenseStatus = verifiedLicense ? 'verified' : hasLicense ? 'pending' : 'missing'
    const documentsVerified = documents?.filter(d => d.status === 'verified').length || 0
    const documentsPending = documents?.filter(d => d.status === 'uploaded' || d.status === 'pending').length || 0

    // Generate PDF
    const pdfBytes = await generateCompanySummaryPdf({
      amxId,
      isVerified: technician.verification_status === 'verified',
      verificationStatus: technician.verification_status,
      licenses: technician.license_category || [],
      aircraftTypes: technician.aircraft_types || [],
      specialties: technician.specialties || [],
      languages: technician.languages || [],
      yearsExperience: technician.years_experience,
      contractPreference: technician.contract_type_preference,
      ownTools: technician.own_tools,
      rightToWorkUk: technician.right_to_work_uk,
      ukLicense: technician.uk_license,
      licenseStatus,
      documentsVerified,
      documentsPending,
      documentsTotal: documents?.length || 0,
      generatedAt: new Date(),
    })

    // Return PDF as downloadable file
    return new NextResponse(Buffer.from(pdfBytes), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${amxId}-summary.pdf"`,
      },
    })

  } catch (error: any) {
    console.error('AMX Summary download error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

interface SummaryData {
  amxId: string
  isVerified: boolean
  verificationStatus: string
  licenses: string[]
  aircraftTypes: string[]
  specialties: string[]
  languages: string[]
  yearsExperience: number | null
  contractPreference: string
  ownTools: boolean
  rightToWorkUk: boolean
  ukLicense: boolean
  licenseStatus: string
  documentsVerified: number
  documentsPending: number
  documentsTotal: number
  generatedAt: Date
}

async function generateCompanySummaryPdf(data: SummaryData): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create()
  const page = pdfDoc.addPage([595.28, 841.89]) // A4
  
  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
  
  const { width, height } = page.getSize()
  const margin = 50

  const COLORS = {
    navy: rgb(0.043, 0.075, 0.169),
    gold: rgb(0.788, 0.635, 0.302),
    white: rgb(1, 1, 1),
    steel: rgb(0.420, 0.533, 0.604),
    steelLight: rgb(0.533, 0.600, 0.667),
    green: rgb(0.298, 0.686, 0.314),
    yellow: rgb(0.9, 0.7, 0.2),
    bgLight: rgb(0.98, 0.98, 0.98),
  }

  // Background
  page.drawRectangle({ x: 0, y: 0, width, height, color: COLORS.white })

  // Header
  page.drawRectangle({ x: 0, y: height - 120, width, height: 120, color: COLORS.navy })

  let y = height - 50
  page.drawText('aero', { x: margin, y, size: 28, font: helveticaBold, color: COLORS.gold })
  page.drawText('Match', { x: margin + 52, y, size: 28, font: helveticaBold, color: COLORS.white })

  y -= 28
  page.drawText('Technician Summary', { x: margin, y, size: 14, font: helvetica, color: COLORS.steelLight })
  page.drawText('(Anonymous Preview)', { x: margin + 130, y, size: 10, font: helvetica, color: COLORS.steel })

  // AMX ID Badge (right side)
  const badgeText = data.amxId
  page.drawText(badgeText, {
    x: width - margin - helveticaBold.widthOfTextAtSize(badgeText, 14),
    y: height - 55,
    size: 14,
    font: helveticaBold,
    color: COLORS.gold,
  })

  // Verification status
  const statusText = data.isVerified ? 'AMX Verified' : 'Pending Verification'
  const statusColor = data.isVerified ? COLORS.green : COLORS.yellow
  page.drawText(statusText, {
    x: width - margin - helveticaBold.widthOfTextAtSize(statusText, 10),
    y: height - 75,
    size: 10,
    font: helveticaBold,
    color: statusColor,
  })

  // Content sections
  y = height - 155

  // Disclaimer
  page.drawText('This is an anonymous preview. Full technician details available after job offer acceptance.', {
    x: margin,
    y,
    size: 9,
    font: helvetica,
    color: COLORS.steel,
  })

  y -= 35

  // Section: Licenses
  drawSection(page, margin, y, 'LICENSES', 
    data.licenses.length > 0 ? `EASA Part-66 ${data.licenses.join(', ')}` : 'Not specified',
    helvetica, helveticaBold, COLORS)
  y -= 55

  // Section: Aircraft Types
  drawSection(page, margin, y, 'TYPE RATINGS',
    data.aircraftTypes.length > 0 ? data.aircraftTypes.join(' · ') : 'Not specified',
    helvetica, helveticaBold, COLORS)
  y -= 55

  // Section: Experience
  drawSection(page, margin, y, 'EXPERIENCE',
    data.yearsExperience ? `${data.yearsExperience} years` : 'Not specified',
    helvetica, helveticaBold, COLORS)
  y -= 55

  // Section: Specialties
  drawSection(page, margin, y, 'SPECIALTIES',
    data.specialties.length > 0 ? data.specialties.join(', ') : 'Not specified',
    helvetica, helveticaBold, COLORS)
  y -= 55

  // Section: Languages
  drawSection(page, margin, y, 'LANGUAGES',
    data.languages.length > 0 ? data.languages.join(', ') : 'Not specified',
    helvetica, helveticaBold, COLORS)
  y -= 55

  // Section: Contract Preference
  const contractLabels: Record<string, string> = {
    'short-term': 'Short-term',
    'long-term': 'Long-term',
    'both': 'Both (Short & Long term)',
  }
  drawSection(page, margin, y, 'CONTRACT PREFERENCE',
    contractLabels[data.contractPreference] || 'Not specified',
    helvetica, helveticaBold, COLORS)
  y -= 55

  // Operational flags
  const flags: string[] = []
  if (data.ownTools) flags.push('Own Tools')
  if (data.rightToWorkUk) flags.push('UK Right to Work')
  if (data.ukLicense) flags.push('UK CAA License')
  
  drawSection(page, margin, y, 'OPERATIONAL FLAGS',
    flags.length > 0 ? flags.join(' · ') : 'None specified',
    helvetica, helveticaBold, COLORS)
  y -= 55

  // Documentation status
  y -= 10
  page.drawRectangle({
    x: margin,
    y: y - 50,
    width: width - margin * 2,
    height: 50,
    color: COLORS.bgLight,
    borderColor: rgb(0.9, 0.9, 0.9),
    borderWidth: 1,
  })

  page.drawText('DOCUMENTATION STATUS', {
    x: margin + 15,
    y: y - 20,
    size: 9,
    font: helveticaBold,
    color: COLORS.steel,
  })

  const docStatusText = `${data.documentsVerified} verified · ${data.documentsPending} pending review · ${data.documentsTotal} total`
  page.drawText(docStatusText, {
    x: margin + 15,
    y: y - 38,
    size: 11,
    font: helvetica,
    color: COLORS.navy,
  })

  // Footer
  page.drawRectangle({ x: 0, y: 0, width, height: 50, color: COLORS.navy })
  
  const footerText = `Generated ${data.generatedAt.toLocaleDateString('en-GB')} · AeroMatch · aeromatch.eu`
  const footerWidth = helvetica.widthOfTextAtSize(footerText, 9)
  page.drawText(footerText, {
    x: (width - footerWidth) / 2,
    y: 20,
    size: 9,
    font: helvetica,
    color: COLORS.steel,
  })

  return await pdfDoc.save()
}

function drawSection(
  page: any,
  x: number,
  y: number,
  label: string,
  value: string,
  font: any,
  fontBold: any,
  colors: any
) {
  page.drawText(label, {
    x,
    y,
    size: 9,
    font: fontBold,
    color: colors.steel,
  })
  
  page.drawText(value.substring(0, 80) + (value.length > 80 ? '...' : ''), {
    x,
    y: y - 18,
    size: 12,
    font: font,
    color: colors.navy,
  })
}
