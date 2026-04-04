import { PDFDocument, PDFImage, PDFPage, PDFFont, rgb, StandardFonts } from 'pdf-lib'
import fs from 'fs'
import path from 'path'
import QRCode from 'qrcode'
import type { AmxCertificateDocumentRow } from '@/lib/certificates/expectedAmxDocuments'

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
  /** UUID de `amx_certificates` (QR de verificación). */
  certificateId?: string
  technician: TechnicianData
  documents: DocumentData[]
  /** Tabla AMX: EASA, logbook, TR por avión (tres niveles). Si viene, sustituye la vista legacy de `documents`. */
  amxDocumentRows?: AmxCertificateDocumentRow[]
  generatedAt: Date
  certificateStatus?: 'pending' | 'checked' | 'rejected'
  /** Huella compuesta de `file_hash` de documentos (certificado checked). */
  documentIntegrity?: {
    fullFingerprintHex: string
    verifiedAt: Date
  }
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

/** Estados documento en certificado AMX (pdf-lib) */
const AMX_TIER_RGB = {
  checked: rgb(0.2, 0.65, 0.4),
  pending: rgb(0.83, 0.63, 0.15),
  not_uploaded: rgb(0.8, 0.45, 0.1),
} as const

const PAGE_WIDTH = 595.28  // A4 width in points
const PAGE_HEIGHT = 841.89 // A4 height in points
const MARGIN = 24 * 2.83465 // 24mm
/** Equilibrio legibilidad / una página cuando sea posible */
const HEADER_H = 58
const FOOTER_H_CHECKED = 118
const FOOTER_H_PLAIN = 40
const BODY_BOTTOM_PAD = 16 // hueco mínimo sobre la banda del pie

// Document type labels (alineado con profile/documents: licencias, cert_*, adicionales)
const DOC_TYPE_LABELS: Record<string, string> = {
  easa_license: 'EASA Part-66 License',
  uk_license: 'UK CAA License',
  faa_ap: 'FAA A&P License',
  passport: 'Passport / ID',
  cv: 'CV / Resume',
  medical: 'Medical certificate',
  training: 'Training Certificate',
  logbook: 'Technical Logbook',
  driving_license_doc: 'Driving license',
  avsaf: 'AVSAF',
  other_additional: 'Other documents',
}

/** Subclaves `cert_${key}` en perfil (HF, EWIS, FTS, etc.) */
const CERT_SUBLABELS: Record<string, string> = {
  hf: 'Cert HF',
  ewis: 'Cert EWIS',
  fts: 'Cert FTS',
  rvsm: 'Cert RVSM',
  etops: 'Cert ETOPS',
  tank_entry: 'Cert Tank Entry',
  dangerous_goods: 'Cert Dangerous Goods',
  sms: 'Cert SMS',
}

function getDocTypeLabel(docType: string): string {
  if (docType.startsWith('type_') && docType.endsWith('_theory')) {
    return 'Type ratings certificates'
  }
  if (docType.startsWith('type_') && docType.endsWith('_practical')) {
    return 'Type ratings certificates'
  }
  if (docType.startsWith('cert_')) {
    const sub = docType.slice(5)
    if (CERT_SUBLABELS[sub]) {
      return CERT_SUBLABELS[sub]
    }
    return `Cert ${sub.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}`
  }
  return DOC_TYPE_LABELS[docType] || docType.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

/** Línea base del texto para centrarlo ópticamente en un rectángulo (Helvetica / similar). */
function baselineInRect(rectBottom: number, rectHeight: number, fontSize: number): number {
  return rectBottom + rectHeight / 2 - fontSize * 0.38
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
  let page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT])
  
  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
  
  const { width, height } = page.getSize()

  /** Pie con QR solo si certificado verificado (tiene UUID); huella opcional si aún no hay hashes en BD. */
  const hasIntegrityFingerprint = !!(
    data.certificateStatus === 'checked' &&
    data.documentIntegrity?.fullFingerprintHex &&
    data.documentIntegrity.fullFingerprintHex.length > 0
  )
  const showFooterVerification = data.certificateStatus === 'checked' && !!data.certificateId
  const footerHeight = showFooterVerification ? FOOTER_H_CHECKED : FOOTER_H_PLAIN
  /** Límite inferior del cuerpo: el pie reserva zona del QR; no dibujar texto encima después. */
  const contentBottomY = footerHeight + BODY_BOTTOM_PAD
  
  // Load images
  const logoImage = await loadImage(pdfDoc, 'logo-certificate.png')

  const drawFooterBackgroundBand = (p: typeof page) => {
    const pw = p.getSize().width
    p.drawRectangle({
      x: 0, y: 0, width: pw, height: footerHeight,
      color: COLORS.lightBg,
    })
    p.drawLine({
      start: { x: 0, y: footerHeight },
      end: { x: pw, y: footerHeight },
      thickness: 0.5,
      color: COLORS.border,
    })
  }

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

  // Fondo del pie ANTES del contenido: si va después, el rectángulo opaco tapa nombre/secciones/documentos.
  drawFooterBackgroundBand(page)

  // ═══════════════════════════════════════════════════════════════════════════
  // NAVY HEADER
  // ═══════════════════════════════════════════════════════════════════════════
  const headerHeight = HEADER_H
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
    const logoHeight = 28
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
    x: width - MARGIN - helvetica.widthOfTextAtSize('TECHNICIAN DOCUMENTATION SUMMARY', 7),
    y: height - 20,
    size: 7,
    font: helvetica,
    color: COLORS.steel200,
  })
  page.drawText('Generated after profile acceptance', {
    x: width - MARGIN - helvetica.widthOfTextAtSize('Generated after profile acceptance', 7),
    y: height - 31,
    size: 7,
    font: helvetica,
    color: COLORS.gold300,
  })

  // ═══════════════════════════════════════════════════════════════════════════
  // CONTENT
  // ═══════════════════════════════════════════════════════════════════════════
  let y = height - headerHeight - 18

  // Name
  page.drawText(data.technician.fullName || 'Unknown Technician', {
    x: MARGIN,
    y,
    size: 18,
    font: helveticaBold,
    color: COLORS.navy950,
  })
  y -= 21

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
  y -= 14

  // Divider line
  page.drawLine({
    start: { x: MARGIN, y },
    end: { x: width - MARGIN, y },
    thickness: 0.5,
    color: COLORS.border,
  })
  y -= 16

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
    return yPos - 13
  }

  // Helper to draw pills
  const drawPills = (
    items: string[],
    yPos: number,
    bgColor: any,
    textColor: any,
    borderColor?: any,
    textFont: PDFFont = helvetica
  ): number => {
    const pillHeight = 15
    const fontSize = 8
    const paddingX = 8
    const gapH = 5
    const gapV = 5
    let x = MARGIN
    let currentY = yPos

    for (const item of items) {
      const textWidth = textFont.widthOfTextAtSize(item, fontSize)
      const pillWidth = textWidth + paddingX * 2

      if (x + pillWidth > width - MARGIN) {
        x = MARGIN
        currentY -= (pillHeight + gapV)
      }

      const rectBottom = currentY - 4

      // Draw pill background
      page.drawRectangle({
        x,
        y: rectBottom,
        width: pillWidth,
        height: pillHeight,
        color: bgColor,
        borderColor: borderColor,
        borderWidth: borderColor ? 0.6 : 0,
      })

      // Draw pill text (centrado verticalmente en el recuadro)
      page.drawText(item, {
        x: x + paddingX,
        y: baselineInRect(rectBottom, pillHeight, fontSize),
        size: fontSize,
        font: textFont,
        color: textColor,
      })

      x += pillWidth + gapH
    }

    return currentY - pillHeight - 10
  }

  // LICENCES
  if (data.technician.licenseCategory && data.technician.licenseCategory.length > 0) {
    y = drawSectionLabel('LICENCES', y)
    y = drawPills(data.technician.licenseCategory, y, COLORS.navy950, COLORS.steel100, undefined, helveticaBold)
  }

  // TYPE RATINGS
  if (data.technician.aircraftTypes && data.technician.aircraftTypes.length > 0) {
    y = drawSectionLabel('TYPE RATINGS', y)
    y = drawPills(data.technician.aircraftTypes, y, COLORS.lightBg, COLORS.navy950, COLORS.border)
  }

  // EXPERIENCE (0 años es válido; no usar truthy)
  if (data.technician.yearsExperience != null) {
    y = drawSectionLabel('EXPERIENCE', y)
    page.drawText(`${data.technician.yearsExperience} years`, {
      x: MARGIN,
      y,
      size: 10,
      font: helvetica,
      color: COLORS.body,
    })
    y -= 17
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
    y -= 17
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
  const colStatusLegacy = width - MARGIN - 82
  const rowAdvance = 16
  const rowAdvanceAmx = 18
  const colStatusXAmx = 248
  const amxRows = data.amxDocumentRows

  // Helvetica/WinAnsi no codifica emoji (⏳ ✓ ⚠); usar ASCII para pdf-lib
  const tierSymbol = (row: AmxCertificateDocumentRow) =>
    row.icon === 'check' ? '+' : row.icon === 'hourglass' ? '*' : '!'

  const tierStatusLabel = (tier: AmxCertificateDocumentRow['tier']) =>
    tier === 'checked' ? 'CHECKED' : tier === 'pending' ? 'PENDING' : 'NOT UPLOADED'

  const drawAmxTableHeaders = (p: typeof page, yHeader: number, pw: number): number => {
    let yy = yHeader
    const detailLabel = 'Detail'
    const detailW = helveticaBold.widthOfTextAtSize(detailLabel, 7.5)
    p.drawText('Document', {
      x: MARGIN,
      y: yy,
      size: 7.5,
      font: helveticaBold,
      color: COLORS.muted,
    })
    p.drawText('Status', {
      x: colStatusXAmx,
      y: yy,
      size: 7.5,
      font: helveticaBold,
      color: COLORS.muted,
    })
    p.drawText(detailLabel, {
      x: pw - MARGIN - detailW,
      y: yy,
      size: 7.5,
      font: helveticaBold,
      color: COLORS.muted,
    })
    yy -= 7
    p.drawLine({
      start: { x: MARGIN, y: yy },
      end: { x: pw - MARGIN, y: yy },
      thickness: 0.5,
      color: COLORS.border,
    })
    return yy - 12
  }

  const startAmxContinuationPage = (withTableHeaders: boolean): number => {
    page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT])
    const pw = page.getSize().width
    const ph = page.getSize().height
    page.drawRectangle({
      x: 0, y: 0, width: pw, height: ph,
      color: COLORS.white,
    })
    page.drawRectangle({
      x: 0, y: 0, width: 3.5, height: ph,
      color: COLORS.gold500,
    })
    drawFooterBackgroundBand(page)
    page.drawText('Documents overview (continued)', {
      x: MARGIN,
      y: ph - 34,
      size: 9,
      font: helveticaBold,
      color: COLORS.navy950,
    })
    let yy = ph - 54
    if (withTableHeaders) {
      yy = drawAmxTableHeaders(page, yy, pw)
    }
    return yy
  }

  if (amxRows && amxRows.length > 0) {
    const docBlockMinHeight = 32 + 22 + Math.max(amxRows.length, 1) * rowAdvanceAmx

    y -= 8
    if (y < contentBottomY + docBlockMinHeight) {
      y = startAmxContinuationPage(false)
    }

    page.drawLine({
      start: { x: MARGIN, y },
      end: { x: width - MARGIN, y },
      thickness: 0.5,
      color: COLORS.border,
    })
    y -= 14

    page.drawText('Documents overview', {
      x: MARGIN,
      y,
      size: 11,
      font: helveticaBold,
      color: COLORS.navy950,
    })
    y -= 16

    y = drawAmxTableHeaders(page, y, width)

    for (const row of amxRows) {
      if (y < contentBottomY + rowAdvanceAmx) {
        y = startAmxContinuationPage(true)
      }
      const tierColor = AMX_TIER_RGB[row.tier]
      const sym = tierSymbol(row)
      const stLabel = tierStatusLabel(row.tier)
      page.drawText(sym, {
        x: MARGIN,
        y,
        size: 9,
        font: helvetica,
        color: tierColor,
      })
      page.drawText(row.label, {
        x: MARGIN + 12,
        y,
        size: 9,
        font: helvetica,
        color: COLORS.body,
      })
      page.drawText(stLabel, {
        x: colStatusXAmx,
        y,
        size: 8,
        font: helveticaBold,
        color: tierColor,
      })
      const detailW = helvetica.widthOfTextAtSize(row.detail, 8)
      page.drawText(row.detail, {
        x: width - MARGIN - detailW,
        y,
        size: 8,
        font: helvetica,
        color: COLORS.steel600,
      })
      y -= 4
      page.drawLine({
        start: { x: MARGIN, y },
        end: { x: width - MARGIN, y },
        thickness: 0.3,
        color: rgb(0.91, 0.925, 0.94),
      })
      y -= rowAdvanceAmx - 4
    }
  } else {
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

    const docGroups = new Map<string, { name: string; status: string }>()
    for (const doc of data.documents) {
      const label = getDocTypeLabel(doc.docType)
      const existing = docGroups.get(label)
      if (!existing || (existing.status === 'checked' && doc.status !== 'checked')) {
        docGroups.set(label, { name: label, status: doc.status })
      }
    }
    const docBlockMinHeight = 32 + 18 + Math.max(docGroups.size, 1) * rowAdvance

    const drawDocTableHeaders = (p: typeof page, yHeader: number): number => {
      let yy = yHeader
      p.drawText('Document', {
        x: MARGIN,
        y: yy,
        size: 7.5,
        font: helveticaBold,
        color: COLORS.muted,
      })
      p.drawText('Status', {
        x: colStatusLegacy,
        y: yy,
        size: 7.5,
        font: helveticaBold,
        color: COLORS.muted,
      })
      yy -= 7
      p.drawLine({
        start: { x: MARGIN, y: yy },
        end: { x: width - MARGIN, y: yy },
        thickness: 0.5,
        color: COLORS.border,
      })
      return yy - 12
    }

    const startDocContinuationPage = (withTableHeaders: boolean): number => {
      page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT])
      const pw = page.getSize().width
      const ph = page.getSize().height
      page.drawRectangle({
        x: 0, y: 0, width: pw, height: ph,
        color: COLORS.white,
      })
      page.drawRectangle({
        x: 0, y: 0, width: 3.5, height: ph,
        color: COLORS.gold500,
      })
      drawFooterBackgroundBand(page)
      page.drawText('Documents overview (continued)', {
        x: MARGIN,
        y: ph - 34,
        size: 9,
        font: helveticaBold,
        color: COLORS.navy950,
      })
      let yy = ph - 54
      if (withTableHeaders) {
        yy = drawDocTableHeaders(page, yy)
      }
      return yy
    }

    y -= 8
    if (y < contentBottomY + docBlockMinHeight) {
      y = startDocContinuationPage(false)
    }

    page.drawLine({
      start: { x: MARGIN, y },
      end: { x: width - MARGIN, y },
      thickness: 0.5,
      color: COLORS.border,
    })
    y -= 14

    page.drawText('Documents overview', {
      x: MARGIN,
      y,
      size: 11,
      font: helveticaBold,
      color: COLORS.navy950,
    })
    y -= 16

    page.drawText('Document', {
      x: MARGIN,
      y,
      size: 7.5,
      font: helveticaBold,
      color: COLORS.muted,
    })
    page.drawText('Status', {
      x: colStatusLegacy,
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
    y -= 12

    const getStatusConfig = (status: string) => {
      switch (status) {
        case 'verified':
        case 'checked':
          return { label: 'Checked', color: COLORS.success500, bg: COLORS.successBg }
        case 'uploaded':
        case 'pending_verification':
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

    for (const docName of docOrder) {
      const doc = docGroups.get(docName)
      if (doc && !drawnDocs.has(docName)) {
        if (y < contentBottomY + rowAdvance) {
          y = startDocContinuationPage(true)
        }
        drawnDocs.add(docName)
        const config = getStatusConfig(doc.status)

        page.drawText(doc.name, {
          x: MARGIN,
          y,
          size: 9,
          font: helvetica,
          color: COLORS.body,
        })

        const statusFontSize = 8
        const statusH = 14
        const statusRectBottom = y - 3
        const statusWidth = helveticaBold.widthOfTextAtSize(config.label, statusFontSize) + 14
        page.drawRectangle({
          x: colStatusLegacy - 2,
          y: statusRectBottom,
          width: statusWidth,
          height: statusH,
          color: config.bg,
          borderColor: COLORS.border,
          borderWidth: 0.35,
        })
        page.drawText(config.label, {
          x: colStatusLegacy + 6,
          y: baselineInRect(statusRectBottom, statusH, statusFontSize),
          size: statusFontSize,
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
        y -= 12
      }
    }

    const remainingNames = Array.from(docGroups.keys())
      .filter((n) => !drawnDocs.has(n))
      .sort((a, b) => a.localeCompare(b, 'en'))
    for (const docName of remainingNames) {
      const doc = docGroups.get(docName)!
      if (y < contentBottomY + rowAdvance) {
        y = startDocContinuationPage(true)
      }
      drawnDocs.add(docName)
      const config = getStatusConfig(doc.status)

      page.drawText(doc.name, {
        x: MARGIN,
        y,
        size: 9,
        font: helvetica,
        color: COLORS.body,
      })

      const statusFontSize = 8
      const statusH = 14
      const statusRectBottom = y - 3
      const statusWidth = helveticaBold.widthOfTextAtSize(config.label, statusFontSize) + 14
      page.drawRectangle({
        x: colStatusLegacy - 2,
        y: statusRectBottom,
        width: statusWidth,
        height: statusH,
        color: config.bg,
        borderColor: COLORS.border,
        borderWidth: 0.35,
      })
      page.drawText(config.label, {
        x: colStatusLegacy + 6,
        y: baselineInRect(statusRectBottom, statusH, statusFontSize),
        size: statusFontSize,
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
      y -= 12
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // FOOTER: mismo pie completo (QR + textos + página) en TODAS las hojas
  // ═══════════════════════════════════════════════════════════════════════════
  const disclaimer1 = 'Documents reviewed based on information provided by the technician.'
  const disclaimer2 = 'AeroMatch does not replace operator or authority validation.'

  let qrEmbedded: PDFImage | null = null
  if (showFooterVerification && data.certificateId) {
    const verifyUrl = `https://aeromatch.eu/certificates/${data.certificateId}/verify`
    const qrBuffer = await QRCode.toBuffer(verifyUrl, { type: 'png', width: 200, margin: 1 })
    qrEmbedded = await pdfDoc.embedPng(qrBuffer)
  }

  const totalPages = pdfDoc.getPageCount()
  const qrSize = 46
  const qrY = 46
  const lineY0 = 92

  const drawFooterOnPage = (p: PDFPage, pageNum: number) => {
    const footW = p.getSize().width

    if (showFooterVerification && data.certificateId && qrEmbedded) {
      p.drawImage(qrEmbedded, {
        x: MARGIN,
        y: qrY,
        width: qrSize,
        height: qrSize,
      })

      const textX = MARGIN + qrSize + 10
      let lineY = lineY0
      if (hasIntegrityFingerprint && data.documentIntegrity) {
        const full = data.documentIntegrity.fullFingerprintHex
        const hashDisplay =
          full.length > 24 ? `${full.slice(0, 16)}...${full.slice(-8)}` : full
        const dateVerified = data.documentIntegrity.verifiedAt.toLocaleDateString('en-GB', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        })
        p.drawText('INTEGRIDAD DOCUMENTAL', {
          x: textX,
          y: lineY,
          size: 7.5,
          font: helveticaBold,
          color: COLORS.navy950,
        })
        lineY -= 10
        p.drawText(hashDisplay, {
          x: textX,
          y: lineY,
          size: 7,
          font: helvetica,
          color: COLORS.body,
        })
        lineY -= 9
        p.drawText(`Verified: ${dateVerified}`, {
          x: textX,
          y: lineY,
          size: 7,
          font: helvetica,
          color: COLORS.steel600,
        })
        lineY -= 9
      } else {
        p.drawText('Verificación en línea', {
          x: textX,
          y: lineY,
          size: 7.5,
          font: helveticaBold,
          color: COLORS.navy950,
        })
        lineY -= 10
        p.drawText('Escanea el código o visita el enlace de verificación.', {
          x: textX,
          y: lineY,
          size: 7,
          font: helvetica,
          color: COLORS.body,
        })
        lineY -= 9
      }
      p.drawText('aeromatch.eu/verify', {
        x: textX,
        y: lineY,
        size: 6.5,
        font: helvetica,
        color: COLORS.steel600,
      })
    }

    const d1y = showFooterVerification ? 36 : 34
    const d2y = showFooterVerification ? 27 : 25

    p.drawText(disclaimer1, {
      x: (footW - helvetica.widthOfTextAtSize(disclaimer1, 6.8)) / 2,
      y: d1y,
      size: 6.8,
      font: helvetica,
      color: COLORS.muted,
    })
    p.drawText(disclaimer2, {
      x: (footW - helvetica.widthOfTextAtSize(disclaimer2, 6.8)) / 2,
      y: d2y,
      size: 6.8,
      font: helvetica,
      color: COLORS.muted,
    })

    const pageLabel = `${pageNum} / ${totalPages}`
    const pageLabelW = helvetica.widthOfTextAtSize(pageLabel, 7)
    p.drawText(pageLabel, {
      x: (footW - pageLabelW) / 2,
      y: 18,
      size: 7,
      font: helvetica,
      color: COLORS.steel600,
    })

    const refLeft = `Reference ID: ${data.referenceId}     Date generated: ${dateStr}`
    p.drawText(refLeft, {
      x: MARGIN,
      y: 10,
      size: 7,
      font: helvetica,
      color: COLORS.steel600,
    })

    p.drawText('aeromatch.eu', {
      x: footW - MARGIN - helveticaBold.widthOfTextAtSize('aeromatch.eu', 7),
      y: 10,
      size: 7,
      font: helveticaBold,
      color: COLORS.gold500,
    })
  }

  for (let i = 0; i < totalPages; i++) {
    drawFooterOnPage(pdfDoc.getPage(i), i + 1)
  }

  return await pdfDoc.save()
}

export type { CertificateData, TechnicianData, DocumentData, AmxCertificateDocumentRow }
