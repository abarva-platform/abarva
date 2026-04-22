-- Migration 034 · Pack H Phase 1 — enterprise-scale data model extensions
-- Idempotent. Adds tech stack / projects / staff aug / volumetrics + extends
-- clients with financial profile columns.
-- Spec originally numbered 027 but 029-032 (Pack I) already shipped; this
-- keeps sequential ordering.

BEGIN;

-- ── Tech stack — every vendor the client uses, not just AI ─────────────
CREATE TABLE IF NOT EXISTS tech_stack_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  category TEXT NOT NULL CHECK (category IN (
    'hardware','infrastructure','platform','business_app',
    'data_platform','security','collaboration','dev_tools',
    'ai_platform','ai_model','service','staff_aug'
  )),
  vendor_name TEXT NOT NULL,
  product_name TEXT,
  deployment_model TEXT CHECK (deployment_model IN ('on_prem','saas','hybrid','cloud_managed','service_contract')),
  annual_spend_usd NUMERIC(14, 2),
  contract_start DATE,
  contract_end DATE,
  seat_count INT,
  owning_function TEXT,
  touches_ai BOOLEAN DEFAULT false,
  status TEXT CHECK (status IN ('active','in_procurement','sunsetting','terminated')) DEFAULT 'active',
  notes TEXT,
  is_demo_data BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_tech_stack_client ON tech_stack_items(client_id);
CREATE INDEX IF NOT EXISTS idx_tech_stack_category ON tech_stack_items(category);
CREATE INDEX IF NOT EXISTS idx_tech_stack_ai ON tech_stack_items(touches_ai) WHERE touches_ai = true;

-- ── Technology projects ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tech_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  program_domain TEXT,
  status TEXT CHECK (status IN ('ideation','approved','in_flight','stabilizing','completed','paused','cancelled')),
  start_date DATE,
  planned_end_date DATE,
  total_budget_usd NUMERIC(14, 2),
  spent_to_date_usd NUMERIC(14, 2),
  exec_sponsor TEXT,
  touches_ai BOOLEAN DEFAULT false,
  linked_use_case_ids UUID[],
  is_demo_data BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_tech_projects_client ON tech_projects(client_id);
CREATE INDEX IF NOT EXISTS idx_tech_projects_status ON tech_projects(status);

-- ── Staff augmentation — contractors, SI engagements, managed services ─
CREATE TABLE IF NOT EXISTS staff_augmentation (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  vendor_name TEXT NOT NULL,
  engagement_type TEXT CHECK (engagement_type IN ('staff_aug','managed_service','fixed_bid','retainer')),
  function_area TEXT,
  headcount_fte INT,
  annual_spend_usd NUMERIC(14, 2),
  contract_start DATE,
  contract_end DATE,
  touches_ai BOOLEAN DEFAULT false,
  notes TEXT,
  is_demo_data BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_staff_aug_client ON staff_augmentation(client_id);

-- ── Volumetrics — daily rollups of API/token/storage/query counts ──────
CREATE TABLE IF NOT EXISTS volumetrics_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  snapshot_date DATE NOT NULL,
  api_calls_millions NUMERIC(10, 2),
  tokens_billions NUMERIC(10, 2),
  storage_tb NUMERIC(10, 2),
  queries_millions NUMERIC(10, 2),
  active_models INT,
  data_pipelines INT,
  is_demo_data BOOLEAN DEFAULT false,
  UNIQUE (client_id, snapshot_date)
);
CREATE INDEX IF NOT EXISTS idx_volumetrics_client_date ON volumetrics_snapshots(client_id, snapshot_date DESC);

-- ── Clients · financial profile columns ────────────────────────────────
ALTER TABLE clients ADD COLUMN IF NOT EXISTS annual_revenue_usd NUMERIC(14, 2);
ALTER TABLE clients ADD COLUMN IF NOT EXISTS it_budget_usd NUMERIC(14, 2);
ALTER TABLE clients ADD COLUMN IF NOT EXISTS ai_budget_usd NUMERIC(14, 2);
ALTER TABLE clients ADD COLUMN IF NOT EXISTS employee_count INT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS operational_units INT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS business_description TEXT;

-- ── RLS (service-role only, matches tower tables) ──────────────────────
ALTER TABLE tech_stack_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE tech_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_augmentation ENABLE ROW LEVEL SECURITY;
ALTER TABLE volumetrics_snapshots ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE t TEXT;
BEGIN
  FOR t IN SELECT unnest(ARRAY[
    'tech_stack_items','tech_projects','staff_augmentation','volumetrics_snapshots'
  ]) LOOP
    EXECUTE format('DROP POLICY IF EXISTS "service_role_all" ON %I', t);
    EXECUTE format('CREATE POLICY "service_role_all" ON %I FOR ALL TO service_role USING (true) WITH CHECK (true)', t);
  END LOOP;
END $$;

NOTIFY pgrst, 'reload schema';

COMMIT;
