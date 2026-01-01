-- ============================================
-- RATINGS & FOUNDING PREMIUM GRANTS
-- Run this in Supabase SQL Editor
-- ============================================

-- 1) PREMIUM GRANTS TABLE
-- For Founding Premium and future promotional grants
CREATE TABLE IF NOT EXISTS premium_grants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  grant_type TEXT NOT NULL, -- 'founding_profile_complete', etc.
  granted_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  snapshot JSONB, -- Store requirements met, cutoff date used, etc.
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, grant_type)
);

-- Index for quick lookups
CREATE INDEX IF NOT EXISTS idx_premium_grants_user ON premium_grants(user_id);
CREATE INDEX IF NOT EXISTS idx_premium_grants_expires ON premium_grants(expires_at);

-- RLS for premium_grants
ALTER TABLE premium_grants ENABLE ROW LEVEL SECURITY;

-- Users can read their own grants
CREATE POLICY "Users can read own premium grants" ON premium_grants
  FOR SELECT USING (auth.uid() = user_id);

-- Only service role can insert/update (server-side)


-- 2) JOB RATINGS TABLE
CREATE TABLE IF NOT EXISTS job_ratings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_request_id UUID NOT NULL REFERENCES job_requests(id) ON DELETE CASCADE,
  rater_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE, -- Company
  rated_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE, -- Technician
  overall INTEGER NOT NULL CHECK (overall >= 1 AND overall <= 5),
  reliability INTEGER CHECK (reliability >= 1 AND reliability <= 5),
  skills_match INTEGER CHECK (skills_match >= 1 AND skills_match <= 5),
  communication INTEGER CHECK (communication >= 1 AND communication <= 5),
  safety_compliance INTEGER CHECK (safety_compliance >= 1 AND safety_compliance <= 5),
  private_comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(job_request_id, rater_user_id, rated_user_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_job_ratings_job ON job_ratings(job_request_id);
CREATE INDEX IF NOT EXISTS idx_job_ratings_rater ON job_ratings(rater_user_id);
CREATE INDEX IF NOT EXISTS idx_job_ratings_rated ON job_ratings(rated_user_id);

-- RLS for job_ratings
ALTER TABLE job_ratings ENABLE ROW LEVEL SECURITY;

-- Rated technician can view their ratings
CREATE POLICY "Technicians can view their ratings" ON job_ratings
  FOR SELECT USING (auth.uid() = rated_user_id);

-- Rater company can view ratings they submitted
CREATE POLICY "Companies can view ratings they submitted" ON job_ratings
  FOR SELECT USING (auth.uid() = rater_user_id);

-- Only service role can insert (server-side API)


-- 3) ADD 'completed' STATUS TO JOB REQUESTS (if not exists)
-- Check if 'completed' is already in the status check constraint
DO $$
BEGIN
  -- Try to add completed to status options
  ALTER TABLE job_requests DROP CONSTRAINT IF EXISTS job_requests_status_check;
  ALTER TABLE job_requests ADD CONSTRAINT job_requests_status_check 
    CHECK (status IN ('pending', 'accepted', 'rejected', 'completed', 'cancelled'));
EXCEPTION
  WHEN others THEN
    -- Constraint might not exist or have different name, continue
    NULL;
END
$$;

-- Add completed_at column if not exists
ALTER TABLE job_requests ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;
ALTER TABLE job_requests ADD COLUMN IF NOT EXISTS rated BOOLEAN DEFAULT FALSE;

