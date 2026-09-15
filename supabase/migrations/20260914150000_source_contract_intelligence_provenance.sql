-- Source contract intelligence provenance spine.
--
-- This is an additive Layer 3 model. Existing optimization tables remain
-- compatibility projections; claim rows explain why each statement is safe
-- to render and make every citation resolvable at contract grain.

BEGIN;

CREATE TABLE IF NOT EXISTS source.opportunity_claim (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_key TEXT NOT NULL,
  dataset_version TEXT NOT NULL,
  claim_id TEXT NOT NULL,
  opportunity_id TEXT NOT NULL,
  contract_id TEXT NOT NULL,
  claim_role TEXT NOT NULL CHECK (
    claim_role IN (
      'problem',
      'current_term',
      'deadline',
      'calculation',
      'proposed_ask',
      'proposed_target',
      'vendor_rationale',
      'sizing',
      'risk'
    )
  ),
  statement TEXT NOT NULL,
  basis TEXT NOT NULL CHECK (
    basis IN (
      'client_record',
      'calculated',
      'benchmark',
      'playbook_rule',
      'judgment',
      'not_recorded'
    )
  ),
  scenario_kind TEXT NOT NULL DEFAULT 'signed_record' CHECK (
    scenario_kind IN ('signed_record', 'proposed_target', 'benchmark_comparable')
  ),
  amount_usd NUMERIC(18,2) NULL CHECK (amount_usd IS NULL OR amount_usd >= 0),
  amount_low_usd NUMERIC(18,2) NULL CHECK (amount_low_usd IS NULL OR amount_low_usd >= 0),
  amount_high_usd NUMERIC(18,2) NULL CHECK (amount_high_usd IS NULL OR amount_high_usd >= 0),
  unit TEXT NULL,
  evidence_status TEXT NOT NULL DEFAULT 'not_established' CHECK (
    evidence_status IN ('supported', 'partial', 'missing', 'conflicted', 'not_established')
  ),
  review_status TEXT NOT NULL DEFAULT 'draft' CHECK (
    review_status IN ('draft', 'reviewed', 'approved', 'blocked')
  ),
  source_refs JSONB NOT NULL DEFAULT '[]'::jsonb,
  calculation_run_id TEXT NULL,
  calculation_rule_id TEXT NULL,
  calculation_rule_version TEXT NULL,
  benchmark_id TEXT NULL,
  playbook_rule_id TEXT NULL,
  playbook_rule_version TEXT NULL,
  produced_by TEXT NOT NULL CHECK (
    produced_by IN ('package_author', 'deterministic_loader', 'human_reviewer', 'claude')
  ),
  generation_ref TEXT NULL,
  reviewer_ref TEXT NULL,
  reviewed_at TIMESTAMPTZ NULL,
  as_of_date DATE NULL,
  valid_from DATE NULL,
  valid_to DATE NULL,
  load_run_id TEXT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_key, dataset_version, claim_id),
  FOREIGN KEY (tenant_key, dataset_version, opportunity_id)
    REFERENCES source.optimization_opportunity (tenant_key, dataset_version, opportunity_id)
    ON DELETE CASCADE,
  CONSTRAINT opportunity_claim_amount_state_check CHECK (
    claim_role <> 'sizing'
    OR amount_usd IS NOT NULL
    OR (amount_low_usd IS NOT NULL AND amount_high_usd IS NOT NULL)
    OR basis IN ('not_recorded', 'judgment')
  ),
  CONSTRAINT opportunity_claim_basis_reference_check CHECK (
    (basis <> 'client_record' OR jsonb_array_length(source_refs) > 0)
    AND (basis <> 'calculated' OR calculation_run_id IS NOT NULL)
    AND (basis <> 'benchmark' OR benchmark_id IS NOT NULL)
    AND (basis <> 'playbook_rule' OR (playbook_rule_id IS NOT NULL AND playbook_rule_version IS NOT NULL))
    AND (produced_by <> 'claude' OR generation_ref IS NOT NULL)
  ),
  CONSTRAINT opportunity_claim_review_check CHECK (
    review_status NOT IN ('reviewed', 'approved')
    OR (reviewer_ref IS NOT NULL AND reviewed_at IS NOT NULL)
  )
);

CREATE INDEX IF NOT EXISTS opportunity_claim_contract_idx
  ON source.opportunity_claim (tenant_key, dataset_version, contract_id, opportunity_id);

CREATE INDEX IF NOT EXISTS opportunity_claim_basis_idx
  ON source.opportunity_claim (tenant_key, dataset_version, basis, evidence_status);

CREATE TABLE IF NOT EXISTS source.playbook_rule (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_id TEXT NOT NULL,
  rule_version TEXT NOT NULL,
  archetype_key TEXT NOT NULL,
  industry_key TEXT NOT NULL,
  lever_type TEXT NOT NULL,
  rule_name TEXT NOT NULL,
  rule_text TEXT NOT NULL,
  applies_when JSONB NOT NULL DEFAULT '{}'::jsonb,
  required_evidence JSONB NOT NULL DEFAULT '[]'::jsonb,
  prohibited_claims JSONB NOT NULL DEFAULT '[]'::jsonb,
  source_basis TEXT NOT NULL,
  confidence_level TEXT NOT NULL DEFAULT 'high' CHECK (confidence_level IN ('high', 'medium', 'low')),
  review_status TEXT NOT NULL DEFAULT 'approved' CHECK (review_status IN ('draft', 'reviewed', 'approved')),
  provenance JSONB NOT NULL DEFAULT '{}'::jsonb,
  model_version TEXT NOT NULL DEFAULT 'source-contract-intelligence-v1',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (rule_id, rule_version)
);

CREATE INDEX IF NOT EXISTS playbook_rule_archetype_idx
  ON source.playbook_rule (archetype_key, industry_key, lever_type);

INSERT INTO source.playbook_rule (
  rule_id, rule_version, archetype_key, industry_key, lever_type,
  rule_name, rule_text, applies_when, required_evidence, prohibited_claims,
  source_basis, confidence_level, review_status, provenance
)
SELECT
  'source.playbook.' || p.archetype_key || '.optimize',
  '1.0.0',
  p.archetype_key,
  p.industry_key,
  'archetype_education',
  p.archetype_label || ' optimize guidance',
  p.body,
  p.industry_context_json,
  p.required_evidence_json,
  jsonb_build_array('market percentile', 'external rate benchmark', 'realized savings'),
  p.source_basis,
  p.confidence_level,
  p.review_status,
  p.provenance
FROM source.contract_archetype_playbook p
ON CONFLICT (rule_id, rule_version) DO UPDATE SET
  rule_text = EXCLUDED.rule_text,
  applies_when = EXCLUDED.applies_when,
  required_evidence = EXCLUDED.required_evidence,
  prohibited_claims = EXCLUDED.prohibited_claims,
  source_basis = EXCLUDED.source_basis,
  confidence_level = EXCLUDED.confidence_level,
  review_status = EXCLUDED.review_status,
  provenance = EXCLUDED.provenance,
  updated_at = now();

CREATE TABLE IF NOT EXISTS source.archetype_source (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  archetype_key TEXT NOT NULL,
  industry_key TEXT NOT NULL,
  source_id TEXT NOT NULL,
  source_type TEXT NOT NULL CHECK (source_type IN ('internal_playbook', 'industry_research', 'vendor_documentation', 'benchmark')),
  title TEXT NOT NULL,
  locator TEXT NULL,
  excerpt TEXT NULL,
  as_of_date DATE NULL,
  confidence_level TEXT NOT NULL DEFAULT 'medium' CHECK (confidence_level IN ('high', 'medium', 'low')),
  review_status TEXT NOT NULL DEFAULT 'approved' CHECK (review_status IN ('draft', 'reviewed', 'approved')),
  provenance JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (archetype_key, source_id)
);

CREATE INDEX IF NOT EXISTS archetype_source_lookup_idx
  ON source.archetype_source (archetype_key, industry_key, review_status);

INSERT INTO source.archetype_source (
  archetype_key, industry_key, source_id, source_type, title,
  excerpt, confidence_level, review_status, provenance
)
SELECT
  p.archetype_key,
  p.industry_key,
  'playbook:' || p.archetype_key,
  'internal_playbook',
  p.archetype_label || ' authored playbook',
  p.body,
  p.confidence_level,
  p.review_status,
  p.provenance
FROM source.contract_archetype_playbook p
ON CONFLICT (archetype_key, source_id) DO UPDATE SET
  industry_key = EXCLUDED.industry_key,
  title = EXCLUDED.title,
  excerpt = EXCLUDED.excerpt,
  confidence_level = EXCLUDED.confidence_level,
  review_status = EXCLUDED.review_status,
  provenance = EXCLUDED.provenance,
  updated_at = now();

ALTER TABLE source.market_benchmark
  ADD COLUMN IF NOT EXISTS comparability_key TEXT,
  ADD COLUMN IF NOT EXISTS source_locator TEXT,
  ADD COLUMN IF NOT EXISTS methodology TEXT,
  ADD COLUMN IF NOT EXISTS review_status TEXT NOT NULL DEFAULT 'unreviewed',
  ADD COLUMN IF NOT EXISTS industry_key TEXT,
  ADD COLUMN IF NOT EXISTS archetype_key TEXT;

ALTER TABLE source.market_benchmark
  DROP CONSTRAINT IF EXISTS market_benchmark_review_status_check;

ALTER TABLE source.market_benchmark
  ADD CONSTRAINT market_benchmark_review_status_check
  CHECK (review_status IN ('unreviewed', 'reviewed', 'approved'));

ALTER TABLE source.opportunity_requirement_status
  ADD COLUMN IF NOT EXISTS claim_id TEXT;

COMMENT ON TABLE source.opportunity_claim IS
  'One governed record per commercial statement. Evidence status is computed from basis and resolvable references; approval does not alter provenance.';

COMMENT ON COLUMN source.opportunity_claim.source_refs IS
  'Structured references to canonical records or document spans. String labels alone are not valid provenance.';

COMMIT;
