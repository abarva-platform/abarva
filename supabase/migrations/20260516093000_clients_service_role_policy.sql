-- Ensure the tenant directory remains available to backend service-role paths.
--
-- Azure Postgres does not inherit Supabase's service-role table access unless
-- we grant it explicitly. Several SECURITY DEFINER helpers resolve UUID tenant
-- IDs through public.clients, and the L4 RLS regression suite uses clients as
-- the service-role bypass canary. Keep browser roles locked out; only the
-- service_role compatibility role receives direct access.

BEGIN;

ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS service_role_all_clients ON public.clients;
CREATE POLICY service_role_all_clients ON public.clients
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.clients TO service_role;

NOTIFY pgrst, 'reload schema';

COMMIT;
