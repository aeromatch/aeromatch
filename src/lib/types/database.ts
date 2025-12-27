export type UserRole = 'technician' | 'company'

export interface Profile {
  id: string
  email: string
  full_name: string
  role: UserRole
  onboarding_completed: boolean
  created_at: string
}

export interface Technician {
  user_id: string
  license_category: string[]
  aircraft_types: string[]
  specialties: string[]
  own_tools: boolean
  right_to_work_uk: boolean
  passport_expiry: string | null
  driving_license: boolean
  languages: string[]
  min_daily_rate_eur: number | null
  visibility_anonymous: boolean
  is_available: boolean
  created_at: string
}

export interface Company {
  user_id: string
  company_name: string
  company_type: string
  hq_country: string
  tax_id: string | null
  website: string | null
  headquarters: string | null
  employee_count: string | null
  services: string[]
  aircraft_types: string[]
  hiring_needs: string | null
  urgent_positions: string | null
  preferred_licenses: string[]
  is_verified: boolean
  is_subscribed: boolean
  created_at: string
}

export interface AvailabilitySlot {
  id: string
  technician_id: string
  start_date: string
  end_date: string
  created_at: string
}

export interface Document {
  id: string
  technician_id: string
  doc_type: string
  status: 'uploaded' | 'verified' | 'rejected' | 'expired'
  storage_path: string
  expires_on: string | null
  created_at: string
}

export interface JobRequest {
  id: string
  company_id: string
  technician_id: string
  final_client_name: string
  work_location: string
  contract_type: 'short-term' | 'long-term'
  start_date: string
  end_date: string
  notes: string | null
  status: 'draft' | 'pending' | 'accepted' | 'rejected' | 'cancelled'
  created_at: string
  updated_at: string
}

