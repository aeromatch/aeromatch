-- Migration: Professional Features for AeroMatch V1
-- Adds audit logs, soft delete, document verification states, and consent tracking

-- ============================================
-- 1. AVAILABILITY SLOTS - Add missing columns
-- ============================================

-- Add status column if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'availability_slots' 
    AND column_name = 'status'
  ) THEN
    ALTER TABLE availability_slots ADD COLUMN status TEXT DEFAULT 'active';
  END IF;
END $$;

-- Add confirmed_at if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'availability_slots' 
    AND column_name = 'confirmed_at'
  ) THEN
    ALTER TABLE availability_slots ADD COLUMN confirmed_at TIMESTAMPTZ;
  END IF;
END $$;

-- Add soft delete column if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'availability_slots' 
    AND column_name = 'is_deleted'
  ) THEN
    ALTER TABLE availability_slots ADD COLUMN is_deleted BOOLEAN DEFAULT FALSE;
  END IF;
END $$;

-- Add deleted_at timestamp
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'availability_slots' 
    AND column_name = 'deleted_at'
  ) THEN
    ALTER TABLE availability_slots ADD COLUMN deleted_at TIMESTAMPTZ;
  END IF;
END $$;

-- ============================================
-- 2. DOCUMENTS - Verification states & soft delete
-- ============================================

-- Add verification columns
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'documents' 
    AND column_name = 'verified_at'
  ) THEN
    ALTER TABLE documents ADD COLUMN verified_at TIMESTAMPTZ;
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'documents' 
    AND column_name = 'verified_by'
  ) THEN
    ALTER TABLE documents ADD COLUMN verified_by UUID REFERENCES auth.users(id);
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'documents' 
    AND column_name = 'rejection_reason'
  ) THEN
    ALTER TABLE documents ADD COLUMN rejection_reason TEXT;
  END IF;
END $$;

-- Soft delete for documents
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'documents' 
    AND column_name = 'is_deleted'
  ) THEN
    ALTER TABLE documents ADD COLUMN is_deleted BOOLEAN DEFAULT FALSE;
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'documents' 
    AND column_name = 'deleted_at'
  ) THEN
    ALTER TABLE documents ADD COLUMN deleted_at TIMESTAMPTZ;
  END IF;
END $$;

-- ============================================
-- 3. AUDIT LOGS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  old_data JSONB,
  new_data JSONB,
  ip_address TEXT,
  user_agent TEXT,
  device_info TEXT,
  role TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);

-- ============================================
-- 4. USER CONSENT TRACKING
-- ============================================

CREATE TABLE IF NOT EXISTS user_consents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  consent_type TEXT NOT NULL, -- 'terms', 'privacy', 'marketing'
  consented BOOLEAN DEFAULT FALSE,
  consented_at TIMESTAMPTZ,
  ip_address TEXT,
  version TEXT, -- Version of terms consented to
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_user_consents_unique 
ON user_consents(user_id, consent_type);

-- ============================================
-- 5. RATE LIMITING TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier TEXT NOT NULL, -- IP or user_id
  action TEXT NOT NULL, -- 'login', 'signup', 'lead_form'
  attempts INTEGER DEFAULT 0,
  first_attempt_at TIMESTAMPTZ DEFAULT NOW(),
  last_attempt_at TIMESTAMPTZ DEFAULT NOW(),
  blocked_until TIMESTAMPTZ
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_rate_limits_unique 
ON rate_limits(identifier, action);

-- ============================================
-- 6. PROFILES - Add consent flag
-- ============================================

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' 
    AND column_name = 'terms_accepted'
  ) THEN
    ALTER TABLE profiles ADD COLUMN terms_accepted BOOLEAN DEFAULT FALSE;
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' 
    AND column_name = 'terms_accepted_at'
  ) THEN
    ALTER TABLE profiles ADD COLUMN terms_accepted_at TIMESTAMPTZ;
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' 
    AND column_name = 'email_verified'
  ) THEN
    ALTER TABLE profiles ADD COLUMN email_verified BOOLEAN DEFAULT FALSE;
  END IF;
END $$;

-- ============================================
-- 7. PREVIEW/DEMO USER
-- ============================================

CREATE TABLE IF NOT EXISTS preview_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  display_id TEXT UNIQUE NOT NULL, -- 'AMX-00023'
  profile_data JSONB NOT NULL,
  technician_data JSONB,
  availability_data JSONB,
  documents_data JSONB,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert sample preview user
INSERT INTO preview_profiles (display_id, profile_data, technician_data, availability_data, documents_data)
VALUES (
  'AMX-00023',
  '{
    "full_name": "Preview Technician",
    "role": "technician",
    "email": "preview@aeromatch.app"
  }'::jsonb,
  '{
    "license_category": ["B1.1", "B2"],
    "aircraft_types": ["A320", "A330", "B737"],
    "specialties": ["Line Maintenance", "Avionics"],
    "own_tools": true,
    "right_to_work_uk": true,
    "languages": ["English", "Spanish"],
    "is_available": true
  }'::jsonb,
  '[
    {"start_date": "2025-02-01", "end_date": "2025-03-31", "status": "active"},
    {"start_date": "2025-05-01", "end_date": "2025-06-30", "status": "active"}
  ]'::jsonb,
  '[
    {"doc_type": "easa_license", "status": "verified"},
    {"doc_type": "type_a320_theory", "status": "verified"},
    {"doc_type": "type_a320_practical", "status": "verified"},
    {"doc_type": "cert_hf", "status": "verified"}
  ]'::jsonb
)
ON CONFLICT (display_id) DO NOTHING;

-- ============================================
-- 8. RLS POLICIES for new tables
-- ============================================

-- Audit logs - only admins can read
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Audit logs are viewable by admins only" ON audit_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- User consents - users can see their own
ALTER TABLE user_consents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own consents" ON user_consents
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own consents" ON user_consents
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own consents" ON user_consents
  FOR UPDATE USING (auth.uid() = user_id);

-- Preview profiles - public read only
ALTER TABLE preview_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Preview profiles are publicly readable" ON preview_profiles
  FOR SELECT USING (is_active = true);

-- ============================================
-- 9. FUNCTION: Create audit log entry
-- ============================================

CREATE OR REPLACE FUNCTION create_audit_log(
  p_user_id UUID,
  p_action TEXT,
  p_entity_type TEXT,
  p_entity_id UUID DEFAULT NULL,
  p_old_data JSONB DEFAULT NULL,
  p_new_data JSONB DEFAULT NULL,
  p_role TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  new_id UUID;
BEGIN
  INSERT INTO audit_logs (user_id, action, entity_type, entity_id, old_data, new_data, role)
  VALUES (p_user_id, p_action, p_entity_type, p_entity_id, p_old_data, p_new_data, p_role)
  RETURNING id INTO new_id;
  
  RETURN new_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 10. FUNCTION: Check rate limit
-- ============================================

CREATE OR REPLACE FUNCTION check_rate_limit(
  p_identifier TEXT,
  p_action TEXT,
  p_max_attempts INTEGER DEFAULT 5,
  p_window_minutes INTEGER DEFAULT 15
)
RETURNS BOOLEAN AS $$
DECLARE
  current_record RECORD;
  window_start TIMESTAMPTZ;
BEGIN
  window_start := NOW() - (p_window_minutes || ' minutes')::INTERVAL;
  
  SELECT * INTO current_record
  FROM rate_limits
  WHERE identifier = p_identifier AND action = p_action;
  
  IF NOT FOUND THEN
    -- First attempt
    INSERT INTO rate_limits (identifier, action, attempts)
    VALUES (p_identifier, p_action, 1);
    RETURN TRUE;
  END IF;
  
  -- Check if blocked
  IF current_record.blocked_until IS NOT NULL AND current_record.blocked_until > NOW() THEN
    RETURN FALSE;
  END IF;
  
  -- Reset if outside window
  IF current_record.first_attempt_at < window_start THEN
    UPDATE rate_limits
    SET attempts = 1, first_attempt_at = NOW(), last_attempt_at = NOW(), blocked_until = NULL
    WHERE identifier = p_identifier AND action = p_action;
    RETURN TRUE;
  END IF;
  
  -- Increment attempt
  UPDATE rate_limits
  SET attempts = attempts + 1, last_attempt_at = NOW()
  WHERE identifier = p_identifier AND action = p_action;
  
  -- Check if exceeded
  IF current_record.attempts + 1 >= p_max_attempts THEN
    UPDATE rate_limits
    SET blocked_until = NOW() + (p_window_minutes || ' minutes')::INTERVAL
    WHERE identifier = p_identifier AND action = p_action;
    RETURN FALSE;
  END IF;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- Update existing rows with defaults
-- ============================================

UPDATE availability_slots 
SET status = 'active', is_deleted = FALSE 
WHERE status IS NULL;

UPDATE documents 
SET is_deleted = FALSE 
WHERE is_deleted IS NULL;

