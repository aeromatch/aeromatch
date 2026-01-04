-- Add requires_right_to_work_uk column to job_requests
ALTER TABLE job_requests 
ADD COLUMN IF NOT EXISTS requires_right_to_work_uk BOOLEAN DEFAULT false;

-- Add UK eligibility fields to job_acceptance_workflow
ALTER TABLE job_acceptance_workflow
ADD COLUMN IF NOT EXISTS uk_eligibility_mode TEXT CHECK (uk_eligibility_mode IN ('not_required', 'umbrella', 'self_arranged'));

ALTER TABLE job_acceptance_workflow
ADD COLUMN IF NOT EXISTS uk_eligibility_acknowledged BOOLEAN DEFAULT false;

-- Comment for clarity
COMMENT ON COLUMN job_requests.requires_right_to_work_uk IS 'Whether this job requires legal Right to Work in the UK';
COMMENT ON COLUMN job_acceptance_workflow.uk_eligibility_mode IS 'How the technician will handle UK eligibility: not_required (has RTW), umbrella (via provider), self_arranged (will arrange independently)';

