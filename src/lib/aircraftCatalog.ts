// AeroMatch Aircraft Catalog - Unified list for technicians and companies

export interface AircraftGroup {
  key: string
  label: { en: string; es: string }
  icon: string
  aircraft: string[]
}

export const AIRCRAFT_CATALOG: AircraftGroup[] = [
  {
    key: 'airbus',
    label: { en: 'Airbus', es: 'Airbus' },
    icon: '🇪🇺',
    aircraft: [
      'A220-100',
      'A220-300',
      'A318',
      'A319',
      'A320',
      'A320neo',
      'A321',
      'A321neo',
      'A321XLR',
      'A330-200',
      'A330-300',
      'A330neo',
      'A340-300',
      'A340-500',
      'A340-600',
      'A350-900',
      'A350-1000',
      'A380',
    ],
  },
  {
    key: 'boeing',
    label: { en: 'Boeing', es: 'Boeing' },
    icon: '🇺🇸',
    aircraft: [
      'B717',
      'B737-700',
      'B737-800',
      'B737-900',
      'B737 MAX 8',
      'B737 MAX 9',
      'B747-400',
      'B747-8',
      'B757-200',
      'B757-300',
      'B767-200',
      'B767-300',
      'B767-400',
      'B777-200',
      'B777-300',
      'B777X',
      'B787-8',
      'B787-9',
      'B787-10',
    ],
  },
  {
    key: 'embraer',
    label: { en: 'Embraer', es: 'Embraer' },
    icon: '🇧🇷',
    aircraft: [
      'ERJ 135',
      'ERJ 145',
      'E170',
      'E175',
      'E175-E2',
      'E190',
      'E190-E2',
      'E195',
      'E195-E2',
    ],
  },
  {
    key: 'atr',
    label: { en: 'ATR', es: 'ATR' },
    icon: '🇫🇷',
    aircraft: [
      'ATR 42-300',
      'ATR 42-500',
      'ATR 42-600',
      'ATR 72-200',
      'ATR 72-500',
      'ATR 72-600',
    ],
  },
  {
    key: 'bombardier',
    label: { en: 'Bombardier/De Havilland', es: 'Bombardier/De Havilland' },
    icon: '🇨🇦',
    aircraft: [
      'CRJ 100/200',
      'CRJ 700',
      'CRJ 900',
      'CRJ 1000',
      'Dash 8-100',
      'Dash 8-300',
      'Dash 8 Q400',
      'Challenger 300',
      'Challenger 350',
      'Challenger 604',
      'Challenger 650',
      'Global 5000',
      'Global 6000',
      'Global 7500',
    ],
  },
  {
    key: 'helicopters',
    label: { en: 'Helicopters', es: 'Helicópteros' },
    icon: '🚁',
    aircraft: [
      // Airbus Helicopters
      'H125 (AS350)',
      'H130 (EC130)',
      'H135 (EC135)',
      'H145 (EC145)',
      'H155 (EC155)',
      'H160',
      'H175 (EC175)',
      'H215 (AS332)',
      'H225 (EC225)',
      // Leonardo
      'AW109',
      'AW119',
      'AW139',
      'AW169',
      'AW189',
      // Bell
      'Bell 206',
      'Bell 212',
      'Bell 407',
      'Bell 412',
      'Bell 429',
      'Bell 505',
      'Bell 525',
      // Sikorsky
      'S-76',
      'S-92',
      // MD Helicopters
      'MD 500',
      'MD 902',
    ],
  },
  {
    key: 'business',
    label: { en: 'Business Jets', es: 'Jets Privados' },
    icon: '✈️',
    aircraft: [
      // Gulfstream
      'Gulfstream G280',
      'Gulfstream G450',
      'Gulfstream G500',
      'Gulfstream G550',
      'Gulfstream G600',
      'Gulfstream G650',
      'Gulfstream G700',
      // Dassault Falcon
      'Falcon 900',
      'Falcon 2000',
      'Falcon 7X',
      'Falcon 8X',
      'Falcon 6X',
      // Cessna Citation
      'Citation M2',
      'Citation CJ3+',
      'Citation CJ4',
      'Citation XLS+',
      'Citation Sovereign+',
      'Citation Latitude',
      'Citation Longitude',
      // Learjet
      'Learjet 45',
      'Learjet 60',
      'Learjet 75',
      // Embraer Business
      'Phenom 100',
      'Phenom 300',
      'Praetor 500',
      'Praetor 600',
      'Legacy 450',
      'Legacy 500',
      'Legacy 600',
      'Legacy 650',
      // Bombardier Business
      'Learjet 70/75',
    ],
  },
  {
    key: 'other',
    label: { en: 'Other European', es: 'Otros Europeos' },
    icon: '📋',
    aircraft: [
      'SAAB 340',
      'SAAB 2000',
      'Fokker 50',
      'Fokker 70',
      'Fokker 100',
      'BAe 146',
      'Avro RJ70',
      'Avro RJ85',
      'Avro RJ100',
      'Dornier 328',
      'Dornier 328JET',
      'Let L-410',
      'Custom/Other',
    ],
  },
]

// Flattened list for easy search
export const ALL_AIRCRAFT = AIRCRAFT_CATALOG.flatMap(group => group.aircraft)

// Search function
export function searchAircraft(query: string): string[] {
  if (!query) return ALL_AIRCRAFT
  const lowerQuery = query.toLowerCase()
  return ALL_AIRCRAFT.filter(aircraft => 
    aircraft.toLowerCase().includes(lowerQuery)
  )
}

// Get aircraft by group key
export function getAircraftByGroup(groupKey: string): string[] {
  const group = AIRCRAFT_CATALOG.find(g => g.key === groupKey)
  return group?.aircraft || []
}

// Get group label
export function getGroupLabel(groupKey: string, language: 'en' | 'es'): string {
  const group = AIRCRAFT_CATALOG.find(g => g.key === groupKey)
  return group?.label[language] || groupKey
}

// Specialties list - including Sheet Metal
export const SPECIALTIES = [
  'Line Maintenance',
  'Base Maintenance',
  'Heavy Checks',
  'A Checks',
  'C Checks',
  'D Checks',
  'Engine',
  'APU',
  'Avionics',
  'Structures',
  'Sheet Metal',
  'Composites',
  'NDT',
  'Borescope',
  'Hydraulics',
  'Pneumatics',
  'Fuel Systems',
  'Landing Gear',
  'Electrical',
  'Interior',
  'Paint',
  'Cabin Crew Seats',
  'Emergency Equipment',
  'Flight Controls',
  'AOG Support',
]

// License categories
export const LICENSE_CATEGORIES = [
  'A',
  'B1.1',
  'B1.2', 
  'B1.3',
  'B1.4',
  'B2',
  'B2L',
  'B3',
  'C',
]

// Languages commonly spoken in EU aviation
export const LANGUAGES_LIST = [
  'English',
  'Español',
  'Français',
  'Deutsch',
  'Italiano',
  'Português',
  'Polski',
  'Nederlands',
  'Română',
  'Čeština',
  'Magyar',
  'Ελληνικά',
  'Svenska',
  'Suomi',
  'Dansk',
  'Norsk',
  'العربية',
  '中文',
]

