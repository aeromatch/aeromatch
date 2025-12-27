-- Add index on documents table for faster lookups by technician and doc_type
-- This improves query performance when loading documents for a specific technician

CREATE INDEX IF NOT EXISTS idx_documents_tech_type 
ON public.documents(technician_id, doc_type);

-- Add index on documents for status filtering
CREATE INDEX IF NOT EXISTS idx_documents_status 
ON public.documents(status);

-- Add index on availability_slots for faster date range queries
CREATE INDEX IF NOT EXISTS idx_availability_slots_dates 
ON public.availability_slots(technician_id, start_date, end_date);

-- Add file_name column to documents if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'documents' 
    AND column_name = 'file_name'
  ) THEN
    ALTER TABLE documents ADD COLUMN file_name TEXT;
  END IF;
END $$;

-- Add extra_label column to documents for type rating extras
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'documents' 
    AND column_name = 'extra_label'
  ) THEN
    ALTER TABLE documents ADD COLUMN extra_label TEXT;
  END IF;
END $$;

