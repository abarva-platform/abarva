-- Data inventory audit-log compatibility substrate.
--
-- Live VNet remediation on 2026-06-21 proved the setup graph and
-- data_ingestion_runs compatibility migration applied, then the Northstar
-- loader failed because public.data_inventory_audit_log was absent. Runtime
-- setup loaders use this table as the segment-level audit trail. This migration
-- is additive only and does not mutate tenant rows.

BEGIN;

CREATE TABLE IF NOT EXISTS public.data_inventory_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  tenant_key TEXT NOT NULL,
  actor_id TEXT,
  actor_role TEXT NOT NULL DEFAULT 'system_import',
  action TEXT NOT NULL,
  segment_id TEXT,
  record_id TEXT,
  before_state JSONB,
  after_state JSONB,
  classification_at_action TEXT,
  source_doc TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_data_inventory_audit_tenant_created
  ON public.data_inventory_audit_log(tenant_key, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_data_inventory_audit_segment
  ON public.data_inventory_audit_log(tenant_key, segment_id);

ALTER TABLE public.data_inventory_audit_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service_role_all_data_inventory_audit_log" ON public.data_inventory_audit_log;
CREATE POLICY "service_role_all_data_inventory_audit_log"
  ON public.data_inventory_audit_log FOR ALL TO service_role
  USING (true) WITH CHECK (true);

NOTIFY pgrst, 'reload schema';

COMMIT;
