-- Performance Advisor: unindexed foreign keys.
-- Anade un indice por cada FK sin cobertura para acelerar JOINs y
-- validacion de integridad en DELETE/UPDATE de la tabla referenciada.

CREATE INDEX IF NOT EXISTS idx_availability_slots_locked_by_request_id
  ON public.availability_slots (locked_by_request_id);

CREATE INDEX IF NOT EXISTS idx_billing_events_user_id
  ON public.billing_events (user_id);

CREATE INDEX IF NOT EXISTS idx_documents_verified_by
  ON public.documents (verified_by);

CREATE INDEX IF NOT EXISTS idx_jaw_company_user_id
  ON public.job_acceptance_workflow (company_user_id);

CREATE INDEX IF NOT EXISTS idx_jaw_umbrella_provider_id
  ON public.job_acceptance_workflow (umbrella_provider_id);

CREATE INDEX IF NOT EXISTS idx_job_ratings_company_user_id
  ON public.job_ratings (company_user_id);

CREATE INDEX IF NOT EXISTS idx_job_ratings_technician_user_id
  ON public.job_ratings (technician_user_id);

CREATE INDEX IF NOT EXISTS idx_logbook_entries_source_id
  ON public.logbook_entries (source_id);

CREATE INDEX IF NOT EXISTS idx_logbook_sources_job_id
  ON public.logbook_sources (job_id);

CREATE INDEX IF NOT EXISTS idx_mailing_history_sent_by
  ON public.mailing_history (sent_by);

CREATE INDEX IF NOT EXISTS idx_requests_technician_id
  ON public.requests (technician_id);

CREATE INDEX IF NOT EXISTS idx_umbrella_country_rec_provider_id
  ON public.umbrella_country_recommendations (umbrella_provider_id);
