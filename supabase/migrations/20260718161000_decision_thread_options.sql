-- Decision dossier options / KDD alternatives.
--
-- Options hang directly from decision_threads: they describe the decision,
-- not one specific surface link. This keeps Intelligence, Moves, Source, and
-- Tower reading the same selected/rejected option set.

BEGIN;

CREATE TABLE IF NOT EXISTS public.decision_thread_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID NOT NULL REFERENCES public.decision_threads(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  rationale_for TEXT,
  rationale_against TEXT,
  is_selected BOOLEAN NOT NULL DEFAULT false,
  decided_by TEXT,
  decided_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS decision_thread_options_thread_idx
  ON public.decision_thread_options (thread_id);

ALTER TABLE public.decision_thread_options ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS service_role_all_decision_thread_options ON public.decision_thread_options;
CREATE POLICY service_role_all_decision_thread_options
  ON public.decision_thread_options
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

DO $decision_thread_options_rls$
BEGIN
  IF to_regprocedure('can_read_tenant_by_key(text)') IS NOT NULL
     AND to_regprocedure('can_write_tenant_by_key(text)') IS NOT NULL THEN
    DROP POLICY IF EXISTS authenticated_select_decision_thread_options ON public.decision_thread_options;
    CREATE POLICY authenticated_select_decision_thread_options
      ON public.decision_thread_options
      FOR SELECT TO authenticated
      USING (
        EXISTS (
          SELECT 1
          FROM public.decision_threads dt
          WHERE dt.id = decision_thread_options.thread_id
            AND can_read_tenant_by_key(dt.client_id)
        )
      );

    DROP POLICY IF EXISTS authenticated_insert_decision_thread_options ON public.decision_thread_options;
    CREATE POLICY authenticated_insert_decision_thread_options
      ON public.decision_thread_options
      FOR INSERT TO authenticated
      WITH CHECK (
        EXISTS (
          SELECT 1
          FROM public.decision_threads dt
          WHERE dt.id = decision_thread_options.thread_id
            AND can_write_tenant_by_key(dt.client_id)
        )
      );

    DROP POLICY IF EXISTS authenticated_update_decision_thread_options ON public.decision_thread_options;
    CREATE POLICY authenticated_update_decision_thread_options
      ON public.decision_thread_options
      FOR UPDATE TO authenticated
      USING (
        EXISTS (
          SELECT 1
          FROM public.decision_threads dt
          WHERE dt.id = decision_thread_options.thread_id
            AND can_write_tenant_by_key(dt.client_id)
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1
          FROM public.decision_threads dt
          WHERE dt.id = decision_thread_options.thread_id
            AND can_write_tenant_by_key(dt.client_id)
        )
      );
  ELSE
    RAISE NOTICE 'decision-thread-options: tenant key RLS helpers absent; authenticated policies skipped';
  END IF;
END
$decision_thread_options_rls$;

GRANT SELECT, INSERT, UPDATE ON public.decision_thread_options TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.decision_thread_options TO service_role;
REVOKE DELETE ON public.decision_thread_options FROM anon, authenticated;

COMMENT ON TABLE public.decision_thread_options IS
  'Selected and rejected alternatives for a unified decision thread / KDD record.';

COMMIT;
