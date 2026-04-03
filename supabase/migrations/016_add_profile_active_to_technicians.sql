ALTER TABLE technicians
ADD COLUMN IF NOT EXISTS profile_active BOOLEAN DEFAULT true;

UPDATE technicians
SET profile_active = true
WHERE profile_active IS NULL;
