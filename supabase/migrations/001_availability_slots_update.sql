-- Migration: Add confirmed_at and status to availability_slots
-- Run this in Supabase SQL Editor

-- Add confirmed_at column if not exists
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

-- Add status column if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'availability_slots' 
    AND column_name = 'status'
  ) THEN
    ALTER TABLE availability_slots ADD COLUMN status TEXT DEFAULT 'pending';
  END IF;
END $$;

-- Update existing rows: set confirmed_at to created_at if null
UPDATE availability_slots 
SET confirmed_at = COALESCE(confirmed_at, created_at),
    status = COALESCE(status, 'confirmed')
WHERE confirmed_at IS NULL OR status IS NULL;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_availability_slots_confirmed 
ON availability_slots(technician_id, confirmed_at);

