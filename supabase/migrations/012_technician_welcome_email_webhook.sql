-- =====================================================
-- Migration 012: Technician welcome email (webhook)
-- =====================================================
-- After INSERT on public.profiles when role = 'technician',
-- queues an HTTP POST to the app (Resend runs in Next.js).
--
-- Post-deploy setup (run once in Supabase SQL Editor):
-- 1. Generate a strong secret and set the same value in Vercel as
--    WELCOME_EMAIL_WEBHOOK_SECRET.
-- 2. Insert or update the webhook row (replace YOUR_SECRET and URL if needed):
--
--    INSERT INTO private.welcome_email_webhook (id, base_url, secret)
--    VALUES (
--      1,
--      'https://app.aeromatch.eu/api/internal/welcome-technician',
--      'YOUR_SECRET'
--    )
--    ON CONFLICT (id) DO UPDATE
--      SET base_url = EXCLUDED.base_url,
--          secret = EXCLUDED.secret;
--
-- Until this row exists with a non-empty secret, the trigger logs and skips HTTP.
-- =====================================================

-- pg_net: async HTTP from Postgres (Supabase)
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Optional: first name for personalised welcome (fallback: profiles.full_name in app)
ALTER TABLE public.technicians
ADD COLUMN IF NOT EXISTS first_name TEXT;

COMMENT ON COLUMN public.technicians.first_name IS
  'Optional given name for emails; welcome uses this before profiles.full_name.';

CREATE SCHEMA IF NOT EXISTS private;

CREATE TABLE IF NOT EXISTS private.welcome_email_webhook (
  id smallint PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  base_url text NOT NULL,
  secret text NOT NULL
);

REVOKE ALL ON TABLE private.welcome_email_webhook FROM PUBLIC;

-- Trigger: notify app to send welcome + admin emails via Resend
CREATE OR REPLACE FUNCTION public.trg_profiles_technician_welcome_webhook()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_base_url text;
  v_secret text;
  v_body jsonb;
BEGIN
  IF NEW.role IS DISTINCT FROM 'technician' THEN
    RETURN NEW;
  END IF;

  SELECT w.base_url, w.secret
    INTO v_base_url, v_secret
  FROM private.welcome_email_webhook w
  WHERE w.id = 1;

  IF v_base_url IS NULL OR v_secret IS NULL OR length(trim(v_secret)) < 16 THEN
    RAISE LOG 'welcome_email_webhook: missing private.welcome_email_webhook config (id=1)';
    RETURN NEW;
  END IF;

  v_body := jsonb_build_object(
    'profile_id', NEW.id::text,
    'email', NEW.email,
    'full_name', NEW.full_name,
    'registered_at', to_jsonb(NEW.created_at)
  );

  PERFORM net.http_post(
    url := trim(trailing '/' from v_base_url),
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-aeromatch-welcome-secret', v_secret
    ),
    body := v_body
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_technician_welcome_webhook ON public.profiles;

CREATE TRIGGER profiles_technician_welcome_webhook
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  WHEN (NEW.role = 'technician')
  EXECUTE PROCEDURE public.trg_profiles_technician_welcome_webhook();

COMMENT ON FUNCTION public.trg_profiles_technician_welcome_webhook() IS
  'POSTs new technician profile payload to the app; Resend sends welcome + admin emails.';
