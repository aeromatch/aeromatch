-- Estados AMX: pending | checked | not_uploaded (not_uploaded solo lógico en app; filas reales: pending/checked)
ALTER TABLE public.documents DROP CONSTRAINT IF EXISTS documents_status_check;

UPDATE public.documents
SET status = CASE
  WHEN status = 'verified' THEN 'checked'
  WHEN status IN ('uploaded', 'pending_verification', 'rejected', 'expired') THEN 'pending'
  ELSE 'pending'
END
WHERE status IS NOT NULL;

ALTER TABLE public.documents
  ALTER COLUMN status SET DEFAULT 'pending';

ALTER TABLE public.documents
  ADD CONSTRAINT documents_status_check
  CHECK (status IN ('pending', 'checked', 'not_uploaded'));

-- Refuerzo: nueva subida o reemplazo de fichero → pending (la verificación admin pasa a checked sin tocar storage_path)
CREATE OR REPLACE FUNCTION public.documents_set_pending_on_upload()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    NEW.status := 'pending';
  ELSIF TG_OP = 'UPDATE'
    AND NEW.storage_path IS DISTINCT FROM OLD.storage_path
    AND NEW.storage_path IS NOT NULL
  THEN
    NEW.status := 'pending';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS documents_pending_on_upload ON public.documents;
CREATE TRIGGER documents_pending_on_upload
  BEFORE INSERT OR UPDATE OF storage_path ON public.documents
  FOR EACH ROW
  EXECUTE PROCEDURE public.documents_set_pending_on_upload();
