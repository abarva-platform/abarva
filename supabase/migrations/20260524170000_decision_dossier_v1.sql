-- Packet 22 · Unified Decision Dossier v1.
--
-- Decision threads bind Intelligence rationale, Moves business case, Source
-- commercial path, Tower measurement, Watchlist signals, and generated
-- artifacts into one tenant-scoped continuity surface.

BEGIN;

CREATE TABLE IF NOT EXISTS public.decision_threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id TEXT NOT NULL,
  thread_slug TEXT NOT NULL,
  title TEXT NOT NULL,
  originating_intelligence_session UUID,
  primary_owner_role TEXT NOT NULL,
  status TEXT NOT NULL
    CHECK (status IN ('open', 'in_flight', 'decided', 'closed', 'archived')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_activity_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (client_id, thread_slug)
);

CREATE TABLE IF NOT EXISTS public.decision_thread_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID NOT NULL REFERENCES public.decision_threads(id) ON DELETE CASCADE,
  surface TEXT NOT NULL
    CHECK (surface IN ('intelligence', 'moves', 'source', 'tower', 'watchlist', 'artifact')),
  artifact_ref TEXT NOT NULL,
  linked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  linked_by TEXT NOT NULL,
  link_reason TEXT,
  UNIQUE (thread_id, surface, artifact_ref)
);

CREATE TABLE IF NOT EXISTS public.source_event_code_backfill_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_event_id UUID NOT NULL,
  client_key TEXT NOT NULL,
  old_code TEXT NOT NULL,
  new_code TEXT NOT NULL,
  actor TEXT NOT NULL DEFAULT 'p22-source-event-code-backfill',
  reason TEXT NOT NULL,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS decision_thread_links_thread_idx
  ON public.decision_thread_links (thread_id);

CREATE INDEX IF NOT EXISTS decision_thread_links_artifact_idx
  ON public.decision_thread_links (artifact_ref);

CREATE INDEX IF NOT EXISTS decision_thread_links_surface_artifact_idx
  ON public.decision_thread_links (surface, artifact_ref);

CREATE INDEX IF NOT EXISTS decision_threads_client_activity_idx
  ON public.decision_threads (client_id, last_activity_at DESC);

ALTER TABLE public.decision_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.decision_thread_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.source_event_code_backfill_audit ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS service_role_all_decision_threads ON public.decision_threads;
CREATE POLICY service_role_all_decision_threads
  ON public.decision_threads
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS service_role_all_decision_thread_links ON public.decision_thread_links;
CREATE POLICY service_role_all_decision_thread_links
  ON public.decision_thread_links
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS service_role_all_source_event_code_backfill_audit ON public.source_event_code_backfill_audit;
CREATE POLICY service_role_all_source_event_code_backfill_audit
  ON public.source_event_code_backfill_audit
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

DO $decision_dossier_rls$
BEGIN
  IF to_regprocedure('can_read_tenant_by_key(text)') IS NOT NULL
     AND to_regprocedure('can_write_tenant_by_key(text)') IS NOT NULL THEN
    DROP POLICY IF EXISTS authenticated_select_decision_threads ON public.decision_threads;
    CREATE POLICY authenticated_select_decision_threads
      ON public.decision_threads
      FOR SELECT TO authenticated
      USING (can_read_tenant_by_key(client_id));

    DROP POLICY IF EXISTS authenticated_insert_decision_threads ON public.decision_threads;
    CREATE POLICY authenticated_insert_decision_threads
      ON public.decision_threads
      FOR INSERT TO authenticated
      WITH CHECK (can_write_tenant_by_key(client_id));

    DROP POLICY IF EXISTS authenticated_update_decision_threads ON public.decision_threads;
    CREATE POLICY authenticated_update_decision_threads
      ON public.decision_threads
      FOR UPDATE TO authenticated
      USING (can_write_tenant_by_key(client_id))
      WITH CHECK (can_write_tenant_by_key(client_id));

    DROP POLICY IF EXISTS authenticated_select_decision_thread_links ON public.decision_thread_links;
    CREATE POLICY authenticated_select_decision_thread_links
      ON public.decision_thread_links
      FOR SELECT TO authenticated
      USING (
        EXISTS (
          SELECT 1
          FROM public.decision_threads dt
          WHERE dt.id = decision_thread_links.thread_id
            AND can_read_tenant_by_key(dt.client_id)
        )
      );

    DROP POLICY IF EXISTS authenticated_insert_decision_thread_links ON public.decision_thread_links;
    CREATE POLICY authenticated_insert_decision_thread_links
      ON public.decision_thread_links
      FOR INSERT TO authenticated
      WITH CHECK (
        EXISTS (
          SELECT 1
          FROM public.decision_threads dt
          WHERE dt.id = decision_thread_links.thread_id
            AND can_write_tenant_by_key(dt.client_id)
        )
      );

    DROP POLICY IF EXISTS authenticated_select_source_event_code_backfill_audit ON public.source_event_code_backfill_audit;
    CREATE POLICY authenticated_select_source_event_code_backfill_audit
      ON public.source_event_code_backfill_audit
      FOR SELECT TO authenticated
      USING (can_read_tenant_by_key(client_key));
  ELSE
    RAISE NOTICE 'decision-dossier-v1: tenant key RLS helpers absent; authenticated policies skipped';
  END IF;
END
$decision_dossier_rls$;

GRANT SELECT, INSERT, UPDATE ON public.decision_threads TO authenticated;
GRANT SELECT, INSERT ON public.decision_thread_links TO authenticated;
GRANT SELECT ON public.source_event_code_backfill_audit TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.decision_threads TO service_role;
GRANT SELECT, INSERT, UPDATE ON public.decision_thread_links TO service_role;
GRANT SELECT, INSERT ON public.source_event_code_backfill_audit TO service_role;
REVOKE DELETE ON public.decision_threads FROM anon, authenticated, service_role;
REVOKE DELETE ON public.decision_thread_links FROM anon, authenticated, service_role;
REVOKE UPDATE, DELETE ON public.source_event_code_backfill_audit FROM anon, authenticated, service_role;

COMMENT ON TABLE public.decision_threads IS
  'Unified decision continuity spine linking Intelligence, Moves, Source, Tower, Watchlist, and generated artifacts.';

COMMENT ON TABLE public.decision_thread_links IS
  'Soft links from a decision thread to surface artifacts. Artifact refs are intentionally unconstrained across heterogeneous source tables.';

COMMENT ON TABLE public.source_event_code_backfill_audit IS
  'Immutable audit trail for Packet 22 source event code rewrites.';

COMMIT;
