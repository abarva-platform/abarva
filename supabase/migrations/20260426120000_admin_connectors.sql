-- ADMIN-DATA10 · admin_connectors
-- Per-tenant admin connector inventory: ERP, spend, contract mgmt, identity, etc.
-- Sourced from ADMIN-DATA1 audit §3.1. Tenant-scoped via clients(id), service-role-only RLS.
-- Bridges to data_integrations(id) for live health lookup without duplicating health storage.

BEGIN;

CREATE TABLE IF NOT EXISTS admin_connectors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (kind IN (
    'erp', 'spend_analytics', 'contract_management', 'identity',
    'data_warehouse', 'crm', 'observability', 'ticketing', 'other'
  )),
  vendor TEXT,
  label TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN (
    'not_configured', 'configured_stub', 'blocked', 'deferred', 'active'
  )),
  config_schema JSONB DEFAULT '{}'::jsonb,
  data_integration_id UUID REFERENCES data_integrations(id) ON DELETE SET NULL,
  last_sync_attempt TIMESTAMPTZ,
  required_for_pilot BOOLEAN NOT NULL DEFAULT false,
  required_for_production BOOLEAN NOT NULL DEFAULT true,
  blocker_reason TEXT,
  steward_guidance TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_admin_connectors_client
  ON admin_connectors(client_id);
CREATE INDEX IF NOT EXISTS idx_admin_connectors_status
  ON admin_connectors(client_id, status);
CREATE INDEX IF NOT EXISTS idx_admin_connectors_kind
  ON admin_connectors(client_id, kind);

ALTER TABLE admin_connectors ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service_role_all_admin_connectors" ON admin_connectors;
CREATE POLICY "service_role_all_admin_connectors" ON admin_connectors
  FOR ALL TO service_role USING (true) WITH CHECK (true);

NOTIFY pgrst, 'reload schema';

COMMIT;
