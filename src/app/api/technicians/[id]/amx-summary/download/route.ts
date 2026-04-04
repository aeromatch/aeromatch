import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'
import fs from 'fs'
import path from 'path'

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

async function loadImage(pdfDoc: PDFDocument, imagePath: string): Promise<any> {
  try {
    const fullPath = path.join(process.cwd(), 'public', imagePath)
    if (fs.existsSync(fullPath)) {
      const imageBytes = fs.readFileSync(fullPath)
      if (imagePath.endsWith('.png')) {
        return await pdfDoc.embedPng(imageBytes)
      }
    }
    return null
  } catch (error) {
    console.error('Error loading image:', imagePath, error)
    return null
  }
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

    const { data: documents } = await serviceClient
      .from('documents')
      .select('doc_type, status')
      .eq('technician_id', technicianId)

    const amxId = `AMX-${technicianId.substring(0, 8).toUpperCase()}`

    const basicLicenseTypes = ['easa_license', 'uk_license', 'faa_ap']
    const hasLicense = documents?.some(d => basicLicenseTypes.includes(d.doc_type))
    const verifiedLicense = documents?.some(d => basicLicenseTypes.includes(d.doc_type) && d.status === 'verified')

    const licenseStatus = verifiedLicense ? 'verified' : hasLicense ? 'pending' : 'missing'
    const documentsVerified = documents?.filter(d => d.status === 'verified').length || 0
    const documentsPending = documents?.filter(d => d.status === 'uploaded' || d.status === 'pending').length || 0

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

const COLORS = {
  white: rgb(1, 1, 1),
  navy950: rgb(0.043, 0.075, 0.169),
  navy900: rgb(0.102, 0.149, 0.259),
  gold500: rgb(0.788, 0.635, 0.302),
  gold300: rgb(0.878, 0.773, 0.502),
  steel600: rgb(0.353, 0.431, 0.541),
  steel200: rgb(0.761, 0.808, 0.851),
  steel100: rgb(0.878, 0.902, 0.925),
  success500: rgb(0.251, 0.569, 0.424),
  successBg: rgb(0.918, 0.961, 0.937),
  warning500: rgb(0.831, 0.627, 0.239),
  warningBg: rgb(0.996, 0.965, 0.906),
  muted: rgb(0.353, 0.431, 0.541),
  body: rgb(0.102, 0.149, 0.259),
  lightBg: rgb(0.957, 0.965, 0.976),
  border: rgb(0.761, 0.808, 0.851),
}

const PAGE_WIDTH = 595.28
const PAGE_HEIGHT = 841.89
const MARGIN = 26 * 2.83465

async function generateCompanySummaryPdf(data: SummaryData): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create()
  const page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT])

  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

  const { width, height } = page.getSize()
  const logoImage = await loadImage(pdfDoc, 'logo-certificate.png')

  page.drawRectangle({ x: 0, y: 0, width, height, color: COLORS.white })

  page.drawRectangle({ x: 0, y: 0, width: 3.5, height, color: COLORS.gold500 })

  const headerHeight = 68
  page.drawRectangle({ x: 0, y: height - headerHeight, width, height: headerHeight, color: COLORS.navy950 })

  page.drawRectangle({ x: 0, y: height - headerHeight - 2, width, height: 2, color: COLORS.gold500 })

  if (logoImage) {
    const logoH = 30
    const logoW = logoH * (396 / 123)
    page.drawImage(logoImage, {
      x: MARGIN,
      y: height - headerHeight / 2 - logoH / 2,
      width: logoW,
      height: logoH,
    })
  } else {
    page.drawText('aero', { x: MARGIN, y: height - 42, size: 20, font: helveticaBold, color: COLORS.gold500 })
    page.drawText('Match', { x: MARGIN + 42, y: height - 42, size: 20, font: helveticaBold, color: COLORS.white })
  }

  page.drawText('TECHNICIAN SUMMARY', {
    x: width - MARGIN - helvetica.widthOfTextAtSize('TECHNICIAN SUMMARY', 7.5),
    y: height - 24,
    size: 7.5,
    font: helvetica,
    color: COLORS.steel200,
  })
  page.drawText('Anonymous Preview', {
    x: width - MARGIN - helvetica.widthOfTextAtSize('Anonymous Preview', 7.5),
    y: height - 37,
    size: 7.5,
    font: helvetica,
    color: COLORS.gold300,
  })

  let y = height - headerHeight - 22

  page.drawText(data.amxId, {
    x: MARGIN,
    y,
    size: 19,
    font: helveticaBold,
    color: COLORS.navy950,
  })
  y -= 20

  const statusText = data.isVerified ? 'AMX Verified' : 'Pending Verification'
  const statusColor = data.isVerified ? COLORS.success500 : COLORS.warning500
  const statusBg = data.isVerified ? COLORS.successBg : COLORS.warningBg

  const statusWidth = helveticaBold.widthOfTextAtSize(statusText, 9) + 16
  page.drawRectangle({ x: MARGIN, y: y - 4, width: statusWidth, height: 16, color: statusBg })
  page.drawText(statusText, { x: MARGIN + 8, y: y + 2, size: 9, font: helveticaBold, color: statusColor })

  const dateStr = data.generatedAt.toLocaleDateString('en-GB')
  page.drawText(`Generated: ${dateStr}`, {
    x: width - MARGIN - helvetica.widthOfTextAtSize(`Generated: ${dateStr}`, 8),
    y,
    size: 8,
    font: helvetica,
    color: COLORS.muted,
  })
  y -= 22

  page.drawLine({ start: { x: MARGIN, y }, end: { x: width - MARGIN, y }, thickness: 0.5, color: COLORS.border })
  y -= 8

  page.drawText('Full technician details available after job offer acceptance.', {
    x: MARGIN,
    y,
    size: 8,
    font: helvetica,
    color: COLORS.muted,
  })
  y -= 22

  const drawSectionLabel = (label: string, yPos: number): number => {
    page.drawText(label, { x: MARGIN, y: yPos, size: 7, font: helveticaBold, color: COLORS.gold500 })
    return yPos - 16
  }

  const drawPills = (items: string[], yPos: number, bgColor: any, textColor: any, borderColor?: any): number => {
    const pillHeight = 17
    const paddingX = 9
    const gapH = 5
    const gapV = 7
    let x = MARGIN
    let currentY = yPos

    for (const item of items) {
      const textWidth = helvetica.widthOfTextAtSize(item, 8.5)
      const pillWidth = textWidth + paddingX * 2

      if (x + pillWidth > width - MARGIN) {
        x = MARGIN
        currentY -= (pillHeight + gapV)
      }

      page.drawRectangle({
        x,
        y: currentY - 4,
        width: pillWidth,
        height: pillHeight,
        color: bgColor,
        borderColor: borderColor,
        borderWidth: borderColor ? 0.6 : 0,
      })

      page.drawText(item, {
        x: x + paddingX,
        y: currentY + 3,
        size: 8.5,
        font: helvetica,
        color: textColor,
      })

      x += pillWidth + gapH
    }

    return currentY - pillHeight - 14
  }

  if (data.licenses.length > 0) {
    y = drawSectionLabel('LICENCES', y)
    y = drawPills(data.licenses, y, COLORS.navy950, COLORS.steel100)
  }

  if (data.aircraftTypes.length > 0) {
    y = drawSectionLabel('TYPE RATINGS', y)
    y = drawPills(data.aircraftTypes, y, COLORS.lightBg, COLORS.navy950, COLORS.border)
  }

  if (data.yearsExperience) {
    y = drawSectionLabel('EXPERIENCE', y)
    page.drawText(`${data.yearsExperience} years`, { x: MARGIN, y, size: 10, font: helvetica, color: COLORS.body })
    y -= 20
  }

  if (data.specialties.length > 0) {
    y = drawSectionLabel('SPECIALTIES', y)
    y = drawPills(data.specialties, y, rgb(0.933, 0.945, 0.965), COLORS.navy950, COLORS.border)
  }

  if (data.languages.length > 0) {
    y = drawSectionLabel('LANGUAGES', y)
    page.drawText(data.languages.join(' - '), { x: MARGIN, y, size: 10, font: helvetica, color: COLORS.body })
    y -= 20
  }

  const contractLabels: Record<string, string> = {
    'short-term': 'Short-term',
    'long-term': 'Long-term',
    'both': 'Both (Short & Long term)',
  }
  if (data.contractPreference) {
    y = drawSectionLabel('CONTRACT PREFERENCE', y)
    page.drawText(contractLabels[data.contractPreference] || data.contractPreference, {
      x: MARGIN, y, size: 10, font: helvetica, color: COLORS.body
    })
    y -= 20
  }

  const flags: string[] = []
  if (data.ownTools) flags.push('Own Tools')
  if (data.rightToWorkUk) flags.push('Right to Work UK')
  if (data.ukLicense) flags.push('UK CAA License')

  if (flags.length > 0) {
    y = drawSectionLabel('OPERATIONAL FLAGS', y)
    y = drawPills(flags, y, COLORS.warningBg, rgb(0.69, 0.49, 0.17), COLORS.warning500)
  }

  y -= 10
  page.drawLine({ start: { x: MARGIN, y }, end: { x: width - MARGIN, y }, thickness: 0.5, color: COLORS.border })
  y -= 20

  page.drawText('Documentation status', { x: MARGIN, y, size: 11, font: helveticaBold, color: COLORS.navy950 })
  y -= 18

  const docStatusText = `${data.documentsVerified} verified - ${data.documentsPending} pending - ${data.documentsTotal} total`
  page.drawText(docStatusText, { x: MARGIN, y, size: 10, font: helvetica, color: COLORS.body })

  const footerHeight = 44
  page.drawRectangle({ x: 0, y: 0, width, height: footerHeight, color: COLORS.lightBg })
  page.drawLine({ start: { x: 0, y: footerHeight }, end: { x: width, y: footerHeight }, thickness: 0.5, color: COLORS.border })

  const disclaimer = 'Anonymous summary. Full details available after technician accepts job offer.'
  page.drawText(disclaimer, {
    x: (width - helvetica.widthOfTextAtSize(disclaimer, 7)) / 2,
    y: 25,
    size: 7,
    font: helvetica,
    color: COLORS.muted,
  })

  page.drawText(`${data.amxId}`, { x: MARGIN, y: 10, size: 7, font: helvetica, color: COLORS.steel600 })
  page.drawText('aeromatch.eu', {
    x: width - MARGIN - helveticaBold.widthOfTextAtSize('aeromatch.eu', 7),
    y: 10,
    size: 7,
    font: helveticaBold,
    color: COLORS.gold500,
  })

  return await pdfDoc.save()
}
