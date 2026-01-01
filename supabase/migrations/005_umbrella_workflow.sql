-- ============================================
-- UMBRELLA WORKFLOW MIGRATION
-- Run this in Supabase SQL Editor
-- ============================================

-- 1) UMBRELLA PROVIDERS TABLE
-- Stores umbrella company information
CREATE TABLE IF NOT EXISTS umbrella_providers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  website_url TEXT,
  contact_email TEXT,
  countries TEXT[] DEFAULT '{}', -- ISO country codes supported
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2) UMBRELLA COUNTRY RECOMMENDATIONS
-- Maps countries to recommended umbrella providers with priority
CREATE TABLE IF NOT EXISTS umbrella_country_recommendations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  country_code TEXT NOT NULL, -- ISO code (ES, GB, DE, etc.)
  umbrella_provider_id UUID NOT NULL REFERENCES umbrella_providers(id) ON DELETE CASCADE,
  priority INT DEFAULT 1, -- Lower = higher priority
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(country_code, umbrella_provider_id)
);

-- 3) JOB ACCEPTANCE WORKFLOW
-- Stores technician's work arrangement selection for accepted jobs
CREATE TABLE IF NOT EXISTS job_acceptance_workflow (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_request_id UUID NOT NULL UNIQUE REFERENCES job_requests(id) ON DELETE CASCADE,
  technician_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  company_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  work_mode TEXT NOT NULL CHECK (work_mode IN ('self_employed', 'umbrella', 'umbrella_with_insurance')),
  umbrella_provider_id UUID REFERENCES umbrella_providers(id),
  payout_bank_account TEXT, -- IBAN or bank account
  payout_details_json JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4) ADD COUNTRY CODE TO JOB REQUESTS (if not exists)
-- This helps determine which umbrella providers to recommend
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'job_requests' AND column_name = 'country_code'
  ) THEN
    ALTER TABLE job_requests ADD COLUMN country_code TEXT DEFAULT 'ES';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'job_requests' AND column_name = 'daily_rate_gross'
  ) THEN
    ALTER TABLE job_requests ADD COLUMN daily_rate_gross DECIMAL(10,2);
  END IF;
END $$;

-- 5) INDEXES
CREATE INDEX IF NOT EXISTS idx_umbrella_country_rec_country ON umbrella_country_recommendations(country_code);
CREATE INDEX IF NOT EXISTS idx_umbrella_country_rec_priority ON umbrella_country_recommendations(priority);
CREATE INDEX IF NOT EXISTS idx_job_acceptance_workflow_job ON job_acceptance_workflow(job_request_id);
CREATE INDEX IF NOT EXISTS idx_job_acceptance_workflow_tech ON job_acceptance_workflow(technician_user_id);

-- 6) ROW LEVEL SECURITY
ALTER TABLE umbrella_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE umbrella_country_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_acceptance_workflow ENABLE ROW LEVEL SECURITY;

-- Umbrella providers: Anyone can read active providers
CREATE POLICY "Anyone can read active umbrella providers" ON umbrella_providers
  FOR SELECT USING (is_active = true);

-- Umbrella country recommendations: Anyone can read active recommendations
CREATE POLICY "Anyone can read active umbrella recommendations" ON umbrella_country_recommendations
  FOR SELECT USING (is_active = true);

-- Job acceptance workflow: Technician can read/write their own rows
CREATE POLICY "Technicians can manage their acceptance workflow" ON job_acceptance_workflow
  FOR ALL USING (auth.uid() = technician_user_id);

-- Companies can read acceptance workflow for their job requests (after acceptance)
CREATE POLICY "Companies can read accepted job workflows" ON job_acceptance_workflow
  FOR SELECT USING (
    auth.uid() = company_user_id
    AND EXISTS (
      SELECT 1 FROM job_requests jr 
      WHERE jr.id = job_acceptance_workflow.job_request_id 
      AND jr.status = 'accepted'
    )
  );

-- ============================================
-- SEED DATA: UMBRELLA PROVIDERS
-- ============================================

-- UK-focused umbrellas
INSERT INTO umbrella_providers (name, website_url, contact_email, countries, description) VALUES
('Parasol Group', 'https://www.parasolgroup.co.uk', 'info@parasolgroup.co.uk', ARRAY['GB'], 'Leading UK umbrella company for contractors'),
('Umbrella Company UK', 'https://www.umbrellacompanyuk.co.uk', 'enquiries@umbrellacompanyuk.co.uk', ARRAY['GB'], 'Specialist umbrella services for aviation contractors'),
('Giant Group', 'https://www.giantgroup.com', 'hello@giantgroup.com', ARRAY['GB', 'IE'], 'UK and Ireland umbrella and payroll solutions')
ON CONFLICT DO NOTHING;

-- EU/Spain focused
INSERT INTO umbrella_providers (name, website_url, contact_email, countries, description) VALUES
('PayFit', 'https://payfit.com', 'support@payfit.com', ARRAY['ES', 'FR', 'DE'], 'European payroll and HR platform'),
('Deel', 'https://www.deel.com', 'support@deel.com', ARRAY['ES', 'FR', 'DE', 'GB', 'PT', 'IT', 'NL'], 'Global contractor management and EoR'),
('Remote.com', 'https://remote.com', 'support@remote.com', ARRAY['ES', 'FR', 'DE', 'GB', 'PT', 'IT', 'NL', 'BE'], 'International employment and contractor payments')
ON CONFLICT DO NOTHING;

-- Global EoR providers
INSERT INTO umbrella_providers (name, website_url, contact_email, countries, description) VALUES
('Papaya Global', 'https://www.papayaglobal.com', 'info@papayaglobal.com', ARRAY['GLOBAL'], 'Global workforce payments platform'),
('Velocity Global', 'https://velocityglobal.com', 'info@velocityglobal.com', ARRAY['GLOBAL'], 'International Employer of Record'),
('Oyster HR', 'https://www.oysterhr.com', 'hello@oysterhr.com', ARRAY['GLOBAL'], 'Global employment platform for distributed teams')
ON CONFLICT DO NOTHING;

-- ============================================
-- SEED DATA: COUNTRY RECOMMENDATIONS
-- ============================================

-- UK recommendations
INSERT INTO umbrella_country_recommendations (country_code, umbrella_provider_id, priority)
SELECT 'GB', id, 1 FROM umbrella_providers WHERE name = 'Parasol Group'
ON CONFLICT DO NOTHING;

INSERT INTO umbrella_country_recommendations (country_code, umbrella_provider_id, priority)
SELECT 'GB', id, 2 FROM umbrella_providers WHERE name = 'Umbrella Company UK'
ON CONFLICT DO NOTHING;

INSERT INTO umbrella_country_recommendations (country_code, umbrella_provider_id, priority)
SELECT 'GB', id, 3 FROM umbrella_providers WHERE name = 'Giant Group'
ON CONFLICT DO NOTHING;

-- Spain recommendations
INSERT INTO umbrella_country_recommendations (country_code, umbrella_provider_id, priority)
SELECT 'ES', id, 1 FROM umbrella_providers WHERE name = 'Deel'
ON CONFLICT DO NOTHING;

INSERT INTO umbrella_country_recommendations (country_code, umbrella_provider_id, priority)
SELECT 'ES', id, 2 FROM umbrella_providers WHERE name = 'Remote.com'
ON CONFLICT DO NOTHING;

INSERT INTO umbrella_country_recommendations (country_code, umbrella_provider_id, priority)
SELECT 'ES', id, 3 FROM umbrella_providers WHERE name = 'PayFit'
ON CONFLICT DO NOTHING;

-- Germany recommendations
INSERT INTO umbrella_country_recommendations (country_code, umbrella_provider_id, priority)
SELECT 'DE', id, 1 FROM umbrella_providers WHERE name = 'Deel'
ON CONFLICT DO NOTHING;

INSERT INTO umbrella_country_recommendations (country_code, umbrella_provider_id, priority)
SELECT 'DE', id, 2 FROM umbrella_providers WHERE name = 'Remote.com'
ON CONFLICT DO NOTHING;

-- France recommendations
INSERT INTO umbrella_country_recommendations (country_code, umbrella_provider_id, priority)
SELECT 'FR', id, 1 FROM umbrella_providers WHERE name = 'PayFit'
ON CONFLICT DO NOTHING;

INSERT INTO umbrella_country_recommendations (country_code, umbrella_provider_id, priority)
SELECT 'FR', id, 2 FROM umbrella_providers WHERE name = 'Deel'
ON CONFLICT DO NOTHING;

-- Ireland recommendations
INSERT INTO umbrella_country_recommendations (country_code, umbrella_provider_id, priority)
SELECT 'IE', id, 1 FROM umbrella_providers WHERE name = 'Giant Group'
ON CONFLICT DO NOTHING;

INSERT INTO umbrella_country_recommendations (country_code, umbrella_provider_id, priority)
SELECT 'IE', id, 2 FROM umbrella_providers WHERE name = 'Deel'
ON CONFLICT DO NOTHING;

-- Global fallback (for countries without specific recommendations)
INSERT INTO umbrella_country_recommendations (country_code, umbrella_provider_id, priority)
SELECT 'GLOBAL', id, 1 FROM umbrella_providers WHERE name = 'Deel'
ON CONFLICT DO NOTHING;

INSERT INTO umbrella_country_recommendations (country_code, umbrella_provider_id, priority)
SELECT 'GLOBAL', id, 2 FROM umbrella_providers WHERE name = 'Remote.com'
ON CONFLICT DO NOTHING;

INSERT INTO umbrella_country_recommendations (country_code, umbrella_provider_id, priority)
SELECT 'GLOBAL', id, 3 FROM umbrella_providers WHERE name = 'Papaya Global'
ON CONFLICT DO NOTHING;

INSERT INTO umbrella_country_recommendations (country_code, umbrella_provider_id, priority)
SELECT 'GLOBAL', id, 4 FROM umbrella_providers WHERE name = 'Oyster HR'
ON CONFLICT DO NOTHING;

