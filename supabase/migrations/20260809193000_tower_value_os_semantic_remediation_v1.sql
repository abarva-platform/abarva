-- Tower Value OS semantic remediation v1
-- migration: destructive-allowed
--
-- The prior Tower Value OS migration is sealed. This migration leaves it
-- intact and layers a deterministic semantic correction over the same canonical
-- source tables:
--   * investment is not promised benefit;
--   * source trust comes from source counts and agreement, not claim state;
--   * tracked corpus, material programs, and board portfolio are separate;
--   * value cases are grouped by initiative/process/benefit/horizon;
--   * economic classification gates board-visible benefit totals;
--   * AI tool identity must point to governed program/initiative entities.
--
-- Audited destructive marker rationale: this migration does not drop tables,
-- columns, schemas, or data. It relaxes NOT NULL constraints so unknown budgets,
-- benefits, outcomes, and proof amounts can remain null instead of being forced
-- to zero.

CREATE SCHEMA IF NOT EXISTS tower;
CREATE SCHEMA IF NOT EXISTS consumption;

ALTER TABLE tower.value_case
  ALTER COLUMN approved_funding_usd DROP NOT NULL,
  ALTER COLUMN actual_spend_usd DROP NOT NULL,
  ALTER COLUMN finance_validated_value_usd DROP NOT NULL,
  ALTER COLUMN claimable_value_usd DROP NOT NULL;

ALTER TABLE tower.value_case_period
  ALTER COLUMN planned_investment_usd DROP NOT NULL,
  ALTER COLUMN actual_spend_usd DROP NOT NULL;

ALTER TABLE tower.economic_conversion
  ALTER COLUMN converted_amount_usd DROP NOT NULL;

ALTER TABLE tower.attestation_event
  ALTER COLUMN attested_amount_usd DROP NOT NULL;

ALTER TABLE tower.proof_action
  ALTER COLUMN amount_exposed_usd DROP NOT NULL;

ALTER TABLE tower.value_case
  ADD COLUMN IF NOT EXISTS semantic_version text NOT NULL DEFAULT 'tower_value_operating_system_v1',
  ADD COLUMN IF NOT EXISTS value_case_group_key text,
  ADD COLUMN IF NOT EXISTS business_process_ref text,
  ADD COLUMN IF NOT EXISTS economic_classification text CHECK (
    economic_classification IS NULL OR economic_classification IN (
      'cost_takeout',
      'cost_avoidance',
      'capacity',
      'revenue',
      'gross_margin',
      'working_capital',
      'risk_loss_avoidance',
      'experience_or_intangible'
    )
  ),
  ADD COLUMN IF NOT EXISTS economic_classification_state text NOT NULL DEFAULT 'needs_review' CHECK (
    economic_classification_state IN ('classified', 'needs_review')
  ),
  ADD COLUMN IF NOT EXISTS active_scope_state text NOT NULL DEFAULT 'active' CHECK (
    active_scope_state IN ('active', 'inactive', 'unknown')
  ),
  ADD COLUMN IF NOT EXISTS material_scope_state text NOT NULL DEFAULT 'not_material' CHECK (
    material_scope_state IN ('material', 'not_material', 'unknown')
  ),
  ADD COLUMN IF NOT EXISTS board_scope_state text NOT NULL DEFAULT 'not_board_scope' CHECK (
    board_scope_state IN ('board_portfolio', 'tracked_corpus', 'not_board_scope')
  ),
  ADD COLUMN IF NOT EXISTS explicit_benefit_assertion boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS source_count integer NOT NULL DEFAULT 0 CHECK (source_count >= 0),
  ADD COLUMN IF NOT EXISTS source_assertion_values jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS claim_ids jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS claim_refs jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS claim_count integer NOT NULL DEFAULT 0 CHECK (claim_count >= 0),
  ADD COLUMN IF NOT EXISTS canary_contract_ref text CHECK (
    canary_contract_ref IS NULL OR canary_contract_ref IN ('CTR-061', 'CTR-090')
  );

ALTER TABLE tower.value_case_period
  ADD COLUMN IF NOT EXISTS semantic_version text NOT NULL DEFAULT 'tower_value_operating_system_v1';

ALTER TABLE tower.subject_link
  ADD COLUMN IF NOT EXISTS semantic_version text NOT NULL DEFAULT 'tower_value_operating_system_v1';

ALTER TABLE tower.proof_action
  ADD COLUMN IF NOT EXISTS semantic_version text NOT NULL DEFAULT 'tower_value_operating_system_v1';

CREATE TABLE IF NOT EXISTS tower.value_case_claim_link (
  tenant_key text NOT NULL,
  value_case_id text NOT NULL,
  claim_id text NOT NULL,
  subject_ref text NOT NULL,
  claim_role text NOT NULL DEFAULT 'supporting_claim' CHECK (
    claim_role IN ('primary_claim', 'supporting_claim', 'canary_claim')
  ),
  asserted_benefit_usd numeric,
  source_count integer NOT NULL DEFAULT 0 CHECK (source_count >= 0),
  source_trust_state text NOT NULL DEFAULT 'ABSENT' CHECK (
    source_trust_state IN ('AGREE', 'ONE_SOURCE', 'CONFLICT', 'ABSENT')
  ),
  source_refs jsonb NOT NULL DEFAULT '[]'::jsonb,
  semantic_version text NOT NULL DEFAULT 'semantic_remediation_v1',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (tenant_key, value_case_id, claim_id),
  FOREIGN KEY (tenant_key, value_case_id)
    REFERENCES tower.value_case (tenant_key, value_case_id)
    ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS tower.ai_identity_crosswalk (
  tenant_key text NOT NULL,
  ai_subject_ref text NOT NULL,
  ai_subject_kind text NOT NULL,
  tool_ref text,
  agent_ref text,
  target_initiative_ref text,
  target_program_ref text,
  business_process_ref text,
  cohort_ref text,
  cost_center_ref text,
  project_code_ref text,
  value_case_id text,
  identity_state text NOT NULL DEFAULT 'needs_review' CHECK (
    identity_state IN ('ready', 'review_missing_value_case', 'blocked_missing_governed_initiative')
  ),
  issue text,
  source_refs jsonb NOT NULL DEFAULT '[]'::jsonb,
  semantic_version text NOT NULL DEFAULT 'semantic_remediation_v1',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (tenant_key, ai_subject_ref, semantic_version)
);

CREATE INDEX IF NOT EXISTS idx_tower_value_case_semantic_scope
  ON tower.value_case (tenant_key, semantic_version, board_scope_state, material_scope_state, economic_classification);

CREATE INDEX IF NOT EXISTS idx_tower_value_case_group_key
  ON tower.value_case (tenant_key, semantic_version, value_case_group_key);

CREATE INDEX IF NOT EXISTS idx_tower_value_case_claim_link_case
  ON tower.value_case_claim_link (tenant_key, value_case_id, semantic_version);

CREATE INDEX IF NOT EXISTS idx_tower_ai_identity_crosswalk_target
  ON tower.ai_identity_crosswalk (tenant_key, target_program_ref, value_case_id, identity_state);

CREATE UNIQUE INDEX IF NOT EXISTS uq_tower_proof_action_semantic_v1_dedupe
  ON tower.proof_action (
    tenant_key,
    semantic_version,
    value_case_id,
    proof_stage,
    blocked_decision,
    evidence_requirement
  )
  WHERE semantic_version = 'semantic_remediation_v1';

WITH latest_project_obs AS (
  SELECT
    tenant_key,
    subject_ref,
    max(value_num) FILTER (WHERE metric_ref = 'project.approved_budget') AS approved_funding_usd,
    max(value_num) FILTER (WHERE metric_ref = 'project.actual_to_date') AS actual_spend_usd
  FROM tower.metric_observation
  WHERE metric_ref IN ('project.approved_budget', 'project.actual_to_date')
  GROUP BY tenant_key, subject_ref
),
claim_base AS (
  SELECT
    c.tenant_key,
    c.claim_id,
    c.subject_ref,
    s.title,
    s.subject_kind,
    s.initiative_ref,
    s.owner_role,
    s.workflow_ref,
    s.application_ref,
    s.vendor_ref,
    s.metadata_json,
    po.approved_funding_usd,
    po.actual_spend_usd,
    c.promised_value,
    c.calculated_value,
    c.currency,
    c.claim_state,
    c.baseline_observation_id,
    c.target_observation_id,
    c.actual_observation_id,
    c.quality_guardrail_state,
    c.next_gate_owner_role,
    c.claim_rule_version,
    c.evaluated_at,
    CASE
      WHEN concat_ws(' ', c.claim_id, c.subject_ref, s.title, s.metadata_json::text) ILIKE '%CTR-061%' THEN 'CTR-061'
      WHEN concat_ws(' ', c.claim_id, c.subject_ref, s.title, s.metadata_json::text) ILIKE '%CTR-090%' THEN 'CTR-090'
      ELSE null
    END AS canary_contract_ref,
    coalesce(nullif(s.initiative_ref, ''), c.subject_ref) AS initiative_id,
    coalesce(nullif(s.metadata_json->>'program_id', ''), nullif(s.initiative_ref, ''), c.subject_ref) AS program_id,
    nullif(s.metadata_json->>'business_unit', '') AS business_unit,
    nullif(s.metadata_json->>'cost_center', '') AS cost_center_ref,
    coalesce(
      nullif(s.workflow_ref, ''),
      nullif(s.metadata_json->>'business_process_ref', ''),
      nullif(s.metadata_json->>'process_area', ''),
      nullif(s.metadata_json->>'workflow_ref', ''),
      nullif(s.application_ref, ''),
      'unmapped_process'
    ) AS business_process_ref,
    coalesce(nullif(s.metadata_json->>'value_horizon', ''), 'quarterly') AS value_horizon,
    CASE
      WHEN lower(concat_ws(' ', s.metadata_json->>'benefit_category', s.metadata_json->>'promised_benefit_type', s.title)) ~ 'cost[ _-]*takeout|run[ -]?rate reduction|hard savings|cost reduction|savings' THEN 'cost_takeout'
      WHEN lower(concat_ws(' ', s.metadata_json->>'benefit_category', s.metadata_json->>'promised_benefit_type', s.title)) ~ 'cost[ _-]*avoid|avoidance|avoid ' THEN 'cost_avoidance'
      WHEN lower(concat_ws(' ', s.metadata_json->>'benefit_category', s.metadata_json->>'promised_benefit_type', s.title)) ~ 'capacity|productivity|hours|time saved|developer|copilot|coding' THEN 'capacity'
      WHEN lower(concat_ws(' ', s.metadata_json->>'benefit_category', s.metadata_json->>'promised_benefit_type', s.title)) ~ 'gross[ _-]*margin|margin' THEN 'gross_margin'
      WHEN lower(concat_ws(' ', s.metadata_json->>'benefit_category', s.metadata_json->>'promised_benefit_type', s.title)) ~ 'working[ _-]*capital|cash|inventory|dso|dpo' THEN 'working_capital'
      WHEN lower(concat_ws(' ', s.metadata_json->>'benefit_category', s.metadata_json->>'promised_benefit_type', s.title)) ~ 'revenue|booking|sales|growth' THEN 'revenue'
      WHEN lower(concat_ws(' ', s.metadata_json->>'benefit_category', s.metadata_json->>'promised_benefit_type', s.title)) ~ 'risk|loss|control|compliance|security|fraud|resilience|disruption' THEN 'risk_loss_avoidance'
      WHEN lower(concat_ws(' ', s.metadata_json->>'benefit_category', s.metadata_json->>'promised_benefit_type', s.title)) ~ 'experience|service quality|quality|nps|employee|customer|intangible' THEN 'experience_or_intangible'
      ELSE null
    END AS economic_classification,
    CASE
      WHEN nullif(s.metadata_json->>'benefit_assertion_id', '') IS NOT NULL THEN c.promised_value
      WHEN nullif(s.metadata_json->>'business_case_benefit_source', '') IS NOT NULL THEN c.promised_value
      WHEN lower(coalesce(s.metadata_json->>'value_source_type', '')) IN ('explicit_benefit_assertion', 'business_case_benefit', 'finance_benefit_case') THEN c.promised_value
      WHEN concat_ws(' ', c.claim_id, c.subject_ref, s.title, s.metadata_json::text) ILIKE '%CTR-061%' THEN c.promised_value
      WHEN concat_ws(' ', c.claim_id, c.subject_ref, s.title, s.metadata_json::text) ILIKE '%CTR-090%' THEN c.promised_value
      ELSE null::numeric
    END AS explicit_benefit_value_usd,
    jsonb_build_object(
      'table', 'tower.value_claim',
      'claim_id', c.claim_id,
      'subject_ref', c.subject_ref,
      'source_file', s.metadata_json->>'source_file',
      'source_row', s.metadata_json->>'source_row',
      'benefit_assertion_id', s.metadata_json->>'benefit_assertion_id',
      'canary_contract_ref',
        CASE
          WHEN concat_ws(' ', c.claim_id, c.subject_ref, s.title, s.metadata_json::text) ILIKE '%CTR-061%' THEN 'CTR-061'
          WHEN concat_ws(' ', c.claim_id, c.subject_ref, s.title, s.metadata_json::text) ILIKE '%CTR-090%' THEN 'CTR-090'
          ELSE null
        END
    ) AS claim_source_ref
  FROM tower.value_claim c
  JOIN tower.tracked_subject s
    ON s.tenant_key = c.tenant_key
   AND s.subject_ref = c.subject_ref
  LEFT JOIN latest_project_obs po
    ON po.tenant_key = c.tenant_key
   AND po.subject_ref = c.subject_ref
),
grouped AS (
  SELECT
    tenant_key,
    CASE
      WHEN canary_contract_ref IS NOT NULL THEN concat_ws(':', 'contract_canary', canary_contract_ref)
      ELSE concat_ws(':', 'business_value_case', initiative_id, business_process_ref, coalesce(economic_classification, 'unresolved'), value_horizon)
    END AS value_case_group_key,
    min(claim_id) AS primary_claim_id,
    initiative_id,
    program_id,
    business_unit,
    cost_center_ref,
    coalesce(nullif(max(owner_role), ''), 'Tower data steward') AS owner_role,
    coalesce(nullif(max(next_gate_owner_role), ''), 'Finance partner') AS finance_owner_role,
    max(title) AS value_case_name,
    business_process_ref,
    value_horizon,
    economic_classification,
    CASE
      WHEN economic_classification = 'capacity' THEN 'capacity'
      WHEN economic_classification = 'cost_takeout' THEN 'cost_takeout'
      WHEN economic_classification IN ('cost_avoidance', 'risk_loss_avoidance') THEN 'risk_avoidance'
      WHEN economic_classification IN ('revenue', 'gross_margin') THEN 'revenue'
      WHEN economic_classification = 'working_capital' THEN 'working_capital'
      WHEN economic_classification = 'experience_or_intangible' THEN 'service_quality'
      ELSE 'unclassified'
    END AS benefit_category,
    min(evaluated_at)::date AS value_period_start,
    (min(evaluated_at)::date + interval '24 months' - interval '1 day')::date AS value_period_end,
    max(approved_funding_usd) AS approved_funding_usd,
    max(actual_spend_usd) AS actual_spend_usd,
    count(*) FILTER (WHERE explicit_benefit_value_usd IS NOT NULL)::int AS source_count,
    count(DISTINCT explicit_benefit_value_usd) FILTER (WHERE explicit_benefit_value_usd IS NOT NULL)::int AS distinct_source_value_count,
    max(explicit_benefit_value_usd) FILTER (WHERE explicit_benefit_value_usd IS NOT NULL) AS agreed_business_case_value_usd,
    sum(calculated_value) FILTER (WHERE calculated_value IS NOT NULL) AS known_calculated_value_usd,
    sum(calculated_value) FILTER (WHERE lower(claim_state) IN ('finance_validated', 'claimable')) AS finance_validated_value_usd,
    sum(calculated_value) FILTER (WHERE lower(claim_state) = 'claimable') AS claimable_value_usd,
    coalesce(max(currency), 'USD') AS currency,
    CASE
      WHEN bool_or(lower(claim_state) = 'claimable') THEN 'claimable'
      WHEN bool_or(lower(claim_state) = 'finance_validated') THEN 'finance_validated'
      WHEN bool_or(lower(claim_state) = 'usage_supported') THEN 'usage_supported'
      ELSE 'evidence_gap'
    END AS claim_state,
    CASE WHEN max(approved_funding_usd) IS NOT NULL OR max(actual_spend_usd) IS NOT NULL THEN 'present' ELSE 'missing' END AS investment_evidence_state,
    CASE WHEN bool_or(lower(claim_state) IN ('usage_supported', 'finance_validated', 'claimable')) THEN 'present' ELSE 'missing' END AS usage_evidence_state,
    CASE WHEN bool_or(baseline_observation_id IS NOT NULL AND target_observation_id IS NOT NULL AND actual_observation_id IS NOT NULL) THEN 'present' ELSE 'missing' END AS operational_outcome_evidence_state,
    CASE WHEN bool_or(calculated_value IS NOT NULL) THEN 'present' ELSE 'missing' END AS financial_conversion_evidence_state,
    CASE WHEN bool_or(lower(quality_guardrail_state) IN ('finance_attested', 'finance_validated') OR lower(claim_state) IN ('finance_validated', 'claimable')) THEN 'present' ELSE 'missing' END AS finance_attestation_state,
    max(metadata_json->>'dataset_version') AS dataset_version,
    coalesce(max(metadata_json->>'source_run_id'), max(claim_rule_version)) AS source_run_id,
    max(evaluated_at)::date AS as_of_period,
    max(evaluated_at) AS refresh_timestamp,
    jsonb_agg(claim_id ORDER BY claim_id) AS claim_ids,
    jsonb_agg(claim_source_ref ORDER BY claim_id) AS claim_refs,
    coalesce(
      jsonb_agg(
        claim_source_ref || jsonb_build_object('asserted_benefit_usd', explicit_benefit_value_usd)
        ORDER BY claim_id
      ) FILTER (WHERE explicit_benefit_value_usd IS NOT NULL),
      '[]'::jsonb
    ) AS benefit_source_refs,
    coalesce(
      jsonb_agg(
        jsonb_build_object(
          'claim_id', claim_id,
          'asserted_benefit_usd', explicit_benefit_value_usd
        )
        ORDER BY claim_id
      ) FILTER (WHERE explicit_benefit_value_usd IS NOT NULL),
      '[]'::jsonb
    ) AS source_assertion_values,
    count(*)::int AS claim_count,
    max(canary_contract_ref) AS canary_contract_ref
  FROM claim_base
  GROUP BY
    tenant_key,
    CASE
      WHEN canary_contract_ref IS NOT NULL THEN concat_ws(':', 'contract_canary', canary_contract_ref)
      ELSE concat_ws(':', 'business_value_case', initiative_id, business_process_ref, coalesce(economic_classification, 'unresolved'), value_horizon)
    END,
    initiative_id,
    program_id,
    business_unit,
    cost_center_ref,
    business_process_ref,
    value_horizon,
    economic_classification
),
semantic_rows AS (
  SELECT
    tenant_key,
    'vc2-' || md5(concat_ws(':', tenant_key, value_case_group_key)) AS value_case_id,
    value_case_group_key,
    primary_claim_id,
    initiative_id,
    program_id,
    business_unit,
    cost_center_ref,
    owner_role,
    finance_owner_role,
    CASE
      WHEN canary_contract_ref IS NOT NULL THEN canary_contract_ref || ' contract optimization value case'
      ELSE value_case_name
    END AS value_case_name,
    business_process_ref,
    CASE
      WHEN economic_classification = 'capacity' THEN 'workforce_productivity'
      WHEN economic_classification IN ('cost_takeout', 'cost_avoidance', 'working_capital') THEN 'process_automation'
      WHEN economic_classification IN ('revenue', 'gross_margin') THEN 'strategic_ai_project'
      WHEN economic_classification = 'risk_loss_avoidance' THEN 'platform_enabler'
      WHEN economic_classification = 'experience_or_intangible' THEN 'non_ai_transformation'
      ELSE 'unclassified'
    END AS value_archetype,
    benefit_category,
    value_period_start,
    value_period_end,
    value_horizon,
    approved_funding_usd,
    actual_spend_usd,
    CASE
      WHEN source_count = 0 THEN null::numeric
      WHEN distinct_source_value_count > 1 THEN null::numeric
      ELSE agreed_business_case_value_usd
    END AS business_case_value_usd,
    known_calculated_value_usd,
    finance_validated_value_usd,
    claimable_value_usd,
    currency,
    claim_state,
    investment_evidence_state,
    usage_evidence_state,
    operational_outcome_evidence_state,
    financial_conversion_evidence_state,
    finance_attestation_state,
    CASE
      WHEN source_count = 0 THEN 'ABSENT'
      WHEN source_count = 1 THEN 'ONE_SOURCE'
      WHEN distinct_source_value_count <= 1 THEN 'AGREE'
      ELSE 'CONFLICT'
    END AS source_trust_state,
    CASE
      WHEN source_count = 0 THEN 'ABSENT'
      WHEN source_count = 1 THEN 'ONE_SOURCE'
      WHEN distinct_source_value_count <= 1 THEN 'AGREE'
      ELSE 'CONFLICT'
    END AS lineage_state,
    dataset_version,
    source_run_id,
    as_of_period,
    refresh_timestamp,
    benefit_source_refs AS source_refs,
    source_assertion_values,
    claim_ids,
    claim_refs,
    claim_count,
    CASE
      WHEN source_count = 0 THEN 'explicit_benefit_assertion'
      WHEN distinct_source_value_count > 1 THEN 'source_authority_reconciliation'
      WHEN economic_classification IS NULL THEN 'economic_classification'
      WHEN operational_outcome_evidence_state <> 'present' THEN 'baseline_target_actual_outcome'
      WHEN financial_conversion_evidence_state <> 'present' THEN 'financial_conversion_evidence'
      WHEN finance_attestation_state <> 'present' THEN 'finance_attestation_package'
      ELSE 'claim_gate_review'
    END AS next_required_extract,
    CASE
      WHEN source_count > 1 AND distinct_source_value_count > 1 THEN 'blocked'
      WHEN economic_classification IS NULL THEN 'needs_review'
      WHEN claim_state = 'claimable' THEN 'ready'
      ELSE 'needs_review'
    END AS review_state,
    CASE WHEN economic_classification IS NULL THEN 'needs_review' ELSE 'classified' END AS economic_classification_state,
    'active'::text AS active_scope_state,
    'material'::text AS material_scope_state,
    'board_portfolio'::text AS board_scope_state,
    (source_count > 0) AS explicit_benefit_assertion,
    source_count,
    economic_classification,
    canary_contract_ref
  FROM grouped
)
INSERT INTO tower.value_case (
  tenant_key,
  value_case_id,
  semantic_version,
  value_case_group_key,
  primary_claim_id,
  initiative_id,
  program_id,
  business_unit,
  cost_center_ref,
  owner_role,
  finance_owner_role,
  value_case_name,
  business_process_ref,
  value_archetype,
  benefit_category,
  value_period_start,
  value_period_end,
  value_horizon,
  approved_funding_usd,
  actual_spend_usd,
  business_case_value_usd,
  known_calculated_value_usd,
  finance_validated_value_usd,
  claimable_value_usd,
  currency,
  claim_state,
  investment_evidence_state,
  usage_evidence_state,
  operational_outcome_evidence_state,
  financial_conversion_evidence_state,
  finance_attestation_state,
  source_trust_state,
  lineage_state,
  dataset_version,
  source_run_id,
  as_of_period,
  refresh_timestamp,
  source_refs,
  source_assertion_values,
  claim_ids,
  claim_refs,
  claim_count,
  next_required_extract,
  review_state,
  economic_classification_state,
  active_scope_state,
  material_scope_state,
  board_scope_state,
  explicit_benefit_assertion,
  source_count,
  economic_classification,
  canary_contract_ref
)
SELECT
  tenant_key,
  value_case_id,
  'semantic_remediation_v1',
  value_case_group_key,
  primary_claim_id,
  initiative_id,
  program_id,
  business_unit,
  cost_center_ref,
  owner_role,
  finance_owner_role,
  value_case_name,
  business_process_ref,
  value_archetype,
  benefit_category,
  value_period_start,
  value_period_end,
  value_horizon,
  approved_funding_usd,
  actual_spend_usd,
  business_case_value_usd,
  known_calculated_value_usd,
  finance_validated_value_usd,
  claimable_value_usd,
  currency,
  claim_state,
  investment_evidence_state,
  usage_evidence_state,
  operational_outcome_evidence_state,
  financial_conversion_evidence_state,
  finance_attestation_state,
  source_trust_state,
  lineage_state,
  dataset_version,
  source_run_id,
  as_of_period,
  refresh_timestamp,
  source_refs,
  source_assertion_values,
  claim_ids,
  claim_refs,
  claim_count,
  next_required_extract,
  review_state,
  economic_classification_state,
  active_scope_state,
  material_scope_state,
  board_scope_state,
  explicit_benefit_assertion,
  source_count,
  economic_classification,
  canary_contract_ref
FROM semantic_rows
ON CONFLICT (tenant_key, value_case_id) DO UPDATE SET
  semantic_version = EXCLUDED.semantic_version,
  value_case_group_key = EXCLUDED.value_case_group_key,
  primary_claim_id = EXCLUDED.primary_claim_id,
  initiative_id = EXCLUDED.initiative_id,
  program_id = EXCLUDED.program_id,
  business_unit = EXCLUDED.business_unit,
  cost_center_ref = EXCLUDED.cost_center_ref,
  owner_role = EXCLUDED.owner_role,
  finance_owner_role = EXCLUDED.finance_owner_role,
  value_case_name = EXCLUDED.value_case_name,
  business_process_ref = EXCLUDED.business_process_ref,
  value_archetype = EXCLUDED.value_archetype,
  benefit_category = EXCLUDED.benefit_category,
  value_period_start = EXCLUDED.value_period_start,
  value_period_end = EXCLUDED.value_period_end,
  value_horizon = EXCLUDED.value_horizon,
  approved_funding_usd = EXCLUDED.approved_funding_usd,
  actual_spend_usd = EXCLUDED.actual_spend_usd,
  business_case_value_usd = EXCLUDED.business_case_value_usd,
  known_calculated_value_usd = EXCLUDED.known_calculated_value_usd,
  finance_validated_value_usd = EXCLUDED.finance_validated_value_usd,
  claimable_value_usd = EXCLUDED.claimable_value_usd,
  claim_state = EXCLUDED.claim_state,
  investment_evidence_state = EXCLUDED.investment_evidence_state,
  usage_evidence_state = EXCLUDED.usage_evidence_state,
  operational_outcome_evidence_state = EXCLUDED.operational_outcome_evidence_state,
  financial_conversion_evidence_state = EXCLUDED.financial_conversion_evidence_state,
  finance_attestation_state = EXCLUDED.finance_attestation_state,
  source_trust_state = EXCLUDED.source_trust_state,
  lineage_state = EXCLUDED.lineage_state,
  dataset_version = EXCLUDED.dataset_version,
  source_run_id = EXCLUDED.source_run_id,
  as_of_period = EXCLUDED.as_of_period,
  refresh_timestamp = EXCLUDED.refresh_timestamp,
  source_refs = EXCLUDED.source_refs,
  source_assertion_values = EXCLUDED.source_assertion_values,
  claim_ids = EXCLUDED.claim_ids,
  claim_refs = EXCLUDED.claim_refs,
  claim_count = EXCLUDED.claim_count,
  next_required_extract = EXCLUDED.next_required_extract,
  review_state = EXCLUDED.review_state,
  economic_classification_state = EXCLUDED.economic_classification_state,
  active_scope_state = EXCLUDED.active_scope_state,
  material_scope_state = EXCLUDED.material_scope_state,
  board_scope_state = EXCLUDED.board_scope_state,
  explicit_benefit_assertion = EXCLUDED.explicit_benefit_assertion,
  source_count = EXCLUDED.source_count,
  economic_classification = EXCLUDED.economic_classification,
  canary_contract_ref = EXCLUDED.canary_contract_ref,
  updated_at = now();

INSERT INTO tower.value_case_claim_link (
  tenant_key,
  value_case_id,
  claim_id,
  subject_ref,
  claim_role,
  asserted_benefit_usd,
  source_count,
  source_trust_state,
  source_refs,
  semantic_version
)
SELECT
  vc.tenant_key,
  vc.value_case_id,
  c.claim_id,
  c.subject_ref,
  CASE
    WHEN vc.canary_contract_ref IS NOT NULL THEN 'canary_claim'
    WHEN vc.primary_claim_id = c.claim_id THEN 'primary_claim'
    ELSE 'supporting_claim'
  END,
  CASE
    WHEN vc.source_refs @> jsonb_build_array(jsonb_build_object('claim_id', c.claim_id))
      THEN c.promised_value
    ELSE null::numeric
  END,
  vc.source_count,
  vc.source_trust_state,
  vc.claim_refs,
  'semantic_remediation_v1'
FROM tower.value_case vc
JOIN tower.value_claim c
  ON c.tenant_key = vc.tenant_key
 AND vc.claim_ids ? c.claim_id
WHERE vc.semantic_version = 'semantic_remediation_v1'
ON CONFLICT (tenant_key, value_case_id, claim_id) DO UPDATE SET
  claim_role = EXCLUDED.claim_role,
  asserted_benefit_usd = EXCLUDED.asserted_benefit_usd,
  source_count = EXCLUDED.source_count,
  source_trust_state = EXCLUDED.source_trust_state,
  source_refs = EXCLUDED.source_refs,
  semantic_version = EXCLUDED.semantic_version,
  updated_at = now();

INSERT INTO tower.value_case_period (
  tenant_key,
  value_case_id,
  semantic_version,
  period_start,
  period_end,
  fiscal_quarter,
  scenario,
  planned_investment_usd,
  actual_spend_usd,
  remaining_commitment_usd,
  business_case_value_usd,
  risk_adjusted_forecast_usd,
  finance_validated_run_rate_usd,
  realized_p_and_l_usd,
  realized_cash_usd,
  forecast_at_completion_usd,
  financial_conversion_usd,
  source_trust_state,
  source_refs
)
SELECT
  vc.tenant_key,
  vc.value_case_id,
  'semantic_remediation_v1',
  (date_trunc('quarter', coalesce(vc.value_period_start, vc.as_of_period, current_date)) + (q.n * interval '3 months'))::date AS period_start,
  (date_trunc('quarter', coalesce(vc.value_period_start, vc.as_of_period, current_date)) + (q.n * interval '3 months') + interval '3 months' - interval '1 day')::date AS period_end,
  concat(
    extract(year FROM (date_trunc('quarter', coalesce(vc.value_period_start, vc.as_of_period, current_date)) + (q.n * interval '3 months')))::int,
    '-Q',
    extract(quarter FROM (date_trunc('quarter', coalesce(vc.value_period_start, vc.as_of_period, current_date)) + (q.n * interval '3 months')))::int
  ) AS fiscal_quarter,
  'forecast'::text AS scenario,
  CASE WHEN vc.approved_funding_usd IS NULL THEN null ELSE round(vc.approved_funding_usd / 8.0, 2) END AS planned_investment_usd,
  CASE WHEN vc.actual_spend_usd IS NULL THEN null ELSE round(vc.actual_spend_usd / 8.0, 2) END AS actual_spend_usd,
  CASE
    WHEN vc.approved_funding_usd IS NULL THEN null
    ELSE round(greatest(vc.approved_funding_usd - coalesce(vc.actual_spend_usd, 0), 0) / 8.0, 2)
  END AS remaining_commitment_usd,
  CASE WHEN vc.business_case_value_usd IS NULL THEN null ELSE round(vc.business_case_value_usd / 8.0, 2) END AS business_case_value_usd,
  CASE
    WHEN vc.source_trust_state IN ('AGREE', 'ONE_SOURCE')
      AND vc.business_case_value_usd IS NOT NULL
      AND vc.economic_classification IS NOT NULL THEN
      round(
        vc.business_case_value_usd
        * (
          (CASE WHEN vc.investment_evidence_state = 'present' THEN 0.2 ELSE 0 END) +
          (CASE WHEN vc.usage_evidence_state = 'present' THEN 0.2 ELSE 0 END) +
          (CASE WHEN vc.operational_outcome_evidence_state = 'present' THEN 0.2 ELSE 0 END) +
          (CASE WHEN vc.financial_conversion_evidence_state = 'present' THEN 0.2 ELSE 0 END) +
          (CASE WHEN vc.finance_attestation_state = 'present' THEN 0.2 ELSE 0 END)
        )
        / 8.0,
        2
      )
    ELSE null
  END AS risk_adjusted_forecast_usd,
  CASE WHEN coalesce(vc.finance_validated_value_usd, 0) > 0 THEN round(vc.finance_validated_value_usd / 8.0, 2) ELSE null END AS finance_validated_run_rate_usd,
  CASE WHEN vc.claim_state = 'claimable' AND vc.source_trust_state <> 'CONFLICT' THEN round(coalesce(vc.claimable_value_usd, 0) / 8.0, 2) ELSE null END AS realized_p_and_l_usd,
  null::numeric AS realized_cash_usd,
  CASE
    WHEN vc.source_trust_state IN ('AGREE', 'ONE_SOURCE') AND vc.economic_classification IS NOT NULL
      THEN coalesce(vc.known_calculated_value_usd, vc.business_case_value_usd)
    ELSE null
  END AS forecast_at_completion_usd,
  CASE WHEN vc.claim_state = 'claimable' AND vc.source_trust_state <> 'CONFLICT' THEN round(coalesce(vc.claimable_value_usd, 0) / 8.0, 2) ELSE null END AS financial_conversion_usd,
  vc.source_trust_state,
  vc.source_refs
FROM tower.value_case vc
CROSS JOIN generate_series(0, 7) AS q(n)
WHERE vc.semantic_version = 'semantic_remediation_v1'
ON CONFLICT (tenant_key, value_case_id, period_start, scenario) DO UPDATE SET
  semantic_version = EXCLUDED.semantic_version,
  period_end = EXCLUDED.period_end,
  fiscal_quarter = EXCLUDED.fiscal_quarter,
  planned_investment_usd = EXCLUDED.planned_investment_usd,
  actual_spend_usd = EXCLUDED.actual_spend_usd,
  remaining_commitment_usd = EXCLUDED.remaining_commitment_usd,
  business_case_value_usd = EXCLUDED.business_case_value_usd,
  risk_adjusted_forecast_usd = EXCLUDED.risk_adjusted_forecast_usd,
  finance_validated_run_rate_usd = EXCLUDED.finance_validated_run_rate_usd,
  realized_p_and_l_usd = EXCLUDED.realized_p_and_l_usd,
  realized_cash_usd = EXCLUDED.realized_cash_usd,
  forecast_at_completion_usd = EXCLUDED.forecast_at_completion_usd,
  financial_conversion_usd = EXCLUDED.financial_conversion_usd,
  source_trust_state = EXCLUDED.source_trust_state,
  source_refs = EXCLUDED.source_refs,
  updated_at = now();

INSERT INTO tower.subject_link (
  tenant_key,
  subject_link_id,
  from_subject_ref,
  from_subject_kind,
  link_type,
  to_subject_ref,
  to_subject_kind,
  to_value_case_id,
  source_ref,
  source_trust_state,
  confidence,
  review_state,
  semantic_version
)
SELECT
  vc.tenant_key,
  'sl2-vc-program-' || md5(concat_ws(':', vc.tenant_key, vc.value_case_id, vc.program_id)),
  vc.value_case_id,
  'value_case',
  'VALUE_CASE_TO_PROGRAM',
  vc.program_id,
  'initiative',
  vc.value_case_id,
  vc.primary_claim_id,
  vc.source_trust_state,
  CASE WHEN p.subject_ref IS NOT NULL THEN 0.9 ELSE 0.4 END,
  CASE WHEN p.subject_ref IS NOT NULL THEN 'ready' ELSE 'blocked' END,
  'semantic_remediation_v1'
FROM tower.value_case vc
LEFT JOIN tower.tracked_subject p
  ON p.tenant_key = vc.tenant_key
 AND p.subject_ref = vc.program_id
 AND p.subject_kind = 'initiative'
WHERE vc.semantic_version = 'semantic_remediation_v1'
ON CONFLICT (tenant_key, subject_link_id) DO UPDATE SET
  to_subject_ref = EXCLUDED.to_subject_ref,
  to_value_case_id = EXCLUDED.to_value_case_id,
  source_trust_state = EXCLUDED.source_trust_state,
  confidence = EXCLUDED.confidence,
  review_state = EXCLUDED.review_state,
  semantic_version = EXCLUDED.semantic_version;

WITH ai_subjects AS (
  SELECT
    s.*,
    coalesce(nullif(s.initiative_ref, ''), nullif(s.metadata_json->>'program_id', '')) AS declared_target_ref,
    coalesce(
      nullif(s.workflow_ref, ''),
      nullif(s.metadata_json->>'business_process_ref', ''),
      nullif(s.metadata_json->>'process_area', ''),
      nullif(s.application_ref, '')
    ) AS business_process_ref,
    nullif(s.metadata_json->>'cost_center', '') AS cost_center_ref,
    coalesce(nullif(s.metadata_json->>'project_code', ''), nullif(s.metadata_json->>'program_id', '')) AS project_code_ref
  FROM tower.tracked_subject s
  WHERE s.subject_kind IN ('developer_ai_tool', 'service_agent', 'hr_agent', 'workflow')
),
with_target AS (
  SELECT
    a.*,
    p.subject_ref AS governed_program_ref,
    p.subject_ref IS NOT NULL AS target_is_governed
  FROM ai_subjects a
  LEFT JOIN tower.tracked_subject p
    ON p.tenant_key = a.tenant_key
   AND p.subject_ref = a.declared_target_ref
   AND p.subject_kind = 'initiative'
),
with_value_case AS (
  SELECT
    t.*,
    vc.value_case_id
  FROM with_target t
  LEFT JOIN LATERAL (
    SELECT value_case_id
    FROM tower.value_case vc
    WHERE vc.tenant_key = t.tenant_key
      AND vc.semantic_version = 'semantic_remediation_v1'
      AND (
        vc.program_id = t.governed_program_ref
        OR vc.initiative_id = t.governed_program_ref
      )
    ORDER BY
      (vc.board_scope_state = 'board_portfolio') DESC,
      vc.business_case_value_usd DESC NULLS LAST,
      vc.approved_funding_usd DESC NULLS LAST,
      vc.value_case_id
    LIMIT 1
  ) vc ON true
)
INSERT INTO tower.ai_identity_crosswalk (
  tenant_key,
  ai_subject_ref,
  ai_subject_kind,
  tool_ref,
  agent_ref,
  target_initiative_ref,
  target_program_ref,
  business_process_ref,
  cohort_ref,
  cost_center_ref,
  project_code_ref,
  value_case_id,
  identity_state,
  issue,
  source_refs,
  semantic_version
)
SELECT
  tenant_key,
  subject_ref,
  subject_kind,
  CASE WHEN subject_kind = 'developer_ai_tool' THEN subject_ref ELSE vendor_ref END,
  CASE WHEN subject_kind IN ('service_agent', 'hr_agent', 'workflow') THEN subject_ref ELSE null END,
  governed_program_ref,
  governed_program_ref,
  business_process_ref,
  null::text,
  cost_center_ref,
  project_code_ref,
  value_case_id,
  CASE
    WHEN NOT target_is_governed THEN 'blocked_missing_governed_initiative'
    WHEN value_case_id IS NULL THEN 'review_missing_value_case'
    ELSE 'ready'
  END,
  CASE
    WHEN NOT target_is_governed THEN 'AI subject does not declare a governed initiative/program target.'
    WHEN value_case_id IS NULL THEN 'AI subject targets a governed program but no semantic value case is grouped for that target.'
    ELSE null
  END,
  jsonb_build_array(
    jsonb_build_object(
      'table', 'tower.tracked_subject',
      'subject_ref', subject_ref,
      'declared_target_ref', declared_target_ref,
      'source_file', metadata_json->>'source_file',
      'source_row', metadata_json->>'source_row'
    )
  ),
  'semantic_remediation_v1'
FROM with_value_case
ON CONFLICT (tenant_key, ai_subject_ref, semantic_version) DO UPDATE SET
  ai_subject_kind = EXCLUDED.ai_subject_kind,
  tool_ref = EXCLUDED.tool_ref,
  agent_ref = EXCLUDED.agent_ref,
  target_initiative_ref = EXCLUDED.target_initiative_ref,
  target_program_ref = EXCLUDED.target_program_ref,
  business_process_ref = EXCLUDED.business_process_ref,
  cohort_ref = EXCLUDED.cohort_ref,
  cost_center_ref = EXCLUDED.cost_center_ref,
  project_code_ref = EXCLUDED.project_code_ref,
  value_case_id = EXCLUDED.value_case_id,
  identity_state = EXCLUDED.identity_state,
  issue = EXCLUDED.issue,
  source_refs = EXCLUDED.source_refs,
  updated_at = now();

INSERT INTO tower.subject_link (
  tenant_key,
  subject_link_id,
  from_subject_ref,
  from_subject_kind,
  link_type,
  to_subject_ref,
  to_subject_kind,
  to_value_case_id,
  source_ref,
  source_trust_state,
  confidence,
  review_state,
  semantic_version
)
SELECT
  x.tenant_key,
  'sl2-ai-' || md5(concat_ws(':', x.tenant_key, x.ai_subject_ref, x.target_program_ref, x.value_case_id)),
  x.ai_subject_ref,
  x.ai_subject_kind,
  'AI_SUBJECT_TO_INITIATIVE',
  x.target_program_ref,
  'initiative',
  x.value_case_id,
  x.ai_subject_ref,
  vc.source_trust_state,
  0.9,
  'ready',
  'semantic_remediation_v1'
FROM tower.ai_identity_crosswalk x
JOIN tower.value_case vc
  ON vc.tenant_key = x.tenant_key
 AND vc.value_case_id = x.value_case_id
WHERE x.semantic_version = 'semantic_remediation_v1'
  AND x.identity_state = 'ready'
ON CONFLICT (tenant_key, subject_link_id) DO UPDATE SET
  to_subject_ref = EXCLUDED.to_subject_ref,
  to_value_case_id = EXCLUDED.to_value_case_id,
  source_trust_state = EXCLUDED.source_trust_state,
  confidence = EXCLUDED.confidence,
  review_state = EXCLUDED.review_state,
  semantic_version = EXCLUDED.semantic_version;

INSERT INTO tower.economic_conversion (
  tenant_key,
  conversion_id,
  value_case_id,
  conversion_type,
  conversion_state,
  conversion_basis,
  converted_amount_usd,
  period_start,
  period_end,
  currency,
  source_refs
)
SELECT
  vc.tenant_key,
  'ec2-' || md5(concat_ws(':', vc.tenant_key, vc.value_case_id, vc.semantic_version)),
  vc.value_case_id,
  CASE
    WHEN coalesce(vc.claimable_value_usd, 0) <= 0 OR vc.economic_classification IS NULL THEN 'no_financial_conversion'
    WHEN vc.economic_classification = 'cost_takeout' THEN 'cost_takeout'
    WHEN vc.economic_classification IN ('cost_avoidance', 'risk_loss_avoidance') THEN 'risk_avoidance'
    WHEN vc.economic_classification IN ('revenue', 'gross_margin') THEN 'revenue_lift'
    WHEN vc.economic_classification = 'experience_or_intangible' THEN 'service_credit'
    ELSE 'capacity_to_financial'
  END,
  CASE
    WHEN vc.economic_classification IS NULL THEN 'blocked'
    WHEN coalesce(vc.claimable_value_usd, 0) > 0 AND vc.source_trust_state <> 'CONFLICT' THEN 'accepted'
    ELSE 'blocked'
  END,
  CASE
    WHEN vc.economic_classification IS NULL THEN 'Economic classification is unresolved; value is withheld from economic totals.'
    WHEN coalesce(vc.claimable_value_usd, 0) > 0 AND vc.source_trust_state <> 'CONFLICT' THEN 'Explicit claimable value from governed value evidence.'
    ELSE 'Investment, adoption, and capacity evidence are not converted to savings without an accepted economic conversion event.'
  END,
  CASE WHEN coalesce(vc.claimable_value_usd, 0) > 0 AND vc.source_trust_state <> 'CONFLICT' THEN vc.claimable_value_usd ELSE null END,
  vc.value_period_start,
  vc.value_period_end,
  vc.currency,
  vc.source_refs
FROM tower.value_case vc
WHERE vc.semantic_version = 'semantic_remediation_v1'
ON CONFLICT (tenant_key, conversion_id) DO UPDATE SET
  conversion_type = EXCLUDED.conversion_type,
  conversion_state = EXCLUDED.conversion_state,
  conversion_basis = EXCLUDED.conversion_basis,
  converted_amount_usd = EXCLUDED.converted_amount_usd,
  period_start = EXCLUDED.period_start,
  period_end = EXCLUDED.period_end,
  source_refs = EXCLUDED.source_refs;

INSERT INTO tower.attestation_event (
  tenant_key,
  attestation_id,
  value_case_id,
  attestation_type,
  attestation_state,
  attested_amount_usd,
  attested_by_role,
  attested_at,
  evidence_package_id,
  caveat,
  source_refs
)
SELECT
  vc.tenant_key,
  'ae2-fin-' || md5(concat_ws(':', vc.tenant_key, vc.value_case_id, vc.semantic_version)),
  vc.value_case_id,
  'finance_validation',
  CASE
    WHEN vc.finance_attestation_state = 'present' AND vc.source_trust_state <> 'CONFLICT' THEN 'accepted'
    WHEN vc.finance_attestation_state = 'present' THEN 'conditional'
    ELSE 'missing'
  END,
  vc.finance_validated_value_usd,
  coalesce(vc.finance_owner_role, 'Finance partner'),
  vc.refresh_timestamp,
  'ep2-' || md5(concat_ws(':', vc.tenant_key, vc.value_case_id, 'finance_validation')),
  CASE
    WHEN vc.business_case_value_usd IS NULL THEN 'Finance validation is preserved, but no explicit promised benefit is board-certified.'
    WHEN vc.source_trust_state = 'CONFLICT' THEN 'Finance validation cannot make value claimable while source authority is unresolved.'
    ELSE 'Finance attestation state projected from governed value evidence.'
  END,
  vc.source_refs
FROM tower.value_case vc
WHERE vc.semantic_version = 'semantic_remediation_v1'
ON CONFLICT (tenant_key, attestation_id) DO UPDATE SET
  attestation_state = EXCLUDED.attestation_state,
  attested_amount_usd = EXCLUDED.attested_amount_usd,
  attested_by_role = EXCLUDED.attested_by_role,
  attested_at = EXCLUDED.attested_at,
  evidence_package_id = EXCLUDED.evidence_package_id,
  caveat = EXCLUDED.caveat,
  source_refs = EXCLUDED.source_refs;

WITH action_candidates AS (
  SELECT
    vc.tenant_key,
    vc.value_case_id,
    'source_authority'::text AS proof_stage,
    'fix'::text AS action_lane,
    CASE WHEN coalesce(vc.approved_funding_usd, vc.business_case_value_usd, 0) >= 10000000 THEN 'critical' ELSE 'high' END AS priority,
    CASE WHEN vc.source_trust_state = 'CONFLICT' THEN 'Resolve benefit source conflict' ELSE 'Load explicit benefit assertion' END AS title,
    CASE WHEN vc.source_trust_state = 'CONFLICT'
      THEN 'Two or more source assertions disagree; the board benefit remains withheld until one authority is declared.'
      ELSE 'Approved funding is investment only. Load a source-backed business benefit assertion before reporting promised benefit.'
    END AS action_body,
    'Tower data steward'::text AS owner_role,
    vc.finance_owner_role AS secondary_owner_role,
    coalesce(vc.as_of_period, current_date) + 14 AS due_date,
    '14 days'::text AS due_window,
    'board_benefit_or_scale_decision'::text AS blocked_decision,
    CASE WHEN vc.source_trust_state = 'CONFLICT'
      THEN 'Reconciled source authority with at least two source assertions and one authoritative value.'
      ELSE 'Explicit business-case benefit source with source file, source row, period, owner, and value definition.'
    END AS evidence_requirement,
    'source registry + benefit/value-case extract'::text AS expected_source_system,
    coalesce(vc.business_case_value_usd, vc.approved_funding_usd) AS amount_exposed_usd,
    vc.source_refs,
    vc.program_id
  FROM tower.value_case vc
  WHERE vc.semantic_version = 'semantic_remediation_v1'
    AND vc.board_scope_state = 'board_portfolio'
    AND vc.source_trust_state IN ('ABSENT', 'CONFLICT')

  UNION ALL

  SELECT
    vc.tenant_key,
    vc.value_case_id,
    'lineage',
    'fix',
    'high',
    'Classify the economic value case',
    'Board-scope value cases must carry one CFO economic classification before they contribute to economic totals.',
    coalesce(vc.finance_owner_role, 'Finance partner'),
    vc.owner_role,
    coalesce(vc.as_of_period, current_date) + 14,
    '14 days',
    'economic_total_or_board_case_decision',
    'Economic class: cost_takeout, cost_avoidance, capacity, revenue, gross_margin, working_capital, risk_loss_avoidance, or experience_or_intangible.',
    'Finance value-case taxonomy',
    coalesce(vc.business_case_value_usd, vc.approved_funding_usd),
    vc.claim_refs,
    vc.program_id
  FROM tower.value_case vc
  WHERE vc.semantic_version = 'semantic_remediation_v1'
    AND vc.board_scope_state = 'board_portfolio'
    AND vc.economic_classification IS NULL

  UNION ALL

  SELECT
    vc.tenant_key,
    vc.value_case_id,
    'operational_outcome',
    'fix',
    'medium',
    'Bind baseline, target, and actual KPI evidence',
    'The value case cannot move from adoption to outcome until baseline, target, and actual observations are linked at the same declared grain.',
    vc.owner_role,
    vc.finance_owner_role,
    coalesce(vc.as_of_period, current_date) + 30,
    '30 days',
    'scale_or_claim_decision',
    'Baseline, target, and actual KPI observations linked to the same value case, business process, cohort, and period.',
    'tower.metric_observation',
    coalesce(vc.business_case_value_usd, vc.approved_funding_usd),
    vc.claim_refs,
    vc.program_id
  FROM tower.value_case vc
  WHERE vc.semantic_version = 'semantic_remediation_v1'
    AND vc.board_scope_state = 'board_portfolio'
    AND vc.operational_outcome_evidence_state <> 'present'

  UNION ALL

  SELECT
    vc.tenant_key,
    vc.value_case_id,
    'financial_conversion',
    'fix',
    'medium',
    'Load financial conversion evidence',
    'Usage, capacity, and operational movement do not become dollars until an accepted conversion method and value event exist.',
    coalesce(vc.finance_owner_role, 'Finance partner'),
    vc.owner_role,
    coalesce(vc.as_of_period, current_date) + 30,
    '30 days',
    'p_and_l_or_cash_claim_decision',
    'Accepted economic conversion event with method, value amount, period, and source refs.',
    'tower.economic_conversion',
    coalesce(vc.business_case_value_usd, vc.approved_funding_usd),
    vc.claim_refs,
    vc.program_id
  FROM tower.value_case vc
  WHERE vc.semantic_version = 'semantic_remediation_v1'
    AND vc.board_scope_state = 'board_portfolio'
    AND vc.financial_conversion_evidence_state <> 'present'

  UNION ALL

  SELECT
    vc.tenant_key,
    vc.value_case_id,
    'finance_attestation',
    'fix',
    CASE WHEN coalesce(vc.finance_validated_value_usd, vc.business_case_value_usd, 0) > 0 THEN 'high' ELSE 'medium' END,
    'Complete Finance attestation package',
    'Finance validation must include owner, period, source refs, and attestation before claimable value can be booked.',
    coalesce(vc.finance_owner_role, 'Finance partner'),
    vc.owner_role,
    coalesce(vc.as_of_period, current_date) + 30,
    '30 days',
    'claimable_value_decision',
    'Finance attestation event with evidence package and accepted economic conversion.',
    'tower.attestation_event + tower.economic_conversion',
    coalesce(vc.finance_validated_value_usd, vc.business_case_value_usd, vc.approved_funding_usd),
    vc.claim_refs,
    vc.program_id
  FROM tower.value_case vc
  WHERE vc.semantic_version = 'semantic_remediation_v1'
    AND vc.board_scope_state = 'board_portfolio'
    AND vc.finance_attestation_state <> 'present'
)
INSERT INTO tower.proof_action (
  tenant_key,
  action_id,
  value_case_id,
  proof_stage,
  action_lane,
  priority,
  title,
  action_body,
  owner_role,
  secondary_owner_role,
  due_date,
  due_window,
  blocked_decision,
  evidence_requirement,
  expected_source_system,
  evidence_package_id,
  handoff_module,
  handoff_entity_id,
  amount_exposed_usd,
  source_refs,
  semantic_version
)
SELECT
  tenant_key,
  'pa2-' || md5(concat_ws(':', tenant_key, value_case_id, proof_stage, blocked_decision, evidence_requirement)),
  value_case_id,
  proof_stage,
  action_lane,
  priority,
  title,
  action_body,
  owner_role,
  secondary_owner_role,
  due_date,
  due_window,
  blocked_decision,
  evidence_requirement,
  expected_source_system,
  'ep2-' || md5(concat_ws(':', tenant_key, value_case_id, proof_stage, blocked_decision, evidence_requirement)),
  'Moves',
  program_id,
  amount_exposed_usd,
  source_refs,
  'semantic_remediation_v1'
FROM action_candidates
ON CONFLICT (tenant_key, semantic_version, value_case_id, proof_stage, blocked_decision, evidence_requirement)
WHERE semantic_version = 'semantic_remediation_v1'
DO UPDATE SET
  action_lane = EXCLUDED.action_lane,
  priority = EXCLUDED.priority,
  title = EXCLUDED.title,
  action_body = EXCLUDED.action_body,
  owner_role = EXCLUDED.owner_role,
  secondary_owner_role = EXCLUDED.secondary_owner_role,
  due_date = EXCLUDED.due_date,
  due_window = EXCLUDED.due_window,
  expected_source_system = EXCLUDED.expected_source_system,
  evidence_package_id = EXCLUDED.evidence_package_id,
  handoff_module = EXCLUDED.handoff_module,
  handoff_entity_id = EXCLUDED.handoff_entity_id,
  amount_exposed_usd = EXCLUDED.amount_exposed_usd,
  source_refs = EXCLUDED.source_refs,
  updated_at = now();

CREATE OR REPLACE VIEW consumption.tower_metric_observation_deduped_v1 AS
WITH ranked AS (
  SELECT
    o.*,
    count(*) OVER (
      PARTITION BY
        o.tenant_key,
        o.subject_ref,
        o.metric_ref,
        o.scenario,
        o.period_start,
        o.period_end,
        coalesce(o.cohort_ref, ''),
        coalesce(o.dimension_json::text, '{}')
    ) AS duplicate_observation_count,
    row_number() OVER (
      PARTITION BY
        o.tenant_key,
        o.subject_ref,
        o.metric_ref,
        o.scenario,
        o.period_start,
        o.period_end,
        coalesce(o.cohort_ref, ''),
        coalesce(o.dimension_json::text, '{}')
      ORDER BY o.observed_at DESC NULLS LAST, o.observation_id DESC
    ) AS tower_grain_rank
  FROM tower.metric_observation o
)
SELECT
  *,
  CASE
    WHEN metric_ref = 'ai.active_user_rate' AND denominator IS NOT NULL AND denominator <> 0 THEN numerator / denominator
    ELSE value_num
  END AS governed_value_num,
  CASE WHEN duplicate_observation_count > 1 THEN 'deduped_latest_at_declared_grain' ELSE 'unique_declared_grain' END AS grain_quality_state
FROM ranked
WHERE tower_grain_rank = 1
  AND tower.can_read_tower_tenant(tenant_key);

CREATE OR REPLACE VIEW consumption.tower_board_posture_v1 AS
WITH vc AS (
  SELECT *
  FROM tower.value_case
  WHERE semantic_version = 'semantic_remediation_v1'
    AND tower.can_read_tower_tenant(tenant_key)
),
obs AS (
  SELECT
    tenant_key,
    sum(governed_value_num) FILTER (WHERE metric_ref = 'finance.total_it_budget' AND scenario IN ('actual', 'target')) AS total_budget,
    sum(governed_value_num) FILTER (WHERE metric_ref = 'finance.run_budget' AND scenario IN ('actual', 'target')) AS run_budget,
    sum(governed_value_num) FILTER (WHERE metric_ref = 'finance.change_budget' AND scenario IN ('actual', 'target')) AS change_budget,
    sum(governed_value_num) FILTER (WHERE metric_ref = 'ai.estimated_use_cost' AND scenario IN ('actual', 'target')) AS ai_spend
  FROM consumption.tower_metric_observation_deduped_v1
  GROUP BY tenant_key
),
subjects AS (
  SELECT
    tenant_key,
    count(*) FILTER (WHERE subject_kind = 'initiative') AS total_program_subject_count,
    count(*) FILTER (WHERE subject_kind = 'initiative' AND lower(coalesce(metadata_json->>'active_state', 'active')) NOT IN ('inactive', 'retired', 'archived')) AS active_program_subject_count,
    count(*) FILTER (WHERE subject_kind IN ('developer_ai_tool', 'service_agent', 'hr_agent', 'workflow')) AS ai_initiative_count
  FROM tower.tracked_subject
  WHERE tower.can_read_tower_tenant(tenant_key)
  GROUP BY tenant_key
),
board_programs AS (
  SELECT
    tenant_key,
    count(DISTINCT program_id)::int AS board_scope_program_count,
    count(DISTINCT program_id)::int AS material_program_count
  FROM vc
  WHERE board_scope_state = 'board_portfolio'
  GROUP BY tenant_key
),
investment_rollup AS (
  SELECT tenant_key, sum(program_investment_usd) AS approved_program_budget_fy26
  FROM (
    SELECT
      tenant_key,
      program_id,
      max(approved_funding_usd) AS program_investment_usd
    FROM vc
    WHERE board_scope_state = 'board_portfolio'
    GROUP BY tenant_key, program_id
  ) p
  GROUP BY tenant_key
),
actions AS (
  SELECT
    tenant_key,
    count(*) FILTER (WHERE action_state = 'open') AS open_action_count
  FROM tower.proof_action
  WHERE semantic_version = 'semantic_remediation_v1'
    AND tower.can_read_tower_tenant(tenant_key)
  GROUP BY tenant_key
)
SELECT
  'tower:' || vc.tenant_key || ':board-posture' AS command_center_key,
  vc.tenant_key,
  initcap(replace(vc.tenant_key, '_', ' ')) AS tenant_name,
  'tower-value-os-semantic-remediation-v1'::text AS mart_version,
  'tower.value_case semantic_remediation_v1 -> consumption.tower_*_v1'::text AS source_standard,
  'tower_value_os_semantic_remediation_v1'::text AS formula_version,
  'consumption.tower_value_os_contract_v1.semantic_remediation_v1'::text AS source_contract_version,
  max(vc.dataset_version) AS dataset_version,
  max(vc.source_run_id) AS source_run_id,
  max(vc.as_of_period)::text AS as_of_period,
  max(vc.refresh_timestamp)::text AS refresh_timestamp,
  max(obs.total_budget) AS total_it_budget_fy26,
  max(obs.run_budget) AS run_budget_fy26,
  max(obs.change_budget) AS change_budget_fy26,
  max(investment_rollup.approved_program_budget_fy26) AS approved_program_budget_fy26,
  max(obs.ai_spend) AS ai_tagged_spend_fy26_non_additive,
  sum(vc.business_case_value_usd) FILTER (
    WHERE vc.board_scope_state = 'board_portfolio'
      AND vc.source_trust_state IN ('AGREE', 'ONE_SOURCE')
      AND vc.economic_classification IS NOT NULL
  ) AS promised_value_fy26,
  coalesce(sum(vc.finance_validated_value_usd), 0) AS partial_finance_validated_value_ytd,
  coalesce(sum(vc.claimable_value_usd) FILTER (WHERE vc.source_trust_state <> 'CONFLICT'), 0) AS realized_value_ytd_allowed,
  count(*)::int AS value_claim_count,
  count(*) FILTER (WHERE vc.known_calculated_value_usd IS NOT NULL)::int AS known_value_claim_count,
  count(*) FILTER (WHERE vc.known_calculated_value_usd IS NULL)::int AS unknown_value_claim_count,
  count(*) FILTER (WHERE vc.known_calculated_value_usd = 0)::int AS known_zero_value_claim_count,
  sum(vc.known_calculated_value_usd) AS known_value_amount_usd,
  count(*) FILTER (WHERE vc.finance_attestation_state = 'present')::int AS finance_attested_claim_count,
  count(*) FILTER (WHERE vc.operational_outcome_evidence_state = 'present')::int AS business_attested_claim_count,
  count(*) FILTER (WHERE vc.claim_state = 'claimable' AND vc.source_trust_state <> 'CONFLICT')::int AS claimable_claim_count,
  count(*) FILTER (WHERE vc.usage_evidence_state = 'present')::int AS usage_supported_claim_count,
  count(*) FILTER (WHERE vc.investment_evidence_state = 'present' AND vc.operational_outcome_evidence_state <> 'present')::int AS funded_no_baseline_claim_count,
  count(*) FILTER (WHERE vc.claim_state = 'stale')::int AS stale_claim_count,
  count(*) FILTER (WHERE vc.claim_state = 'disputed' OR vc.source_trust_state = 'CONFLICT')::int AS disputed_claim_count,
  count(*) FILTER (WHERE vc.operational_outcome_evidence_state = 'present')::int AS baseline_linked_claim_count,
  count(*) FILTER (WHERE vc.operational_outcome_evidence_state = 'present')::int AS target_linked_claim_count,
  count(*) FILTER (WHERE vc.operational_outcome_evidence_state = 'present')::int AS actual_linked_claim_count,
  count(*) FILTER (WHERE vc.operational_outcome_evidence_state = 'present')::int AS outcome_measured_claim_count,
  count(*) FILTER (WHERE vc.claim_state = 'claimable' AND vc.source_trust_state <> 'CONFLICT')::int AS claimable_program_count,
  count(*) FILTER (WHERE vc.claim_state <> 'claimable' OR vc.source_trust_state = 'CONFLICT')::int AS blocked_program_count,
  count(*) FILTER (WHERE vc.source_trust_state = 'CONFLICT')::int AS conflicted_program_count,
  count(*) FILTER (WHERE vc.operational_outcome_evidence_state <> 'present')::int AS unmeasured_program_count,
  coalesce(max(board_programs.board_scope_program_count), 0)::int AS program_count,
  coalesce(max(subjects.ai_initiative_count), 0)::int AS ai_initiative_count,
  count(*) FILTER (WHERE vc.claim_state = 'adoption_only')::int AS candidate_ai_opportunities,
  coalesce(max(actions.open_action_count), 0)::int AS watch_pressure_signals,
  coalesce(sum(vc.finance_validated_value_usd), 0) - coalesce(sum(vc.claimable_value_usd) FILTER (WHERE vc.source_trust_state <> 'CONFLICT'), 0) AS finance_validated_blocked_value,
  sum(vc.business_case_value_usd) FILTER (
    WHERE vc.board_scope_state = 'board_portfolio'
      AND vc.source_trust_state IN ('AGREE', 'ONE_SOURCE')
      AND vc.economic_classification IS NOT NULL
  ) AS promised_value_exposure,
  CASE WHEN max(obs.total_budget) > 0 THEN max(obs.run_budget) / max(obs.total_budget) ELSE null END AS run_ratio,
  CASE WHEN max(obs.total_budget) > 0 THEN max(obs.change_budget) / max(obs.total_budget) ELSE null END AS change_ratio,
  CASE WHEN count(*) > 0 THEN (count(*) FILTER (WHERE vc.finance_attestation_state = 'present'))::numeric / count(*) ELSE null END AS finance_validation_ratio,
  'Are we investing capital, changing work, and converting explicit benefit cases into claimable economic outcomes?'::text AS decision_question,
  CASE
    WHEN sum(vc.business_case_value_usd) FILTER (WHERE vc.source_trust_state IN ('AGREE', 'ONE_SOURCE')) IS NULL THEN
      'Tower separates investment from benefit: approved funding is visible, but no board-certified promised benefit is shown without an explicit benefit assertion.'
    WHEN bool_or(vc.source_trust_state = 'CONFLICT') THEN
      'Benefit source authority has conflicts; economic benefit is withheld from board totals until source assertions reconcile.'
    ELSE
      'Tower value cases are grouped by initiative, process, benefit type, and horizon. Claimable value is limited to accepted economic conversion and attestation evidence.'
  END AS executive_summary,
  CASE
    WHEN bool_or(vc.source_trust_state = 'CONFLICT') THEN 'CONFLICT - authority unresolved'
    WHEN sum(vc.business_case_value_usd) FILTER (WHERE vc.source_trust_state IN ('AGREE', 'ONE_SOURCE')) IS NOT NULL THEN 'explicit benefit loaded'
    ELSE 'ABSENT - no explicit benefit assertion'
  END AS promised_value_board_status,
  CASE
    WHEN bool_or(vc.source_trust_state = 'CONFLICT') THEN 'CONFLICT'
    WHEN bool_or(vc.source_trust_state = 'AGREE') THEN 'AGREE'
    WHEN bool_or(vc.source_trust_state = 'ONE_SOURCE') THEN 'ONE_SOURCE'
    ELSE 'ABSENT'
  END AS promised_value_trust_state,
  ARRAY[
    'tower.value_case semantic_remediation_v1',
    'tower.value_case_claim_link',
    'tower.ai_identity_crosswalk',
    'tower.value_case_period semantic_remediation_v1',
    'tower.proof_action semantic_remediation_v1',
    'consumption.tower_*_v1'
  ]::text[] AS source_files,
  coalesce(max(subjects.total_program_subject_count), 0)::int AS total_program_subject_count,
  coalesce(max(subjects.active_program_subject_count), 0)::int AS active_program_subject_count,
  coalesce(max(board_programs.material_program_count), 0)::int AS material_program_count,
  coalesce(max(board_programs.board_scope_program_count), 0)::int AS board_scope_program_count,
  count(*) FILTER (WHERE vc.economic_classification IS NULL)::int AS economic_review_queue_count,
  jsonb_build_object(
    'total_program_subjects', coalesce(max(subjects.total_program_subject_count), 0),
    'active_program_subjects', coalesce(max(subjects.active_program_subject_count), 0),
    'material_programs', coalesce(max(board_programs.material_program_count), 0),
    'board_scope_programs', coalesce(max(board_programs.board_scope_program_count), 0),
    'ai_initiatives', coalesce(max(subjects.ai_initiative_count), 0),
    'semantic_version', 'semantic_remediation_v1'
  ) AS portfolio_scope_json
FROM vc
LEFT JOIN obs ON obs.tenant_key = vc.tenant_key
LEFT JOIN subjects ON subjects.tenant_key = vc.tenant_key
LEFT JOIN board_programs ON board_programs.tenant_key = vc.tenant_key
LEFT JOIN investment_rollup ON investment_rollup.tenant_key = vc.tenant_key
LEFT JOIN actions ON actions.tenant_key = vc.tenant_key
GROUP BY vc.tenant_key;

CREATE OR REPLACE VIEW consumption.tower_value_trajectory_v1 AS
SELECT
  p.tenant_key,
  p.value_case_id,
  vc.program_id,
  vc.initiative_id,
  vc.value_case_name,
  vc.value_archetype,
  p.period_start,
  p.period_end,
  p.fiscal_quarter,
  p.scenario,
  p.planned_investment_usd,
  p.actual_spend_usd,
  p.remaining_commitment_usd,
  p.business_case_value_usd,
  p.business_case_value_usd AS business_case_benefit_usd,
  p.risk_adjusted_forecast_usd,
  p.finance_validated_run_rate_usd,
  p.realized_p_and_l_usd,
  p.realized_cash_usd,
  p.forecast_at_completion_usd,
  p.financial_conversion_usd,
  vc.usage_evidence_state,
  vc.operational_outcome_evidence_state,
  vc.finance_attestation_state,
  p.source_trust_state,
  vc.claim_state,
  vc.dataset_version,
  vc.source_run_id,
  vc.source_refs,
  vc.economic_classification,
  vc.board_scope_state,
  vc.material_scope_state,
  vc.source_count
FROM tower.value_case_period p
JOIN tower.value_case vc
  ON vc.tenant_key = p.tenant_key
 AND vc.value_case_id = p.value_case_id
WHERE p.semantic_version = 'semantic_remediation_v1'
  AND vc.semantic_version = 'semantic_remediation_v1'
  AND tower.can_read_tower_tenant(p.tenant_key);

CREATE OR REPLACE VIEW consumption.tower_portfolio_decision_v1 AS
SELECT
  vc.tenant_key,
  'tower:' || vc.tenant_key || ':decision:' || vc.value_case_id AS decision_ref,
  vc.value_case_id,
  vc.program_id,
  vc.initiative_id,
  vc.value_case_name AS program_name,
  vc.owner_role,
  vc.finance_owner_role,
  CASE
    WHEN vc.source_trust_state = 'CONFLICT' THEN 'fix'
    WHEN vc.source_trust_state = 'ABSENT' THEN 'fix'
    WHEN vc.economic_classification IS NULL THEN 'fix'
    WHEN vc.claim_state = 'claimable' AND coalesce(vc.claimable_value_usd, 0) > 0 THEN 'fund'
    WHEN vc.operational_outcome_evidence_state = 'missing' THEN 'freeze'
    ELSE 'fix'
  END AS decision_lane,
  CASE
    WHEN vc.source_trust_state = 'CONFLICT' THEN 'Benefit source authority conflict blocks board-visible value.'
    WHEN vc.source_trust_state = 'ABSENT' THEN 'Approved funding is investment only; promised benefit is absent until an explicit benefit source is loaded.'
    WHEN vc.economic_classification IS NULL THEN 'Economic classification is unresolved, so the value case stays in review.'
    WHEN vc.claim_state = 'claimable' AND coalesce(vc.claimable_value_usd, 0) > 0 THEN 'Claimable value has accepted conversion and attestation evidence.'
    WHEN vc.operational_outcome_evidence_state = 'missing' THEN 'Operational outcome proof is missing.'
    ELSE 'Evidence chain is incomplete.'
  END AS decision_rationale,
  vc.approved_funding_usd,
  vc.approved_funding_usd AS funded_amount,
  null::numeric AS ai_tagged_spend_usd,
  vc.business_case_value_usd AS promised_value_usd,
  vc.finance_validated_value_usd AS finance_validated_value_usd,
  vc.known_calculated_value_usd AS known_supported_value,
  (
    (CASE WHEN vc.investment_evidence_state = 'present' THEN 20 ELSE 0 END) +
    (CASE WHEN vc.usage_evidence_state = 'present' THEN 20 ELSE 0 END) +
    (CASE WHEN vc.operational_outcome_evidence_state = 'present' THEN 20 ELSE 0 END) +
    (CASE WHEN vc.financial_conversion_evidence_state = 'present' THEN 20 ELSE 0 END) +
    (CASE WHEN vc.finance_attestation_state = 'present' THEN 20 ELSE 0 END)
  )::int AS proof_maturity_score,
  CASE
    WHEN vc.source_trust_state = 'CONFLICT' THEN 95
    WHEN vc.source_trust_state = 'ABSENT' THEN 85
    WHEN vc.economic_classification IS NULL THEN 80
    WHEN vc.operational_outcome_evidence_state = 'missing' THEN 75
    WHEN vc.finance_attestation_state = 'missing' THEN 65
    ELSE 35
  END::int AS risk_pressure_score,
  CASE WHEN vc.usage_evidence_state = 'present' THEN 70 ELSE 0 END::int AS usage_strength_score,
  vc.source_trust_state AS lineage_trust_state,
  CASE
    WHEN vc.source_trust_state IN ('CONFLICT', 'ABSENT') THEN 'FIX_SOURCE_TRUST'
    WHEN vc.economic_classification IS NULL THEN 'CLASSIFY_ECONOMICS'
    WHEN vc.claim_state = 'claimable' AND coalesce(vc.claimable_value_usd, 0) > 0 THEN 'SCALE'
    WHEN vc.operational_outcome_evidence_state = 'missing' THEN 'FREEZE'
    ELSE 'FIX_PROOF'
  END AS decision_reason_code,
  CASE
    WHEN vc.business_case_value_usd IS NULL THEN null
    ELSE greatest(vc.business_case_value_usd - coalesce(vc.claimable_value_usd, 0), 0)
  END AS amount_blocked,
  vc.next_required_extract AS next_gate,
  CASE WHEN vc.usage_evidence_state = 'present' THEN 'usage evidence linked' ELSE null END AS usage_metric,
  CASE WHEN vc.usage_evidence_state = 'present' THEN 1 ELSE null END AS usage_actual,
  null::numeric AS adoption_rate_pct,
  vc.claim_state AS value_claim_status,
  CASE WHEN vc.claim_state = 'claimable' AND vc.source_trust_state <> 'CONFLICT' THEN 'allowed' WHEN coalesce(vc.finance_validated_value_usd, 0) > 0 THEN 'partial' ELSE 'blocked' END AS tower_claim_allowed,
  jsonb_build_array(
    jsonb_build_object('ask', 'Investment evidence', 'status', vc.investment_evidence_state),
    jsonb_build_object('ask', 'Source trust', 'status', vc.source_trust_state, 'source_count', vc.source_count),
    jsonb_build_object('ask', 'Economic classification', 'status', vc.economic_classification_state),
    jsonb_build_object('ask', 'Operational outcome', 'status', vc.operational_outcome_evidence_state),
    jsonb_build_object('ask', 'Financial conversion', 'status', vc.financial_conversion_evidence_state),
    jsonb_build_object('ask', 'Finance attestation', 'status', vc.finance_attestation_state)
  ) AS required_gates,
  CASE
    WHEN vc.source_trust_state = 'ABSENT' THEN 'No promised benefit is shown because no explicit benefit assertion exists. Approved funding remains investment.'
    WHEN vc.source_trust_state = 'CONFLICT' THEN 'Promised benefit is withheld until source authority reconciles.'
    WHEN vc.economic_classification IS NULL THEN 'Board-scope value case is in the economic classification review queue.'
    ELSE 'Value case is governed by Tower Value OS semantic remediation v1.'
  END AS caveat,
  'tower.value_case'::text AS source_file,
  vc.value_case_id AS source_row,
  vc.economic_classification,
  vc.board_scope_state,
  vc.material_scope_state,
  vc.source_count,
  vc.claim_count
FROM tower.value_case vc
WHERE vc.semantic_version = 'semantic_remediation_v1'
  AND tower.can_read_tower_tenant(vc.tenant_key);

CREATE OR REPLACE VIEW consumption.tower_tool_productivity_v1 AS
WITH ai_subject AS (
  SELECT *
  FROM tower.tracked_subject
  WHERE subject_kind IN ('developer_ai_tool', 'hr_agent')
    AND tower.can_read_tower_tenant(tenant_key)
),
usage_obs AS (
  SELECT
    tenant_key,
    subject_ref,
    max(governed_value_num) FILTER (WHERE metric_ref = 'ai.active_users') AS active_users,
    max(governed_value_num) FILTER (WHERE metric_ref = 'ai.seats_purchased') AS seats_purchased,
    max(governed_value_num) FILTER (WHERE metric_ref = 'ai.estimated_use_cost') AS estimated_use_cost,
    max(value_num) FILTER (WHERE metric_ref = 'ai.active_user_rate') AS stored_usage_rate,
    max(governed_value_num) FILTER (WHERE metric_ref = 'ai.active_user_rate') AS recalculated_usage_rate,
    max(duplicate_observation_count) AS duplicate_observation_count,
    max(source_result_hash) AS source_result_hash
  FROM consumption.tower_metric_observation_deduped_v1
  WHERE metric_ref IN ('ai.active_users', 'ai.seats_purchased', 'ai.estimated_use_cost', 'ai.active_user_rate')
  GROUP BY tenant_key, subject_ref
),
normalized_usage AS (
  SELECT
    *,
    CASE
      WHEN stored_usage_rate IS NULL THEN null
      WHEN stored_usage_rate <= 1 THEN round(stored_usage_rate * 100.0, 2)
      ELSE round(stored_usage_rate, 2)
    END AS reported_usage_rate_pct,
    CASE
      WHEN coalesce(seats_purchased, 0) > 0 THEN round((coalesce(active_users, 0) / seats_purchased) * 100.0, 2)
      ELSE null
    END AS calculated_usage_rate_pct
  FROM usage_obs
),
usage_quality AS (
  SELECT
    *,
    CASE
      WHEN reported_usage_rate_pct IS NOT NULL AND calculated_usage_rate_pct IS NOT NULL THEN abs(calculated_usage_rate_pct - reported_usage_rate_pct)
      ELSE null
    END AS usage_rate_variance_pct,
    CASE
      WHEN coalesce(seats_purchased, 0) = 0 THEN 'missing_denominator'
      WHEN coalesce(active_users, 0) > coalesce(seats_purchased, 0) THEN 'active_exceeds_licensed'
      WHEN reported_usage_rate_pct IS NOT NULL AND calculated_usage_rate_pct IS NOT NULL AND abs(calculated_usage_rate_pct - reported_usage_rate_pct) > 0.5 THEN 'reported_rate_variance'
      ELSE 'reconciled'
    END AS usage_rate_quality_state,
    CASE
      WHEN coalesce(active_users, 0) > coalesce(seats_purchased, 0) THEN null
      ELSE calculated_usage_rate_pct
    END AS effective_usage_rate_pct
  FROM normalized_usage
)
SELECT
  s.tenant_key,
  'tower:' || s.tenant_key || ':tool:' || s.subject_ref AS ai_portfolio_key,
  s.title AS item_name,
  CASE WHEN x.identity_state = 'ready' THEN 'usage_benefit' ELSE 'candidate_opportunity' END AS item_kind,
  coalesce(s.metadata_json->>'vendor_provider', s.vendor_ref) AS vendor_name,
  s.subject_ref AS system_name,
  'workforce productivity tool'::text AS ai_spend_type,
  'Developer and workforce AI'::text AS ai_spend_category,
  s.funding_status,
  CASE WHEN x.identity_state = 'ready' THEN 'fix' ELSE 'freeze' END AS decision_lane,
  vc.approved_funding_usd,
  o.estimated_use_cost AS ai_tagged_spend_usd,
  vc.business_case_value_usd AS promised_value_usd,
  vc.finance_validated_value_usd AS finance_validated_value_usd,
  'active users'::text AS usage_metric,
  o.active_users AS usage_actual,
  o.effective_usage_rate_pct AS adoption_rate_pct,
  o.reported_usage_rate_pct,
  o.calculated_usage_rate_pct,
  o.usage_rate_variance_pct,
  o.usage_rate_quality_state,
  o.effective_usage_rate_pct,
  CASE WHEN vc.business_case_value_usd IS NOT NULL THEN 65 ELSE 35 END AS value_score,
  CASE WHEN coalesce(o.seats_purchased, 0) > 0 THEN least(100, round(coalesce(o.effective_usage_rate_pct, 0), 0)) ELSE 0 END AS readiness_score,
  CASE
    WHEN x.identity_state <> 'ready' THEN 90
    WHEN coalesce(o.duplicate_observation_count, 1) > 1 THEN 70
    ELSE 50
  END AS risk_score,
  CASE WHEN coalesce(o.duplicate_observation_count, 1) > 1 THEN 'deduped_latest_declared_grain' ELSE null END AS duplicate_risk,
  coalesce(vc.claim_state, 'adoption_only') AS value_claim_status,
  CASE WHEN vc.claim_state = 'claimable' AND vc.source_trust_state <> 'CONFLICT' THEN 'allowed' ELSE 'blocked' END AS tower_claim_allowed,
  CASE
    WHEN x.identity_state <> 'ready' THEN coalesce(x.issue, 'AI subject identity requires a governed initiative/program/value-case link.')
    WHEN o.usage_rate_quality_state = 'reported_rate_variance' THEN 'Stored usage rate differs from calculated active/licensed rate; governed view uses the calculated rate.'
    WHEN o.usage_rate_quality_state = 'active_exceeds_licensed' THEN 'Active users exceed licensed or eligible users; usage evidence is blocked until the denominator is corrected.'
    ELSE 'Usage/adoption evidence is visible but does not become savings without outcome and conversion evidence.'
  END AS caveat,
  'tower.ai_identity_crosswalk + consumption.tower_metric_observation_deduped_v1'::text AS source_file,
  o.source_result_hash AS source_row,
  x.identity_state,
  x.target_program_ref,
  x.value_case_id
FROM ai_subject s
LEFT JOIN tower.ai_identity_crosswalk x
  ON x.tenant_key = s.tenant_key
 AND x.ai_subject_ref = s.subject_ref
 AND x.semantic_version = 'semantic_remediation_v1'
LEFT JOIN tower.value_case vc
  ON vc.tenant_key = x.tenant_key
 AND vc.value_case_id = x.value_case_id
 AND vc.semantic_version = 'semantic_remediation_v1'
LEFT JOIN usage_quality o
  ON o.tenant_key = s.tenant_key
 AND o.subject_ref = s.subject_ref;

CREATE OR REPLACE VIEW consumption.tower_agent_outcome_v1 AS
WITH agent_subject AS (
  SELECT *
  FROM tower.tracked_subject
  WHERE subject_kind IN ('service_agent', 'workflow')
    AND tower.can_read_tower_tenant(tenant_key)
),
agent_obs AS (
  SELECT
    tenant_key,
    subject_ref,
    count(*) AS observation_count,
    max(governed_value_num) FILTER (WHERE scenario = 'actual') AS latest_actual,
    max(duplicate_observation_count) AS duplicate_observation_count,
    max(source_result_hash) AS source_result_hash
  FROM consumption.tower_metric_observation_deduped_v1
  GROUP BY tenant_key, subject_ref
)
SELECT
  s.tenant_key,
  'tower:' || s.tenant_key || ':agent:' || s.subject_ref AS ai_portfolio_key,
  s.title AS item_name,
  'embedded_platform'::text AS item_kind,
  coalesce(s.metadata_json->>'vendor_provider', s.vendor_ref) AS vendor_name,
  coalesce(s.workflow_ref, s.application_ref, s.subject_ref) AS system_name,
  'process or agent automation'::text AS ai_spend_type,
  'Service and workflow agents'::text AS ai_spend_category,
  s.funding_status,
  CASE WHEN x.identity_state = 'ready' THEN 'fix' ELSE 'freeze' END AS decision_lane,
  vc.approved_funding_usd,
  null::numeric AS ai_tagged_spend_usd,
  vc.business_case_value_usd AS promised_value_usd,
  vc.finance_validated_value_usd AS finance_validated_value_usd,
  'operational outcome observations'::text AS usage_metric,
  o.latest_actual AS usage_actual,
  null::numeric AS adoption_rate_pct,
  CASE WHEN vc.operational_outcome_evidence_state = 'present' THEN 70 ELSE 30 END AS value_score,
  least(100, coalesce(o.observation_count, 0) * 20)::numeric AS readiness_score,
  CASE WHEN x.identity_state <> 'ready' THEN 90 WHEN vc.operational_outcome_evidence_state = 'missing' THEN 75 ELSE 45 END AS risk_score,
  CASE WHEN coalesce(o.duplicate_observation_count, 1) > 1 THEN 'deduped_latest_declared_grain' ELSE null END AS duplicate_risk,
  coalesce(vc.claim_state, 'adoption_only') AS value_claim_status,
  CASE WHEN vc.claim_state = 'claimable' AND vc.source_trust_state <> 'CONFLICT' THEN 'allowed' ELSE 'blocked' END AS tower_claim_allowed,
  CASE WHEN x.identity_state <> 'ready' THEN coalesce(x.issue, 'Agent identity requires a governed initiative/program/value-case link.') ELSE 'Agent outcomes require operational and economic conversion proof before financial value is claimable.' END AS caveat,
  'tower.ai_identity_crosswalk + consumption.tower_agent_outcome_v1'::text AS source_file,
  o.source_result_hash AS source_row,
  x.identity_state,
  x.target_program_ref,
  x.value_case_id
FROM agent_subject s
LEFT JOIN tower.ai_identity_crosswalk x
  ON x.tenant_key = s.tenant_key
 AND x.ai_subject_ref = s.subject_ref
 AND x.semantic_version = 'semantic_remediation_v1'
LEFT JOIN tower.value_case vc
  ON vc.tenant_key = x.tenant_key
 AND vc.value_case_id = x.value_case_id
 AND vc.semantic_version = 'semantic_remediation_v1'
LEFT JOIN agent_obs o
  ON o.tenant_key = s.tenant_key
 AND o.subject_ref = s.subject_ref;

CREATE OR REPLACE VIEW consumption.tower_action_queue_v1 AS
SELECT
  tenant_key,
  action_id AS action_key,
  row_number() OVER (
    PARTITION BY tenant_key
    ORDER BY
      CASE priority WHEN 'critical' THEN 0 WHEN 'high' THEN 1 WHEN 'medium' THEN 2 ELSE 3 END,
      due_date,
      amount_exposed_usd DESC NULLS LAST,
      action_id
  )::int AS sequence,
  action_lane,
  title,
  action_body,
  owner_role AS owner_hint,
  handoff_module AS module_handoff,
  handoff_entity_id AS program_id,
  value_case_id AS claim_id,
  proof_stage,
  blocked_decision,
  amount_exposed_usd AS amount_exposed,
  evidence_requirement,
  expected_source_system,
  evidence_package_id,
  owner_role,
  secondary_owner_role,
  due_window,
  due_date,
  handoff_module,
  handoff_entity_id,
  handoff_readiness,
  action_state,
  priority
FROM tower.proof_action
WHERE semantic_version = 'semantic_remediation_v1'
  AND tower.can_read_tower_tenant(tenant_key);

CREATE OR REPLACE VIEW consumption.tower_source_trust_v1 AS
SELECT
  vc.tenant_key,
  'tower:' || vc.tenant_key || ':source-trust:' || vc.value_case_id AS lineage_key,
  'value_case'::text AS surface_section,
  vc.value_case_name AS displayed_fact,
  CASE
    WHEN vc.source_trust_state = 'CONFLICT' THEN 'CONFLICT - authority unresolved'
    WHEN vc.source_trust_state = 'ABSENT' THEN 'ABSENT - no explicit benefit assertion'
    WHEN vc.source_trust_state = 'AGREE' THEN 'AGREE - multiple sources align'
    ELSE 'ONE_SOURCE - single source assertion'
  END AS displayed_value_text,
  vc.business_case_value_usd AS displayed_value_numeric,
  vc.value_case_id AS metric_or_fact_key,
  'Promised benefit'::text AS board_visible_label,
  vc.source_trust_state AS lineage_state,
  vc.source_count,
  vc.source_refs,
  CASE WHEN vc.source_trust_state = 'CONFLICT' THEN vc.source_assertion_values ELSE '[]'::jsonb END AS conflicting_values,
  CASE WHEN vc.source_trust_state IN ('AGREE', 'ONE_SOURCE') THEN vc.business_case_value_usd::text ELSE null END AS authoritative_value,
  coalesce(vc.finance_owner_role, 'Tower data steward') AS resolution_owner_role,
  CASE WHEN vc.source_trust_state IN ('CONFLICT', 'ABSENT') THEN 'open' ELSE 'not_required' END AS resolution_state,
  'tower.value_case'::text AS source_file,
  vc.value_case_id AS source_row,
  'tower'::text AS source_system,
  CASE
    WHEN vc.source_trust_state = 'ABSENT' THEN 'Approved funding is investment, not promised benefit; no explicit benefit source is loaded.'
    WHEN vc.source_trust_state = 'CONFLICT' THEN 'Source conflicts block claimable or realized value.'
    ELSE 'Source state follows source-count and agreement rules.'
  END AS caveat
FROM tower.value_case vc
WHERE vc.semantic_version = 'semantic_remediation_v1'
  AND tower.can_read_tower_tenant(vc.tenant_key)

UNION ALL

SELECT
  tenant_key,
  'tower:' || tenant_key || ':source-trust:board-promised-benefit' AS lineage_key,
  'board_value_posture'::text AS surface_section,
  'Board promised benefit exposure'::text AS displayed_fact,
  promised_value_board_status AS displayed_value_text,
  promised_value_exposure AS displayed_value_numeric,
  'board_promised_benefit'::text AS metric_or_fact_key,
  'Promised benefit'::text AS board_visible_label,
  promised_value_trust_state AS lineage_state,
  CASE WHEN promised_value_trust_state = 'ABSENT' THEN 0 ELSE 1 END::int AS source_count,
  jsonb_build_array(jsonb_build_object('view', 'consumption.tower_board_posture_v1', 'contract', source_contract_version)) AS source_refs,
  CASE WHEN promised_value_trust_state = 'CONFLICT' THEN jsonb_build_array(jsonb_build_object('state', promised_value_board_status)) ELSE '[]'::jsonb END AS conflicting_values,
  CASE WHEN promised_value_trust_state IN ('AGREE', 'ONE_SOURCE') THEN promised_value_exposure::text ELSE null END AS authoritative_value,
  'Tower data steward'::text AS resolution_owner_role,
  CASE WHEN promised_value_trust_state IN ('CONFLICT', 'ABSENT') THEN 'open' ELSE 'not_required' END AS resolution_state,
  'consumption.tower_board_posture_v1'::text AS source_file,
  null::text AS source_row,
  'tower'::text AS source_system,
  executive_summary AS caveat
FROM consumption.tower_board_posture_v1;

CREATE OR REPLACE FUNCTION tower.assert_tower_value_os_semantic_remediation_v1()
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  bad_conflicts integer;
  bad_ai_links integer;
  bad_actions integer;
BEGIN
  SELECT count(*) INTO bad_conflicts
  FROM tower.value_case
  WHERE semantic_version = 'semantic_remediation_v1'
    AND source_trust_state = 'CONFLICT'
    AND source_count < 2;

  IF bad_conflicts > 0 THEN
    RAISE EXCEPTION 'Tower semantic remediation failed: % CONFLICT value cases have source_count < 2', bad_conflicts;
  END IF;

  SELECT count(*) INTO bad_ai_links
  FROM tower.ai_identity_crosswalk x
  WHERE semantic_version = 'semantic_remediation_v1'
    AND identity_state = 'ready'
    AND NOT EXISTS (
      SELECT 1
      FROM tower.tracked_subject s
      WHERE s.tenant_key = x.tenant_key
        AND s.subject_ref = x.target_program_ref
        AND s.subject_kind = 'initiative'
    );

  IF bad_ai_links > 0 THEN
    RAISE EXCEPTION 'Tower semantic remediation failed: % ready AI identity links do not target governed initiative/program entities', bad_ai_links;
  END IF;

  SELECT count(*) INTO bad_actions
  FROM (
    SELECT tenant_key, value_case_id, proof_stage, blocked_decision, evidence_requirement
    FROM tower.proof_action
    WHERE semantic_version = 'semantic_remediation_v1'
    GROUP BY tenant_key, value_case_id, proof_stage, blocked_decision, evidence_requirement
    HAVING count(*) > 1
  ) duplicated;

  IF bad_actions > 0 THEN
    RAISE EXCEPTION 'Tower semantic remediation failed: % duplicate proof-action groups remain', bad_actions;
  END IF;
END;
$$;

SELECT tower.assert_tower_value_os_semantic_remediation_v1();

GRANT SELECT ON
  tower.value_case_claim_link,
  tower.ai_identity_crosswalk,
  consumption.tower_metric_observation_deduped_v1,
  consumption.tower_board_posture_v1,
  consumption.tower_value_trajectory_v1,
  consumption.tower_portfolio_decision_v1,
  consumption.tower_tool_productivity_v1,
  consumption.tower_agent_outcome_v1,
  consumption.tower_action_queue_v1,
  consumption.tower_source_trust_v1
TO authenticated, service_role;

GRANT INSERT, UPDATE, DELETE ON
  tower.value_case_claim_link,
  tower.ai_identity_crosswalk
TO service_role;

COMMENT ON TABLE tower.value_case_claim_link IS
  'Semantic remediation bridge: one grouped value case may contain many governed value claims.';
COMMENT ON TABLE tower.ai_identity_crosswalk IS
  'Semantic remediation AI identity map from tools/agents to governed initiative, process, cohort, cost center, project code, and value case.';
COMMENT ON VIEW consumption.tower_board_posture_v1 IS
  'Tower board posture with investment vs benefit separation, source-count trust, corpus/material/board-scope counts, and null-preserving value semantics.';
COMMENT ON VIEW consumption.tower_source_trust_v1 IS
  'Source trust trail using 0=ABSENT, 1=ONE_SOURCE, 2+ agreeing=AGREE, 2+ disagreeing=CONFLICT.';
