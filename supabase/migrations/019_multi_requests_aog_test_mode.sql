-- Multi-request flow, AOG fields, and test offers

ALTER TABLE public.job_requests
ADD COLUMN IF NOT EXISTS positions_needed INTEGER NOT NULL DEFAULT 1,
ADD COLUMN IF NOT EXISTS positions_filled INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS preference_order INTEGER NOT NULL DEFAULT 1,
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS is_aog BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS is_test BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS request_group_id UUID;

ALTER TABLE public.job_requests
DROP CONSTRAINT IF EXISTS job_requests_positions_needed_check;

ALTER TABLE public.job_requests
ADD CONSTRAINT job_requests_positions_needed_check
CHECK (positions_needed >= 1 AND positions_needed <= 10);

ALTER TABLE public.job_requests
DROP CONSTRAINT IF EXISTS job_requests_positions_filled_check;

ALTER TABLE public.job_requests
ADD CONSTRAINT job_requests_positions_filled_check
CHECK (positions_filled >= 0 AND positions_filled <= positions_needed);

ALTER TABLE public.job_requests
DROP CONSTRAINT IF EXISTS job_requests_preference_order_check;

ALTER TABLE public.job_requests
ADD CONSTRAINT job_requests_preference_order_check
CHECK (preference_order >= 1 AND preference_order <= 10);

CREATE INDEX IF NOT EXISTS idx_job_requests_group_order
  ON public.job_requests(request_group_id, preference_order);

CREATE INDEX IF NOT EXISTS idx_job_requests_expires_at
  ON public.job_requests(expires_at)
  WHERE status = 'pending';

ALTER TABLE public.technicians
ADD COLUMN IF NOT EXISTS aog_available BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS aog_location TEXT;
