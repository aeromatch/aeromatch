-- AeroMatch Database Schema
-- Run this in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  role TEXT CHECK (role IN ('technician', 'company')),
  onboarding_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Technicians table
CREATE TABLE IF NOT EXISTS technicians (
  user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  license_category TEXT[] DEFAULT '{}',
  aircraft_types TEXT[] DEFAULT '{}',
  specialties TEXT[] DEFAULT '{}',
  own_tools BOOLEAN DEFAULT FALSE,
  right_to_work_uk BOOLEAN DEFAULT FALSE,
  uk_license BOOLEAN DEFAULT FALSE,
  passport_expiry DATE,
  driving_license BOOLEAN DEFAULT FALSE,
  languages TEXT[] DEFAULT '{}',
  min_daily_rate_eur INTEGER,
  visibility_anonymous BOOLEAN DEFAULT TRUE,
  is_available BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Companies table
CREATE TABLE IF NOT EXISTS companies (
  user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  company_type TEXT NOT NULL,
  hq_country TEXT NOT NULL,
  tax_id TEXT,
  website TEXT,
  headquarters TEXT,
  employee_count TEXT,
  services TEXT[] DEFAULT '{}',
  aircraft_types TEXT[] DEFAULT '{}',
  hiring_needs TEXT,
  urgent_positions TEXT,
  preferred_licenses TEXT[] DEFAULT '{}',
  is_verified BOOLEAN DEFAULT FALSE,
  is_subscribed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Availability slots
CREATE TABLE IF NOT EXISTS availability_slots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  technician_id UUID NOT NULL REFERENCES technicians(user_id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CHECK (end_date >= start_date)
);

-- Documents
CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  technician_id UUID NOT NULL REFERENCES technicians(user_id) ON DELETE CASCADE,
  doc_type TEXT NOT NULL,
  status TEXT DEFAULT 'uploaded' CHECK (status IN ('uploaded', 'verified', 'rejected', 'expired')),
  storage_path TEXT NOT NULL,
  expires_on DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(technician_id, doc_type)
);

-- Job requests
CREATE TABLE IF NOT EXISTS job_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  technician_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  final_client_name TEXT NOT NULL,
  work_location TEXT NOT NULL,
  contract_type TEXT DEFAULT 'short-term' CHECK (contract_type IN ('short-term', 'long-term')),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  notes TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('draft', 'pending', 'accepted', 'rejected', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_technicians_available ON technicians(is_available);
CREATE INDEX IF NOT EXISTS idx_technicians_uk_license ON technicians(uk_license);
CREATE INDEX IF NOT EXISTS idx_availability_dates ON availability_slots(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_job_requests_technician ON job_requests(technician_id);
CREATE INDEX IF NOT EXISTS idx_job_requests_company ON job_requests(company_id);
CREATE INDEX IF NOT EXISTS idx_job_requests_status ON job_requests(status);

-- Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE technicians ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE availability_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_requests ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Technicians policies
CREATE POLICY "Users can view own technician profile" ON technicians
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own technician profile" ON technicians
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own technician profile" ON technicians
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Companies can view available technicians" ON technicians
  FOR SELECT USING (
    is_available = true OR auth.uid() = user_id
  );

-- Companies policies
CREATE POLICY "Users can view own company" ON companies
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own company" ON companies
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own company" ON companies
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Availability slots policies
CREATE POLICY "Users can view own availability" ON availability_slots
  FOR SELECT USING (auth.uid() = technician_id);

CREATE POLICY "Users can manage own availability" ON availability_slots
  FOR ALL USING (auth.uid() = technician_id);

CREATE POLICY "Companies can view technician availability" ON availability_slots
  FOR SELECT USING (true);

-- Documents policies
CREATE POLICY "Users can view own documents" ON documents
  FOR SELECT USING (auth.uid() = technician_id);

CREATE POLICY "Users can manage own documents" ON documents
  FOR ALL USING (auth.uid() = technician_id);

-- Job requests policies
CREATE POLICY "Technicians can view their requests" ON job_requests
  FOR SELECT USING (auth.uid() = technician_id);

CREATE POLICY "Companies can view their requests" ON job_requests
  FOR SELECT USING (auth.uid() = company_id);

CREATE POLICY "Companies can create requests" ON job_requests
  FOR INSERT WITH CHECK (auth.uid() = company_id);

CREATE POLICY "Users can update relevant requests" ON job_requests
  FOR UPDATE USING (auth.uid() = technician_id OR auth.uid() = company_id);

-- Storage bucket for documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', false)
ON CONFLICT DO NOTHING;

-- Storage policies
CREATE POLICY "Users can upload own documents" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'documents' AND 
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can view own documents" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'documents' AND 
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can delete own documents" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'documents' AND 
    (storage.foldername(name))[1] = auth.uid()::text
  );

