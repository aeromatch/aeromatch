-- =====================================================
-- Migration 009: Two-Level Verification System
-- =====================================================
-- This migration adds verification states for technicians:
-- - verification_status: unverified | pending | verified | rejected
-- - availability_status: hidden | available_unverified | available_verified
--
-- Verified technicians appear first in search results and can accept offers.
-- Unverified technicians appear in results but cannot accept offers.
-- =====================================================

-- Add verification columns to technicians table
ALTER TABLE technicians 
ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'unverified' 
  CHECK (verification_status IN ('unverified', 'pending', 'verified', 'rejected'));

ALTER TABLE technicians 
ADD COLUMN IF NOT EXISTS availability_status TEXT DEFAULT 'hidden'
  CHECK (availability_status IN ('hidden', 'available_unverified', 'available_verified'));

-- Add verified_at timestamp for audit
ALTER TABLE technicians 
ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ;

-- Add verification_notes for admin use (rejection reasons, etc.)
ALTER TABLE technicians 
ADD COLUMN IF NOT EXISTS verification_notes TEXT;

-- =====================================================
-- Migrate existing users based on current state
-- =====================================================

-- Users with documents and is_available = true become available_unverified
UPDATE technicians 
SET availability_status = 'available_unverified',
    verification_status = 'unverified'
WHERE is_available = true 
  AND availability_status = 'hidden';

-- Users with is_available = false stay hidden
UPDATE technicians 
SET availability_status = 'hidden'
WHERE is_available = false 
  AND availability_status IS NULL;

-- =====================================================
-- RLS Policies for Document Visibility
-- =====================================================

-- Documents should only be visible to:
-- 1. The technician themselves (always)
-- 2. Companies ONLY if technician is verified AND in context of a job request

-- Drop existing policy if it exists (safe recreation)
DROP POLICY IF EXISTS "documents_company_view_verified" ON documents;

-- Companies can only see documents of verified technicians they have active requests with
CREATE POLICY "documents_company_view_verified" ON documents
FOR SELECT
TO authenticated
USING (
  -- Owner can always see their own documents
  technician_id = auth.uid()
  OR
  -- Companies can see documents of VERIFIED technicians they have job requests with
  (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'company'
    )
    AND EXISTS (
      SELECT 1 FROM technicians t 
      WHERE t.user_id = documents.technician_id 
      AND t.verification_status = 'verified'
    )
    AND EXISTS (
      SELECT 1 FROM job_requests jr 
      WHERE jr.company_id = auth.uid() 
      AND jr.technician_id = documents.technician_id
      AND jr.status IN ('pending', 'accepted')
    )
  )
);

-- =====================================================
-- Index for faster verified-first queries
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_technicians_verification_status 
ON technicians(verification_status);

CREATE INDEX IF NOT EXISTS idx_technicians_availability_status 
ON technicians(availability_status);

-- Composite index for search queries (verified first, then unverified)
CREATE INDEX IF NOT EXISTS idx_technicians_search_ranking 
ON technicians(availability_status, verification_status, is_available);

-- =====================================================
-- Comments for documentation
-- =====================================================

COMMENT ON COLUMN technicians.verification_status IS 
'Verification state: unverified (default), pending (docs submitted), verified (AMX approved), rejected';

COMMENT ON COLUMN technicians.availability_status IS 
'Visibility state: hidden (not in search), available_unverified (visible, cannot accept), available_verified (visible, can accept)';

COMMENT ON COLUMN technicians.verified_at IS 
'Timestamp when verification was approved';

COMMENT ON COLUMN technicians.verification_notes IS 
'Internal notes from admin about verification status (e.g., rejection reason)';




