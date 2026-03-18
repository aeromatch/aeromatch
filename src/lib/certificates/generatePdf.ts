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
  certificateStatus?: 'pending' | 'checked' | 'rejected'
}

const COLORS = {
  white: rgb(1, 1, 1),
  black: rgb(0.1, 0.1, 0.1),
  darkGray: rgb(0.2, 0.2, 0.2),
  gray: rgb(0.5, 0.5, 0.5),
  lightGray: rgb(0.7, 0.7, 0.7),
  gold: rgb(0.76, 0.6, 0.3),
  green: rgb(0.2, 0.65, 0.4),
  lineGray: rgb(0.85, 0.85, 0.85),
}

const DOC_CATEGORIES = [
  { key: 'license', label: 'License', types: ['easa_license', 'uk_license', 'faa_ap'] },
  { key: 'type_ratings', label: 'Type ratings', types: ['type_'] },
  { key: 'medical', label: 'Medical certificate', types: ['medical'] },
  { key: 'passport', label: 'Passport / ID', types: ['passport'] },
  { key: 'experience', label: 'Experience log', types: ['logbook', 'cv'] },
]

function getDocumentCategoryStatus(documents: DocumentData[], types: string[]): string {
  const matchingDocs = documents.filter(d => 
    types.some(t => t.endsWith('_') ? d.docType.startsWith(t) : d.docType === t)
  )
  
  if (matchingDocs.length === 0) return 'missing'
  if (matchingDocs.some(d => d.status === 'verified')) return 'verified'
  if (matchingDocs.some(d => d.status === 'uploaded')) return 'uploaded'
  return 'pending'
}

export async function generateCertificatePdf(data: CertificateData): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create()
  const page = pdfDoc.addPage([595.28, 841.89]) // A4
  
  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
  
  const { width, height } = page.getSize()
  const marginLeft = 50
  const marginRight = 50
  
  // White background
  page.drawRectangle({ x: 0, y: 0, width, height, color: COLORS.white })

  let y = height - 50

  // ========== HEADER ==========
  // Logo "A" triangle shape (simplified as text for now)
  page.drawText('A', {
    x: marginLeft,
    y: y - 5,
    size: 36,
    font: helveticaBold,
    color: COLORS.gold,
  })
  
  // "aeroMatch" text below logo
  y -= 45
  page.drawText('aeroMatch', {
    x: marginLeft,
    y,
    size: 11,
    font: helvetica,
    color: COLORS.gray,
  })

  // ========== TITLE SECTION ==========
  y -= 50
  page.drawText('Technician Documentation Summary', {
    x: marginLeft,
    y,
    size: 22,
    font: helveticaBold,
    color: COLORS.black,
  })

  y -= 22
  page.drawText('Generated after profile acceptance', {
    x: marginLeft,
    y,
    size: 11,
    font: helvetica,
    color: COLORS.gray,
  })

  // Status badge on right side
  const badgeX = width - marginRight - 80
  const badgeY = y + 15
  
  // "DOCUMENTS STATUS" label
  page.drawText('DOCUMENTS STATUS', {
    x: badgeX,
    y: badgeY + 25,
    size: 7,
    font: helveticaBold,
    color: COLORS.lightGray,
  })
  
  // Status value
  const statusText = data.certificateStatus === 'checked' ? 'Checked' : 
                     data.certificateStatus === 'rejected' ? 'Rejected' : 'Pending'
  const statusColor = data.certificateStatus === 'checked' ? COLORS.green : 
                      data.certificateStatus === 'rejected' ? rgb(0.8, 0.2, 0.2) : COLORS.gold
  
  page.drawText(statusText, {
    x: badgeX + 20,
    y: badgeY,
    size: 12,
    font: helveticaBold,
    color: statusColor,
  })

  // ========== INFO SECTION ==========
  y -= 50
  
  // License
  page.drawText('License', {
    x: marginLeft + 20,
    y,
    size: 10,
    font: helveticaBold,
    color: COLORS.gray,
  })
  y -= 16
  const licenseText = data.technician.licenseCategory.length > 0 
    ? `EASA Part-66 ${data.technician.licenseCategory.join(', ')}`
    : 'Not specified'
  page.drawText(licenseText, {
    x: marginLeft + 20,
    y,
    size: 11,
    font: helvetica,
    color: COLORS.darkGray,
  })

  // Type Ratings
  y -= 30
  page.drawText('Type Ratings', {
    x: marginLeft + 20,
    y,
    size: 10,
    font: helveticaBold,
    color: COLORS.gray,
  })
  y -= 16
  const typeRatingsText = data.technician.aircraftTypes.length > 0 
    ? data.technician.aircraftTypes.join(' · ')
    : 'Not specified'
  // Truncate if too long
  const truncatedTypeRatings = typeRatingsText.length > 60 
    ? typeRatingsText.substring(0, 57) + '...' 
    : typeRatingsText
  page.drawText(truncatedTypeRatings, {
    x: marginLeft + 20,
    y,
    size: 11,
    font: helvetica,
    color: COLORS.gold,
  })

  // Experience
  y -= 30
  page.drawText('Experience', {
    x: marginLeft + 20,
    y,
    size: 10,
    font: helveticaBold,
    color: COLORS.gray,
  })
  y -= 16
  const experienceText = data.technician.yearsExperience 
    ? `${data.technician.yearsExperience} years`
    : 'Not specified'
  page.drawText(experienceText, {
    x: marginLeft + 20,
    y,
    size: 11,
    font: helvetica,
    color: COLORS.darkGray,
  })

  // Availability
  y -= 30
  page.drawText('Availability', {
    x: marginLeft + 20,
    y,
    size: 10,
    font: helveticaBold,
    color: COLORS.gray,
  })
  y -= 16
  const availabilityText = data.technician.isAvailable ? 'READY TO WORK' : 'Not available'
  const availabilityColor = data.technician.isAvailable ? COLORS.green : COLORS.gray
  page.drawText(availabilityText, {
    x: marginLeft + 20,
    y,
    size: 11,
    font: helveticaBold,
    color: availabilityColor,
  })

  // ========== DOCUMENTS OVERVIEW ==========
  y -= 50
  page.drawText('Documents overview', {
    x: marginLeft,
    y,
    size: 14,
    font: helveticaBold,
    color: COLORS.black,
  })

  // Table header
  y -= 35
  const colDocument = marginLeft + 60
  const colStatus = width - marginRight - 100
  
  page.drawText('Document', {
    x: colDocument,
    y,
    size: 10,
    font: helveticaBold,
    color: COLORS.gray,
  })
  page.drawText('Status', {
    x: colStatus,
    y,
    size: 10,
    font: helveticaBold,
    color: COLORS.gray,
  })

  // Table rows
  y -= 10
  for (const category of DOC_CATEGORIES) {
    y -= 25
    
    // Document name
    page.drawText(category.label, {
      x: colDocument,
      y,
      size: 10,
      font: helvetica,
      color: COLORS.darkGray,
    })
    
    // Status
    const catStatus = getDocumentCategoryStatus(data.documents, category.types)
    let statusLabel = 'Missing'
    let statusLabelColor = COLORS.lightGray
    
    if (catStatus === 'verified') {
      statusLabel = 'Checked'
      statusLabelColor = COLORS.green
    } else if (catStatus === 'uploaded') {
      statusLabel = 'Uploaded'
      statusLabelColor = COLORS.gold
    } else if (catStatus === 'pending') {
      statusLabel = 'Pending'
      statusLabelColor = COLORS.gold
    }
    
    page.drawText(statusLabel, {
      x: colStatus,
      y,
      size: 10,
      font: helvetica,
      color: statusLabelColor,
    })
  }

  // ========== FOOTER ==========
  // Disclaimer line
  const disclaimerY = 100
  page.drawLine({
    start: { x: marginLeft, y: disclaimerY + 20 },
    end: { x: width - marginRight, y: disclaimerY + 20 },
    thickness: 0.5,
    color: COLORS.lineGray,
  })

  // Disclaimer text centered
  const disclaimer1 = 'Documents reviewed based on information provided by the technician.'
  const disclaimer2 = 'AeroMatch does not replace operator or authority validation.'
  
  const disclaimer1Width = helvetica.widthOfTextAtSize(disclaimer1, 9)
  const disclaimer2Width = helvetica.widthOfTextAtSize(disclaimer2, 9)
  
  page.drawText(disclaimer1, {
    x: (width - disclaimer1Width) / 2,
    y: disclaimerY,
    size: 9,
    font: helvetica,
    color: COLORS.lightGray,
  })
  page.drawText(disclaimer2, {
    x: (width - disclaimer2Width) / 2,
    y: disclaimerY - 14,
    size: 9,
    font: helvetica,
    color: COLORS.lightGray,
  })

  // Reference ID and Date at bottom left
  page.drawText(`Reference ID: ${data.referenceId}`, {
    x: marginLeft,
    y: 45,
    size: 9,
    font: helvetica,
    color: COLORS.gray,
  })
  
  const dateStr = data.generatedAt.toLocaleDateString('en-GB')
  page.drawText(`Date generated: ${dateStr}`, {
    x: marginLeft,
    y: 30,
    size: 9,
    font: helvetica,
    color: COLORS.gray,
  })

  return await pdfDoc.save()
}

export type { CertificateData, TechnicianData, DocumentData }
