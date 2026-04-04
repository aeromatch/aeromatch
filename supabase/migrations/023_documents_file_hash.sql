-- SHA-256 del archivo en el momento de la verificación administrativa (AMX)
ALTER TABLE public.documents
ADD COLUMN IF NOT EXISTS file_hash TEXT;
