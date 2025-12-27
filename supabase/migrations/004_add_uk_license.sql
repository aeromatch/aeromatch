-- Add uk_license column to technicians table
ALTER TABLE technicians 
ADD COLUMN IF NOT EXISTS uk_license BOOLEAN DEFAULT FALSE;

-- Create index for faster filtering
CREATE INDEX IF NOT EXISTS idx_technicians_uk_license ON technicians(uk_license);

