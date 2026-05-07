-- logBook360: soporte para informe HTML subido por admin + fuente MANUAL del tecnico
--
-- 1) Anade columnas en logbook_analysis para el HTML que el admin sube manualmente
--    (path en Storage bucket "documents" + timestamp del ultimo upload).
-- 2) Asegura que solo exista UNA fila MANUAL por tecnico en logbook_sources
--    (constraint via unique partial index, asi no afecta a fuentes TRAX/AMOS/etc.).

ALTER TABLE public.logbook_analysis
  ADD COLUMN IF NOT EXISTS html_report_path TEXT,
  ADD COLUMN IF NOT EXISTS html_report_uploaded_at TIMESTAMPTZ;

COMMENT ON COLUMN public.logbook_analysis.html_report_path IS
  'Path en bucket documents al HTML del logBook360 generado externamente y subido por admin.';
COMMENT ON COLUMN public.logbook_analysis.html_report_uploaded_at IS
  'Fecha del ultimo upload del HTML por parte del admin.';

-- Una sola fuente MANUAL por tecnico (unique partial index)
CREATE UNIQUE INDEX IF NOT EXISTS logbook_sources_manual_unique_per_technician
  ON public.logbook_sources (technician_id)
  WHERE source_system = 'MANUAL';
