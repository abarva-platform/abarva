-- S5 · Context Explorer answer audit

CREATE TABLE IF NOT EXISTS context_explorer_answer_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id TEXT NOT NULL,
  tenant_key TEXT NOT NULL,
  question TEXT NOT NULL,
  route_used TEXT NOT NULL,
  answer_text TEXT NOT NULL,
  citation_count INT NOT NULL DEFAULT 0,
  facts_used UUID[] NOT NULL DEFAULT '{}',
  chunks_used UUID[] NOT NULL DEFAULT '{}',
  confidence TEXT CHECK (confidence IS NULL OR confidence IN ('high','medium','low','none')),
  freshness_status TEXT CHECK (freshness_status IS NULL OR freshness_status IN ('fresh','attention','stale','unknown')),
  missing_context TEXT[] NOT NULL DEFAULT '{}',
  view_directive JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_context_answer_audit_tenant
  ON context_explorer_answer_audit(tenant_key, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_context_answer_audit_client
  ON context_explorer_answer_audit(client_id, created_at DESC);

ALTER TABLE context_explorer_answer_audit ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS svc_all ON context_explorer_answer_audit;
CREATE POLICY svc_all ON context_explorer_answer_audit
  FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS auth_read ON context_explorer_answer_audit;
CREATE POLICY auth_read ON context_explorer_answer_audit
  FOR SELECT TO authenticated USING (can_read_tenant_by_key(tenant_key));

DROP POLICY IF EXISTS auth_insert ON context_explorer_answer_audit;
CREATE POLICY auth_insert ON context_explorer_answer_audit
  FOR INSERT TO authenticated WITH CHECK (can_write_tenant_by_key(tenant_key));

GRANT SELECT, INSERT ON context_explorer_answer_audit TO authenticated;
