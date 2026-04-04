-- Alinea documents con el código de verificación AMX (promoteTechnicianDocumentsToVerified).
-- Idempotente: seguro si la migración 002 no se aplicó nunca en este entorno.

-- verified_at / verified_by: requeridos por la API al marcar documentos checked
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'documents' AND column_name = 'verified_at'
  ) THEN
    ALTER TABLE public.documents ADD COLUMN verified_at TIMESTAMPTZ;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'documents' AND column_name = 'verified_by'
  ) THEN
    ALTER TABLE public.documents ADD COLUMN verified_by UUID REFERENCES auth.users(id);
  END IF;
END $$;

-- Soft delete (opcional; el código filtra is_deleted cuando existe)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'documents' AND column_name = 'is_deleted'
  ) THEN
    ALTER TABLE public.documents ADD COLUMN is_deleted BOOLEAN DEFAULT FALSE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'documents' AND column_name = 'deleted_at'
  ) THEN
    ALTER TABLE public.documents ADD COLUMN deleted_at TIMESTAMPTZ;
  END IF;
END $$;
