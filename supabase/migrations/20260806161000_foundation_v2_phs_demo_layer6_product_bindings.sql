CREATE TABLE IF NOT EXISTS foundation_v2_phs_demo.layer6_app_module_bindings (
  binding_id text PRIMARY KEY,
  tenant_key text NOT NULL,
  test_namespace text NOT NULL,
  source_release_id text NOT NULL,
  module_key text NOT NULL CHECK (module_key IN ('source', 'home', 'intelligence', 'moves', 'tower', 'ava')),
  binding_version text NOT NULL,
  event_context_snapshot_id text,
  projection_authority_ids jsonb NOT NULL DEFAULT '[]'::jsonb,
  cube_views jsonb NOT NULL DEFAULT '[]'::jsonb,
  hero_step_keys jsonb NOT NULL DEFAULT '[]'::jsonb,
  readiness_status text NOT NULL CHECK (readiness_status IN ('bound', 'blocked')),
  caveats jsonb NOT NULL DEFAULT '[]'::jsonb,
  binding_hash text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_key, test_namespace, source_release_id, module_key, binding_version),
  FOREIGN KEY (event_context_snapshot_id, tenant_key, test_namespace)
    REFERENCES foundation_v2_phs_demo.event_context_snapshots(event_context_snapshot_id, tenant_key, test_namespace)
);

CREATE TABLE IF NOT EXISTS foundation_v2_phs_demo.layer6_hero_journey_findings (
  finding_id text PRIMARY KEY,
  tenant_key text NOT NULL,
  test_namespace text NOT NULL,
  source_release_id text NOT NULL,
  event_context_snapshot_id text NOT NULL,
  hero_step_key text NOT NULL,
  hero_step_order integer NOT NULL,
  hero_step_title text NOT NULL,
  product_modules jsonb NOT NULL DEFAULT '[]'::jsonb,
  projection_authority_ids jsonb NOT NULL DEFAULT '[]'::jsonb,
  cube_measures jsonb NOT NULL DEFAULT '[]'::jsonb,
  deterministic_result jsonb NOT NULL,
  finding_status text NOT NULL CHECK (finding_status IN ('supported', 'gap', 'blocked')),
  source_record_ids jsonb NOT NULL DEFAULT '[]'::jsonb,
  canonical_entity_ids jsonb NOT NULL DEFAULT '[]'::jsonb,
  canonical_relationship_ids jsonb NOT NULL DEFAULT '[]'::jsonb,
  finding_hash text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_key, test_namespace, source_release_id, hero_step_key),
  FOREIGN KEY (event_context_snapshot_id, tenant_key, test_namespace)
    REFERENCES foundation_v2_phs_demo.event_context_snapshots(event_context_snapshot_id, tenant_key, test_namespace)
);

CREATE TABLE IF NOT EXISTS foundation_v2_phs_demo.layer6_governed_narrative_artifacts (
  artifact_id text PRIMARY KEY,
  tenant_key text NOT NULL,
  test_namespace text NOT NULL,
  source_release_id text NOT NULL,
  event_context_snapshot_id text NOT NULL,
  artifact_kind text NOT NULL,
  artifact_title text NOT NULL,
  product_modules jsonb NOT NULL DEFAULT '[]'::jsonb,
  advisory_packet jsonb NOT NULL,
  narrative_sections jsonb NOT NULL,
  evidence_finding_ids jsonb NOT NULL DEFAULT '[]'::jsonb,
  generation_mode text NOT NULL CHECK (generation_mode IN ('deterministic-governed')),
  readiness_status text NOT NULL CHECK (readiness_status IN ('generated', 'blocked')),
  unsupported_claim_count integer NOT NULL DEFAULT 0,
  artifact_hash text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_key, test_namespace, source_release_id, artifact_kind),
  FOREIGN KEY (event_context_snapshot_id, tenant_key, test_namespace)
    REFERENCES foundation_v2_phs_demo.event_context_snapshots(event_context_snapshot_id, tenant_key, test_namespace)
);

CREATE TABLE IF NOT EXISTS foundation_v2_phs_demo.layer6_gate_results (
  gate_result_id text PRIMARY KEY,
  tenant_key text NOT NULL,
  test_namespace text NOT NULL,
  source_release_id text NOT NULL,
  layer6_version text NOT NULL,
  gate_key text NOT NULL,
  expected_count integer NOT NULL,
  actual_count integer NOT NULL,
  gate_status text NOT NULL CHECK (gate_status IN ('passed', 'failed')),
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_key, test_namespace, source_release_id, layer6_version, gate_key)
);

CREATE INDEX IF NOT EXISTS idx_phs_l6_bindings_module
  ON foundation_v2_phs_demo.layer6_app_module_bindings (tenant_key, test_namespace, module_key);

CREATE INDEX IF NOT EXISTS idx_phs_l6_findings_step
  ON foundation_v2_phs_demo.layer6_hero_journey_findings (tenant_key, test_namespace, hero_step_order);

CREATE INDEX IF NOT EXISTS idx_phs_l6_artifacts_kind
  ON foundation_v2_phs_demo.layer6_governed_narrative_artifacts (tenant_key, test_namespace, artifact_kind);

GRANT SELECT, INSERT, DELETE ON foundation_v2_phs_demo.layer6_app_module_bindings TO foundation_v2_phs_demo_writer;
GRANT SELECT, INSERT, DELETE ON foundation_v2_phs_demo.layer6_hero_journey_findings TO foundation_v2_phs_demo_writer;
GRANT SELECT, INSERT, DELETE ON foundation_v2_phs_demo.layer6_governed_narrative_artifacts TO foundation_v2_phs_demo_writer;
GRANT SELECT, INSERT, DELETE ON foundation_v2_phs_demo.layer6_gate_results TO foundation_v2_phs_demo_writer;

GRANT SELECT ON foundation_v2_phs_demo.layer6_app_module_bindings TO foundation_v2_phs_demo_reader;
GRANT SELECT ON foundation_v2_phs_demo.layer6_hero_journey_findings TO foundation_v2_phs_demo_reader;
GRANT SELECT ON foundation_v2_phs_demo.layer6_governed_narrative_artifacts TO foundation_v2_phs_demo_reader;
GRANT SELECT ON foundation_v2_phs_demo.layer6_gate_results TO foundation_v2_phs_demo_reader;

ALTER TABLE foundation_v2_phs_demo.layer6_app_module_bindings ENABLE ROW LEVEL SECURITY;
ALTER TABLE foundation_v2_phs_demo.layer6_hero_journey_findings ENABLE ROW LEVEL SECURITY;
ALTER TABLE foundation_v2_phs_demo.layer6_governed_narrative_artifacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE foundation_v2_phs_demo.layer6_gate_results ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS phs_l6_bindings_tenant_guard ON foundation_v2_phs_demo.layer6_app_module_bindings;
CREATE POLICY phs_l6_bindings_tenant_guard
  ON foundation_v2_phs_demo.layer6_app_module_bindings
  USING (tenant_key = current_setting('app.tenant_key', true))
  WITH CHECK (tenant_key = current_setting('app.tenant_key', true));

DROP POLICY IF EXISTS phs_l6_findings_tenant_guard ON foundation_v2_phs_demo.layer6_hero_journey_findings;
CREATE POLICY phs_l6_findings_tenant_guard
  ON foundation_v2_phs_demo.layer6_hero_journey_findings
  USING (tenant_key = current_setting('app.tenant_key', true))
  WITH CHECK (tenant_key = current_setting('app.tenant_key', true));

DROP POLICY IF EXISTS phs_l6_artifacts_tenant_guard ON foundation_v2_phs_demo.layer6_governed_narrative_artifacts;
CREATE POLICY phs_l6_artifacts_tenant_guard
  ON foundation_v2_phs_demo.layer6_governed_narrative_artifacts
  USING (tenant_key = current_setting('app.tenant_key', true))
  WITH CHECK (tenant_key = current_setting('app.tenant_key', true));

DROP POLICY IF EXISTS phs_l6_gates_tenant_guard ON foundation_v2_phs_demo.layer6_gate_results;
CREATE POLICY phs_l6_gates_tenant_guard
  ON foundation_v2_phs_demo.layer6_gate_results
  USING (tenant_key = current_setting('app.tenant_key', true))
  WITH CHECK (tenant_key = current_setting('app.tenant_key', true));

COMMENT ON TABLE foundation_v2_phs_demo.layer6_app_module_bindings IS
  'Layer 6 module binding map: Source, Home, Intelligence, Moves, Tower, and aVa consume typed Layer 4/5 business-grain projections, never generic observations.';

COMMENT ON TABLE foundation_v2_phs_demo.layer6_hero_journey_findings IS
  'Layer 6 deterministic hero-journey findings generated from typed PHS canary tables and immutable event-context snapshot.';

COMMENT ON TABLE foundation_v2_phs_demo.layer6_governed_narrative_artifacts IS
  'Layer 6 governed narrative artifacts generated only after deterministic findings and Cube reconciliation proof pass.';
