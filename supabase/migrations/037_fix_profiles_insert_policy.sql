-- Fix regresion introducida en 035_rls_performance_optimization.sql
--
-- En 035 se elimino la politica "Allow all for authenticated users" de
-- public.profiles y solo se conservaron SELECT y UPDATE. Como consecuencia,
-- el upsert que hace el cliente para crear el profile de un usuario nuevo
-- (tras Google OAuth o signUp con email) fallaba silenciosamente con RLS,
-- dejando al usuario atascado en /onboarding/role con el spinner "Configurando..."
-- que volvia al estado inicial.
--
-- Esta migracion anade la politica de INSERT que faltaba. El usuario solo
-- puede crear su propio profile (id = auth.uid()), manteniendo la seguridad.

DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
CREATE POLICY "profiles_insert_own" ON public.profiles
  FOR INSERT
  WITH CHECK ((select auth.uid()) = id);
