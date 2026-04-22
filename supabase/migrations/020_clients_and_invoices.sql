-- Migration 020 · clients + invoices + engagements.client_id
-- Schema-only migration. Demo client seed/backfill moved to
-- 050_client_seed_and_backfill.sql.

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

-- Defensive column adds — if clients was created by a prior migration with a
-- narrower schema, CREATE TABLE IF NOT EXISTS above is a no-op and we need
-- to ensure the billing columns exist before the INSERTs below.
ALTER TABLE clients ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS legal_name TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS billing_email TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS industry_code TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now();
ALTER TABLE clients ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

CREATE UNIQUE INDEX IF NOT EXISTS clients_name_key ON clients(name);
CREATE UNIQUE INDEX IF NOT EXISTS clients_stripe_customer_id_key ON clients(stripe_customer_id);

DROP TRIGGER IF EXISTS clients_set_updated_at ON clients;
CREATE TRIGGER clients_set_updated_at BEFORE UPDATE ON clients
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

ALTER TABLE engagements ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES clients(id);

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

ALTER TABLE invoices ADD COLUMN IF NOT EXISTS engagement_id UUID REFERENCES engagements(id);
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES clients(id);
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS stripe_invoice_id TEXT;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS amount_usd NUMERIC(14,2);
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS status TEXT;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS issued_at TIMESTAMPTZ NOT NULL DEFAULT now();
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS due_at TIMESTAMPTZ;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now();
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

CREATE UNIQUE INDEX IF NOT EXISTS invoices_stripe_invoice_id_key ON invoices(stripe_invoice_id);

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
