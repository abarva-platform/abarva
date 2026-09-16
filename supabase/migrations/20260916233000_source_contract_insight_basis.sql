-- Versioned reporting cutoffs and claim-level contract insight substrate.
-- Additive only: existing opportunity and playbook records keep their state.

BEGIN;

CREATE TABLE IF NOT EXISTS source.contract_intelligence_dataset (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_key TEXT NOT NULL,
  dataset_version TEXT NOT NULL,
  reporting_as_of_date DATE NOT NULL,
  simulation_as_of_date DATE NULL,
  simulation_disclosure TEXT NULL,
  source_package_ref TEXT NOT NULL,
  load_run_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_key, dataset_version),
  CONSTRAINT contract_intelligence_dataset_simulation_check CHECK (
    simulation_as_of_date IS NULL
    OR NULLIF(BTRIM(simulation_disclosure), '') IS NOT NULL
  )
);

ALTER TABLE source.contract_intelligence_dataset ENABLE ROW LEVEL SECURITY;

CREATE POLICY service_role_all_contract_intelligence_dataset
  ON source.contract_intelligence_dataset FOR ALL TO service_role
  USING (true) WITH CHECK (true);

CREATE POLICY authenticated_read_contract_intelligence_dataset
  ON source.contract_intelligence_dataset FOR SELECT TO authenticated
  USING (source.can_read_sourcing_tenant(tenant_key));

ALTER TABLE source.contract
  ADD COLUMN IF NOT EXISTS business_domain_key TEXT NULL,
  ADD COLUMN IF NOT EXISTS sourcing_category_key TEXT NULL;

ALTER TABLE source.opportunity_claim
  ADD COLUMN IF NOT EXISTS value_effect TEXT NULL;

ALTER TABLE source.opportunity_claim
  ADD CONSTRAINT opportunity_claim_value_effect_check CHECK (
    value_effect IS NULL OR value_effect IN (
      'cost_reduction', 'cash_timing', 'exposure_addressed',
      'recovery', 'non_financial'
    )
  );

ALTER TABLE source.playbook_rule
  ADD COLUMN IF NOT EXISTS rule_kind TEXT NOT NULL DEFAULT 'decision',
  ADD COLUMN IF NOT EXISTS origin_type TEXT NOT NULL DEFAULT 'not_recorded',
  ADD COLUMN IF NOT EXISTS origin_ref TEXT NULL,
  ADD COLUMN IF NOT EXISTS author_ref TEXT NULL,
  ADD COLUMN IF NOT EXISTS reviewer_ref TEXT NULL,
  ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ NULL,
  ADD COLUMN IF NOT EXISTS client_approved BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS formula TEXT NULL,
  ADD COLUMN IF NOT EXISTS required_inputs JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS period_rule TEXT NULL,
  ADD COLUMN IF NOT EXISTS currency TEXT NULL,
  ADD COLUMN IF NOT EXISTS unit TEXT NULL,
  ADD COLUMN IF NOT EXISTS denominator TEXT NULL,
  ADD COLUMN IF NOT EXISTS completeness_requirement TEXT NULL,
  ADD COLUMN IF NOT EXISTS permitted_interpretation TEXT NULL,
  ADD COLUMN IF NOT EXISTS prohibited_inference TEXT NULL,
  ADD COLUMN IF NOT EXISTS blocked_when JSONB NOT NULL DEFAULT '[]'::jsonb;

ALTER TABLE source.playbook_rule
  ADD CONSTRAINT playbook_rule_kind_check
    CHECK (rule_kind IN ('insight', 'decision')),
  ADD CONSTRAINT playbook_rule_origin_type_check
    CHECK (origin_type IN (
      'contract_clause', 'client_policy', 'vendor_publication',
      'external_benchmark', 'practitioner_rule', 'ai_hypothesis',
      'not_recorded'
    )),
  ADD CONSTRAINT playbook_rule_insight_formula_check CHECK (
    rule_kind <> 'insight'
    OR (NULLIF(BTRIM(formula), '') IS NOT NULL AND jsonb_typeof(required_inputs) = 'array')
  );

CREATE TABLE IF NOT EXISTS source.contract_insight (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_key TEXT NOT NULL,
  dataset_version TEXT NOT NULL,
  insight_id TEXT NOT NULL,
  contract_id TEXT NOT NULL,
  rule_id TEXT NOT NULL,
  rule_version TEXT NOT NULL,
  state TEXT NOT NULL CHECK (state IN ('computed', 'blocked_missing_input', 'not_applicable')),
  computed_value NUMERIC(20,6) NULL,
  unit TEXT NULL,
  input_refs JSONB NOT NULL DEFAULT '[]'::jsonb,
  calculation_run_id TEXT NULL,
  blocked_inputs JSONB NOT NULL DEFAULT '[]'::jsonb,
  limitations JSONB NOT NULL DEFAULT '[]'::jsonb,
  as_of_date DATE NOT NULL,
  load_run_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_key, dataset_version, insight_id),
  FOREIGN KEY (tenant_key, dataset_version)
    REFERENCES source.contract_intelligence_dataset (tenant_key, dataset_version),
  FOREIGN KEY (rule_id, rule_version)
    REFERENCES source.playbook_rule (rule_id, rule_version),
  CONSTRAINT contract_insight_value_state_check CHECK (
    (state = 'computed' AND computed_value IS NOT NULL AND jsonb_array_length(input_refs) > 0)
    OR (state = 'blocked_missing_input' AND computed_value IS NULL AND jsonb_array_length(blocked_inputs) > 0)
    OR (state = 'not_applicable' AND computed_value IS NULL)
  ),
  CONSTRAINT contract_insight_json_check CHECK (
    jsonb_typeof(input_refs) = 'array'
    AND jsonb_typeof(blocked_inputs) = 'array'
    AND jsonb_typeof(limitations) = 'array'
  )
);

CREATE INDEX IF NOT EXISTS contract_insight_contract_idx
  ON source.contract_insight (tenant_key, dataset_version, contract_id, state);

ALTER TABLE source.contract_insight ENABLE ROW LEVEL SECURITY;

CREATE POLICY service_role_all_contract_insight
  ON source.contract_insight FOR ALL TO service_role
  USING (true) WITH CHECK (true);

CREATE POLICY authenticated_read_contract_insight
  ON source.contract_insight FOR SELECT TO authenticated
  USING (source.can_read_sourcing_tenant(tenant_key));

COMMIT;
