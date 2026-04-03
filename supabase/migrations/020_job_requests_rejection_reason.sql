ALTER TABLE public.job_requests
ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
