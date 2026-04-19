-- Migration 031 · Financial Services vertical — Pack I Phase 3
-- Idempotent. Four domains: Claims/Risk/Underwriting, Fraud/AML,
-- Customer Service/Call Center, Digital Banking/CX.

BEGIN;

-- ── 11 · Claims / Risk / Underwriting ──────────────────────────────────
CREATE TABLE IF NOT EXISTS underwriting_workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  workflow_name TEXT NOT NULL,
  avg_processing_days NUMERIC(5, 1),
  approval_rate_pct NUMERIC(5, 2),
  avg_loss_rate_pct NUMERIC(5, 2),
  is_demo_data BOOLEAN DEFAULT false
);
CREATE INDEX IF NOT EXISTS idx_uw_workflows_client ON underwriting_workflows(client_id);

CREATE TABLE IF NOT EXISTS claims_risk (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  month DATE NOT NULL,
  total_claims_count INT,
  avg_claim_value_usd NUMERIC(10, 2),
  fraud_rate_pct NUMERIC(5, 2),
  processing_time_days NUMERIC(5, 1),
  straight_through_pct NUMERIC(5, 2),
  is_demo_data BOOLEAN DEFAULT false,
  UNIQUE (client_id, month)
);

-- ── 12 · Fraud / AML ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS fraud_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  month DATE NOT NULL,
  transactions_analyzed_millions NUMERIC(10, 2),
  alerts_generated_thousands NUMERIC(8, 1),
  false_positive_rate_pct NUMERIC(5, 2),
  fraud_loss_usd_thousands NUMERIC(10, 2),
  fraud_recovery_rate_pct NUMERIC(5, 2),
  detection_rate_pct NUMERIC(5, 2),
  is_demo_data BOOLEAN DEFAULT false,
  UNIQUE (client_id, month)
);

CREATE TABLE IF NOT EXISTS aml_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  month DATE NOT NULL,
  alerts_generated INT,
  sar_filed INT,
  investigation_hours_avg NUMERIC(6, 1),
  sla_adherence_pct NUMERIC(5, 2),
  is_demo_data BOOLEAN DEFAULT false
);
CREATE INDEX IF NOT EXISTS idx_aml_client_month ON aml_alerts(client_id, month DESC);

-- ── 13 · Customer Service / Call Center ────────────────────────────────
CREATE TABLE IF NOT EXISTS call_center_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  month DATE NOT NULL,
  total_contacts_thousands NUMERIC(8, 1),
  aht_seconds NUMERIC(6, 1),
  first_contact_resolution_pct NUMERIC(5, 2),
  csat_score NUMERIC(3, 1),
  agent_fte_count INT,
  automation_rate_pct NUMERIC(5, 2),
  transfer_rate_pct NUMERIC(5, 2),
  is_demo_data BOOLEAN DEFAULT false,
  UNIQUE (client_id, month)
);

CREATE TABLE IF NOT EXISTS tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  category TEXT,
  month DATE NOT NULL,
  count INT,
  avg_resolution_hours NUMERIC(6, 1),
  is_demo_data BOOLEAN DEFAULT false
);
CREATE INDEX IF NOT EXISTS idx_tickets_client_month ON tickets(client_id, month DESC);

-- ── 14 · Digital Banking / CX ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS digital_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  month DATE NOT NULL,
  channel TEXT CHECK (channel IN ('mobile_app','web_portal','chat','api')),
  mau_thousands NUMERIC(8, 1),
  dau_thousands NUMERIC(8, 1),
  session_count_millions NUMERIC(10, 2),
  conversion_rate_pct NUMERIC(5, 2),
  retention_30d_pct NUMERIC(5, 2),
  is_demo_data BOOLEAN DEFAULT false,
  UNIQUE (client_id, month, channel)
);

CREATE TABLE IF NOT EXISTS journeys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  journey_name TEXT,
  avg_completion_minutes NUMERIC(6, 1),
  drop_off_rate_pct NUMERIC(5, 2),
  is_demo_data BOOLEAN DEFAULT false
);
CREATE INDEX IF NOT EXISTS idx_journeys_client ON journeys(client_id);

-- ── RLS ────────────────────────────────────────────────────────────────
ALTER TABLE underwriting_workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE claims_risk ENABLE ROW LEVEL SECURITY;
ALTER TABLE fraud_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE aml_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE call_center_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE digital_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE journeys ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE t TEXT;
BEGIN
  FOR t IN SELECT unnest(ARRAY[
    'underwriting_workflows','claims_risk','fraud_metrics','aml_alerts',
    'call_center_metrics','tickets','digital_metrics','journeys'
  ]) LOOP
    EXECUTE format('DROP POLICY IF EXISTS "service_role_all" ON %I', t);
    EXECUTE format('CREATE POLICY "service_role_all" ON %I FOR ALL TO service_role USING (true) WITH CHECK (true)', t);
  END LOOP;
END $$;

NOTIFY pgrst, 'reload schema';

COMMIT;
