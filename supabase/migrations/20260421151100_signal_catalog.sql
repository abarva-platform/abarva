-- Tower W3 · signal_catalog
-- Catalog of signal types, routing defaults, and evidence requirements.

BEGIN;

CREATE TABLE IF NOT EXISTS signal_catalog (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL,
  title TEXT NOT NULL,
  pillar TEXT NOT NULL
    CHECK (pillar IN ('inventory','adoption','value','risk','cost','cross_pillar')),
  description TEXT,
  default_severity TEXT NOT NULL
    CHECK (default_severity IN ('critical','warning','info')),
  state_model JSONB NOT NULL DEFAULT '["new","triaged","actioned","resolved","suppressed"]'::jsonb,
  evidence_schema JSONB NOT NULL DEFAULT '{}'::jsonb,
  routing_defaults JSONB NOT NULL DEFAULT '{}'::jsonb,
  recommended_pattern_keys TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  rule_logic JSONB NOT NULL DEFAULT '{}'::jsonb,
  rule_version INT NOT NULL DEFAULT 1,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS signal_catalog_key_key
  ON signal_catalog(key);
CREATE INDEX IF NOT EXISTS idx_signal_catalog_pillar_active
  ON signal_catalog(pillar, active);

DROP TRIGGER IF EXISTS signal_catalog_set_updated_at ON signal_catalog;
CREATE TRIGGER signal_catalog_set_updated_at BEFORE UPDATE ON signal_catalog
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

ALTER TABLE signal_catalog ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service_role_all_signal_catalog" ON signal_catalog;
CREATE POLICY "service_role_all_signal_catalog" ON signal_catalog
  FOR ALL TO service_role USING (true) WITH CHECK (true);

NOTIFY pgrst, 'reload schema';

COMMIT;
