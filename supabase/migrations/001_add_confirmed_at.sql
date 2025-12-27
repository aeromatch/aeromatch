-- Add confirmed_at column to availability_slots for freshness tracking
-- This migration is safe to run multiple times

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'availability_slots' 
    AND column_name = 'confirmed_at'
  ) THEN
    ALTER TABLE availability_slots ADD COLUMN confirmed_at TIMESTAMPTZ DEFAULT NOW();
  END IF;
END $$;

-- Update existing rows to have a confirmed_at value
UPDATE availability_slots 
SET confirmed_at = created_at 
WHERE confirmed_at IS NULL;

