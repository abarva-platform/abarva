-- Packet 19 · Evidence Ledger v1.
--
-- Trust moat foundation for every claim / recommendation / metric citation.
-- Append-only by trigger; corrections create a new row with supersedes_id.

BEGIN;

CREATE TABLE IF NOT EXISTS public.evidence_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id TEXT NOT NULL,
  surface TEXT NOT NULL
    CHECK (surface IN ('intelligence', 'moves', 'source', 'tower', 'watchlist')),
  artifact_type TEXT NOT NULL
    CHECK (artifact_type IN ('recommendation', 'claim', 'metric', 'citation', 'value_state', 'kill_signal')),
  artifact_ref TEXT NOT NULL,
  claim_text TEXT NOT NULL,
  source_type TEXT NOT NULL
    CHECK (source_type IN ('tenant_record', 'corpus_pattern', 'document_extract', 'workshop_output', 'live_telemetry', 'derived', 'no_evidence')),
  source_ref JSONB NOT NULL DEFAULT '{}'::jsonb,
  source_quote TEXT,
  freshness_at TIMESTAMPTZ NOT NULL,
  confidence NUMERIC NOT NULL CHECK (confidence BETWEEN 0 AND 1),
  confidence_basis TEXT NOT NULL,
  owner_role TEXT,
  not_enough_data_flag BOOLEAN NOT NULL DEFAULT false,
  not_enough_data_reason TEXT,
  egress_audit_id UUID REFERENCES public.ai_egress_audit(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by TEXT NOT NULL,
  supersedes_id UUID REFERENCES public.evidence_ledger(id)
);

CREATE INDEX IF NOT EXISTS evidence_ledger_artifact_idx
  ON public.evidence_ledger (client_id, surface, artifact_type, artifact_ref);

CREATE INDEX IF NOT EXISTS evidence_ledger_freshness_idx
  ON public.evidence_ledger (client_id, freshness_at);

CREATE INDEX IF NOT EXISTS evidence_ledger_claim_search_idx
  ON public.evidence_ledger USING gin (to_tsvector('english', claim_text));

ALTER TABLE public.evidence_ledger ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS service_role_all_evidence_ledger ON public.evidence_ledger;
CREATE POLICY service_role_all_evidence_ledger
  ON public.evidence_ledger
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

DO $evidence_ledger_rls$
BEGIN
  IF to_regprocedure('can_read_tenant_by_key(text)') IS NOT NULL
     AND to_regprocedure('can_write_tenant_by_key(text)') IS NOT NULL THEN
    DROP POLICY IF EXISTS authenticated_select_evidence_ledger ON public.evidence_ledger;
    CREATE POLICY authenticated_select_evidence_ledger
      ON public.evidence_ledger
      FOR SELECT TO authenticated
      USING (can_read_tenant_by_key(client_id));

    DROP POLICY IF EXISTS authenticated_insert_evidence_ledger ON public.evidence_ledger;
    CREATE POLICY authenticated_insert_evidence_ledger
      ON public.evidence_ledger
      FOR INSERT TO authenticated
      WITH CHECK (can_write_tenant_by_key(client_id));
  ELSE
    RAISE NOTICE 'evidence-ledger-v1: tenant key RLS helpers absent; authenticated policies skipped';
  END IF;
END
$evidence_ledger_rls$;

CREATE OR REPLACE FUNCTION public.evidence_ledger_immutable()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'evidence_ledger is append-only: UPDATE and DELETE are not permitted; insert a superseding row instead';
END;
$$;

DROP TRIGGER IF EXISTS evidence_ledger_no_update ON public.evidence_ledger;
CREATE TRIGGER evidence_ledger_no_update
  BEFORE UPDATE ON public.evidence_ledger
  FOR EACH ROW EXECUTE FUNCTION public.evidence_ledger_immutable();

DROP TRIGGER IF EXISTS evidence_ledger_no_delete ON public.evidence_ledger;
CREATE TRIGGER evidence_ledger_no_delete
  BEFORE DELETE ON public.evidence_ledger
  FOR EACH ROW EXECUTE FUNCTION public.evidence_ledger_immutable();

GRANT SELECT, INSERT ON public.evidence_ledger TO authenticated;
GRANT SELECT, INSERT ON public.evidence_ledger TO service_role;
REVOKE UPDATE, DELETE ON public.evidence_ledger FROM anon, authenticated, service_role;

COMMENT ON TABLE public.evidence_ledger IS
  'Append-only ledger for every tenant-grounded claim, recommendation, metric, citation, value state, and kill signal.';

COMMENT ON COLUMN public.evidence_ledger.client_id IS
  'Tenant key / client key, e.g. apexretail, meridian, arcturus. RLS uses can_read_tenant_by_key.';

COMMENT ON COLUMN public.evidence_ledger.source_ref IS
  'Structured soft reference to tenant row, corpus chunk, document page/quote, workshop output, telemetry record, derivation, or no-evidence reason.';

NOTIFY pgrst, 'reload schema';

COMMIT;
