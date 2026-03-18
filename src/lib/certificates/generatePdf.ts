import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'

interface TechnicianData {
  fullName: string
  licenseCategory: string[]
  aircraftTypes: string[]
  yearsExperience: number | null
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
}

const COLORS = {
  navy: rgb(0.043, 0.075, 0.169),      // #0B132B
  navyLight: rgb(0.102, 0.149, 0.259), // #1A2642
  gold: rgb(0.788, 0.635, 0.302),      // #C9A24D
  white: rgb(1, 1, 1),
  steel: rgb(0.420, 0.533, 0.604),     // #6B889A
  steelLight: rgb(0.533, 0.600, 0.667),// #889AAA
  green: rgb(0.298, 0.686, 0.314),     // #4CAF50
  greenLight: rgb(0.898, 0.976, 0.898),// #E5F9E5
}

const DOC_TYPE_LABELS: Record<string, string> = {
  easa_license: 'EASA License',
  uk_license: 'UK CAA License',
  faa_ap: 'FAA A&P License',
  passport: 'Passport / ID',
  cv: 'CV / Resume',
  medical: 'Medical Certificate',
  training: 'Training Certificate',
  logbook: 'Experience Logbook',
}

function getDocTypeLabel(docType: string): string {
  if (docType.startsWith('type_') && docType.endsWith('_theory')) {
    const aircraft = docType.replace('type_', '').replace('_theory', '').toUpperCase()
    return `Type Rating Theory: ${aircraft}`
  }
  if (docType.startsWith('type_') && docType.endsWith('_practical')) {
    const aircraft = docType.replace('type_', '').replace('_practical', '').toUpperCase()
    return `Type Rating Practical: ${aircraft}`
  }
  return DOC_TYPE_LABELS[docType] || docType
}

function getStatusLabel(status: string): string {
  switch (status) {
    case 'verified': return 'Checked'
    case 'uploaded': return 'Uploaded'
    case 'pending': return 'Pending'
    case 'expired': return 'Expired'
    default: return status
  }
}

export async function generateCertificatePdf(data: CertificateData): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create()
  const page = pdfDoc.addPage([595.28, 841.89]) // A4 size in points
  
  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
  
  const { width, height } = page.getSize()
  const margin = 50
  let y = height - margin

  // Background
  page.drawRectangle({
    x: 0,
    y: 0,
    width,
    height,
    color: COLORS.white,
  })

  // Header background
  page.drawRectangle({
    x: 0,
    y: height - 140,
    width,
    height: 140,
    color: COLORS.navy,
  })

  // Logo text "aeroMatch"
  y = height - 55
  page.drawText('aero', {
    x: margin,
    y,
    size: 32,
    font: helveticaBold,
    color: COLORS.gold,
  })
  page.drawText('Match', {
    x: margin + 62,
    y,
    size: 32,
    font: helveticaBold,
    color: COLORS.white,
  })

  // Title
  y -= 35
  page.drawText('Technician Documentation Summary', {
    x: margin,
    y,
    size: 16,
    font: helvetica,
    color: COLORS.steelLight,
  })

  // Subtitle
  y -= 18
  page.drawText('Generated after profile acceptance', {
    x: margin,
    y,
    size: 10,
    font: helvetica,
    color: COLORS.steel,
  })

  // Status badge (right side of header)
  const badgeWidth = 80
  const badgeHeight = 28
  const badgeX = width - margin - badgeWidth
  const badgeY = height - 70
  
  page.drawRectangle({
    x: badgeX,
    y: badgeY,
    width: badgeWidth,
    height: badgeHeight,
    color: COLORS.greenLight,
    borderColor: COLORS.green,
    borderWidth: 1,
  })
  
  page.drawText('Pending', {
    x: badgeX + 18,
    y: badgeY + 9,
    size: 11,
    font: helveticaBold,
    color: COLORS.green,
  })

  // Reference ID and Date (right aligned)
  y = height - 100
  const refText = `Reference ID: ${data.referenceId}`
  const refWidth = helvetica.widthOfTextAtSize(refText, 10)
  page.drawText(refText, {
    x: width - margin - refWidth,
    y,
    size: 10,
    font: helveticaBold,
    color: COLORS.white,
  })

  y -= 14
  const dateText = `Date generated: ${data.generatedAt.toLocaleDateString('en-GB')}`
  const dateWidth = helvetica.widthOfTextAtSize(dateText, 9)
  page.drawText(dateText, {
    x: width - margin - dateWidth,
    y,
    size: 9,
    font: helvetica,
    color: COLORS.steel,
  })

  // Disclaimer
  y = height - 165
  page.drawText('Documents reviewed based on information provided by the technician.', {
    x: margin,
    y,
    size: 9,
    font: helvetica,
    color: COLORS.steel,
  })
  y -= 12
  page.drawText('AeroMatch does not replace operator or authority validation.', {
    x: margin,
    y,
    size: 9,
    font: helvetica,
    color: COLORS.steel,
  })

  // Info Cards Section
  y -= 40
  const cardWidth = (width - margin * 2 - 20) / 2
  const cardHeight = 70
  
  // License Card
  drawInfoCard(page, margin, y - cardHeight, cardWidth, cardHeight, 'License', 
    data.technician.licenseCategory.length > 0 
      ? `EASA Part-66 ${data.technician.licenseCategory.join(', ')}`
      : 'Not specified',
    helvetica, helveticaBold)

  // Type Ratings Card
  drawInfoCard(page, margin + cardWidth + 20, y - cardHeight, cardWidth, cardHeight, 'Type Ratings',
    data.technician.aircraftTypes.length > 0
      ? data.technician.aircraftTypes.slice(0, 4).join(' · ') + (data.technician.aircraftTypes.length > 4 ? ' ...' : '')
      : 'Not specified',
    helvetica, helveticaBold)

  y -= cardHeight + 20

  // Experience Card
  drawInfoCard(page, margin, y - cardHeight, cardWidth, cardHeight, 'Experience',
    data.technician.yearsExperience 
      ? `${data.technician.yearsExperience} years`
      : 'Not specified',
    helvetica, helveticaBold)

  // Availability Card
  drawInfoCard(page, margin + cardWidth + 20, y - cardHeight, cardWidth, cardHeight, 'Availability',
    data.technician.isAvailable ? 'READY TO WORK' : 'Not available',
    helvetica, helveticaBold, data.technician.isAvailable ? COLORS.green : COLORS.steel)

  y -= cardHeight + 40

  // Documents Overview Section
  page.drawText('Documents overview', {
    x: margin,
    y,
    size: 14,
    font: helveticaBold,
    color: COLORS.navy,
  })

  y -= 25

  // Document categories for quick overview
  const docCategories = [
    { label: 'License', types: ['easa_license', 'uk_license', 'faa_ap'] },
    { label: 'Type ratings', types: data.technician.aircraftTypes.flatMap(ac => [`type_${ac.toLowerCase().replace(/[^a-z0-9]/g, '_')}_theory`, `type_${ac.toLowerCase().replace(/[^a-z0-9]/g, '_')}_practical`]) },
    { label: 'Medical certificate', types: ['medical'] },
    { label: 'Passport / ID', types: ['passport'] },
    { label: 'Experience log', types: ['logbook', 'cv'] },
  ]

  // Quick overview chips
  const chipHeight = 24
  const chipGap = 10
  let chipX = margin

  for (const category of docCategories) {
    const hasDoc = data.documents.some(d => category.types.some(t => d.docType.includes(t) || d.docType === t))
    const chipWidth = helvetica.widthOfTextAtSize(category.label, 10) + 20
    
    if (chipX + chipWidth > width - margin) {
      chipX = margin
      y -= chipHeight + 8
    }

    page.drawRectangle({
      x: chipX,
      y: y - chipHeight,
      width: chipWidth,
      height: chipHeight,
      color: hasDoc ? rgb(0.9, 0.95, 0.9) : rgb(0.95, 0.95, 0.95),
      borderColor: hasDoc ? COLORS.green : COLORS.steel,
      borderWidth: 0.5,
    })

    page.drawText(category.label, {
      x: chipX + 10,
      y: y - chipHeight + 7,
      size: 10,
      font: helvetica,
      color: hasDoc ? COLORS.green : COLORS.steel,
    })

    chipX += chipWidth + chipGap
  }

  y -= chipHeight + 30

  // Documents Table
  page.drawText('DOCUMENTS STATUS', {
    x: margin,
    y,
    size: 11,
    font: helveticaBold,
    color: COLORS.navy,
  })

  y -= 20

  // Table header
  const col1Width = 300
  const col2Width = 100
  
  page.drawRectangle({
    x: margin,
    y: y - 20,
    width: width - margin * 2,
    height: 20,
    color: rgb(0.95, 0.95, 0.95),
  })

  page.drawText('Document', {
    x: margin + 10,
    y: y - 14,
    size: 9,
    font: helveticaBold,
    color: COLORS.navy,
  })

  page.drawText('Status', {
    x: margin + col1Width + 10,
    y: y - 14,
    size: 9,
    font: helveticaBold,
    color: COLORS.navy,
  })

  y -= 20

  // Table rows
  const rowHeight = 22
  for (const doc of data.documents.slice(0, 12)) {
    // Row background (alternating)
    const rowIndex = data.documents.indexOf(doc)
    if (rowIndex % 2 === 0) {
      page.drawRectangle({
        x: margin,
        y: y - rowHeight,
        width: width - margin * 2,
        height: rowHeight,
        color: rgb(0.98, 0.98, 0.98),
      })
    }

    // Document name
    page.drawText(getDocTypeLabel(doc.docType), {
      x: margin + 10,
      y: y - 15,
      size: 9,
      font: helvetica,
      color: COLORS.navy,
    })

    // Status
    const statusColor = doc.status === 'verified' ? COLORS.green : 
                       doc.status === 'uploaded' ? COLORS.gold : COLORS.steel
    page.drawText(getStatusLabel(doc.status), {
      x: margin + col1Width + 10,
      y: y - 15,
      size: 9,
      font: helveticaBold,
      color: statusColor,
    })

    y -= rowHeight

    if (y < 80) break // Don't overflow page
  }

  if (data.documents.length > 12) {
    y -= 15
    page.drawText(`+ ${data.documents.length - 12} more documents...`, {
      x: margin,
      y,
      size: 9,
      font: helvetica,
      color: COLORS.steel,
    })
  }

  // Footer
  page.drawRectangle({
    x: 0,
    y: 0,
    width,
    height: 40,
    color: COLORS.navy,
  })

  const footerText = `© ${new Date().getFullYear()} AeroMatch · aeromatch.eu`
  const footerWidth = helvetica.widthOfTextAtSize(footerText, 9)
  page.drawText(footerText, {
    x: (width - footerWidth) / 2,
    y: 15,
    size: 9,
    font: helvetica,
    color: COLORS.steel,
  })

  // Page number
  page.drawText('-- 1 of 1 --', {
    x: width - margin - 50,
    y: 15,
    size: 8,
    font: helvetica,
    color: COLORS.steel,
  })

  return await pdfDoc.save()
}

function drawInfoCard(
  page: any,
  x: number,
  y: number,
  width: number,
  height: number,
  title: string,
  value: string,
  font: any,
  fontBold: any,
  valueColor = COLORS.navy
) {
  // Card background
  page.drawRectangle({
    x,
    y,
    width,
    height,
    color: rgb(0.98, 0.98, 0.98),
    borderColor: rgb(0.9, 0.9, 0.9),
    borderWidth: 1,
  })

  // Title
  page.drawText(title, {
    x: x + 15,
    y: y + height - 22,
    size: 10,
    font: font,
    color: COLORS.steel,
  })

  // Value
  page.drawText(value, {
    x: x + 15,
    y: y + height - 45,
    size: 12,
    font: fontBold,
    color: valueColor,
  })
}

export type { CertificateData, TechnicianData, DocumentData }
