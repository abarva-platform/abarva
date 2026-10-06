-- Reconcile fresh installs with the scoped policy already present in the lab.
-- The original source_events migration granted ALL to PUBLIC via an omitted TO clause.
DROP POLICY IF EXISTS "service_role_full_access" ON public.source_events;

DO $policy$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'source_events'
      AND policyname = 'service_role_all_source_events'
      AND roles = ARRAY['service_role']::name[]
      AND cmd = 'ALL'
  ) THEN
    DROP POLICY IF EXISTS "service_role_all_source_events" ON public.source_events;
    CREATE POLICY "service_role_all_source_events" ON public.source_events
      FOR ALL TO service_role USING (true) WITH CHECK (true);
  END IF;
END;
$policy$;
