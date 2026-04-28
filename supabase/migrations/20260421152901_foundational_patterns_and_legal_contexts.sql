BEGIN;

CREATE TABLE IF NOT EXISTS foundational_pattern_packs (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  short_description TEXT,
  long_description TEXT,
  category TEXT,
  cross_industry BOOLEAN NOT NULL DEFAULT false,
  sector_applicability TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  variant_of TEXT,
  related_patterns TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  trigger_symptoms TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  detection_signals JSONB NOT NULL DEFAULT '[]'::jsonb,
  diagnostic_questions TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  evidence_requirements TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  likely_root_causes JSONB NOT NULL DEFAULT '[]'::jsonb,
  intervention_options JSONB NOT NULL DEFAULT '[]'::jsonb,
  anti_patterns TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  failure_modes TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  phase_1_deliverables TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  phase_2_deliverables TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  phase_3_deliverables TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  phase_4_deliverables TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  expected_outcomes TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  success_metrics JSONB NOT NULL DEFAULT '[]'::jsonb,
  required_sponsor_profile TEXT,
  evidence_base JSONB NOT NULL DEFAULT '[]'::jsonb,
  confidence_level TEXT NOT NULL DEFAULT 'medium',
  version TEXT NOT NULL DEFAULT '1.0',
  author TEXT NOT NULL DEFAULT 'AbarVa',
  raw_markdown TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS foundational_pattern_variants (
  id TEXT PRIMARY KEY,
  foundational_pattern_id TEXT NOT NULL REFERENCES foundational_pattern_packs(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  variant_pattern_pack_id TEXT REFERENCES pattern_packs(id) ON DELETE SET NULL,
  tenant_key TEXT NOT NULL,
  variant_name TEXT NOT NULL,
  sector TEXT NOT NULL,
  evidence_summary TEXT,
  linked_kpi_ids TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  sensitivities TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS foundational_pattern_variants_tenant_pattern_key
  ON foundational_pattern_variants(foundational_pattern_id, client_id);
CREATE INDEX IF NOT EXISTS idx_foundational_pattern_variants_client
  ON foundational_pattern_variants(client_id);

CREATE TABLE IF NOT EXISTS legal_privileged_contexts (
  id TEXT PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  context_description TEXT NOT NULL,
  privilege_type TEXT NOT NULL,
  duration TEXT NOT NULL,
  related_entities TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  access_scope_id TEXT REFERENCES access_scopes(id) ON DELETE SET NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

DO $$
BEGIN
  ALTER TABLE legal_privileged_contexts
    ADD CONSTRAINT legal_privileged_contexts_privilege_type_check CHECK (
      privilege_type IN ('attorney_client', 'work_product', 'regulatory_examination', 'litigation')
    );
EXCEPTION
  WHEN duplicate_object THEN NULL;
  WHEN duplicate_table THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE legal_privileged_contexts
    ADD CONSTRAINT legal_privileged_contexts_duration_check CHECK (
      duration IN ('active', 'historical')
    );
EXCEPTION
  WHEN duplicate_object THEN NULL;
  WHEN duplicate_table THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_legal_privileged_contexts_client
  ON legal_privileged_contexts(client_id);
CREATE INDEX IF NOT EXISTS idx_legal_privileged_contexts_scope
  ON legal_privileged_contexts(access_scope_id);

DROP TRIGGER IF EXISTS foundational_pattern_packs_set_updated_at ON foundational_pattern_packs;
CREATE TRIGGER foundational_pattern_packs_set_updated_at BEFORE UPDATE ON foundational_pattern_packs
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

DROP TRIGGER IF EXISTS foundational_pattern_variants_set_updated_at ON foundational_pattern_variants;
CREATE TRIGGER foundational_pattern_variants_set_updated_at BEFORE UPDATE ON foundational_pattern_variants
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

DROP TRIGGER IF EXISTS legal_privileged_contexts_set_updated_at ON legal_privileged_contexts;
CREATE TRIGGER legal_privileged_contexts_set_updated_at BEFORE UPDATE ON legal_privileged_contexts
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

ALTER TABLE foundational_pattern_packs ENABLE ROW LEVEL SECURITY;
ALTER TABLE foundational_pattern_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE legal_privileged_contexts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service_role_all_foundational_pattern_packs" ON foundational_pattern_packs;
CREATE POLICY "service_role_all_foundational_pattern_packs" ON foundational_pattern_packs
  FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "service_role_all_foundational_pattern_variants" ON foundational_pattern_variants;
CREATE POLICY "service_role_all_foundational_pattern_variants" ON foundational_pattern_variants
  FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "service_role_all_legal_privileged_contexts" ON legal_privileged_contexts;
CREATE POLICY "service_role_all_legal_privileged_contexts" ON legal_privileged_contexts
  FOR ALL TO service_role USING (true) WITH CHECK (true);

NOTIFY pgrst, 'reload schema';

COMMIT;
