-- logBook360: jobs, fuentes, entradas, análisis agregado (JSON)

CREATE TABLE IF NOT EXISTS public.logbook_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  technician_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending',
  -- pending | processing | completed | failed
  source_filename text,
  storage_path text,
  source_pages integer,
  source_system text,
  source_system_label text,
  error_message text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.logbook_sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  technician_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  job_id uuid REFERENCES public.logbook_jobs(id) ON DELETE SET NULL,
  source_system text NOT NULL,
  source_system_label text NOT NULL,
  source_filename text,
  source_pages integer,
  entries_count integer DEFAULT 0,
  date_from date,
  date_to date,
  uploaded_at timestamptz DEFAULT now()
);

-- Dedup: wo_number y ata_chapter nunca NULL en aplicación (vacío = '')
CREATE TABLE IF NOT EXISTS public.logbook_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  technician_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  source_id uuid REFERENCES public.logbook_sources(id) ON DELETE CASCADE,
  entry_date date NOT NULL,
  ac_registration text,
  ac_type text,
  ac_type_raw text,
  ata_chapter text NOT NULL DEFAULT '',
  ata_description text,
  wo_number text NOT NULL DEFAULT '',
  description text,
  duration_hours numeric(6, 2),
  location text,
  skill_level text,
  created_at timestamptz DEFAULT now(),
  UNIQUE (technician_id, entry_date, wo_number, ata_chapter)
);

CREATE TABLE IF NOT EXISTS public.logbook_analysis (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  technician_id uuid NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  analysis_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  entries_total integer DEFAULT 0,
  last_updated timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_logbook_entries_technician ON public.logbook_entries(technician_id);
CREATE INDEX IF NOT EXISTS idx_logbook_sources_technician ON public.logbook_sources(technician_id);
CREATE INDEX IF NOT EXISTS idx_logbook_jobs_technician ON public.logbook_jobs(technician_id);

ALTER TABLE public.logbook_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.logbook_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.logbook_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.logbook_analysis ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "technician_own" ON public.logbook_jobs;
DROP POLICY IF EXISTS "technician_own" ON public.logbook_sources;
DROP POLICY IF EXISTS "technician_own" ON public.logbook_entries;
DROP POLICY IF EXISTS "technician_own" ON public.logbook_analysis;
DROP POLICY IF EXISTS "companies_see_verified" ON public.logbook_analysis;

CREATE POLICY "logbook_jobs_technician" ON public.logbook_jobs
  FOR ALL
  USING (technician_id = auth.uid())
  WITH CHECK (technician_id = auth.uid());

CREATE POLICY "logbook_sources_technician" ON public.logbook_sources
  FOR ALL
  USING (technician_id = auth.uid())
  WITH CHECK (technician_id = auth.uid());

CREATE POLICY "logbook_entries_technician" ON public.logbook_entries
  FOR ALL
  USING (technician_id = auth.uid())
  WITH CHECK (technician_id = auth.uid());

CREATE POLICY "logbook_analysis_technician" ON public.logbook_analysis
  FOR ALL
  USING (technician_id = auth.uid())
  WITH CHECK (technician_id = auth.uid());

-- Empresas: ver análisis de técnicos verificados (AMX)
CREATE POLICY "logbook_analysis_companies_verified" ON public.logbook_analysis
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.technicians t
      WHERE t.user_id = logbook_analysis.technician_id
        AND t.verification_status = 'verified'
    )
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role = 'company'
    )
  );
