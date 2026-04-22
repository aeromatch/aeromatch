-- Anade la columna preferred_language a public.profiles para poder
-- enviar los emails transaccionales (welcome, confirmacion, etc.)
-- en el idioma del usuario (ES/EN).
--
-- Se guarda en el signUp a partir del LanguageContext activo en la UI
-- en el momento del registro. Default 'es' para no romper los registros
-- anteriores (la mayoria actual del trafico es ES).

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS preferred_language TEXT
  NOT NULL DEFAULT 'es';

-- Restringir a los idiomas soportados por la UI
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'profiles_preferred_language_check'
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_preferred_language_check
      CHECK (preferred_language IN ('es', 'en'));
  END IF;
END $$;

COMMENT ON COLUMN public.profiles.preferred_language IS
  'Idioma preferido del usuario para comunicaciones (emails, notificaciones). ''es'' | ''en''.';
