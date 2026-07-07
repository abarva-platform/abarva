-- S4 · context refresh-event ledger

CREATE TABLE IF NOT EXISTS context_refresh_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id TEXT NOT NULL,
  tenant_key TEXT NOT NULL,
  triggered_by TEXT NOT NULL CHECK (triggered_by IN ('csv_upload','source_artifact','move_artifact','manual','api_sync')),
  source_id UUID,
  source_label TEXT,
  period_label TEXT,
  rows_seen INT NOT NULL DEFAULT 0,
  rows_accepted INT NOT NULL DEFAULT 0,
  rows_rejected INT NOT NULL DEFAULT 0,
  facts_created INT NOT NULL DEFAULT 0,
  facts_updated INT NOT NULL DEFAULT 0,
  facts_superseded INT NOT NULL DEFAULT 0,
  approval_required BOOLEAN NOT NULL DEFAULT false,
  affected_surfaces TEXT[] NOT NULL DEFAULT '{}',
  receipt_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cre_tenant
  ON context_refresh_events(tenant_key, created_at DESC);

ALTER TABLE context_refresh_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS svc_all ON context_refresh_events;
CREATE POLICY svc_all ON context_refresh_events
  FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS auth_read ON context_refresh_events;
CREATE POLICY auth_read ON context_refresh_events
  FOR SELECT TO authenticated USING (can_read_tenant_by_key(tenant_key));

DROP POLICY IF EXISTS auth_insert ON context_refresh_events;
CREATE POLICY auth_insert ON context_refresh_events
  FOR INSERT TO authenticated WITH CHECK (can_write_tenant_by_key(tenant_key));

DROP POLICY IF EXISTS auth_update ON context_refresh_events;
CREATE POLICY auth_update ON context_refresh_events
  FOR UPDATE TO authenticated USING (can_write_tenant_by_key(tenant_key)) WITH CHECK (can_write_tenant_by_key(tenant_key));

DROP POLICY IF EXISTS auth_delete ON context_refresh_events;
CREATE POLICY auth_delete ON context_refresh_events
  FOR DELETE TO authenticated USING (can_write_tenant_by_key(tenant_key));

GRANT SELECT, INSERT, UPDATE, DELETE ON context_refresh_events TO authenticated;
