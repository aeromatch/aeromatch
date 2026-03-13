-- =====================================================
-- Migration 010: Contract Type Preferences & Additional Documents
-- =====================================================
-- Adds:
-- 1. contract_type_preference to technicians (short-term, long-term, both)
-- 2. Support for additional document types (logbook, cv)
-- =====================================================

-- Add contract type preference column to technicians
ALTER TABLE technicians 
ADD COLUMN IF NOT EXISTS contract_type_preference TEXT DEFAULT 'both'
  CHECK (contract_type_preference IN ('short-term', 'long-term', 'both'));

-- Add years_experience to technicians for AMX certificate
ALTER TABLE technicians 
ADD COLUMN IF NOT EXISTS years_experience INTEGER;

-- Add index for faster filtering by contract preference
CREATE INDEX IF NOT EXISTS idx_technicians_contract_pref ON technicians(contract_type_preference);

-- Comments for documentation
COMMENT ON COLUMN technicians.contract_type_preference IS 
'Preferred contract type: short-term, long-term, or both. Used for company search filtering.';

COMMENT ON COLUMN technicians.years_experience IS 
'Years of aviation maintenance experience. Used in AMX certificate.';

-- =====================================================
-- Note: Document types 'logbook' and 'cv' are supported
-- through the existing documents table structure.
-- No schema changes needed - just add handling in the app.
-- =====================================================

