-- Tower AI Value Operating System v1
--
-- Purpose:
--   Add the shared Tower value-case layer on top of the current `tower.*`
--   canonical measurement schema, then publish governed consumption views for
--   Tower UI, aVa, exports, and Cube models.
--
-- Guardrails:
--   * Do not revive the retired Tower projection route.
--   * Do not convert capacity, adoption, or hours-saved evidence into dollars
--     without an explicit economic conversion event.
--   * Source authority conflicts stay blocked at the consumption layer.
--   * Raw duplicate observations are preserved, but governed reads use one row
--     per declared observation grain.

CREATE SCHEMA IF NOT EXISTS tower;
CREATE SCHEMA IF NOT EXISTS consumption;

-- Upstream Tower source facts are populated by governed loaders. These
-- foundations make a clean database replay deterministic before tenant data is
-- loaded; existing lab tables and rows are left unchanged.
CREATE TABLE IF NOT EXISTS tower.tracked_subject (
  tenant_key text NOT NULL,
  subject_ref text NOT NULL,
  subject_kind text NOT NULL DEFAULT 'initiative',
  title text NOT NULL,
  initiative_ref text,
  owner_role text,
  launch_date date,
  vendor_ref text,
  workflow_ref text,
  application_ref text,
  funding_status text,
  metadata_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (tenant_key, subject_ref)
);

CREATE TABLE IF NOT EXISTS tower.metric_observation (
  tenant_key text NOT NULL,
  observation_id text NOT NULL DEFAULT ('obs-' || md5(random()::text || clock_timestamp()::text)),
  subject_ref text NOT NULL,
  metric_ref text NOT NULL,
  scenario text NOT NULL DEFAULT 'actual',
  value_num numeric,
  numerator numeric,
  denominator numeric,
  period_start date,
  period_end date,
  cohort_ref text,
  dimension_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  observed_at timestamptz NOT NULL DEFAULT now(),
  source_result_hash text,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (tenant_key, observation_id)
);

CREATE TABLE IF NOT EXISTS tower.value_claim (
  tenant_key text NOT NULL,
  claim_id text NOT NULL,
  subject_ref text NOT NULL,
  promised_value numeric,
  calculated_value numeric,
  currency text NOT NULL DEFAULT 'USD',
  claim_state text NOT NULL DEFAULT 'evidence_gap',
  baseline_observation_id text,
  target_observation_id text,
  actual_observation_id text,
  quality_guardrail_state text,
  next_gate_owner_role text,
  claim_rule_version text,
  evaluated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (tenant_key, claim_id)
);

CREATE INDEX IF NOT EXISTS idx_tower_tracked_subject_tenant_kind
  ON tower.tracked_subject (tenant_key, subject_kind, initiative_ref);

CREATE INDEX IF NOT EXISTS idx_tower_metric_observation_tenant_subject_metric
  ON tower.metric_observation (tenant_key, subject_ref, metric_ref, scenario, period_start, period_end);

CREATE INDEX IF NOT EXISTS idx_tower_value_claim_tenant_subject
  ON tower.value_claim (tenant_key, subject_ref, claim_state);

CREATE OR REPLACE FUNCTION tower.can_read_tower_tenant(target_tenant_key text)
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT
    current_user = 'service_role'
    OR target_tenant_key = current_setting('app.tenant_key', true)
$$;

CREATE TABLE IF NOT EXISTS tower.value_case (
  tenant_key text NOT NULL,
  value_case_id text NOT NULL,
  primary_claim_id text,
  initiative_id text NOT NULL,
  program_id text,
  business_unit text,
  cost_center_ref text,
  owner_role text NOT NULL DEFAULT 'Tower data steward',
  finance_owner_role text,
  value_case_name text NOT NULL,
  value_archetype text NOT NULL CHECK (
    value_archetype IN (
      'workforce_productivity',
      'process_automation',
      'strategic_ai_project',
      'platform_enabler',
      'non_ai_transformation',
      'unclassified'
    )
  ),
  benefit_category text NOT NULL DEFAULT 'unclassified' CHECK (
    benefit_category IN (
      'capacity',
      'cost_takeout',
      'revenue',
      'risk_avoidance',
      'service_quality',
      'working_capital',
      'unclassified'
    )
  ),
  value_period_start date,
  value_period_end date,
  value_horizon text NOT NULL DEFAULT 'quarterly',
  approved_funding_usd numeric NOT NULL DEFAULT 0 CHECK (approved_funding_usd >= 0),
  actual_spend_usd numeric NOT NULL DEFAULT 0 CHECK (actual_spend_usd >= 0),
  business_case_value_usd numeric,
  known_calculated_value_usd numeric,
  finance_validated_value_usd numeric NOT NULL DEFAULT 0 CHECK (finance_validated_value_usd >= 0),
  claimable_value_usd numeric NOT NULL DEFAULT 0 CHECK (claimable_value_usd >= 0),
  currency text NOT NULL DEFAULT 'USD',
  claim_state text NOT NULL DEFAULT 'evidence_gap',
  investment_evidence_state text NOT NULL DEFAULT 'missing' CHECK (investment_evidence_state IN ('present', 'missing', 'blocked')),
  usage_evidence_state text NOT NULL DEFAULT 'missing' CHECK (usage_evidence_state IN ('present', 'missing', 'blocked')),
  operational_outcome_evidence_state text NOT NULL DEFAULT 'missing' CHECK (operational_outcome_evidence_state IN ('present', 'missing', 'blocked')),
  financial_conversion_evidence_state text NOT NULL DEFAULT 'missing' CHECK (financial_conversion_evidence_state IN ('present', 'missing', 'blocked')),
  finance_attestation_state text NOT NULL DEFAULT 'missing' CHECK (finance_attestation_state IN ('present', 'missing', 'blocked')),
  source_trust_state text NOT NULL DEFAULT 'ABSENT' CHECK (source_trust_state IN ('AGREE', 'ONE_SOURCE', 'CONFLICT', 'ABSENT')),
  lineage_state text NOT NULL DEFAULT 'ABSENT' CHECK (lineage_state IN ('AGREE', 'ONE_SOURCE', 'CONFLICT', 'ABSENT')),
  dataset_version text,
  source_run_id text,
  as_of_period date,
  refresh_timestamp timestamptz,
  source_refs jsonb NOT NULL DEFAULT '[]'::jsonb,
  next_required_extract text,
  review_state text NOT NULL DEFAULT 'needs_review' CHECK (review_state IN ('ready', 'needs_review', 'blocked')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (tenant_key, value_case_id)
);

CREATE TABLE IF NOT EXISTS tower.value_case_period (
  tenant_key text NOT NULL,
  value_case_id text NOT NULL,
  period_start date NOT NULL,
  period_end date NOT NULL,
  fiscal_quarter text NOT NULL,
  scenario text NOT NULL DEFAULT 'forecast' CHECK (scenario IN ('baseline', 'target', 'actual', 'forecast', 'plan')),
  planned_investment_usd numeric NOT NULL DEFAULT 0 CHECK (planned_investment_usd >= 0),
  actual_spend_usd numeric NOT NULL DEFAULT 0 CHECK (actual_spend_usd >= 0),
  remaining_commitment_usd numeric,
  business_case_value_usd numeric,
  risk_adjusted_forecast_usd numeric,
  finance_validated_run_rate_usd numeric,
  realized_p_and_l_usd numeric,
  realized_cash_usd numeric,
  forecast_at_completion_usd numeric,
  capacity_hours numeric,
  financial_conversion_usd numeric,
  conversion_event_id text,
  source_trust_state text NOT NULL DEFAULT 'ABSENT' CHECK (source_trust_state IN ('AGREE', 'ONE_SOURCE', 'CONFLICT', 'ABSENT')),
  source_refs jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (tenant_key, value_case_id, period_start, scenario),
  FOREIGN KEY (tenant_key, value_case_id)
    REFERENCES tower.value_case (tenant_key, value_case_id)
    ON DELETE CASCADE,
  CHECK (period_end >= period_start)
);

CREATE TABLE IF NOT EXISTS tower.subject_link (
  tenant_key text NOT NULL,
  subject_link_id text NOT NULL,
  from_subject_ref text NOT NULL,
  from_subject_kind text NOT NULL,
  link_type text NOT NULL CHECK (
    link_type IN (
      'AI_SUBJECT_TO_INITIATIVE',
      'SUBJECT_TO_VALUE_CASE',
      'VALUE_CASE_TO_PROGRAM',
      'VALUE_CASE_TO_COST_CENTER',
      'VALUE_CASE_TO_BUSINESS_KPI',
      'VALUE_CASE_TO_DORA_TEAM',
      'VALUE_CASE_TO_PERSONA',
      'VALUE_CASE_TO_TOOL'
    )
  ),
  to_subject_ref text,
  to_subject_kind text,
  to_value_case_id text,
  source_ref text,
  source_trust_state text NOT NULL DEFAULT 'ABSENT' CHECK (source_trust_state IN ('AGREE', 'ONE_SOURCE', 'CONFLICT', 'ABSENT')),
  confidence numeric NOT NULL DEFAULT 0.5 CHECK (confidence >= 0 AND confidence <= 1),
  review_state text NOT NULL DEFAULT 'needs_review' CHECK (review_state IN ('ready', 'needs_review', 'blocked')),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (tenant_key, subject_link_id),
  FOREIGN KEY (tenant_key, to_value_case_id)
    REFERENCES tower.value_case (tenant_key, value_case_id)
    ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS tower.economic_conversion (
  tenant_key text NOT NULL,
  conversion_id text NOT NULL,
  value_case_id text NOT NULL,
  conversion_type text NOT NULL CHECK (
    conversion_type IN (
      'capacity_to_financial',
      'cost_takeout',
      'revenue_lift',
      'risk_avoidance',
      'service_credit',
      'no_financial_conversion'
    )
  ),
  conversion_state text NOT NULL DEFAULT 'blocked' CHECK (conversion_state IN ('accepted', 'proposed', 'blocked', 'rejected')),
  conversion_basis text NOT NULL,
  capacity_hours numeric,
  conversion_rate_usd numeric,
  converted_amount_usd numeric NOT NULL DEFAULT 0 CHECK (converted_amount_usd >= 0),
  period_start date,
  period_end date,
  currency text NOT NULL DEFAULT 'USD',
  source_refs jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (tenant_key, conversion_id),
  FOREIGN KEY (tenant_key, value_case_id)
    REFERENCES tower.value_case (tenant_key, value_case_id)
    ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS tower.attestation_event (
  tenant_key text NOT NULL,
  attestation_id text NOT NULL,
  value_case_id text NOT NULL,
  attestation_type text NOT NULL CHECK (
    attestation_type IN ('finance_validation', 'business_attestation', 'risk_review', 'source_authority_review')
  ),
  attestation_state text NOT NULL CHECK (
    attestation_state IN ('accepted', 'conditional', 'blocked', 'rejected', 'missing')
  ),
  attested_amount_usd numeric NOT NULL DEFAULT 0 CHECK (attested_amount_usd >= 0),
  attested_by_role text NOT NULL,
  attested_at timestamptz,
  evidence_package_id text NOT NULL,
  caveat text,
  source_refs jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (tenant_key, attestation_id),
  FOREIGN KEY (tenant_key, value_case_id)
    REFERENCES tower.value_case (tenant_key, value_case_id)
    ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS tower.proof_action (
  tenant_key text NOT NULL,
  action_id text NOT NULL,
  value_case_id text NOT NULL,
  proof_stage text NOT NULL CHECK (
    proof_stage IN (
      'identity',
      'investment',
      'usage',
      'operational_outcome',
      'financial_conversion',
      'finance_attestation',
      'source_authority',
      'lineage'
    )
  ),
  action_lane text NOT NULL DEFAULT 'fix' CHECK (action_lane IN ('fund', 'fix', 'freeze', 'stop')),
  priority text NOT NULL DEFAULT 'medium' CHECK (priority IN ('critical', 'high', 'medium', 'low')),
  title text NOT NULL,
  action_body text NOT NULL,
  owner_role text NOT NULL,
  secondary_owner_role text,
  due_date date NOT NULL,
  due_window text NOT NULL,
  blocked_decision text NOT NULL,
  evidence_requirement text NOT NULL,
  expected_source_system text NOT NULL,
  evidence_package_id text NOT NULL,
  handoff_module text NOT NULL DEFAULT 'Moves',
  handoff_entity_id text,
  handoff_readiness text NOT NULL DEFAULT 'not_ready',
  amount_exposed_usd numeric NOT NULL DEFAULT 0 CHECK (amount_exposed_usd >= 0),
  action_state text NOT NULL DEFAULT 'open' CHECK (action_state IN ('open', 'in_progress', 'closed', 'waived')),
  source_refs jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (tenant_key, action_id),
  FOREIGN KEY (tenant_key, value_case_id)
    REFERENCES tower.value_case (tenant_key, value_case_id)
    ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_tower_value_case_tenant_initiative
  ON tower.value_case (tenant_key, initiative_id, program_id, source_trust_state, claim_state);

CREATE INDEX IF NOT EXISTS idx_tower_value_case_initiative
  ON tower.value_case (tenant_key, initiative_id);

CREATE INDEX IF NOT EXISTS idx_tower_value_case_source_trust
  ON tower.value_case (tenant_key, source_trust_state, review_state);

CREATE INDEX IF NOT EXISTS idx_tower_value_case_period_tenant_period
  ON tower.value_case_period (tenant_key, period_start, period_end, scenario);

CREATE INDEX IF NOT EXISTS idx_tower_value_case_period_quarter
  ON tower.value_case_period (tenant_key, fiscal_quarter, source_trust_state);

CREATE INDEX IF NOT EXISTS idx_tower_subject_link_identity
  ON tower.subject_link (tenant_key, link_type, from_subject_ref, to_subject_ref, to_value_case_id);

CREATE INDEX IF NOT EXISTS idx_tower_subject_link_from_subject
  ON tower.subject_link (tenant_key, from_subject_ref, link_type);

CREATE INDEX IF NOT EXISTS idx_tower_economic_conversion_case
  ON tower.economic_conversion (tenant_key, value_case_id, conversion_state, period_end);

CREATE INDEX IF NOT EXISTS idx_tower_attestation_case
  ON tower.attestation_event (tenant_key, value_case_id, attestation_type, attestation_state);

CREATE INDEX IF NOT EXISTS idx_tower_proof_action_queue
  ON tower.proof_action (tenant_key, action_state, priority, due_date, amount_exposed_usd DESC);

CREATE INDEX IF NOT EXISTS idx_tower_proof_action_stage_lane
  ON tower.proof_action (tenant_key, proof_stage, action_lane, action_state);

CREATE INDEX IF NOT EXISTS idx_tower_proof_action_state
  ON tower.proof_action (tenant_key, action_state, due_date);

ALTER TABLE tower.value_case ENABLE ROW LEVEL SECURITY;
ALTER TABLE tower.value_case_period ENABLE ROW LEVEL SECURITY;
ALTER TABLE tower.subject_link ENABLE ROW LEVEL SECURITY;
ALTER TABLE tower.economic_conversion ENABLE ROW LEVEL SECURITY;
ALTER TABLE tower.attestation_event ENABLE ROW LEVEL SECURITY;
ALTER TABLE tower.proof_action ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS value_case_tenant_isolation ON tower.value_case;
CREATE POLICY value_case_tenant_isolation ON tower.value_case
  USING (tower.can_read_tower_tenant(tenant_key))
  WITH CHECK (current_user = 'service_role' OR tenant_key = current_setting('app.tenant_key', true));

DROP POLICY IF EXISTS value_case_period_tenant_isolation ON tower.value_case_period;
CREATE POLICY value_case_period_tenant_isolation ON tower.value_case_period
  USING (tower.can_read_tower_tenant(tenant_key))
  WITH CHECK (current_user = 'service_role' OR tenant_key = current_setting('app.tenant_key', true));

DROP POLICY IF EXISTS subject_link_tenant_isolation ON tower.subject_link;
CREATE POLICY subject_link_tenant_isolation ON tower.subject_link
  USING (tower.can_read_tower_tenant(tenant_key))
  WITH CHECK (current_user = 'service_role' OR tenant_key = current_setting('app.tenant_key', true));

DROP POLICY IF EXISTS economic_conversion_tenant_isolation ON tower.economic_conversion;
CREATE POLICY economic_conversion_tenant_isolation ON tower.economic_conversion
  USING (tower.can_read_tower_tenant(tenant_key))
  WITH CHECK (current_user = 'service_role' OR tenant_key = current_setting('app.tenant_key', true));

DROP POLICY IF EXISTS attestation_event_tenant_isolation ON tower.attestation_event;
CREATE POLICY attestation_event_tenant_isolation ON tower.attestation_event
  USING (tower.can_read_tower_tenant(tenant_key))
  WITH CHECK (current_user = 'service_role' OR tenant_key = current_setting('app.tenant_key', true));

DROP POLICY IF EXISTS proof_action_tenant_isolation ON tower.proof_action;
CREATE POLICY proof_action_tenant_isolation ON tower.proof_action
  USING (tower.can_read_tower_tenant(tenant_key))
  WITH CHECK (current_user = 'service_role' OR tenant_key = current_setting('app.tenant_key', true));

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
claim_cases AS (
  SELECT
    c.tenant_key,
    'vc-' || md5(concat_ws(':', c.tenant_key, c.claim_id)) AS value_case_id,
    c.claim_id AS primary_claim_id,
    coalesce(nullif(s.initiative_ref, ''), c.subject_ref) AS initiative_id,
    coalesce(nullif(s.metadata_json->>'program_id', ''), nullif(s.initiative_ref, ''), c.subject_ref) AS program_id,
    nullif(s.metadata_json->>'business_unit', '') AS business_unit,
    nullif(s.metadata_json->>'cost_center', '') AS cost_center_ref,
    coalesce(nullif(s.owner_role, ''), 'Tower data steward') AS owner_role,
    coalesce(nullif(c.next_gate_owner_role, ''), 'Finance partner') AS finance_owner_role,
    s.title AS value_case_name,
    CASE
      WHEN s.subject_kind = 'developer_ai_tool' THEN 'workforce_productivity'
      WHEN s.subject_kind IN ('service_agent', 'hr_agent', 'workflow') THEN 'process_automation'
      WHEN s.subject_kind = 'initiative' AND lower(coalesce(s.metadata_json->>'ai_enabled', '')) IN ('true', 'yes', '1') THEN 'strategic_ai_project'
      WHEN s.subject_kind IN ('cloud_estate', 'data_platform', 'application') THEN 'platform_enabler'
      WHEN s.subject_kind = 'initiative' THEN 'non_ai_transformation'
      ELSE 'unclassified'
    END AS value_archetype,
    CASE
      WHEN nullif(s.metadata_json->>'benefit_category', '') IN (
        'capacity',
        'cost_takeout',
        'revenue',
        'risk_avoidance',
        'service_quality',
        'working_capital',
        'unclassified'
      ) THEN s.metadata_json->>'benefit_category'
      ELSE 'unclassified'
    END AS benefit_category,
    c.evaluated_at::date AS value_period_start,
    (c.evaluated_at::date + interval '24 months' - interval '1 day')::date AS value_period_end,
    coalesce(po.approved_funding_usd, 0) AS approved_funding_usd,
    coalesce(po.actual_spend_usd, 0) AS actual_spend_usd,
    c.promised_value AS business_case_value_usd,
    c.calculated_value AS known_calculated_value_usd,
    CASE WHEN lower(c.claim_state) IN ('finance_validated', 'claimable') THEN coalesce(c.calculated_value, 0) ELSE 0 END AS finance_validated_value_usd,
    CASE WHEN lower(c.claim_state) = 'claimable' THEN coalesce(c.calculated_value, 0) ELSE 0 END AS claimable_value_usd,
    coalesce(c.currency, 'USD') AS currency,
    c.claim_state,
    CASE WHEN po.approved_funding_usd IS NOT NULL OR po.actual_spend_usd IS NOT NULL THEN 'present' ELSE 'missing' END AS investment_evidence_state,
    CASE WHEN lower(c.claim_state) IN ('usage_supported', 'finance_validated', 'claimable') THEN 'present' ELSE 'missing' END AS usage_evidence_state,
    CASE WHEN c.baseline_observation_id IS NOT NULL AND c.target_observation_id IS NOT NULL AND c.actual_observation_id IS NOT NULL THEN 'present' ELSE 'missing' END AS operational_outcome_evidence_state,
    CASE WHEN c.calculated_value IS NOT NULL THEN 'present' ELSE 'missing' END AS financial_conversion_evidence_state,
    CASE WHEN lower(c.quality_guardrail_state) IN ('finance_attested', 'finance_validated') OR lower(c.claim_state) IN ('finance_validated', 'claimable') THEN 'present' ELSE 'missing' END AS finance_attestation_state,
    CASE WHEN c.promised_value IS NULL THEN 'ABSENT' WHEN lower(c.claim_state) = 'claimable' THEN 'ONE_SOURCE' ELSE 'CONFLICT' END AS source_trust_state,
    CASE WHEN c.promised_value IS NULL THEN 'ABSENT' ELSE 'CONFLICT' END AS lineage_state,
    coalesce(nullif(s.metadata_json->>'dataset_version', ''), nullif(s.metadata_json->>'source_release', '')) AS dataset_version,
    coalesce(nullif(s.metadata_json->>'source_run_id', ''), nullif(c.claim_rule_version, '')) AS source_run_id,
    c.evaluated_at::date AS as_of_period,
    c.evaluated_at AS refresh_timestamp,
    jsonb_build_array(
      jsonb_build_object(
        'table', 'tower.value_claim',
        'claim_id', c.claim_id,
        'subject_ref', c.subject_ref,
        'source_file', s.metadata_json->>'source_file',
        'source_row', s.metadata_json->>'source_row'
      )
    ) AS source_refs,
    CASE
      WHEN c.promised_value IS NOT NULL THEN 'independent_source_authority_assertions'
      WHEN c.calculated_value IS NULL THEN 'financial_conversion_evidence'
      ELSE 'finance_attestation_package'
    END AS next_required_extract,
    CASE WHEN c.promised_value IS NULL OR lower(c.claim_state) = 'claimable' THEN 'needs_review' ELSE 'blocked' END AS review_state
  FROM tower.value_claim c
  JOIN tower.tracked_subject s
    ON s.tenant_key = c.tenant_key
   AND s.subject_ref = c.subject_ref
  LEFT JOIN latest_project_obs po
    ON po.tenant_key = c.tenant_key
   AND po.subject_ref = c.subject_ref
),
ai_adoption_cases AS (
  SELECT
    s.tenant_key,
    'vc-ai-' || md5(concat_ws(':', s.tenant_key, s.subject_ref)) AS value_case_id,
    null::text AS primary_claim_id,
    coalesce(nullif(s.initiative_ref, ''), s.subject_ref) AS initiative_id,
    coalesce(nullif(s.metadata_json->>'program_id', ''), nullif(s.initiative_ref, ''), s.subject_ref) AS program_id,
    nullif(s.metadata_json->>'business_unit', '') AS business_unit,
    nullif(s.metadata_json->>'cost_center', '') AS cost_center_ref,
    coalesce(nullif(s.owner_role, ''), 'Tower data steward') AS owner_role,
    'Finance partner'::text AS finance_owner_role,
    s.title || ' adoption evidence case' AS value_case_name,
    CASE WHEN s.subject_kind = 'developer_ai_tool' THEN 'workforce_productivity' ELSE 'process_automation' END AS value_archetype,
    'capacity'::text AS benefit_category,
    coalesce(s.launch_date, current_date)::date AS value_period_start,
    (coalesce(s.launch_date, current_date)::date + interval '24 months' - interval '1 day')::date AS value_period_end,
    0::numeric AS approved_funding_usd,
    0::numeric AS actual_spend_usd,
    null::numeric AS business_case_value_usd,
    null::numeric AS known_calculated_value_usd,
    0::numeric AS finance_validated_value_usd,
    0::numeric AS claimable_value_usd,
    'USD'::text AS currency,
    'adoption_only'::text AS claim_state,
    'missing'::text AS investment_evidence_state,
    CASE WHEN count(o.observation_id) > 0 THEN 'present' ELSE 'missing' END AS usage_evidence_state,
    'missing'::text AS operational_outcome_evidence_state,
    'missing'::text AS financial_conversion_evidence_state,
    'missing'::text AS finance_attestation_state,
    'ABSENT'::text AS source_trust_state,
    'ONE_SOURCE'::text AS lineage_state,
    coalesce(nullif(s.metadata_json->>'dataset_version', ''), nullif(s.metadata_json->>'source_release', '')) AS dataset_version,
    nullif(s.metadata_json->>'source_run_id', '') AS source_run_id,
    max(o.period_end) AS as_of_period,
    max(o.observed_at) AS refresh_timestamp,
    jsonb_build_array(
      jsonb_build_object(
        'table', 'tower.tracked_subject',
        'subject_ref', s.subject_ref,
        'source_file', s.metadata_json->>'source_file',
        'source_row', s.metadata_json->>'source_row'
      )
    ) AS source_refs,
    'business_outcome_and_financial_conversion_evidence'::text AS next_required_extract,
    'needs_review'::text AS review_state
  FROM tower.tracked_subject s
  LEFT JOIN tower.metric_observation o
    ON o.tenant_key = s.tenant_key
   AND o.subject_ref = s.subject_ref
   AND o.metric_ref IN ('ai.active_users', 'ai.seats_purchased', 'ai.estimated_use_cost', 'ai.active_user_rate')
  WHERE s.subject_kind IN ('developer_ai_tool', 'service_agent', 'hr_agent')
    AND NOT EXISTS (
      SELECT 1
      FROM tower.value_claim c
      WHERE c.tenant_key = s.tenant_key
        AND c.subject_ref = s.subject_ref
    )
  GROUP BY s.tenant_key, s.subject_ref, s.subject_kind, s.title, s.initiative_ref, s.owner_role, s.launch_date, s.metadata_json
)
INSERT INTO tower.value_case (
  tenant_key,
  value_case_id,
  primary_claim_id,
  initiative_id,
  program_id,
  business_unit,
  cost_center_ref,
  owner_role,
  finance_owner_role,
  value_case_name,
  value_archetype,
  benefit_category,
  value_period_start,
  value_period_end,
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
  next_required_extract,
  review_state
)
SELECT *
FROM claim_cases
UNION ALL
SELECT *
FROM ai_adoption_cases
ON CONFLICT (tenant_key, value_case_id) DO UPDATE SET
  initiative_id = EXCLUDED.initiative_id,
  program_id = EXCLUDED.program_id,
  business_unit = EXCLUDED.business_unit,
  cost_center_ref = EXCLUDED.cost_center_ref,
  owner_role = EXCLUDED.owner_role,
  finance_owner_role = EXCLUDED.finance_owner_role,
  value_case_name = EXCLUDED.value_case_name,
  value_archetype = EXCLUDED.value_archetype,
  benefit_category = EXCLUDED.benefit_category,
  value_period_start = EXCLUDED.value_period_start,
  value_period_end = EXCLUDED.value_period_end,
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
  next_required_extract = EXCLUDED.next_required_extract,
  review_state = EXCLUDED.review_state,
  updated_at = now();

INSERT INTO tower.value_case_period (
  tenant_key,
  value_case_id,
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
  (date_trunc('quarter', coalesce(vc.value_period_start, vc.as_of_period, current_date)) + (q.n * interval '3 months'))::date AS period_start,
  (date_trunc('quarter', coalesce(vc.value_period_start, vc.as_of_period, current_date)) + (q.n * interval '3 months') + interval '3 months' - interval '1 day')::date AS period_end,
  concat(
    extract(year FROM (date_trunc('quarter', coalesce(vc.value_period_start, vc.as_of_period, current_date)) + (q.n * interval '3 months')))::int,
    '-Q',
    extract(quarter FROM (date_trunc('quarter', coalesce(vc.value_period_start, vc.as_of_period, current_date)) + (q.n * interval '3 months')))::int
  ) AS fiscal_quarter,
  'forecast'::text AS scenario,
  round(vc.approved_funding_usd / 8.0, 2) AS planned_investment_usd,
  round(vc.actual_spend_usd / 8.0, 2) AS actual_spend_usd,
  round(greatest(vc.approved_funding_usd - vc.actual_spend_usd, 0) / 8.0, 2) AS remaining_commitment_usd,
  CASE WHEN vc.source_trust_state IN ('AGREE', 'ONE_SOURCE') THEN round(coalesce(vc.business_case_value_usd, 0) / 8.0, 2) ELSE null END AS business_case_value_usd,
  CASE
    WHEN vc.source_trust_state IN ('AGREE', 'ONE_SOURCE') THEN
      round(
        coalesce(vc.business_case_value_usd, vc.known_calculated_value_usd, 0)
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
  CASE WHEN vc.finance_validated_value_usd > 0 THEN round(vc.finance_validated_value_usd / 8.0, 2) ELSE null END AS finance_validated_run_rate_usd,
  CASE WHEN vc.claim_state = 'claimable' AND vc.source_trust_state <> 'CONFLICT' THEN round(vc.claimable_value_usd / 8.0, 2) ELSE null END AS realized_p_and_l_usd,
  null::numeric AS realized_cash_usd,
  CASE WHEN vc.source_trust_state IN ('AGREE', 'ONE_SOURCE') THEN coalesce(vc.known_calculated_value_usd, vc.business_case_value_usd) ELSE null END AS forecast_at_completion_usd,
  CASE WHEN vc.claim_state = 'claimable' AND vc.source_trust_state <> 'CONFLICT' THEN round(vc.claimable_value_usd / 8.0, 2) ELSE null END AS financial_conversion_usd,
  vc.source_trust_state,
  vc.source_refs
FROM tower.value_case vc
CROSS JOIN generate_series(0, 7) AS q(n)
ON CONFLICT (tenant_key, value_case_id, period_start, scenario) DO UPDATE SET
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
  review_state
)
SELECT
  vc.tenant_key,
  'sl-vc-' || md5(concat_ws(':', vc.tenant_key, vc.value_case_id, 'subject_to_value_case')),
  coalesce(vc.primary_claim_id, vc.initiative_id),
  'value_evidence_subject',
  'SUBJECT_TO_VALUE_CASE',
  vc.initiative_id,
  'initiative',
  vc.value_case_id,
  vc.primary_claim_id,
  vc.source_trust_state,
  CASE WHEN vc.primary_claim_id IS NULL THEN 0.45 ELSE 0.8 END,
  CASE WHEN vc.primary_claim_id IS NULL THEN 'needs_review' ELSE vc.review_state END
FROM tower.value_case vc
ON CONFLICT (tenant_key, subject_link_id) DO UPDATE SET
  to_subject_ref = EXCLUDED.to_subject_ref,
  to_value_case_id = EXCLUDED.to_value_case_id,
  source_trust_state = EXCLUDED.source_trust_state,
  confidence = EXCLUDED.confidence,
  review_state = EXCLUDED.review_state;

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
  review_state
)
SELECT
  s.tenant_key,
  'sl-ai-' || md5(concat_ws(':', s.tenant_key, s.subject_ref, coalesce(s.initiative_ref, s.subject_ref))),
  s.subject_ref,
  s.subject_kind,
  'AI_SUBJECT_TO_INITIATIVE',
  coalesce(nullif(s.initiative_ref, ''), s.subject_ref),
  'initiative',
  vc.value_case_id,
  s.metadata_json->>'source_file',
  vc.source_trust_state,
  CASE WHEN nullif(s.initiative_ref, '') IS NULL THEN 0.45 ELSE 0.8 END,
  CASE WHEN nullif(s.initiative_ref, '') IS NULL THEN 'needs_review' ELSE 'ready' END
FROM tower.tracked_subject s
JOIN LATERAL (
  SELECT *
  FROM tower.value_case vc
  WHERE vc.tenant_key = s.tenant_key
    AND vc.initiative_id = coalesce(nullif(s.initiative_ref, ''), s.subject_ref)
  ORDER BY
    (vc.primary_claim_id IS NOT NULL) DESC,
    vc.business_case_value_usd DESC NULLS LAST,
    vc.value_case_id
  LIMIT 1
) vc ON true
WHERE s.subject_kind IN ('developer_ai_tool', 'service_agent', 'hr_agent')
ON CONFLICT (tenant_key, subject_link_id) DO UPDATE SET
  to_subject_ref = EXCLUDED.to_subject_ref,
  to_value_case_id = EXCLUDED.to_value_case_id,
  source_trust_state = EXCLUDED.source_trust_state,
  confidence = EXCLUDED.confidence,
  review_state = EXCLUDED.review_state;

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
  'ec-' || md5(concat_ws(':', vc.tenant_key, vc.value_case_id)),
  vc.value_case_id,
  CASE WHEN vc.claimable_value_usd > 0 THEN 'cost_takeout' ELSE 'no_financial_conversion' END,
  CASE WHEN vc.claimable_value_usd > 0 AND vc.source_trust_state <> 'CONFLICT' THEN 'accepted' ELSE 'blocked' END,
  CASE
    WHEN vc.claimable_value_usd > 0 AND vc.source_trust_state <> 'CONFLICT' THEN 'Explicit claimable value from tower.value_claim.'
    ELSE 'Capacity, adoption, and usage are not converted to savings without an accepted economic conversion event.'
  END,
  CASE WHEN vc.claimable_value_usd > 0 AND vc.source_trust_state <> 'CONFLICT' THEN vc.claimable_value_usd ELSE 0 END,
  vc.value_period_start,
  vc.value_period_end,
  vc.currency,
  vc.source_refs
FROM tower.value_case vc
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
  'ae-fin-' || md5(concat_ws(':', vc.tenant_key, vc.value_case_id)),
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
  'ep-' || md5(concat_ws(':', vc.tenant_key, vc.value_case_id, 'finance_validation')),
  CASE
    WHEN vc.source_trust_state = 'CONFLICT' THEN 'Finance validation cannot make value claimable while source authority is unresolved.'
    ELSE 'Finance attestation state projected from governed value evidence.'
  END,
  vc.source_refs
FROM tower.value_case vc
ON CONFLICT (tenant_key, attestation_id) DO UPDATE SET
  attestation_state = EXCLUDED.attestation_state,
  attested_amount_usd = EXCLUDED.attested_amount_usd,
  attested_by_role = EXCLUDED.attested_by_role,
  attested_at = EXCLUDED.attested_at,
  evidence_package_id = EXCLUDED.evidence_package_id,
  caveat = EXCLUDED.caveat,
  source_refs = EXCLUDED.source_refs;

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
  source_refs
)
SELECT
  vc.tenant_key,
  'pa-source-' || md5(concat_ws(':', vc.tenant_key, vc.value_case_id)),
  vc.value_case_id,
  'source_authority',
  'fix',
  CASE
    WHEN coalesce(vc.business_case_value_usd, 0) >= 10000000 THEN 'critical'
    WHEN coalesce(vc.business_case_value_usd, 0) > 0 THEN 'high'
    ELSE 'medium'
  END,
  'Resolve promised-value source authority',
  'Board-visible promised value is blocked until independent source assertions reconcile to one authority.',
  'Tower data steward',
  vc.finance_owner_role,
  coalesce(vc.as_of_period, current_date) + 14,
  '14 days',
  'board_value_claim_or_scale_decision',
  'Source authority reconciliation with source refs, source run, period, and authoritative owner.',
  'source registry + tower.metric_provenance + source assertions',
  'ep-' || md5(concat_ws(':', vc.tenant_key, vc.value_case_id, 'source_authority')),
  'Moves',
  vc.program_id,
  coalesce(vc.business_case_value_usd, 0),
  vc.source_refs
FROM tower.value_case vc
WHERE vc.source_trust_state = 'CONFLICT'
ON CONFLICT (tenant_key, action_id) DO UPDATE SET
  priority = EXCLUDED.priority,
  due_date = EXCLUDED.due_date,
  amount_exposed_usd = EXCLUDED.amount_exposed_usd,
  source_refs = EXCLUDED.source_refs,
  updated_at = now();

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
  source_refs
)
SELECT
  vc.tenant_key,
  'pa-outcome-' || md5(concat_ws(':', vc.tenant_key, vc.value_case_id)),
  vc.value_case_id,
  'operational_outcome',
  'fix',
  CASE WHEN coalesce(vc.business_case_value_usd, 0) >= 10000000 THEN 'high' ELSE 'medium' END,
  'Bind baseline, target, and actual KPI evidence',
  'Value cannot become board-claimable until baseline, target, and actual observations exist at the same declared grain.',
  vc.owner_role,
  vc.finance_owner_role,
  coalesce(vc.as_of_period, current_date) + 30,
  '30 days',
  'scale_or_claim_decision',
  'Baseline, target, and actual KPI observations linked to the same value case and period.',
  'tower.metric_observation',
  'ep-' || md5(concat_ws(':', vc.tenant_key, vc.value_case_id, 'operational_outcome')),
  'Moves',
  vc.program_id,
  coalesce(vc.business_case_value_usd, 0),
  vc.source_refs
FROM tower.value_case vc
WHERE vc.operational_outcome_evidence_state <> 'present'
ON CONFLICT (tenant_key, action_id) DO UPDATE SET
  priority = EXCLUDED.priority,
  due_date = EXCLUDED.due_date,
  amount_exposed_usd = EXCLUDED.amount_exposed_usd,
  source_refs = EXCLUDED.source_refs,
  updated_at = now();

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
  source_refs
)
SELECT
  vc.tenant_key,
  'pa-finance-' || md5(concat_ws(':', vc.tenant_key, vc.value_case_id)),
  vc.value_case_id,
  'finance_attestation',
  'fix',
  CASE
    WHEN coalesce(vc.finance_validated_value_usd, vc.business_case_value_usd, 0) >= 10000000 THEN 'high'
    WHEN coalesce(vc.finance_validated_value_usd, vc.business_case_value_usd, 0) > 0 THEN 'medium'
    ELSE 'low'
  END,
  'Complete Finance attestation package',
  'Finance validation must include owner, period, source refs, and attestation before claimable value can be booked.',
  coalesce(vc.finance_owner_role, 'Finance partner'),
  vc.owner_role,
  coalesce(vc.as_of_period, current_date) + 30,
  '30 days',
  'p_and_l_or_cash_claim_decision',
  'Finance attestation event with evidence package and accepted economic conversion.',
  'tower.attestation_event + tower.economic_conversion',
  'ep-' || md5(concat_ws(':', vc.tenant_key, vc.value_case_id, 'finance_attestation')),
  'Moves',
  vc.program_id,
  coalesce(vc.finance_validated_value_usd, vc.business_case_value_usd, 0),
  vc.source_refs
FROM tower.value_case vc
WHERE vc.finance_attestation_state <> 'present'
   OR vc.financial_conversion_evidence_state <> 'present'
ON CONFLICT (tenant_key, action_id) DO UPDATE SET
  priority = EXCLUDED.priority,
  due_date = EXCLUDED.due_date,
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
  WHERE tower.can_read_tower_tenant(tenant_key)
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
    count(*) FILTER (WHERE subject_kind = 'initiative') AS program_count,
    count(*) FILTER (WHERE subject_kind IN ('developer_ai_tool', 'service_agent', 'hr_agent')) AS ai_initiative_count
  FROM tower.tracked_subject
  WHERE tower.can_read_tower_tenant(tenant_key)
  GROUP BY tenant_key
),
actions AS (
  SELECT
    tenant_key,
    count(*) FILTER (WHERE action_state = 'open') AS open_action_count
  FROM tower.proof_action
  WHERE tower.can_read_tower_tenant(tenant_key)
  GROUP BY tenant_key
)
SELECT
  'tower:' || vc.tenant_key || ':board-posture' AS command_center_key,
  vc.tenant_key,
  initcap(replace(vc.tenant_key, '_', ' ')) AS tenant_name,
  'tower-value-os-v1'::text AS mart_version,
  'tower.value_case -> consumption.tower_*_v1'::text AS source_standard,
  'tower_value_operating_system_v1'::text AS formula_version,
  'consumption.tower_value_os_contract_v1'::text AS source_contract_version,
  max(vc.dataset_version) AS dataset_version,
  max(vc.source_run_id) AS source_run_id,
  max(vc.as_of_period)::text AS as_of_period,
  max(vc.refresh_timestamp)::text AS refresh_timestamp,
  coalesce(max(obs.total_budget), 0) AS total_it_budget_fy26,
  coalesce(max(obs.run_budget), 0) AS run_budget_fy26,
  coalesce(max(obs.change_budget), 0) AS change_budget_fy26,
  coalesce(sum(vc.approved_funding_usd), 0) AS approved_program_budget_fy26,
  coalesce(max(obs.ai_spend), 0) AS ai_tagged_spend_fy26_non_additive,
  coalesce(sum(vc.business_case_value_usd), 0) AS promised_value_fy26,
  coalesce(sum(vc.finance_validated_value_usd), 0) AS partial_finance_validated_value_ytd,
  coalesce(sum(vc.claimable_value_usd) FILTER (WHERE vc.source_trust_state <> 'CONFLICT'), 0) AS realized_value_ytd_allowed,
  count(*)::int AS value_claim_count,
  count(*) FILTER (WHERE vc.known_calculated_value_usd IS NOT NULL)::int AS known_value_claim_count,
  count(*) FILTER (WHERE vc.known_calculated_value_usd IS NULL)::int AS unknown_value_claim_count,
  count(*) FILTER (WHERE vc.known_calculated_value_usd = 0)::int AS known_zero_value_claim_count,
  coalesce(sum(vc.known_calculated_value_usd), 0) AS known_value_amount_usd,
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
  coalesce(max(subjects.program_count), count(distinct vc.program_id))::int AS program_count,
  coalesce(max(subjects.ai_initiative_count), count(*) FILTER (WHERE vc.value_archetype IN ('workforce_productivity', 'process_automation', 'strategic_ai_project')))::int AS ai_initiative_count,
  count(*) FILTER (WHERE vc.claim_state = 'adoption_only')::int AS candidate_ai_opportunities,
  coalesce(max(actions.open_action_count), 0)::int AS watch_pressure_signals,
  coalesce(sum(vc.finance_validated_value_usd), 0) - coalesce(sum(vc.claimable_value_usd) FILTER (WHERE vc.source_trust_state <> 'CONFLICT'), 0) AS finance_validated_blocked_value,
  coalesce(sum(vc.business_case_value_usd), 0) AS promised_value_exposure,
  CASE WHEN coalesce(max(obs.total_budget), 0) > 0 THEN coalesce(max(obs.run_budget), 0) / max(obs.total_budget) ELSE null END AS run_ratio,
  CASE WHEN coalesce(max(obs.total_budget), 0) > 0 THEN coalesce(max(obs.change_budget), 0) / max(obs.total_budget) ELSE null END AS change_ratio,
  CASE WHEN count(*) > 0 THEN (count(*) FILTER (WHERE vc.finance_attestation_state = 'present'))::numeric / count(*) ELSE null END AS finance_validation_ratio,
  'Are we buying AI, changing work, and converting it into economic value?'::text AS decision_question,
  CASE
    WHEN bool_or(vc.source_trust_state = 'CONFLICT') THEN
      'AI investment and adoption activity are visible, but portfolio economic case is not board-certified. Promised value is CONFLICT - authority unresolved, and source conflicts block claimability.'
    ELSE
      'Tower value cases are loaded through the governed value operating model. Claimable value is limited to accepted economic conversion and attestation evidence.'
  END AS executive_summary,
  CASE WHEN bool_or(vc.source_trust_state = 'CONFLICT') THEN 'CONFLICT - authority unresolved' ELSE 'authority loaded' END AS promised_value_board_status,
  CASE WHEN bool_or(vc.source_trust_state = 'CONFLICT') THEN 'CONFLICT' WHEN bool_or(vc.source_trust_state = 'ONE_SOURCE') THEN 'ONE_SOURCE' ELSE 'ABSENT' END AS promised_value_trust_state,
  ARRAY[
    'tower.value_case',
    'tower.value_case_period',
    'tower.subject_link',
    'tower.economic_conversion',
    'tower.attestation_event',
    'tower.proof_action',
    'consumption.tower_*_v1'
  ]::text[] AS source_files
FROM vc
LEFT JOIN obs ON obs.tenant_key = vc.tenant_key
LEFT JOIN subjects ON subjects.tenant_key = vc.tenant_key
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
  vc.source_refs
FROM tower.value_case_period p
JOIN tower.value_case vc
  ON vc.tenant_key = p.tenant_key
 AND vc.value_case_id = p.value_case_id
WHERE tower.can_read_tower_tenant(p.tenant_key);

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
    WHEN vc.claim_state = 'claimable' AND vc.claimable_value_usd > 0 THEN 'fund'
    WHEN vc.operational_outcome_evidence_state = 'missing' THEN 'freeze'
    ELSE 'fix'
  END AS decision_lane,
  CASE
    WHEN vc.source_trust_state = 'CONFLICT' THEN 'Source authority conflict blocks board-visible value.'
    WHEN vc.claim_state = 'claimable' AND vc.claimable_value_usd > 0 THEN 'Claimable value has accepted conversion and attestation evidence.'
    WHEN vc.operational_outcome_evidence_state = 'missing' THEN 'Operational outcome proof is missing.'
    ELSE 'Evidence chain is incomplete.'
  END AS decision_rationale,
  vc.approved_funding_usd,
  vc.approved_funding_usd AS funded_amount,
  0::numeric AS ai_tagged_spend_usd,
  coalesce(vc.business_case_value_usd, 0) AS promised_value_usd,
  vc.finance_validated_value_usd AS finance_validated_value_usd,
  coalesce(vc.known_calculated_value_usd, 0) AS known_supported_value,
  (
    (CASE WHEN vc.investment_evidence_state = 'present' THEN 20 ELSE 0 END) +
    (CASE WHEN vc.usage_evidence_state = 'present' THEN 20 ELSE 0 END) +
    (CASE WHEN vc.operational_outcome_evidence_state = 'present' THEN 20 ELSE 0 END) +
    (CASE WHEN vc.financial_conversion_evidence_state = 'present' THEN 20 ELSE 0 END) +
    (CASE WHEN vc.finance_attestation_state = 'present' THEN 20 ELSE 0 END)
  )::int AS proof_maturity_score,
  CASE
    WHEN vc.source_trust_state = 'CONFLICT' THEN 95
    WHEN vc.operational_outcome_evidence_state = 'missing' THEN 75
    WHEN vc.finance_attestation_state = 'missing' THEN 65
    ELSE 35
  END::int AS risk_pressure_score,
  CASE WHEN vc.usage_evidence_state = 'present' THEN 70 ELSE 0 END::int AS usage_strength_score,
  vc.source_trust_state AS lineage_trust_state,
  CASE
    WHEN vc.source_trust_state = 'CONFLICT' THEN 'FIX_PROOF'
    WHEN vc.claim_state = 'claimable' AND vc.claimable_value_usd > 0 THEN 'SCALE'
    WHEN vc.operational_outcome_evidence_state = 'missing' THEN 'FREEZE'
    ELSE 'FIX_PROOF'
  END AS decision_reason_code,
  greatest(coalesce(vc.business_case_value_usd, 0) - vc.claimable_value_usd, 0) AS amount_blocked,
  vc.next_required_extract AS next_gate,
  CASE WHEN vc.usage_evidence_state = 'present' THEN 'usage evidence linked' ELSE null END AS usage_metric,
  CASE WHEN vc.usage_evidence_state = 'present' THEN 1 ELSE null END AS usage_actual,
  null::numeric AS adoption_rate_pct,
  vc.claim_state AS value_claim_status,
  CASE WHEN vc.claim_state = 'claimable' AND vc.source_trust_state <> 'CONFLICT' THEN 'allowed' WHEN vc.finance_validated_value_usd > 0 THEN 'partial' ELSE 'blocked' END AS tower_claim_allowed,
  jsonb_build_array(
    jsonb_build_object(
      'ask', coalesce(vc.next_required_extract, 'Complete governed proof chain'),
      'status', CASE WHEN vc.claim_state = 'claimable' AND vc.source_trust_state <> 'CONFLICT' THEN 'complete' ELSE 'blocked' END
    )
  ) AS required_gates,
  CASE
    WHEN vc.source_trust_state = 'CONFLICT' THEN 'Promised value is not board-certified until source authority reconciles.'
    ELSE 'Value case is governed by Tower value operating system v1.'
  END AS caveat,
  'tower.value_case'::text AS source_file,
  vc.primary_claim_id AS source_row
FROM tower.value_case vc
WHERE tower.can_read_tower_tenant(vc.tenant_key);

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
  CASE WHEN vc.claim_state = 'adoption_only' THEN 'usage_benefit' ELSE 'funded_program' END AS item_kind,
  coalesce(s.metadata_json->>'vendor_provider', s.vendor_ref) AS vendor_name,
  s.subject_ref AS system_name,
  'workforce productivity tool'::text AS ai_spend_type,
  'Developer and workforce AI'::text AS ai_spend_category,
  s.funding_status,
  CASE WHEN vc.source_trust_state = 'CONFLICT' THEN 'fix' WHEN vc.claim_state = 'claimable' THEN 'fund' ELSE 'fix' END AS decision_lane,
  vc.approved_funding_usd,
  coalesce(o.estimated_use_cost, 0) AS ai_tagged_spend_usd,
  coalesce(vc.business_case_value_usd, 0) AS promised_value_usd,
  vc.finance_validated_value_usd AS finance_validated_value_usd,
  'active users'::text AS usage_metric,
  o.active_users AS usage_actual,
  o.effective_usage_rate_pct AS adoption_rate_pct,
  o.reported_usage_rate_pct,
  o.calculated_usage_rate_pct,
  o.usage_rate_variance_pct,
  o.usage_rate_quality_state,
  o.effective_usage_rate_pct,
  CASE WHEN coalesce(vc.business_case_value_usd, 0) > 0 THEN 65 ELSE 35 END AS value_score,
  CASE WHEN coalesce(o.seats_purchased, 0) > 0 THEN least(100, round(o.effective_usage_rate_pct, 0)) ELSE 0 END AS readiness_score,
  CASE WHEN vc.source_trust_state = 'CONFLICT' THEN 90 WHEN coalesce(o.duplicate_observation_count, 1) > 1 THEN 70 ELSE 50 END AS risk_score,
  CASE WHEN coalesce(o.duplicate_observation_count, 1) > 1 THEN 'deduped_latest_declared_grain' ELSE null END AS duplicate_risk,
  vc.claim_state AS value_claim_status,
  CASE WHEN vc.claim_state = 'claimable' AND vc.source_trust_state <> 'CONFLICT' THEN 'allowed' ELSE 'blocked' END AS tower_claim_allowed,
  CASE
    WHEN o.usage_rate_quality_state = 'reported_rate_variance'
      THEN 'Stored usage rate differs from calculated active/licensed rate; governed view uses the calculated rate.'
    WHEN o.usage_rate_quality_state = 'active_exceeds_licensed'
      THEN 'Active users exceed licensed or eligible users; usage evidence is blocked until the denominator is corrected.'
    ELSE 'Usage/adoption evidence is visible but does not become savings without outcome and conversion evidence.'
  END AS caveat,
  'consumption.tower_metric_observation_deduped_v1'::text AS source_file,
  o.source_result_hash AS source_row
FROM ai_subject s
JOIN LATERAL (
  SELECT *
  FROM tower.value_case vc
  WHERE vc.tenant_key = s.tenant_key
    AND vc.initiative_id = coalesce(nullif(s.initiative_ref, ''), s.subject_ref)
  ORDER BY
    (vc.primary_claim_id IS NOT NULL) DESC,
    vc.business_case_value_usd DESC NULLS LAST,
    vc.value_case_id
  LIMIT 1
) vc ON true
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
  CASE WHEN vc.source_trust_state = 'CONFLICT' THEN 'fix' WHEN vc.claim_state = 'claimable' THEN 'fund' ELSE 'fix' END AS decision_lane,
  vc.approved_funding_usd,
  0::numeric AS ai_tagged_spend_usd,
  coalesce(vc.business_case_value_usd, 0) AS promised_value_usd,
  vc.finance_validated_value_usd AS finance_validated_value_usd,
  'operational outcome observations'::text AS usage_metric,
  o.latest_actual AS usage_actual,
  null::numeric AS adoption_rate_pct,
  CASE WHEN vc.operational_outcome_evidence_state = 'present' THEN 70 ELSE 30 END AS value_score,
  least(100, coalesce(o.observation_count, 0) * 20)::numeric AS readiness_score,
  CASE WHEN vc.source_trust_state = 'CONFLICT' THEN 90 WHEN vc.operational_outcome_evidence_state = 'missing' THEN 75 ELSE 45 END AS risk_score,
  CASE WHEN coalesce(o.duplicate_observation_count, 1) > 1 THEN 'deduped_latest_declared_grain' ELSE null END AS duplicate_risk,
  vc.claim_state AS value_claim_status,
  CASE WHEN vc.claim_state = 'claimable' AND vc.source_trust_state <> 'CONFLICT' THEN 'allowed' ELSE 'blocked' END AS tower_claim_allowed,
  'Agent outcomes require operational and economic conversion proof before financial value is claimable.'::text AS caveat,
  'consumption.tower_agent_outcome_v1'::text AS source_file,
  o.source_result_hash AS source_row
FROM agent_subject s
JOIN tower.value_case vc
  ON vc.tenant_key = s.tenant_key
 AND vc.initiative_id = coalesce(nullif(s.initiative_ref, ''), s.subject_ref)
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
      amount_exposed_usd DESC,
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
WHERE tower.can_read_tower_tenant(tenant_key);

CREATE OR REPLACE VIEW consumption.tower_source_trust_v1 AS
SELECT
  vc.tenant_key,
  'tower:' || vc.tenant_key || ':source-trust:' || vc.value_case_id AS lineage_key,
  'value_case'::text AS surface_section,
  vc.value_case_name AS displayed_fact,
  CASE
    WHEN vc.source_trust_state = 'CONFLICT' THEN 'CONFLICT - authority unresolved'
    WHEN vc.source_trust_state = 'ABSENT' THEN 'ABSENT - no source assertion'
    ELSE vc.source_trust_state
  END AS displayed_value_text,
  vc.business_case_value_usd AS displayed_value_numeric,
  vc.value_case_id AS metric_or_fact_key,
  'Promised value authority'::text AS board_visible_label,
  vc.source_trust_state AS lineage_state,
  greatest(jsonb_array_length(vc.source_refs), 1)::int AS source_count,
  vc.source_refs,
  CASE WHEN vc.source_trust_state = 'CONFLICT' THEN vc.source_refs ELSE '[]'::jsonb END AS conflicting_values,
  CASE WHEN vc.source_trust_state IN ('AGREE', 'ONE_SOURCE') THEN vc.business_case_value_usd::text ELSE null END AS authoritative_value,
  coalesce(vc.finance_owner_role, 'Tower data steward') AS resolution_owner_role,
  CASE WHEN vc.source_trust_state = 'CONFLICT' THEN 'open' ELSE 'not_required' END AS resolution_state,
  'tower.value_case'::text AS source_file,
  vc.primary_claim_id AS source_row,
  'tower'::text AS source_system,
  CASE
    WHEN vc.source_trust_state = 'CONFLICT' THEN 'Source conflicts block claimable or realized value.'
    ELSE 'Source state comes from the governed Tower value-case layer.'
  END AS caveat
FROM tower.value_case vc
WHERE tower.can_read_tower_tenant(vc.tenant_key)

UNION ALL

SELECT
  tenant_key,
  'tower:' || tenant_key || ':source-trust:board-promised-value' AS lineage_key,
  'board_value_posture'::text AS surface_section,
  'Board promised value exposure'::text AS displayed_fact,
  promised_value_board_status AS displayed_value_text,
  promised_value_exposure AS displayed_value_numeric,
  'board_promised_value'::text AS metric_or_fact_key,
  'Promised value'::text AS board_visible_label,
  promised_value_trust_state AS lineage_state,
  1::int AS source_count,
  jsonb_build_array(jsonb_build_object('view', 'consumption.tower_board_posture_v1', 'contract', source_contract_version)) AS source_refs,
  CASE WHEN promised_value_trust_state = 'CONFLICT' THEN jsonb_build_array(jsonb_build_object('state', promised_value_board_status)) ELSE '[]'::jsonb END AS conflicting_values,
  CASE WHEN promised_value_trust_state = 'CONFLICT' THEN null ELSE promised_value_exposure::text END AS authoritative_value,
  'Tower data steward'::text AS resolution_owner_role,
  CASE WHEN promised_value_trust_state = 'CONFLICT' THEN 'open' ELSE 'not_required' END AS resolution_state,
  'consumption.tower_board_posture_v1'::text AS source_file,
  null::text AS source_row,
  'tower'::text AS source_system,
  executive_summary AS caveat
FROM consumption.tower_board_posture_v1;

GRANT SELECT ON
  tower.value_case,
  tower.value_case_period,
  tower.subject_link,
  tower.economic_conversion,
  tower.attestation_event,
  tower.proof_action,
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
  tower.value_case,
  tower.value_case_period,
  tower.subject_link,
  tower.economic_conversion,
  tower.attestation_event,
  tower.proof_action
TO service_role;

COMMENT ON TABLE tower.value_case IS
  'Shared Tower value-case layer. Preserves investment -> adoption -> workflow change -> outcome -> economic conversion -> Finance validation -> realized value.';
COMMENT ON TABLE tower.value_case_period IS
  'Quarterly value-case schedule. At least eight quarters are created by the v1 backfill; forecast value remains null while authority is unresolved.';
COMMENT ON TABLE tower.subject_link IS
  'Identity crosswalk linking tools, agents, personas, DORA teams, business KPIs, value cases, programs, initiatives, and cost centers.';
COMMENT ON TABLE tower.economic_conversion IS
  'Explicit conversion events. Capacity and hours saved do not become savings unless represented here.';
COMMENT ON TABLE tower.attestation_event IS
  'Finance, business, risk, and source-authority attestations with evidence package IDs.';
COMMENT ON TABLE tower.proof_action IS
  'Owner/due/evidence/decision action queue for blocked value cases.';
COMMENT ON VIEW consumption.tower_board_posture_v1 IS
  'Board posture read contract for Tower UI, aVa, exports, and Cube models.';
COMMENT ON VIEW consumption.tower_value_trajectory_v1 IS
  'Quarterly value trajectory and proof-state schedule: investment plan, actual spend, remaining commitment, business-case benefit, risk-adjusted forecast, Finance run-rate, realized P&L/cash, and forecast at completion.';
COMMENT ON VIEW consumption.tower_portfolio_decision_v1 IS
  'Program/value-case decision lane contract. Source conflicts and proof gaps block claimability.';
COMMENT ON VIEW consumption.tower_tool_productivity_v1 IS
  'Workforce-productivity AI tool view preserving reported usage rate, calculated active/licensed rate, variance, quality state, and governed effective rate.';
COMMENT ON VIEW consumption.tower_agent_outcome_v1 IS
  'Process/agent automation outcome view; operational outcomes remain separate from economics.';
COMMENT ON VIEW consumption.tower_action_queue_v1 IS
  'Proof action queue with required owner, due date, evidence package, and blocked decision.';
COMMENT ON VIEW consumption.tower_source_trust_v1 IS
  'Source trust trail productizing AGREE, ONE_SOURCE, CONFLICT, and ABSENT states.';
