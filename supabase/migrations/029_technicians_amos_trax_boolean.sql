-- AMOS / TRAX: de texto libre (028) a flags booleanos
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'technicians'
      AND column_name = 'experience_amos' AND data_type = 'text'
  ) THEN
    ALTER TABLE public.technicians
      ALTER COLUMN experience_amos TYPE boolean
      USING (COALESCE(trim(experience_amos::text), '') <> '');
    ALTER TABLE public.technicians ALTER COLUMN experience_amos SET DEFAULT false;
    ALTER TABLE public.technicians ALTER COLUMN experience_amos SET NOT NULL;
  ELSIF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'technicians'
      AND column_name = 'experience_amos'
  ) THEN
    ALTER TABLE public.technicians
      ADD COLUMN experience_amos boolean NOT NULL DEFAULT false;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'technicians'
      AND column_name = 'experience_trax' AND data_type = 'text'
  ) THEN
    ALTER TABLE public.technicians
      ALTER COLUMN experience_trax TYPE boolean
      USING (COALESCE(trim(experience_trax::text), '') <> '');
    ALTER TABLE public.technicians ALTER COLUMN experience_trax SET DEFAULT false;
    ALTER TABLE public.technicians ALTER COLUMN experience_trax SET NOT NULL;
  ELSIF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'technicians'
      AND column_name = 'experience_trax'
  ) THEN
    ALTER TABLE public.technicians
      ADD COLUMN experience_trax boolean NOT NULL DEFAULT false;
  END IF;
END $$;
