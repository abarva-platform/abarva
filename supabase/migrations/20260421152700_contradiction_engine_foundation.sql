-- Contradiction engine foundation
-- Extends the existing Tower contradictions table into the north-star
-- contradiction model while keeping legacy readers working.

BEGIN;

-- Expand the existing contradictions table without breaking prior Tower use.
ALTER TABLE contradictions DROP CONSTRAINT IF EXISTS contradictions_contradiction_type_check;
ALTER TABLE contradictions DROP CONSTRAINT IF EXISTS contradictions_severity_check;

ALTER TABLE contradictions
  ADD COLUMN IF NOT EXISTS summary TEXT,
  ADD COLUMN IF NOT EXISTS impact JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS short_title TEXT,
  ADD COLUMN IF NOT EXISTS long_description TEXT,
  ADD COLUMN IF NOT EXISTS category TEXT,
  ADD COLUMN IF NOT EXISTS subcategory TEXT,
  ADD COLUMN IF NOT EXISTS temporal_state TEXT,
  ADD COLUMN IF NOT EXISTS severity_label TEXT,
  ADD COLUMN IF NOT EXISTS confidence_level TEXT,
  ADD COLUMN IF NOT EXISTS sensitivity TEXT,
  ADD COLUMN IF NOT EXISTS stakes_score INT,
  ADD COLUMN IF NOT EXISTS stakes_components JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS evidence_ids TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN IF NOT EXISTS source_count INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS implicated_priority_refs TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN IF NOT EXISTS implicated_initiative_refs TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN IF NOT EXISTS implicated_person_ids UUID[] NOT NULL DEFAULT ARRAY[]::UUID[],
  ADD COLUMN IF NOT EXISTS implicated_kpi_ids TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN IF NOT EXISTS implicated_external_event_ids TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN IF NOT EXISTS related_pattern_ids TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN IF NOT EXISTS first_detected_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS last_refreshed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS last_evidence_change_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS resolution_state TEXT,
  ADD COLUMN IF NOT EXISTS resolution_evidence_ids TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN IF NOT EXISTS reasoning_scope_id TEXT REFERENCES access_scopes(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS disclosure_scope_id TEXT REFERENCES access_scopes(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS suppress_until TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS surfacing_priority INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS recommended_conversation_context TEXT,
  ADD COLUMN IF NOT EXISTS detection_rule_id TEXT,
  ADD COLUMN IF NOT EXISTS detection_run_id UUID,
  ADD COLUMN IF NOT EXISTS created_by TEXT NOT NULL DEFAULT 'automated',
  ADD COLUMN IF NOT EXISTS reviewer_notes JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

DO $$
BEGIN
  ALTER TABLE contradictions
    ADD CONSTRAINT contradictions_contradiction_type_check CHECK (
      contradiction_type IN (
        'cost_vs_adoption','value_vs_adoption','value_vs_baseline',
        'risk_vs_value','risk_vs_data','shadow_ai','stalled','cost_trajectory',
        'strategy_allocation','commitment_pace','sponsor_behavior',
        'budget_priority','external_internal_messaging'
      )
    );
EXCEPTION
  WHEN duplicate_object THEN NULL;
  WHEN duplicate_table THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE contradictions
    ADD CONSTRAINT contradictions_severity_check CHECK (
      severity IN ('high','medium','low')
    );
EXCEPTION
  WHEN duplicate_object THEN NULL;
  WHEN duplicate_table THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE contradictions
    ADD CONSTRAINT contradictions_category_check CHECK (
      category IS NULL OR category IN (
        'A_strategy_allocation',
        'B_commitment_pace',
        'C_sponsor_behavior',
        'D_budget_priority',
        'E_external_internal_messaging'
      )
    );
EXCEPTION
  WHEN duplicate_object THEN NULL;
  WHEN duplicate_table THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE contradictions
    ADD CONSTRAINT contradictions_temporal_state_check CHECK (
      temporal_state IS NULL OR temporal_state IN ('acute','persistent','widening','narrowing')
    );
EXCEPTION
  WHEN duplicate_object THEN NULL;
  WHEN duplicate_table THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE contradictions
    ADD CONSTRAINT contradictions_severity_label_check CHECK (
      severity_label IS NULL OR severity_label IN ('material','significant','minor')
    );
EXCEPTION
  WHEN duplicate_object THEN NULL;
  WHEN duplicate_table THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE contradictions
    ADD CONSTRAINT contradictions_confidence_level_check CHECK (
      confidence_level IS NULL OR confidence_level IN ('high','medium','low')
    );
EXCEPTION
  WHEN duplicate_object THEN NULL;
  WHEN duplicate_table THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE contradictions
    ADD CONSTRAINT contradictions_sensitivity_check CHECK (
      sensitivity IS NULL OR sensitivity IN ('low','medium','high','severe')
    );
EXCEPTION
  WHEN duplicate_object THEN NULL;
  WHEN duplicate_table THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE contradictions
    ADD CONSTRAINT contradictions_resolution_state_check CHECK (
      resolution_state IS NULL OR resolution_state IN (
        'open','acknowledged','resolving','resolved','superseded','dismissed'
      )
    );
EXCEPTION
  WHEN duplicate_object THEN NULL;
  WHEN duplicate_table THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE contradictions
    ADD CONSTRAINT contradictions_created_by_check CHECK (
      created_by IN ('automated','agent_proposed','human_flagged')
    );
EXCEPTION
  WHEN duplicate_object THEN NULL;
  WHEN duplicate_table THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_contradictions_category_state
  ON contradictions(client_id, category, resolution_state);
CREATE INDEX IF NOT EXISTS idx_contradictions_surfacing_priority
  ON contradictions(client_id, surfacing_priority DESC);
CREATE INDEX IF NOT EXISTS idx_contradictions_detection_rule
  ON contradictions(detection_rule_id, client_id);

DROP TRIGGER IF EXISTS contradictions_set_updated_at ON contradictions;
CREATE TRIGGER contradictions_set_updated_at BEFORE UPDATE ON contradictions
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

UPDATE contradictions
SET
  summary = COALESCE(summary, short_title, LEFT(description, 160)),
  long_description = COALESCE(long_description, description, summary),
  short_title = COALESCE(short_title, summary, LEFT(description, 120)),
  impact = COALESCE(impact, '{}'::jsonb),
  first_detected_at = COALESCE(first_detected_at, detected_at, created_at),
  last_refreshed_at = COALESCE(last_refreshed_at, detected_at, created_at),
  last_evidence_change_at = COALESCE(last_evidence_change_at, detected_at, created_at),
  resolution_state = COALESCE(
    resolution_state,
    CASE WHEN resolved_at IS NULL THEN 'open' ELSE 'resolved' END
  ),
  surfacing_priority = COALESCE(NULLIF(surfacing_priority, 0), 50),
  stakes_score = COALESCE(stakes_score, 0),
  created_by = COALESCE(created_by, 'automated'),
  updated_at = COALESCE(updated_at, now())
WHERE
  summary IS NULL
  OR long_description IS NULL
  OR short_title IS NULL
  OR first_detected_at IS NULL
  OR last_refreshed_at IS NULL
  OR last_evidence_change_at IS NULL
  OR resolution_state IS NULL
  OR stakes_score IS NULL;

CREATE TABLE IF NOT EXISTS contradiction_detection_rules (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  signal_query TEXT,
  threshold_conditions JSONB NOT NULL DEFAULT '[]'::jsonb,
  evidence_requirements JSONB NOT NULL DEFAULT '[]'::jsonb,
  temporal_window TEXT NOT NULL,
  applicable_sectors TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  applicable_company_scales TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  confidence_multiplier NUMERIC(6,2) NOT NULL DEFAULT 1,
  false_positive_guard JSONB NOT NULL DEFAULT '[]'::jsonb,
  suppression_rules JSONB NOT NULL DEFAULT '[]'::jsonb,
  run_schedule TEXT NOT NULL,
  last_run_at TIMESTAMPTZ,
  average_contradictions_per_run NUMERIC(10,2),
  false_positive_rate NUMERIC(6,2),
  enabled BOOLEAN NOT NULL DEFAULT true,
  version TEXT NOT NULL DEFAULT '1.0',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_modified_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

DO $$
BEGIN
  ALTER TABLE contradiction_detection_rules
    ADD CONSTRAINT contradiction_detection_rules_category_check CHECK (
      category IN (
        'A_strategy_allocation',
        'B_commitment_pace',
        'C_sponsor_behavior',
        'D_budget_priority',
        'E_external_internal_messaging'
      )
    );
EXCEPTION
  WHEN duplicate_object THEN NULL;
  WHEN duplicate_table THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE contradiction_detection_rules
    ADD CONSTRAINT contradiction_detection_rules_run_schedule_check CHECK (
      run_schedule IN ('continuous','daily','event_driven','weekly')
    );
EXCEPTION
  WHEN duplicate_object THEN NULL;
  WHEN duplicate_table THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_contradiction_detection_rules_category
  ON contradiction_detection_rules(category, enabled);

DROP TRIGGER IF EXISTS contradiction_detection_rules_set_updated_at ON contradiction_detection_rules;
CREATE TRIGGER contradiction_detection_rules_set_updated_at BEFORE UPDATE ON contradiction_detection_rules
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TABLE IF NOT EXISTS contradiction_detection_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  rule_id TEXT NOT NULL REFERENCES contradiction_detection_rules(id) ON DELETE CASCADE,
  trigger_type TEXT NOT NULL DEFAULT 'manual_seed',
  run_started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  run_finished_at TIMESTAMPTZ,
  contradictions_created INT NOT NULL DEFAULT 0,
  contradictions_updated INT NOT NULL DEFAULT 0,
  run_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

DO $$
BEGIN
  ALTER TABLE contradiction_detection_runs
    ADD CONSTRAINT contradiction_detection_runs_trigger_type_check CHECK (
      trigger_type IN ('schedule','event','manual_seed','manual_review')
    );
EXCEPTION
  WHEN duplicate_object THEN NULL;
  WHEN duplicate_table THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_contradiction_detection_runs_client_rule
  ON contradiction_detection_runs(client_id, rule_id, run_started_at DESC);

CREATE TABLE IF NOT EXISTS contradiction_evidence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contradiction_id UUID NOT NULL REFERENCES contradictions(id) ON DELETE CASCADE,
  evidence_id TEXT NOT NULL REFERENCES evidence(id) ON DELETE CASCADE,
  evidence_role TEXT NOT NULL,
  temporal_relevance TEXT,
  source_diversity TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (contradiction_id, evidence_id)
);

DO $$
BEGIN
  ALTER TABLE contradiction_evidence
    ADD CONSTRAINT contradiction_evidence_role_check CHECK (
      evidence_role IN ('supporting','contextualizing','refuting','resolving')
    );
EXCEPTION
  WHEN duplicate_object THEN NULL;
  WHEN duplicate_table THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE contradiction_evidence
    ADD CONSTRAINT contradiction_evidence_source_diversity_check CHECK (
      source_diversity IN ('same_source','cross_source','independent_sources')
    );
EXCEPTION
  WHEN duplicate_object THEN NULL;
  WHEN duplicate_table THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_contradiction_evidence_contradiction
  ON contradiction_evidence(contradiction_id, sort_order);

CREATE TABLE IF NOT EXISTS contradiction_resolution_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contradiction_id UUID NOT NULL REFERENCES contradictions(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL,
  action_description TEXT NOT NULL,
  taken_by_person_id UUID REFERENCES persons(id) ON DELETE SET NULL,
  taken_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  evidence_ids TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  effective BOOLEAN,
  evaluated_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

DO $$
BEGIN
  ALTER TABLE contradiction_resolution_actions
    ADD CONSTRAINT contradiction_resolution_actions_type_check CHECK (
      action_type IN (
        'strategy_realignment',
        'pace_acceleration',
        'sponsor_reassignment',
        'budget_reallocation',
        'external_disclosure_update',
        'acknowledged_tradeoff',
        'dismissed'
      )
    );
EXCEPTION
  WHEN duplicate_object THEN NULL;
  WHEN duplicate_table THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_contradiction_resolution_actions_contradiction
  ON contradiction_resolution_actions(contradiction_id, taken_at DESC);

DO $$
BEGIN
  ALTER TABLE contradictions
    ADD CONSTRAINT contradictions_detection_rule_fk
    FOREIGN KEY (detection_rule_id) REFERENCES contradiction_detection_rules(id) ON DELETE SET NULL;
EXCEPTION
  WHEN duplicate_object THEN NULL;
  WHEN duplicate_table THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE contradictions
    ADD CONSTRAINT contradictions_detection_run_fk
    FOREIGN KEY (detection_run_id) REFERENCES contradiction_detection_runs(id) ON DELETE SET NULL;
EXCEPTION
  WHEN duplicate_object THEN NULL;
  WHEN duplicate_table THEN NULL;
END $$;

ALTER TABLE contradiction_detection_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE contradiction_detection_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE contradiction_evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE contradiction_resolution_actions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service_role_all_contradiction_detection_rules" ON contradiction_detection_rules;
CREATE POLICY "service_role_all_contradiction_detection_rules" ON contradiction_detection_rules
  FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "service_role_all_contradiction_detection_runs" ON contradiction_detection_runs;
CREATE POLICY "service_role_all_contradiction_detection_runs" ON contradiction_detection_runs
  FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "service_role_all_contradiction_evidence" ON contradiction_evidence;
CREATE POLICY "service_role_all_contradiction_evidence" ON contradiction_evidence
  FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "service_role_all_contradiction_resolution_actions" ON contradiction_resolution_actions;
CREATE POLICY "service_role_all_contradiction_resolution_actions" ON contradiction_resolution_actions
  FOR ALL TO service_role USING (true) WITH CHECK (true);

NOTIFY pgrst, 'reload schema';

COMMIT;
