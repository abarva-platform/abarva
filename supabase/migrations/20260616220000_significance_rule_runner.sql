-- S3 · significance-rule runner support
-- Adds the uniqueness contract required by the deterministic evaluator upsert.

CREATE UNIQUE INDEX IF NOT EXISTS context_insights_tenant_rule_entity_key
  ON context_insights (tenant_key, rule_id, entity_name)
  WHERE entity_name IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_context_insights_tenant_updated
  ON context_insights (tenant_key, updated_at DESC);
