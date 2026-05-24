-- Packet 20 · Board Pack Generator v1.
--
-- Stores generated board-grade artifacts and pilot evidence packages. The
-- renderer may use Gamma when tenant policy allows, but every published row
-- carries evidence-ledger ids and an immutable blob hash.

BEGIN;

CREATE TABLE IF NOT EXISTS public.generated_artifacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id TEXT NOT NULL,
  artifact_type TEXT NOT NULL
    CHECK (artifact_type IN (
      'move_board_pack',
      'source_board_pack',
      'pilot_evidence_package',
      'watchlist_review_pack',
      'dossier_board_pack'
    )),
  source_artifact_ref TEXT NOT NULL,
  render_engine TEXT NOT NULL
    CHECK (render_engine IN ('gamma', 'internal', 'gamma_with_internal_fallback')),
  output_format TEXT NOT NULL
    CHECK (output_format IN ('pptx', 'pdf', 'html', 'docx')),
  blob_url TEXT NOT NULL,
  blob_sha256 TEXT NOT NULL,
  quality_score NUMERIC CHECK (quality_score IS NULL OR quality_score BETWEEN 0 AND 10),
  evidence_ledger_ids UUID[] NOT NULL DEFAULT ARRAY[]::UUID[],
  generation_egress_audit UUID REFERENCES public.ai_egress_audit(id),
  rendered_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  rendered_by TEXT NOT NULL,
  superseded_by UUID REFERENCES public.generated_artifacts(id),
  quarantine_reason TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS generated_artifacts_lookup_idx
  ON public.generated_artifacts (client_id, artifact_type, source_artifact_ref, rendered_at DESC);

CREATE INDEX IF NOT EXISTS generated_artifacts_evidence_ids_idx
  ON public.generated_artifacts USING gin (evidence_ledger_ids);

ALTER TABLE public.generated_artifacts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS service_role_all_generated_artifacts ON public.generated_artifacts;
CREATE POLICY service_role_all_generated_artifacts
  ON public.generated_artifacts
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

DO $generated_artifacts_rls$
BEGIN
  IF to_regprocedure('can_read_tenant_by_key(text)') IS NOT NULL
     AND to_regprocedure('can_write_tenant_by_key(text)') IS NOT NULL THEN
    DROP POLICY IF EXISTS authenticated_select_generated_artifacts ON public.generated_artifacts;
    CREATE POLICY authenticated_select_generated_artifacts
      ON public.generated_artifacts
      FOR SELECT TO authenticated
      USING (can_read_tenant_by_key(client_id));

    DROP POLICY IF EXISTS authenticated_insert_generated_artifacts ON public.generated_artifacts;
    CREATE POLICY authenticated_insert_generated_artifacts
      ON public.generated_artifacts
      FOR INSERT TO authenticated
      WITH CHECK (can_write_tenant_by_key(client_id));
  ELSE
    RAISE NOTICE 'generated-artifacts-v1: tenant key RLS helpers absent; authenticated policies skipped';
  END IF;
END
$generated_artifacts_rls$;

GRANT SELECT, INSERT ON public.generated_artifacts TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.generated_artifacts TO service_role;
REVOKE DELETE ON public.generated_artifacts FROM anon, authenticated, service_role;

COMMENT ON TABLE public.generated_artifacts IS
  'Packet 20 generated board packs, Source packs, Watchlist packs, Dossier packs, and pilot evidence packages.';

COMMENT ON COLUMN public.generated_artifacts.evidence_ledger_ids IS
  'Every published claim in the artifact must resolve to these evidence_ledger rows.';

COMMIT;
