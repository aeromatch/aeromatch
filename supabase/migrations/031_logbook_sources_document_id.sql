-- Enlaza cada fuente de logbook con un documento del perfil (mismo storage_path tras análisis)
ALTER TABLE public.logbook_sources
  ADD COLUMN IF NOT EXISTS document_id uuid REFERENCES public.documents(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_logbook_sources_document_id ON public.logbook_sources(document_id);

COMMENT ON COLUMN public.logbook_sources.document_id IS 'Documento en documents (perfil) asociado a esta fuente, si aplica.';
