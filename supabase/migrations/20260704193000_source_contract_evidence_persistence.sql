-- Source · structured contract evidence persistence.
--
-- This is the decision-grade evidence layer between raw client artifacts and
-- Source advisory outputs. Raw files remain in Azure Blob / source_artifacts.
-- These tables store the minimum sourcing-critical extracts needed for
-- contract optimization, renewal, renegotiation, and RFP fallback decisions.

BEGIN;

CREATE TABLE IF NOT EXISTS public.source_contract_evidence_manifests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_key TEXT NOT NULL,
  source_event_id TEXT NOT NULL,
  source_artifact_id UUID NULL REFERENCES public.source_artifacts(id) ON DELETE SET NULL,
  archetype_key TEXT NOT NULL,
  evidence_pack_name TEXT NOT NULL,
  upload_batch_id TEXT NOT NULL,
  source_type TEXT NOT NULL DEFAULT 'client_uploaded'
    CHECK (source_type IN ('client_uploaded', 'system_export', 'vendor_provided', 'synthetic_demo')),
  validation_status TEXT NOT NULL DEFAULT 'accepted'
    CHECK (validation_status IN ('accepted', 'partial', 'needs_review', 'rejected')),
  row_count INTEGER NOT NULL DEFAULT 0 CHECK (row_count >= 0),
  required_family_count INTEGER NOT NULL DEFAULT 0 CHECK (required_family_count >= 0),
  covered_required_family_count INTEGER NOT NULL DEFAULT 0 CHECK (covered_required_family_count >= 0),
  missing_required_families TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  warnings TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_source_contract_evidence_manifest_batch
  ON public.source_contract_evidence_manifests (tenant_key, source_event_id, upload_batch_id);

CREATE INDEX IF NOT EXISTS idx_source_contract_evidence_manifests_event
  ON public.source_contract_evidence_manifests (tenant_key, source_event_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.source_contract_evidence_rows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  manifest_id UUID NOT NULL REFERENCES public.source_contract_evidence_manifests(id) ON DELETE CASCADE,
  tenant_key TEXT NOT NULL,
  source_event_id TEXT NOT NULL,
  source_artifact_id UUID NULL REFERENCES public.source_artifacts(id) ON DELETE SET NULL,
  archetype_key TEXT NOT NULL,
  evidence_family TEXT NOT NULL,
  source_sheet TEXT NOT NULL,
  source_row_number INTEGER NULL CHECK (source_row_number IS NULL OR source_row_number > 0),
  row_hash TEXT NOT NULL,
  row_payload JSONB NOT NULL,
  normalized_subject TEXT NULL,
  period_start DATE NULL,
  period_end DATE NULL,
  amount_usd NUMERIC(18,2) NULL,
  confidence NUMERIC(4,3) NOT NULL DEFAULT 0.800 CHECK (confidence >= 0 AND confidence <= 1),
  validation_status TEXT NOT NULL DEFAULT 'accepted'
    CHECK (validation_status IN ('accepted', 'partial', 'needs_review', 'rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_source_contract_evidence_rows_hash
  ON public.source_contract_evidence_rows (manifest_id, evidence_family, row_hash);

CREATE INDEX IF NOT EXISTS idx_source_contract_evidence_rows_event
  ON public.source_contract_evidence_rows (tenant_key, source_event_id, evidence_family);

CREATE INDEX IF NOT EXISTS idx_source_contract_evidence_rows_period
  ON public.source_contract_evidence_rows (tenant_key, source_event_id, evidence_family, period_start, period_end);

CREATE TABLE IF NOT EXISTS public.source_contract_evidence_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  manifest_id UUID NOT NULL REFERENCES public.source_contract_evidence_manifests(id) ON DELETE CASCADE,
  tenant_key TEXT NOT NULL,
  source_event_id TEXT NOT NULL,
  archetype_key TEXT NOT NULL,
  metric_key TEXT NOT NULL,
  metric_label TEXT NOT NULL,
  metric_value NUMERIC(18,4) NOT NULL,
  unit TEXT NOT NULL,
  evidence_family TEXT NOT NULL,
  basis JSONB NOT NULL DEFAULT '{}'::jsonb,
  confidence NUMERIC(4,3) NOT NULL DEFAULT 0.800 CHECK (confidence >= 0 AND confidence <= 1),
  validation_status TEXT NOT NULL DEFAULT 'accepted'
    CHECK (validation_status IN ('accepted', 'partial', 'needs_review')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_source_contract_evidence_metrics
  ON public.source_contract_evidence_metrics (manifest_id, metric_key);

CREATE INDEX IF NOT EXISTS idx_source_contract_evidence_metrics_event
  ON public.source_contract_evidence_metrics (tenant_key, source_event_id, metric_key);

ALTER TABLE public.source_contract_evidence_manifests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.source_contract_evidence_rows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.source_contract_evidence_metrics ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS service_role_all_source_contract_evidence_manifests
  ON public.source_contract_evidence_manifests;
CREATE POLICY service_role_all_source_contract_evidence_manifests
  ON public.source_contract_evidence_manifests
  FOR ALL USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS service_role_all_source_contract_evidence_rows
  ON public.source_contract_evidence_rows;
CREATE POLICY service_role_all_source_contract_evidence_rows
  ON public.source_contract_evidence_rows
  FOR ALL USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS service_role_all_source_contract_evidence_metrics
  ON public.source_contract_evidence_metrics;
CREATE POLICY service_role_all_source_contract_evidence_metrics
  ON public.source_contract_evidence_metrics
  FOR ALL USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

DO $source_contract_evidence_rls$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'can_read_tenant_by_key') THEN
    DROP POLICY IF EXISTS authenticated_read_source_contract_evidence_manifests
      ON public.source_contract_evidence_manifests;
    CREATE POLICY authenticated_read_source_contract_evidence_manifests
      ON public.source_contract_evidence_manifests
      FOR SELECT USING (can_read_tenant_by_key(tenant_key));

    DROP POLICY IF EXISTS authenticated_read_source_contract_evidence_rows
      ON public.source_contract_evidence_rows;
    CREATE POLICY authenticated_read_source_contract_evidence_rows
      ON public.source_contract_evidence_rows
      FOR SELECT USING (can_read_tenant_by_key(tenant_key));

    DROP POLICY IF EXISTS authenticated_read_source_contract_evidence_metrics
      ON public.source_contract_evidence_metrics;
    CREATE POLICY authenticated_read_source_contract_evidence_metrics
      ON public.source_contract_evidence_metrics
      FOR SELECT USING (can_read_tenant_by_key(tenant_key));
  END IF;
END
$source_contract_evidence_rls$;

GRANT SELECT ON public.source_contract_evidence_manifests TO authenticated;
GRANT SELECT ON public.source_contract_evidence_rows TO authenticated;
GRANT SELECT ON public.source_contract_evidence_metrics TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.source_contract_evidence_manifests TO service_role;
GRANT SELECT, INSERT ON public.source_contract_evidence_rows TO service_role;
GRANT SELECT, INSERT ON public.source_contract_evidence_metrics TO service_role;

COMMENT ON TABLE public.source_contract_evidence_manifests IS
  'Source structured evidence pack manifests for contract optimization. Raw files remain in source_artifacts and Blob; this table records decision-grade extract coverage.';
COMMENT ON TABLE public.source_contract_evidence_rows IS
  'Row-level minimum viable sourcing evidence extracted from client templates or system exports, tenant-scoped and linked to source artifacts where available.';
COMMENT ON TABLE public.source_contract_evidence_metrics IS
  'Deterministic rollups computed from structured contract evidence rows for Source advisory artifacts and aVa answers.';

COMMIT;
