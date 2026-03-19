import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'
import fs from 'fs'
import path from 'path'

interface TechnicianData {
  fullName: string
  licenseCategory: string[]
  aircraftTypes: string[]
  yearsExperience: number | null
  specialties?: string[]
  languages?: string[]
  ownTools?: boolean
  rightToWorkUk?: boolean
  drivingLicense?: boolean
  isAvailable: boolean
}

interface DocumentData {
  docType: string
  status: string
  expiresOn: string | null
}

interface CertificateData {
  referenceId: string
  technician: TechnicianData
  documents: DocumentData[]
  generatedAt: Date
  certificateStatus?: 'pending' | 'checked' | 'rejected'
}

// Brand colors (AeroMatch Design System)
const COLORS = {
  white: rgb(1, 1, 1),
  navy950: rgb(0.043, 0.075, 0.169),     // #0B132B
  navy900: rgb(0.102, 0.149, 0.259),     // #1A2642
  gold500: rgb(0.788, 0.635, 0.302),     // #C9A24D
  gold300: rgb(0.878, 0.773, 0.502),     // #E0C580
  steel600: rgb(0.353, 0.431, 0.541),    // #5A6E8A
  steel200: rgb(0.761, 0.808, 0.851),    // #C2CED9
  steel100: rgb(0.878, 0.902, 0.925),    // #E0E6EC
  success500: rgb(0.251, 0.569, 0.424),  // #40916C
  successBg: rgb(0.918, 0.961, 0.937),   // #EAF5EF
  warning500: rgb(0.831, 0.627, 0.239),  // #D4A03D
  warningBg: rgb(0.996, 0.965, 0.906),   // #FEF6E7
  error500: rgb(0.773, 0.188, 0.188),    // #C53030
  errorBg: rgb(0.992, 0.918, 0.914),     // #FDECEA
  muted: rgb(0.353, 0.431, 0.541),       // #5A6E8A
  body: rgb(0.102, 0.149, 0.259),        // #1A2642
  lightBg: rgb(0.957, 0.965, 0.976),     // #F4F6F9
  border: rgb(0.761, 0.808, 0.851),      // #C2CED9
}

const PAGE_WIDTH = 595.28  // A4 width in points
const PAGE_HEIGHT = 841.89 // A4 height in points
const MARGIN = 26 * 2.83465 // 26mm in points

// Document type labels
const DOC_TYPE_LABELS: Record<string, string> = {
  easa_license: 'EASA Part-66 License',
  uk_license: 'UK CAA License',
  faa_ap: 'FAA A&P License',
  passport: 'Passport / ID',
  cv: 'CV / Resume',
  medical: 'Medical certificate',
  training: 'Training Certificate',
  logbook: 'Technical Logbook',
}

function getDocTypeLabel(docType: string): string {
  if (docType.startsWith('type_') && docType.endsWith('_theory')) {
    return 'Type ratings certificates'
  }
  if (docType.startsWith('type_') && docType.endsWith('_practical')) {
    return 'Type ratings certificates'
  }
  return DOC_TYPE_LABELS[docType] || docType.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

async function loadImage(pdfDoc: PDFDocument, imagePath: string): Promise<any> {
  try {
    // In production (Vercel), images are in the public folder
    // We need to fetch them via URL or read from filesystem
    const fullPath = path.join(process.cwd(), 'public', imagePath)
    
    if (fs.existsSync(fullPath)) {
      const imageBytes = fs.readFileSync(fullPath)
      if (imagePath.endsWith('.png')) {
        return await pdfDoc.embedPng(imageBytes)
      } else if (imagePath.endsWith('.jpg') || imagePath.endsWith('.jpeg')) {
        return await pdfDoc.embedJpg(imageBytes)
      }
    }
    return null
  } catch (error) {
    console.error('Error loading image:', imagePath, error)
    return null
  }
}

export async function generateCertificatePdf(data: CertificateData): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create()
  const page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT])
  
  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
  
  const { width, height } = page.getSize()
  
  // Load images
  const logoImage = await loadImage(pdfDoc, 'logo-certificate.png')
  const sealChecked = await loadImage(pdfDoc, 'seal-checked.png')
  const sealPending = await loadImage(pdfDoc, 'seal-pending.png')

  // ═══════════════════════════════════════════════════════════════════════════
  // BACKGROUND
  // ═══════════════════════════════════════════════════════════════════════════
  page.drawRectangle({
    x: 0, y: 0, width, height,
    color: COLORS.white,
  })

  // Gold left stripe
  page.drawRectangle({
    x: 0, y: 0, width: 3.5, height,
    color: COLORS.gold500,
  })

  // ═══════════════════════════════════════════════════════════════════════════
  // NAVY HEADER
  // ═══════════════════════════════════════════════════════════════════════════
  const headerHeight = 68
  page.drawRectangle({
    x: 0, y: height - headerHeight, width, height: headerHeight,
    color: COLORS.navy950,
  })

  // Gold line below header
  page.drawRectangle({
    x: 0, y: height - headerHeight - 2, width, height: 2,
    color: COLORS.gold500,
  })

  // Logo
  if (logoImage) {
    const logoHeight = 30
    const logoWidth = logoHeight * (396 / 123) // Maintain aspect ratio
    page.drawImage(logoImage, {
      x: MARGIN,
      y: height - headerHeight / 2 - logoHeight / 2,
      width: logoWidth,
      height: logoHeight,
    })
  } else {
    // Fallback: text logo
    page.drawText('aero', {
      x: MARGIN,
      y: height - 42,
      size: 20,
      font: helveticaBold,
      color: COLORS.gold500,
    })
    page.drawText('Match', {
      x: MARGIN + 42,
      y: height - 42,
      size: 20,
      font: helveticaBold,
      color: COLORS.white,
    })
  }

  // Header right text
  page.drawText('TECHNICIAN DOCUMENTATION SUMMARY', {
    x: width - MARGIN - helvetica.widthOfTextAtSize('TECHNICIAN DOCUMENTATION SUMMARY', 7.5),
    y: height - 24,
    size: 7.5,
    font: helvetica,
    color: COLORS.steel200,
  })
  page.drawText('Generated after profile acceptance', {
    x: width - MARGIN - helvetica.widthOfTextAtSize('Generated after profile acceptance', 7.5),
    y: height - 37,
    size: 7.5,
    font: helvetica,
    color: COLORS.gold300,
  })

  // ═══════════════════════════════════════════════════════════════════════════
  // CONTENT
  // ═══════════════════════════════════════════════════════════════════════════
  let y = height - headerHeight - 22

  // Name
  page.drawText(data.technician.fullName || 'Unknown Technician', {
    x: MARGIN,
    y,
    size: 19,
    font: helveticaBold,
    color: COLORS.navy950,
  })
  y -= 20

  // Reference ID + Date
  const dateStr = data.generatedAt.toLocaleDateString('en-GB')
  page.drawText(`Reference ID: ${data.referenceId}`, {
    x: MARGIN,
    y,
    size: 8,
    font: helvetica,
    color: COLORS.muted,
  })
  page.drawText(`Date: ${dateStr}`, {
    x: width - MARGIN - helvetica.widthOfTextAtSize(`Date: ${dateStr}`, 8),
    y,
    size: 8,
    font: helvetica,
    color: COLORS.muted,
  })
  y -= 16

  // Divider line
  page.drawLine({
    start: { x: MARGIN, y },
    end: { x: width - MARGIN, y },
    thickness: 0.5,
    color: COLORS.border,
  })
  y -= 20

  // Status seal (top right area)
  const sealImage = data.certificateStatus === 'checked' ? sealChecked : sealPending
  if (sealImage) {
    const sealHeight = 45
    const sealWidth = sealHeight * 1.2
    page.drawImage(sealImage, {
      x: width - MARGIN - sealWidth,
      y: height - headerHeight - 75,
      width: sealWidth,
      height: sealHeight,
    })
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SECTIONS
  // ═══════════════════════════════════════════════════════════════════════════

  // Helper to draw section label
  const drawSectionLabel = (label: string, yPos: number): number => {
    page.drawText(label, {
      x: MARGIN,
      y: yPos,
      size: 7,
      font: helveticaBold,
      color: COLORS.gold500,
    })
    return yPos - 16
  }

  // Helper to draw pills
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

      // Draw pill background
      page.drawRectangle({
        x,
        y: currentY - 4,
        width: pillWidth,
        height: pillHeight,
        color: bgColor,
        borderColor: borderColor,
        borderWidth: borderColor ? 0.6 : 0,
      })

      // Draw pill text
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

  // LICENCES
  if (data.technician.licenseCategory && data.technician.licenseCategory.length > 0) {
    y = drawSectionLabel('LICENCES', y)
    y = drawPills(data.technician.licenseCategory, y, COLORS.navy950, COLORS.steel100)
  }

  // TYPE RATINGS
  if (data.technician.aircraftTypes && data.technician.aircraftTypes.length > 0) {
    y = drawSectionLabel('TYPE RATINGS', y)
    y = drawPills(data.technician.aircraftTypes, y, COLORS.lightBg, COLORS.navy950, COLORS.border)
  }

  // EXPERIENCE
  if (data.technician.yearsExperience) {
    y = drawSectionLabel('EXPERIENCE', y)
    page.drawText(`${data.technician.yearsExperience} years`, {
      x: MARGIN,
      y,
      size: 10,
      font: helvetica,
      color: COLORS.body,
    })
    y -= 20
  }

  // SPECIALTIES
  if (data.technician.specialties && data.technician.specialties.length > 0) {
    y = drawSectionLabel('SPECIALTIES', y)
    y = drawPills(data.technician.specialties, y, rgb(0.933, 0.945, 0.965), COLORS.navy950, COLORS.border)
  }

  // LANGUAGES
  if (data.technician.languages && data.technician.languages.length > 0) {
    y = drawSectionLabel('LANGUAGES', y)
    page.drawText(data.technician.languages.join(' · '), {
      x: MARGIN,
      y,
      size: 10,
      font: helvetica,
      color: COLORS.body,
    })
    y -= 20
  }

  // OPERATIONAL FLAGS
  const flags: string[] = []
  if (data.technician.ownTools) flags.push('Own Tools')
  if (data.technician.rightToWorkUk) flags.push('Right to Work UK')
  if (data.technician.drivingLicense) flags.push('Driving License')

  if (flags.length > 0) {
    y = drawSectionLabel('OPERATIONAL FLAGS', y)
    y = drawPills(flags, y, COLORS.warningBg, rgb(0.69, 0.49, 0.17), COLORS.warning500)
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // DOCUMENTS OVERVIEW
  // ═══════════════════════════════════════════════════════════════════════════
  y -= 10
  page.drawLine({
    start: { x: MARGIN, y },
    end: { x: width - MARGIN, y },
    thickness: 0.5,
    color: COLORS.border,
  })
  y -= 20

  page.drawText('Documents overview', {
    x: MARGIN,
    y,
    size: 11,
    font: helveticaBold,
    color: COLORS.navy950,
  })
  y -= 18

  // Table header
  const colStatus = width - MARGIN - 85
  page.drawText('Document', {
    x: MARGIN,
    y,
    size: 7.5,
    font: helveticaBold,
    color: COLORS.muted,
  })
  page.drawText('Status', {
    x: colStatus,
    y,
    size: 7.5,
    font: helveticaBold,
    color: COLORS.muted,
  })
  y -= 7

  page.drawLine({
    start: { x: MARGIN, y },
    end: { x: width - MARGIN, y },
    thickness: 0.5,
    color: COLORS.border,
  })
  y -= 15

  // Group documents by type
  const docGroups = new Map<string, { name: string; status: string }>()
  const docOrder = [
    'EASA Part-66 License',
    'UK CAA License',
    'FAA A&P License',
    'Type ratings certificates',
    'Medical certificate',
    'Passport / ID',
    'Technical Logbook',
    'CV / Resume',
  ]

  for (const doc of data.documents) {
    const label = getDocTypeLabel(doc.docType)
    const existing = docGroups.get(label)
    
    if (!existing || (existing.status === 'verified' && doc.status !== 'verified')) {
      docGroups.set(label, { name: label, status: doc.status })
    }
  }

  // Draw documents in preferred order
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'verified':
        return { label: 'Checked', color: COLORS.success500, bg: COLORS.successBg }
      case 'uploaded':
        return { label: 'Uploaded', color: COLORS.warning500, bg: COLORS.warningBg }
      case 'pending':
        return { label: 'Pending', color: COLORS.warning500, bg: COLORS.warningBg }
      case 'expired':
        return { label: 'Expired', color: COLORS.error500, bg: COLORS.errorBg }
      case 'rejected':
        return { label: 'Rejected', color: COLORS.error500, bg: COLORS.errorBg }
      default:
        return { label: 'Missing', color: COLORS.error500, bg: COLORS.errorBg }
    }
  }

  const drawnDocs = new Set<string>()
  
  // First draw in preferred order
  for (const docName of docOrder) {
    const doc = docGroups.get(docName)
    if (doc && !drawnDocs.has(docName)) {
      drawnDocs.add(docName)
      const config = getStatusConfig(doc.status)

      page.drawText(doc.name, {
        x: MARGIN,
        y,
        size: 9.5,
        font: helvetica,
        color: COLORS.body,
      })

      const statusWidth = helveticaBold.widthOfTextAtSize(config.label, 8) + 16
      page.drawRectangle({
        x: colStatus - 2,
        y: y - 3,
        width: statusWidth,
        height: 15,
        color: config.bg,
      })
      page.drawText(config.label, {
        x: colStatus + 6,
        y: y + 3,
        size: 8,
        font: helveticaBold,
        color: config.color,
      })

      y -= 4
      page.drawLine({
        start: { x: MARGIN, y },
        end: { x: width - MARGIN, y },
        thickness: 0.3,
        color: rgb(0.91, 0.925, 0.94),
      })
      y -= 14
    }
  }

  // Then draw any remaining docs
  for (const [docName, doc] of docGroups) {
    if (!drawnDocs.has(docName)) {
      drawnDocs.add(docName)
      const config = getStatusConfig(doc.status)

      page.drawText(doc.name, {
        x: MARGIN,
        y,
        size: 9.5,
        font: helvetica,
        color: COLORS.body,
      })

      const statusWidth = helveticaBold.widthOfTextAtSize(config.label, 8) + 16
      page.drawRectangle({
        x: colStatus - 2,
        y: y - 3,
        width: statusWidth,
        height: 15,
        color: config.bg,
      })
      page.drawText(config.label, {
        x: colStatus + 6,
        y: y + 3,
        size: 8,
        font: helveticaBold,
        color: config.color,
      })

      y -= 4
      page.drawLine({
        start: { x: MARGIN, y },
        end: { x: width - MARGIN, y },
        thickness: 0.3,
        color: rgb(0.91, 0.925, 0.94),
      })
      y -= 14
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // FOOTER
  // ═══════════════════════════════════════════════════════════════════════════
  const footerHeight = 44
  page.drawRectangle({
    x: 0, y: 0, width, height: footerHeight,
    color: COLORS.lightBg,
  })
  page.drawLine({
    start: { x: 0, y: footerHeight },
    end: { x: width, y: footerHeight },
    thickness: 0.5,
    color: COLORS.border,
  })

  // Disclaimer text centered
  const disclaimer1 = 'Documents reviewed based on information provided by the technician.'
  const disclaimer2 = 'AeroMatch does not replace operator or authority validation.'
  
  page.drawText(disclaimer1, {
    x: (width - helvetica.widthOfTextAtSize(disclaimer1, 6.8)) / 2,
    y: 30,
    size: 6.8,
    font: helvetica,
    color: COLORS.muted,
  })
  page.drawText(disclaimer2, {
    x: (width - helvetica.widthOfTextAtSize(disclaimer2, 6.8)) / 2,
    y: 20,
    size: 6.8,
    font: helvetica,
    color: COLORS.muted,
  })

  // Reference info at bottom
  page.drawText(`Reference ID: ${data.referenceId}     Date generated: ${dateStr}`, {
    x: MARGIN,
    y: 10,
    size: 7,
    font: helvetica,
    color: COLORS.steel600,
  })
  page.drawText('aeromatch.eu', {
    x: width - MARGIN - helveticaBold.widthOfTextAtSize('aeromatch.eu', 7),
    y: 10,
    size: 7,
    font: helveticaBold,
    color: COLORS.gold500,
  })

  return await pdfDoc.save()
}

export type { CertificateData, TechnicianData, DocumentData }
