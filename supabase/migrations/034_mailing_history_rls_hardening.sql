-- Security Advisor fix: "RLS Policy Always True" en public.mailing_history
-- La política anterior usaba USING (true) que es demasiado permisiva.
-- Todas las operaciones reales van por service_role (bypasea RLS),
-- así que bloqueamos acceso directo desde cliente authenticated/anon.

DROP POLICY IF EXISTS "Admin full access mailing_history" ON public.mailing_history;

CREATE POLICY "No direct access for users"
  ON public.mailing_history
  FOR ALL
  TO authenticated, anon
  USING (false)
  WITH CHECK (false);
