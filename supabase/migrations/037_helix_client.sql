-- Migration 037 · Pack K — client_partnerships table for Helix↔Meridian relationships
-- Idempotent. Helix Therapeutics client row inserted separately via
-- src/scripts/insert-helix-client.ts (clients.name has no UNIQUE constraint,
-- so DDL-side ON CONFLICT isn't available here).

BEGIN;

CREATE TABLE IF NOT EXISTS client_partnerships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  target_client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  relationship_type TEXT NOT NULL CHECK (relationship_type IN (
    'clinical_trials','rwe_license','msl_engagement','patient_recruitment',
    'shared_vendor','formulary','medical_info','research_partnership'
  )),
  detail JSONB NOT NULL DEFAULT '{}'::jsonb,
  annual_value_usd NUMERIC(14, 2),
  is_demo_data BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (source_client_id, target_client_id, relationship_type)
);

CREATE INDEX IF NOT EXISTS idx_partnerships_source ON client_partnerships(source_client_id);
CREATE INDEX IF NOT EXISTS idx_partnerships_target ON client_partnerships(target_client_id);

ALTER TABLE client_partnerships ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "service_role_all" ON client_partnerships;
CREATE POLICY "service_role_all" ON client_partnerships FOR ALL TO service_role USING (true) WITH CHECK (true);

NOTIFY pgrst, 'reload schema';

COMMIT;
