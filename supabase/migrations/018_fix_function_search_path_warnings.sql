-- Fix Supabase warnings: Function Search Path Mutable
-- Safe change: only sets explicit search_path on existing functions.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname = 'update_billing_updated_at'
      AND pg_get_function_identity_arguments(p.oid) = ''
  ) THEN
    ALTER FUNCTION public.update_billing_updated_at()
      SET search_path = public, pg_temp;
  END IF;
END
$$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname = 'generate_amx_reference_id'
      AND pg_get_function_identity_arguments(p.oid) = ''
  ) THEN
    ALTER FUNCTION public.generate_amx_reference_id()
      SET search_path = public, pg_temp;
  END IF;
END
$$;
