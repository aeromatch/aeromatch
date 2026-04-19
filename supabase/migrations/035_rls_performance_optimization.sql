-- Performance Advisor fixes:
--   1. auth_rls_initplan: envolver auth.uid() en (select auth.uid())
--      para que Postgres evalue la funcion una sola vez por query en lugar de por fila.
--   2. multiple_permissive_policies: eliminar politicas duplicadas / redundantes.
-- Ningun cambio funcional. El comportamiento para authenticated/anon/service_role
-- es identico al anterior.

-- =====================================================
-- PART 1: Reemplazar auth.uid() por (select auth.uid())
-- =====================================================

-- profiles
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
CREATE POLICY "profiles_select_own" ON public.profiles
  FOR SELECT USING ((select auth.uid()) = id);

DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE USING ((select auth.uid()) = id);

-- Eliminar "Allow all for authenticated users" (redundante con las *_own)
DROP POLICY IF EXISTS "Allow all for authenticated users" ON public.profiles;

-- companies
DROP POLICY IF EXISTS "company_select_own" ON public.companies;
CREATE POLICY "company_select_own" ON public.companies
  FOR SELECT USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "company_update_own" ON public.companies;
CREATE POLICY "company_update_own" ON public.companies
  FOR UPDATE USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "company_upsert_own" ON public.companies;
CREATE POLICY "company_upsert_own" ON public.companies
  FOR INSERT WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Allow all for authenticated users" ON public.companies;

-- amx_certificates
DROP POLICY IF EXISTS "Technicians can view own certificate" ON public.amx_certificates;
CREATE POLICY "Technicians can view own certificate" ON public.amx_certificates
  FOR SELECT USING (technician_id = (select auth.uid()));

-- billing_customers
DROP POLICY IF EXISTS "Users can insert own billing customer" ON public.billing_customers;
CREATE POLICY "Users can insert own billing customer" ON public.billing_customers
  FOR INSERT WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can read own billing customer" ON public.billing_customers;
CREATE POLICY "Users can read own billing customer" ON public.billing_customers
  FOR SELECT USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update own billing customer" ON public.billing_customers;
CREATE POLICY "Users can update own billing customer" ON public.billing_customers
  FOR UPDATE USING ((select auth.uid()) = user_id);

-- company_metrics
DROP POLICY IF EXISTS "Companies can insert own metrics" ON public.company_metrics;
CREATE POLICY "Companies can insert own metrics" ON public.company_metrics
  FOR INSERT WITH CHECK (company_id = (select auth.uid()));

DROP POLICY IF EXISTS "Companies can update own metrics" ON public.company_metrics;
CREATE POLICY "Companies can update own metrics" ON public.company_metrics
  FOR UPDATE USING (company_id = (select auth.uid()));

DROP POLICY IF EXISTS "Companies can view own metrics" ON public.company_metrics;
CREATE POLICY "Companies can view own metrics" ON public.company_metrics
  FOR SELECT USING (company_id = (select auth.uid()));

-- documents
DROP POLICY IF EXISTS "Users can manage own documents" ON public.documents;
CREATE POLICY "Users can manage own documents" ON public.documents
  FOR ALL USING (technician_id = (select auth.uid()));

-- job_ratings
DROP POLICY IF EXISTS "Companies can insert ratings" ON public.job_ratings;
CREATE POLICY "Companies can insert ratings" ON public.job_ratings
  FOR INSERT WITH CHECK (company_user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can view relevant ratings" ON public.job_ratings;
CREATE POLICY "Users can view relevant ratings" ON public.job_ratings
  FOR SELECT USING (
    (company_user_id = (select auth.uid()))
    OR (technician_user_id = (select auth.uid()))
  );

-- logbook_jobs / sources / entries (FOR ALL + USING + WITH CHECK)
DROP POLICY IF EXISTS "logbook_jobs_technician" ON public.logbook_jobs;
CREATE POLICY "logbook_jobs_technician" ON public.logbook_jobs
  FOR ALL
  USING (technician_id = (select auth.uid()))
  WITH CHECK (technician_id = (select auth.uid()));

DROP POLICY IF EXISTS "logbook_sources_technician" ON public.logbook_sources;
CREATE POLICY "logbook_sources_technician" ON public.logbook_sources
  FOR ALL
  USING (technician_id = (select auth.uid()))
  WITH CHECK (technician_id = (select auth.uid()));

DROP POLICY IF EXISTS "logbook_entries_technician" ON public.logbook_entries;
CREATE POLICY "logbook_entries_technician" ON public.logbook_entries
  FOR ALL
  USING (technician_id = (select auth.uid()))
  WITH CHECK (technician_id = (select auth.uid()));

-- premium_grants
DROP POLICY IF EXISTS "Users can view own premium" ON public.premium_grants;
CREATE POLICY "Users can view own premium" ON public.premium_grants
  FOR SELECT USING (technician_id = (select auth.uid()));

-- subscriptions
DROP POLICY IF EXISTS "Users can read own subscriptions" ON public.subscriptions;
CREATE POLICY "Users can read own subscriptions" ON public.subscriptions
  FOR SELECT USING ((select auth.uid()) = user_id);

-- =====================================================
-- PART 2: Consolidar politicas duplicadas
-- =====================================================

-- availability_slots: ownership estricto para escritura, lectura authenticated
DROP POLICY IF EXISTS "Owner full access slots" ON public.availability_slots;
DROP POLICY IF EXISTS "Read all slots" ON public.availability_slots;

CREATE POLICY "availability_slots_select" ON public.availability_slots
  FOR SELECT USING ((select auth.uid()) IS NOT NULL);
CREATE POLICY "availability_slots_insert_own" ON public.availability_slots
  FOR INSERT WITH CHECK (technician_id = (select auth.uid()));
CREATE POLICY "availability_slots_update_own" ON public.availability_slots
  FOR UPDATE USING (technician_id = (select auth.uid()));
CREATE POLICY "availability_slots_delete_own" ON public.availability_slots
  FOR DELETE USING (technician_id = (select auth.uid()));

-- technicians: owner + lectura de tecnicos disponibles
DROP POLICY IF EXISTS "Owner full access" ON public.technicians;
DROP POLICY IF EXISTS "Read available technicians" ON public.technicians;

CREATE POLICY "technicians_select" ON public.technicians
  FOR SELECT USING (
    (user_id = (select auth.uid()))
    OR (((select auth.uid()) IS NOT NULL) AND (is_available = true))
  );
CREATE POLICY "technicians_insert_own" ON public.technicians
  FOR INSERT WITH CHECK (user_id = (select auth.uid()));
CREATE POLICY "technicians_update_own" ON public.technicians
  FOR UPDATE USING (user_id = (select auth.uid()));
CREATE POLICY "technicians_delete_own" ON public.technicians
  FOR DELETE USING (user_id = (select auth.uid()));

-- requests: combinar UPDATE duplicado (company y technician)
DROP POLICY IF EXISTS "requests_company_insert" ON public.requests;
DROP POLICY IF EXISTS "requests_company_select_own" ON public.requests;
DROP POLICY IF EXISTS "requests_company_update" ON public.requests;
DROP POLICY IF EXISTS "requests_technician_update_status" ON public.requests;

CREATE POLICY "requests_select_participant" ON public.requests
  FOR SELECT USING (
    ((select auth.uid()) = company_id)
    OR ((select auth.uid()) = technician_id)
  );
CREATE POLICY "requests_company_insert" ON public.requests
  FOR INSERT WITH CHECK ((select auth.uid()) = company_id);
CREATE POLICY "requests_update_participant" ON public.requests
  FOR UPDATE USING (
    ((select auth.uid()) = company_id)
    OR ((select auth.uid()) = technician_id)
  );

-- job_requests: combinar SELECT y UPDATE duplicados
DROP POLICY IF EXISTS "Company view requests" ON public.job_requests;
DROP POLICY IF EXISTS "Technician view requests" ON public.job_requests;
DROP POLICY IF EXISTS "Company create requests" ON public.job_requests;
DROP POLICY IF EXISTS "Company update requests" ON public.job_requests;
DROP POLICY IF EXISTS "Technician respond requests" ON public.job_requests;

CREATE POLICY "job_requests_select_participant" ON public.job_requests
  FOR SELECT USING (
    ((select auth.uid()) = company_id)
    OR ((select auth.uid()) = technician_id)
  );
CREATE POLICY "job_requests_company_insert" ON public.job_requests
  FOR INSERT WITH CHECK (company_id = (select auth.uid()));
CREATE POLICY "job_requests_update_participant" ON public.job_requests
  FOR UPDATE USING (
    ((select auth.uid()) = company_id)
    OR ((select auth.uid()) = technician_id)
  );

-- job_acceptance_workflow: SELECT combinado, resto solo para el tecnico
DROP POLICY IF EXISTS "Technicians can manage their acceptance workflow" ON public.job_acceptance_workflow;
DROP POLICY IF EXISTS "Companies can read accepted job workflows" ON public.job_acceptance_workflow;

CREATE POLICY "jaw_select" ON public.job_acceptance_workflow
  FOR SELECT USING (
    ((select auth.uid()) = technician_user_id)
    OR (
      ((select auth.uid()) = company_user_id)
      AND EXISTS (
        SELECT 1 FROM public.job_requests jr
        WHERE jr.id = job_acceptance_workflow.job_request_id
          AND jr.status = 'accepted'
      )
    )
  );
CREATE POLICY "jaw_insert_tech" ON public.job_acceptance_workflow
  FOR INSERT WITH CHECK ((select auth.uid()) = technician_user_id);
CREATE POLICY "jaw_update_tech" ON public.job_acceptance_workflow
  FOR UPDATE USING ((select auth.uid()) = technician_user_id);
CREATE POLICY "jaw_delete_tech" ON public.job_acceptance_workflow
  FOR DELETE USING ((select auth.uid()) = technician_user_id);

-- logbook_analysis: SELECT combinado (tecnico + empresas verificadas)
DROP POLICY IF EXISTS "logbook_analysis_technician" ON public.logbook_analysis;
DROP POLICY IF EXISTS "logbook_analysis_companies_verified" ON public.logbook_analysis;

CREATE POLICY "logbook_analysis_select" ON public.logbook_analysis
  FOR SELECT USING (
    (technician_id = (select auth.uid()))
    OR (
      EXISTS (
        SELECT 1 FROM public.technicians t
        WHERE t.user_id = logbook_analysis.technician_id
          AND t.verification_status = 'verified'
      )
      AND EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = (select auth.uid())
          AND p.role = 'company'::user_role
      )
    )
  );
CREATE POLICY "logbook_analysis_insert_tech" ON public.logbook_analysis
  FOR INSERT WITH CHECK (technician_id = (select auth.uid()));
CREATE POLICY "logbook_analysis_update_tech" ON public.logbook_analysis
  FOR UPDATE
  USING (technician_id = (select auth.uid()))
  WITH CHECK (technician_id = (select auth.uid()));
CREATE POLICY "logbook_analysis_delete_tech" ON public.logbook_analysis
  FOR DELETE USING (technician_id = (select auth.uid()));
