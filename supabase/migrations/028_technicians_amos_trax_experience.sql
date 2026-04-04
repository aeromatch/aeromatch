-- Experiencia declarada con sistemas MRO (texto libre; aparece en certificado AMX)
ALTER TABLE public.technicians
  ADD COLUMN IF NOT EXISTS experience_amos TEXT;

ALTER TABLE public.technicians
  ADD COLUMN IF NOT EXISTS experience_trax TEXT;
