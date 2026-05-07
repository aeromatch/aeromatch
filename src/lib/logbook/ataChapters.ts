// Catalogo ATA-100 (capitulos estandar de mantenimiento aeronautico).
// Lista resumida con los capitulos comunes que un tecnico EASA Part-66
// usaria al rellenar un logbook. Si necesitas mas, anade aqui sin tocar
// la API ni el formulario - se rellenan dinamicamente.

export type AtaChapter = {
  code: string
  description: string
}

export const ATA_CHAPTERS: AtaChapter[] = [
  { code: '00', description: 'General' },
  { code: '05', description: 'Time Limits / Maintenance Checks' },
  { code: '06', description: 'Dimensions and Areas' },
  { code: '07', description: 'Lifting and Shoring' },
  { code: '08', description: 'Leveling and Weighing' },
  { code: '09', description: 'Towing and Taxiing' },
  { code: '10', description: 'Parking, Mooring, Storage and Return to Service' },
  { code: '11', description: 'Placards and Markings' },
  { code: '12', description: 'Servicing' },
  { code: '20', description: 'Standard Practices - Airframe' },
  { code: '21', description: 'Air Conditioning' },
  { code: '22', description: 'Auto Flight' },
  { code: '23', description: 'Communications' },
  { code: '24', description: 'Electrical Power' },
  { code: '25', description: 'Equipment / Furnishings' },
  { code: '26', description: 'Fire Protection' },
  { code: '27', description: 'Flight Controls' },
  { code: '28', description: 'Fuel' },
  { code: '29', description: 'Hydraulic Power' },
  { code: '30', description: 'Ice and Rain Protection' },
  { code: '31', description: 'Indicating / Recording Systems' },
  { code: '32', description: 'Landing Gear' },
  { code: '33', description: 'Lights' },
  { code: '34', description: 'Navigation' },
  { code: '35', description: 'Oxygen' },
  { code: '36', description: 'Pneumatic' },
  { code: '38', description: 'Water / Waste' },
  { code: '45', description: 'Onboard Maintenance System' },
  { code: '46', description: 'Information Systems' },
  { code: '47', description: 'Inert Gas System' },
  { code: '49', description: 'Airborne Auxiliary Power (APU)' },
  { code: '50', description: 'Cargo and Accessory Compartments' },
  { code: '51', description: 'Standard Practices - Structures' },
  { code: '52', description: 'Doors' },
  { code: '53', description: 'Fuselage' },
  { code: '54', description: 'Nacelles / Pylons' },
  { code: '55', description: 'Stabilizers' },
  { code: '56', description: 'Windows' },
  { code: '57', description: 'Wings' },
  { code: '70', description: 'Standard Practices - Engines' },
  { code: '71', description: 'Power Plant' },
  { code: '72', description: 'Engine - Turbine / Turboprop' },
  { code: '73', description: 'Engine Fuel and Control' },
  { code: '74', description: 'Ignition' },
  { code: '75', description: 'Air' },
  { code: '76', description: 'Engine Controls' },
  { code: '77', description: 'Engine Indicating' },
  { code: '78', description: 'Exhaust' },
  { code: '79', description: 'Oil' },
  { code: '80', description: 'Starting' },
]

export function getAtaDescription(code: string): string {
  const c = ATA_CHAPTERS.find((a) => a.code === code)
  return c?.description ?? ''
}
