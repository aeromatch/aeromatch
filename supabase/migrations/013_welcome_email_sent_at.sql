-- Idempotencia para email de bienvenida (envío desde la app Next.js)
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS welcome_email_sent_at TIMESTAMPTZ;

COMMENT ON COLUMN public.profiles.welcome_email_sent_at IS
  'Cuándo se envió el email de bienvenida al técnico (null = aún no enviado).';

-- El trigger pg_net (012) suele no dispararse con upsert (ruta UPDATE) y depende de config en DB.
-- Se desactiva el envío por HTTP desde Postgres; el envío real lo hace /api/account/send-welcome-email.
DROP TRIGGER IF EXISTS profiles_technician_welcome_webhook ON public.profiles;
