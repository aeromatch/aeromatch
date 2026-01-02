-- Add rated column to job_requests if not exists
ALTER TABLE job_requests ADD COLUMN IF NOT EXISTS rated BOOLEAN DEFAULT false;

-- Add average_rating to technicians if not exists
ALTER TABLE technicians ADD COLUMN IF NOT EXISTS average_rating DECIMAL(2,1) DEFAULT NULL;

-- Create job_ratings table if not exists
CREATE TABLE IF NOT EXISTS job_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_request_id UUID REFERENCES job_requests(id) ON DELETE CASCADE,
  technician_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  overall_rating INTEGER NOT NULL CHECK (overall_rating >= 1 AND overall_rating <= 5),
  reliability_rating INTEGER CHECK (reliability_rating >= 1 AND reliability_rating <= 5),
  skills_match_rating INTEGER CHECK (skills_match_rating >= 1 AND skills_match_rating <= 5),
  communication_rating INTEGER CHECK (communication_rating >= 1 AND communication_rating <= 5),
  safety_compliance_rating INTEGER CHECK (safety_compliance_rating >= 1 AND safety_compliance_rating <= 5),
  private_comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(job_request_id, company_id) -- One rating per job per company
);

-- Create premium_grants table if not exists
CREATE TABLE IF NOT EXISTS premium_grants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  technician_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  reason TEXT NOT NULL,
  granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL
);

-- Enable RLS
ALTER TABLE job_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE premium_grants ENABLE ROW LEVEL SECURITY;

-- RLS policies for job_ratings
DROP POLICY IF EXISTS "Companies can insert ratings for their jobs" ON job_ratings;
CREATE POLICY "Companies can insert ratings for their jobs" ON job_ratings
  FOR INSERT WITH CHECK (
    company_id IN (SELECT id FROM companies WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Companies can view their ratings" ON job_ratings;
CREATE POLICY "Companies can view their ratings" ON job_ratings
  FOR SELECT USING (
    company_id IN (SELECT id FROM companies WHERE user_id = auth.uid())
    OR technician_id = auth.uid()
  );

DROP POLICY IF EXISTS "Technicians can view their ratings" ON job_ratings;
CREATE POLICY "Technicians can view their ratings" ON job_ratings
  FOR SELECT USING (technician_id = auth.uid());

-- RLS policies for premium_grants
DROP POLICY IF EXISTS "Users can view their own premium grants" ON premium_grants;
CREATE POLICY "Users can view their own premium grants" ON premium_grants
  FOR SELECT USING (technician_id = auth.uid());

DROP POLICY IF EXISTS "Service role can manage premium grants" ON premium_grants;
CREATE POLICY "Service role can manage premium grants" ON premium_grants
  FOR ALL USING (true);

