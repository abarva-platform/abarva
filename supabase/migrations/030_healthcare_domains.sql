-- Migration 030 · Healthcare vertical — Pack I Phase 2
-- Idempotent. Four domains: Revenue Cycle, Provider Operations, Clinical
-- Workflows, Patient Experience. Client-scoped, service-role RLS.

BEGIN;

-- ── 7 · Revenue Cycle ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS revenue_cycle_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  month DATE NOT NULL,
  total_claims_count INT,
  denial_rate_pct NUMERIC(5, 2),
  days_in_ar NUMERIC(5, 1),
  cost_per_claim_usd NUMERIC(8, 2),
  first_pass_resolution_rate_pct NUMERIC(5, 2),
  clean_claim_rate_pct NUMERIC(5, 2),
  net_collection_rate_pct NUMERIC(5, 2),
  is_demo_data BOOLEAN DEFAULT false,
  UNIQUE (client_id, month)
);
CREATE INDEX IF NOT EXISTS idx_rcm_client_month ON revenue_cycle_metrics(client_id, month DESC);

CREATE TABLE IF NOT EXISTS claims_denials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  denial_category TEXT CHECK (denial_category IN ('authorization','eligibility','coding','documentation','timely_filing','other')),
  month DATE NOT NULL,
  count INT,
  avg_value_usd NUMERIC(10, 2),
  recoverable_pct NUMERIC(5, 2),
  is_demo_data BOOLEAN DEFAULT false
);
CREATE INDEX IF NOT EXISTS idx_denials_client_month ON claims_denials(client_id, month DESC);

-- ── 8 · Provider Operations ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS clinical_units (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  unit_type TEXT CHECK (unit_type IN ('hospital','clinic','ed','or','icu','specialty')),
  location TEXT,
  staff_count INT,
  annual_patient_volume INT,
  is_demo_data BOOLEAN DEFAULT false
);
CREATE INDEX IF NOT EXISTS idx_clinical_units_client ON clinical_units(client_id);

CREATE TABLE IF NOT EXISTS provider_ops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  unit_id UUID REFERENCES clinical_units(id) ON DELETE SET NULL,
  month DATE NOT NULL,
  patient_throughput INT,
  avg_visit_minutes NUMERIC(5, 1),
  utilization_pct NUMERIC(5, 2),
  nurse_to_patient_ratio NUMERIC(4, 2),
  overtime_hours INT,
  is_demo_data BOOLEAN DEFAULT false
);
CREATE INDEX IF NOT EXISTS idx_provops_unit_month ON provider_ops(unit_id, month DESC);

-- ── 9 · Clinical Workflows ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS clinical_workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  workflow_name TEXT NOT NULL,
  specialty TEXT,
  total_steps INT,
  avg_documentation_minutes NUMERIC(5, 1),
  avg_turnaround_minutes NUMERIC(5, 1),
  clinician_satisfaction_score NUMERIC(3, 1),
  is_demo_data BOOLEAN DEFAULT false
);
CREATE INDEX IF NOT EXISTS idx_clinical_workflows_client ON clinical_workflows(client_id);

CREATE TABLE IF NOT EXISTS workflow_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id UUID NOT NULL REFERENCES clinical_workflows(id) ON DELETE CASCADE,
  step_order INT,
  step_name TEXT,
  avg_duration_minutes NUMERIC(5, 1),
  bottleneck_flag BOOLEAN DEFAULT false
);
CREATE INDEX IF NOT EXISTS idx_workflow_steps_wf ON workflow_steps(workflow_id, step_order);

-- ── 10 · Patient Experience ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS digital_channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  channel_type TEXT,
  monthly_active_users INT,
  is_demo_data BOOLEAN DEFAULT false
);

CREATE TABLE IF NOT EXISTS patient_experience (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  month DATE NOT NULL,
  channel_id UUID REFERENCES digital_channels(id) ON DELETE SET NULL,
  avg_wait_time_minutes NUMERIC(5, 1),
  appointment_conversion_rate_pct NUMERIC(5, 2),
  portal_adoption_pct NUMERIC(5, 2),
  nps_score NUMERIC(4, 1),
  hcahps_score NUMERIC(4, 1),
  is_demo_data BOOLEAN DEFAULT false
);
CREATE INDEX IF NOT EXISTS idx_px_client_month ON patient_experience(client_id, month DESC);

-- ── RLS ────────────────────────────────────────────────────────────────
ALTER TABLE revenue_cycle_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE claims_denials ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinical_units ENABLE ROW LEVEL SECURITY;
ALTER TABLE provider_ops ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinical_workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE digital_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_experience ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE t TEXT;
BEGIN
  FOR t IN SELECT unnest(ARRAY[
    'revenue_cycle_metrics','claims_denials','clinical_units','provider_ops',
    'clinical_workflows','workflow_steps','digital_channels','patient_experience'
  ]) LOOP
    EXECUTE format('DROP POLICY IF EXISTS "service_role_all" ON %I', t);
    EXECUTE format('CREATE POLICY "service_role_all" ON %I FOR ALL TO service_role USING (true) WITH CHECK (true)', t);
  END LOOP;
END $$;

NOTIFY pgrst, 'reload schema';

COMMIT;
