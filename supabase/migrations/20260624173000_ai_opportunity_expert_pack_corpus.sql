-- AI Opportunity Discovery Expert Pack Corpus
--
-- Source of truth for authored pack content remains git. These tables are the
-- additive Postgres read model used by Intelligence, Moves, and Ava to retrieve
-- reusable expert knowledge alongside tenant evidence.

CREATE TABLE IF NOT EXISTS public.ai_opportunity_expert_packs (
  expert_pack_id       TEXT PRIMARY KEY,
  domain               TEXT NOT NULL,
  pattern_name         TEXT NOT NULL,
  description          TEXT NOT NULL,
  source_systems       TEXT[] NOT NULL DEFAULT '{}',
  metrics              TEXT[] NOT NULL DEFAULT '{}',
  opportunity_archetypes TEXT[] NOT NULL DEFAULT '{}',
  pack                 JSONB NOT NULL,
  pack_hash            TEXT NOT NULL,
  active               BOOLEAN NOT NULL DEFAULT true,
  authored_by          TEXT NOT NULL DEFAULT 'AbarVa',
  review_tier          TEXT NOT NULL DEFAULT 'ai-gate',
  as_of                DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.ai_opportunity_expert_pack_patterns (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expert_pack_id       TEXT NOT NULL REFERENCES public.ai_opportunity_expert_packs(expert_pack_id) ON DELETE CASCADE,
  pattern_name         TEXT NOT NULL,
  problem_signals      TEXT[] NOT NULL DEFAULT '{}',
  diagnostic_questions TEXT[] NOT NULL DEFAULT '{}',
  required_evidence    TEXT[] NOT NULL DEFAULT '{}',
  value_levers         TEXT[] NOT NULL DEFAULT '{}',
  risks                TEXT[] NOT NULL DEFAULT '{}',
  controls             TEXT[] NOT NULL DEFAULT '{}',
  confidence_rules     TEXT[] NOT NULL DEFAULT '{}',
  caveats              TEXT[] NOT NULL DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS public.ai_opportunity_expert_pack_archetypes (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expert_pack_id       TEXT NOT NULL REFERENCES public.ai_opportunity_expert_packs(expert_pack_id) ON DELETE CASCADE,
  archetype_name       TEXT NOT NULL,
  evidence_signals     TEXT[] NOT NULL DEFAULT '{}',
  applicable_source_systems TEXT[] NOT NULL DEFAULT '{}',
  value_levers         TEXT[] NOT NULL DEFAULT '{}',
  feasibility_factors  TEXT[] NOT NULL DEFAULT '{}',
  risk_factors         TEXT[] NOT NULL DEFAULT '{}',
  human_in_loop_requirement TEXT NOT NULL DEFAULT '',
  guardrails           TEXT[] NOT NULL DEFAULT '{}',
  estimate_inputs      TEXT[] NOT NULL DEFAULT '{}',
  typical_pilot_scope  TEXT NOT NULL DEFAULT '',
  success_metrics      TEXT[] NOT NULL DEFAULT '{}',
  implementation_complexity TEXT NOT NULL DEFAULT 'medium',
  roadmap_pattern      TEXT NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS public.ai_opportunity_expert_pack_metrics (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expert_pack_id       TEXT NOT NULL REFERENCES public.ai_opportunity_expert_packs(expert_pack_id) ON DELETE CASCADE,
  metric_key           TEXT NOT NULL,
  metric_label         TEXT NOT NULL,
  source_systems       TEXT[] NOT NULL DEFAULT '{}',
  required_fields      TEXT[] NOT NULL DEFAULT '{}',
  interpretation_rule  TEXT NOT NULL DEFAULT '',
  caveat               TEXT NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS public.ai_opportunity_expert_pack_controls (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expert_pack_id       TEXT NOT NULL REFERENCES public.ai_opportunity_expert_packs(expert_pack_id) ON DELETE CASCADE,
  control_name         TEXT NOT NULL,
  risk_addressed       TEXT NOT NULL,
  human_owner_role     TEXT,
  evidence_required    TEXT[] NOT NULL DEFAULT '{}',
  audit_artifact       TEXT
);

CREATE TABLE IF NOT EXISTS public.ai_opportunity_expert_pack_architecture_patterns (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expert_pack_id       TEXT NOT NULL REFERENCES public.ai_opportunity_expert_packs(expert_pack_id) ON DELETE CASCADE,
  architecture_pattern TEXT NOT NULL,
  required_flow        TEXT[] NOT NULL DEFAULT ARRAY[
    'source_systems',
    'secure_ingestion_export',
    'operational_evidence_normalization',
    'context_layer',
    'semantic_question_layer',
    'pattern_detection_opportunity_scoring',
    'ai_agent_layer',
    'human_review_workflow',
    'business_process_action',
    'value_measurement'
  ],
  trust_boundary_notes TEXT[] NOT NULL DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS public.ai_opportunity_expert_pack_roadmap_patterns (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expert_pack_id       TEXT NOT NULL REFERENCES public.ai_opportunity_expert_packs(expert_pack_id) ON DELETE CASCADE,
  phase_0_30           TEXT[] NOT NULL DEFAULT '{}',
  phase_31_60          TEXT[] NOT NULL DEFAULT '{}',
  phase_61_90          TEXT[] NOT NULL DEFAULT '{}',
  value_gates          TEXT[] NOT NULL DEFAULT '{}',
  scale_decision_rules TEXT[] NOT NULL DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS public.ai_opportunity_expert_pack_estimate_models (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expert_pack_id       TEXT NOT NULL REFERENCES public.ai_opportunity_expert_packs(expert_pack_id) ON DELETE CASCADE,
  estimate_model       TEXT NOT NULL,
  required_inputs      TEXT[] NOT NULL DEFAULT '{}',
  cost_inputs          TEXT[] NOT NULL DEFAULT '{}',
  confidence_rules     TEXT[] NOT NULL DEFAULT '{}',
  finance_validation_required BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS public.ai_opportunity_expert_pack_usage_refs (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expert_pack_id       TEXT NOT NULL REFERENCES public.ai_opportunity_expert_packs(expert_pack_id) ON DELETE CASCADE,
  module               TEXT NOT NULL,
  artifact_type        TEXT,
  move_archetype       TEXT,
  source_system        TEXT,
  selection_reason     TEXT NOT NULL,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ai_opp_expert_packs_domain
  ON public.ai_opportunity_expert_packs(domain)
  WHERE active = true;

CREATE INDEX IF NOT EXISTS idx_ai_opp_expert_packs_source_systems
  ON public.ai_opportunity_expert_packs USING GIN(source_systems);

CREATE INDEX IF NOT EXISTS idx_ai_opp_expert_packs_archetypes
  ON public.ai_opportunity_expert_packs USING GIN(opportunity_archetypes);

CREATE INDEX IF NOT EXISTS idx_ai_opp_expert_pack_pack_gin
  ON public.ai_opportunity_expert_packs USING GIN(pack);

CREATE INDEX IF NOT EXISTS idx_ai_opp_expert_pack_usage_lookup
  ON public.ai_opportunity_expert_pack_usage_refs(module, artifact_type, move_archetype, source_system);

ALTER TABLE public.ai_opportunity_expert_packs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_opportunity_expert_pack_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_opportunity_expert_pack_archetypes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_opportunity_expert_pack_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_opportunity_expert_pack_controls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_opportunity_expert_pack_architecture_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_opportunity_expert_pack_roadmap_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_opportunity_expert_pack_estimate_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_opportunity_expert_pack_usage_refs ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE
  table_name TEXT;
BEGIN
  FOREACH table_name IN ARRAY ARRAY[
    'ai_opportunity_expert_packs',
    'ai_opportunity_expert_pack_patterns',
    'ai_opportunity_expert_pack_archetypes',
    'ai_opportunity_expert_pack_metrics',
    'ai_opportunity_expert_pack_controls',
    'ai_opportunity_expert_pack_architecture_patterns',
    'ai_opportunity_expert_pack_roadmap_patterns',
    'ai_opportunity_expert_pack_estimate_models',
    'ai_opportunity_expert_pack_usage_refs'
  ]
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', table_name || '_read_all_authenticated', table_name);
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR SELECT USING (auth.role() = %L OR current_setting(%L, true) = %L)',
      table_name || '_read_all_authenticated',
      table_name,
      'authenticated',
      'app.current_role',
      'MAESTRO'
    );

    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', table_name || '_service_role_all', table_name);
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR ALL USING (auth.role() = %L OR current_setting(%L, true) = %L) WITH CHECK (auth.role() = %L OR current_setting(%L, true) = %L)',
      table_name || '_service_role_all',
      table_name,
      'service_role',
      'app.current_role',
      'MAESTRO',
      'service_role',
      'app.current_role',
      'MAESTRO'
    );
  END LOOP;
END $$;

COMMENT ON TABLE public.ai_opportunity_expert_packs IS
  'Reusable AbarVa expert knowledge packs for AI Opportunity Discovery and Process Intelligence. These rows are AbarVa knowledge assets, not tenant evidence.';
