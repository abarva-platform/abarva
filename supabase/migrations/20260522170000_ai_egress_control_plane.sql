-- Enterprise AI Readiness · Layer 1 egress control plane.
--
-- The roadmap names `tenants.ai_policy`. In this schema, the tenant directory
-- table is `clients`, so the policy column lives on `clients.ai_policy`.
--
-- Apply with `npm run db:migrate` before deploying code paths that write
-- `ai_egress_audit`.

BEGIN;

ALTER TABLE public.clients
  ADD COLUMN IF NOT EXISTS tenant_key TEXT;

ALTER TABLE public.clients
  ADD COLUMN IF NOT EXISTS ai_policy JSONB NOT NULL DEFAULT
  '{
    "allowExternalAI": false,
    "kernelOnlyMode": true,
    "allowClaude": false,
    "allowGamma": false,
    "maxDataClass": "internal",
    "requireRedaction": true,
    "requireHumanApprovalForExports": true,
    "promptResponseRetentionDays": 0
  }'::jsonb;

-- Preserve current demo behavior for the three seeded tenants while keeping
-- the insert-time default conservative for every new client.
UPDATE public.clients
SET ai_policy = jsonb_strip_nulls(ai_policy || '{
  "allowExternalAI": true,
  "kernelOnlyMode": false,
  "allowClaude": true,
  "allowGamma": true,
  "maxDataClass": "confidential",
  "requireRedaction": false,
  "requireHumanApprovalForExports": true,
  "promptResponseRetentionDays": 30
}'::jsonb)
WHERE lower(coalesce(tenant_key, name)) IN ('apexretail', 'apex-retail', 'apex retail');

UPDATE public.clients
SET ai_policy = jsonb_strip_nulls(ai_policy || '{
  "allowExternalAI": true,
  "kernelOnlyMode": false,
  "allowClaude": true,
  "allowGamma": false,
  "maxDataClass": "confidential",
  "requireRedaction": false,
  "requireHumanApprovalForExports": true,
  "promptResponseRetentionDays": 30
}'::jsonb)
WHERE lower(coalesce(tenant_key, name)) IN (
  'meridian',
  'meridian-health',
  'meridian health',
  'arcturus',
  'first-capital',
  'first capital'
);

CREATE TABLE IF NOT EXISTS public.tenant_policy_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  actor_id UUID,
  actor_label TEXT,
  prior_policy JSONB NOT NULL DEFAULT '{}'::jsonb,
  new_policy JSONB NOT NULL DEFAULT '{}'::jsonb,
  reason TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tenant_policy_audit_tenant_recent
  ON public.tenant_policy_audit(tenant_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.ai_egress_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  user_id UUID,
  workflow TEXT NOT NULL,
  artifact_id UUID,
  artifact_type TEXT,
  provider TEXT NOT NULL,
  model TEXT,
  route TEXT NOT NULL,
  data_class TEXT NOT NULL
    CHECK (data_class IN ('public', 'internal', 'confidential', 'restricted')),
  policy_decision TEXT NOT NULL
    CHECK (policy_decision IN ('allow', 'deny', 'redact_required', 'error')),
  decision_reason TEXT NOT NULL,
  prompt_hash TEXT,
  response_hash TEXT,
  prompt_snapshot_ref TEXT,
  response_snapshot_ref TEXT,
  request_metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ai_egress_audit_tenant_recent
  ON public.ai_egress_audit(tenant_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ai_egress_audit_workflow_recent
  ON public.ai_egress_audit(workflow, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ai_egress_audit_provider_recent
  ON public.ai_egress_audit(provider, created_at DESC);

ALTER TABLE public.tenant_policy_audit ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_egress_audit ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS service_role_all_tenant_policy_audit ON public.tenant_policy_audit;
CREATE POLICY service_role_all_tenant_policy_audit
  ON public.tenant_policy_audit
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS service_role_all_ai_egress_audit ON public.ai_egress_audit;
CREATE POLICY service_role_all_ai_egress_audit
  ON public.ai_egress_audit
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

DO $ai_egress_rls$
BEGIN
  IF to_regprocedure('can_read_tenant_by_id(uuid)') IS NOT NULL THEN
    DROP POLICY IF EXISTS authenticated_select_tenant_policy_audit ON public.tenant_policy_audit;
    CREATE POLICY authenticated_select_tenant_policy_audit
      ON public.tenant_policy_audit
      FOR SELECT TO authenticated
      USING (can_read_tenant_by_id(tenant_id));

    DROP POLICY IF EXISTS authenticated_select_ai_egress_audit ON public.ai_egress_audit;
    CREATE POLICY authenticated_select_ai_egress_audit
      ON public.ai_egress_audit
      FOR SELECT TO authenticated
      USING (can_read_tenant_by_id(tenant_id));
  ELSE
    RAISE NOTICE 'ai-egress-control-plane: can_read_tenant_by_id(uuid) absent; authenticated audit read policies skipped';
  END IF;
END
$ai_egress_rls$;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.tenant_policy_audit TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_egress_audit TO service_role;
GRANT SELECT ON public.tenant_policy_audit TO authenticated;
GRANT SELECT ON public.ai_egress_audit TO authenticated;

COMMENT ON COLUMN public.clients.ai_policy IS
  'Per-tenant AI egress policy. New tenants default to kernel-only mode; demo tenants are backfilled explicitly by migration 20260522170000.';

COMMENT ON TABLE public.ai_egress_audit IS
  'Synchronous audit ledger for every permitted, denied, or failed external AI egress attempt.';

NOTIFY pgrst, 'reload schema';

COMMIT;
