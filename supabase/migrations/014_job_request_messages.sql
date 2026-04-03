-- Store editable messages exchanged around accepted jobs
ALTER TABLE job_requests
ADD COLUMN IF NOT EXISTS company_offer_message TEXT,
ADD COLUMN IF NOT EXISTS technician_presentation_message TEXT;

COMMENT ON COLUMN job_requests.company_offer_message IS
'Editable offer message authored by company when creating request.';

COMMENT ON COLUMN job_requests.technician_presentation_message IS
'Editable presentation message authored by technician when accepting request.';
