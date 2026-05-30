-- Migration · tower_cloud_cost
-- Slice S10 — Azure Cost Management ingest target.
--
-- Source: Azure Cost Management — monthly cloud spend per workload/program.
-- Tag-based program allocation is first-class; tag_program rolls untagged
-- rows into '__untagged__' so portfolio-level math stays honest.
--
-- Idempotency: the natural key is
--   (client_id, subscription_id, resource_group, resource_name, service, meter_category, period_start)
-- The ingest CLI upserts on that key — re-running a month overwrites.

BEGIN;

CREATE TABLE IF NOT EXISTS tower_cloud_cost (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,

  -- Azure shape
  subscription_id TEXT NOT NULL,
  resource_group TEXT NOT NULL,
  resource_name TEXT NOT NULL DEFAULT '',
  service TEXT NOT NULL DEFAULT '',
  meter_category TEXT NOT NULL DEFAULT '',
  location TEXT NOT NULL DEFAULT '',

  -- Tag-based allocation (first-class)
  tag_program TEXT NOT NULL DEFAULT '__untagged__',
  tag_environment TEXT NOT NULL DEFAULT 'unspecified',

  -- Period
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,

  -- Money
  monthly_cost_usd NUMERIC(14,2) NOT NULL CHECK (monthly_cost_usd >= 0),
  currency TEXT NOT NULL DEFAULT 'USD' CHECK (currency = 'USD'),

  -- Provenance
  source TEXT NOT NULL DEFAULT 'azure-cost',
  source_file_id UUID,
  ingested_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT tower_cloud_cost_period_order CHECK (period_end >= period_start)
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_tower_cloud_cost_natural_key
  ON tower_cloud_cost (
    client_id,
    subscription_id,
    resource_group,
    resource_name,
    service,
    meter_category,
    period_start
  );

CREATE INDEX IF NOT EXISTS idx_tower_cloud_cost_client_program
  ON tower_cloud_cost (client_id, tag_program, period_start DESC);

CREATE INDEX IF NOT EXISTS idx_tower_cloud_cost_client_subscription
  ON tower_cloud_cost (client_id, subscription_id, period_start DESC);

CREATE INDEX IF NOT EXISTS idx_tower_cloud_cost_client_period
  ON tower_cloud_cost (client_id, period_start);

-- Service-role-only RLS posture (mirrors tower_data_model 022 until per-user
-- RLS extends to this table).
ALTER TABLE tower_cloud_cost ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY tower_cloud_cost_service_role ON tower_cloud_cost
    FOR ALL TO service_role USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

COMMIT;
