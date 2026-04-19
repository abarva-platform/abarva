-- Migration 037 · Pack K — Helix Therapeutics client seed + cross-client partnership table
-- Idempotent.

BEGIN;

-- Insert Helix client row (composite $22B biotech). ON CONFLICT skip so
-- re-runs are safe. Client name is NOT on the forbidden list.
INSERT INTO clients (name, legal_name, industry_code, annual_revenue_usd, it_budget_usd, ai_budget_usd, employee_count, operational_units, business_description)
VALUES (
  'Helix Therapeutics',
  'Helix Therapeutics, Inc.',
  'HEALTHCARE_IDN',
  22000000000,
  420000000,
  95000000,
  18000,
  6,
  '$22B mid-cap biotech · 14 approved drugs · 280 pipeline compounds (Phase 1-4) · 340 active trials · 6 manufacturing sites · HQ US East Coast with research hubs in Basel + Singapore + Cambridge MA'
)
ON CONFLICT (name) DO UPDATE SET
  legal_name = EXCLUDED.legal_name,
  industry_code = EXCLUDED.industry_code,
  annual_revenue_usd = EXCLUDED.annual_revenue_usd,
  it_budget_usd = EXCLUDED.it_budget_usd,
  ai_budget_usd = EXCLUDED.ai_budget_usd,
  employee_count = EXCLUDED.employee_count,
  operational_units = EXCLUDED.operational_units,
  business_description = EXCLUDED.business_description;

-- Cross-client partnership relationships (Pack K section 'Shared touchpoints').
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
