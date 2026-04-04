/** Documentos mínimos para contratación: licencia + logbook + cursos HF/EWIS/FTS */

export const BASIC_LICENSE_DOC_TYPES = ['easa_license', 'uk_license', 'faa_ap'] as const

export const MANDATORY_COURSE_DOC_TYPES = ['cert_hf', 'cert_ewis', 'cert_fts'] as const

export function hasBasicLicenseDoc(documentTypes: string[]): boolean {
  return BASIC_LICENSE_DOC_TYPES.some((t) => documentTypes.includes(t))
}

export function hasLogbookDoc(documentTypes: string[]): boolean {
  return documentTypes.includes('logbook')
}

export function hasMandatoryCourseDocs(documentTypes: string[]): boolean {
  return MANDATORY_COURSE_DOC_TYPES.every((t) => documentTypes.includes(t))
}

/** Licencia + logbook + HF/EWIS/FTS (sin habilitaciones por avión aquí). */
export function hasCoreContractDocuments(documentTypes: string[]): boolean {
  return hasBasicLicenseDoc(documentTypes) && hasLogbookDoc(documentTypes) && hasMandatoryCourseDocs(documentTypes)
}
