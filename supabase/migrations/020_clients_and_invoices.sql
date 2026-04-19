-- Migration 020 · clients + invoices + engagements.client_id
-- Seeds the 3 demo clients and backfills existing engagement client_id.

BEGIN;

CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  legal_name TEXT,
  billing_email TEXT,
  stripe_customer_id TEXT UNIQUE,
  industry_code TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS clients_set_updated_at ON clients;
CREATE TRIGGER clients_set_updated_at BEFORE UPDATE ON clients
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

ALTER TABLE engagements ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES clients(id);

-- Seed demo clients (idempotent by name — not using a unique constraint
-- since name collisions across real clients are plausible, but safe here)
INSERT INTO clients (name, legal_name, industry_code)
SELECT 'Meridian Health', 'Meridian Health System, Inc.', 'HEALTHCARE_IDN'
WHERE NOT EXISTS (SELECT 1 FROM clients WHERE name = 'Meridian Health');

INSERT INTO clients (name, legal_name, industry_code)
SELECT 'First Capital', 'First Capital Financial Corporation', 'FINSERV'
WHERE NOT EXISTS (SELECT 1 FROM clients WHERE name = 'First Capital');

INSERT INTO clients (name, legal_name, industry_code)
SELECT 'Apex Retail', 'Apex Retail Group LLC', 'RETAIL'
WHERE NOT EXISTS (SELECT 1 FROM clients WHERE name = 'Apex Retail');

UPDATE engagements SET client_id = (SELECT id FROM clients WHERE name = 'Meridian Health')
WHERE graph_node_id = 'eng_meridian_analytics_mod' AND client_id IS NULL;

UPDATE engagements SET client_id = (SELECT id FROM clients WHERE name = 'First Capital')
WHERE graph_node_id = 'eng_arcturus_wealth_platform' AND client_id IS NULL;

UPDATE engagements SET client_id = (SELECT id FROM clients WHERE name = 'Apex Retail')
WHERE graph_node_id = 'eng_apex_retail_hr_erp' AND client_id IS NULL;

CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  engagement_id UUID NOT NULL REFERENCES engagements(id),
  client_id UUID NOT NULL REFERENCES clients(id),
  stripe_invoice_id TEXT UNIQUE,
  amount_usd NUMERIC(14,2) NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('draft','sent','paid','overdue','cancelled','uncollectible')),
  issued_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  due_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS invoices_set_updated_at ON invoices;
CREATE TRIGGER invoices_set_updated_at BEFORE UPDATE ON invoices
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE INDEX IF NOT EXISTS idx_invoices_engagement ON invoices(engagement_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);

-- Allow 'invoiced' as a valid outcome_fee_status
ALTER TABLE engagements DROP CONSTRAINT IF EXISTS engagements_outcome_fee_status_check;
ALTER TABLE engagements ADD CONSTRAINT engagements_outcome_fee_status_check
  CHECK (outcome_fee_status IN ('not_triggered','proposed','approved','invoiced','paid'));

NOTIFY pgrst, 'reload schema';

COMMIT;
