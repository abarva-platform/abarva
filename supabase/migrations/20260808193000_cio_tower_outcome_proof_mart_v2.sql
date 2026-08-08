-- CIO Tower outcome-proof mart v2
-- Purpose: promote the Tower cockpit's deterministic operating fields into
-- cio_tower.mart_* so React renders the read model instead of deriving the
-- CFO story in the browser. These are derived projection columns, not source
-- truth, and must be written only by a governed Tower data-build job.

CREATE SCHEMA IF NOT EXISTS cio_tower;

ALTER TABLE cio_tower.mart_command_center
  ADD COLUMN IF NOT EXISTS claimable_value numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS finance_validated_blocked_value numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS promised_value_exposure numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS unknown_value_claim_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS claimable_program_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS blocked_program_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS conflicted_program_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS unmeasured_program_count integer NOT NULL DEFAULT 0;

ALTER TABLE cio_tower.mart_value_funnel
  ADD COLUMN IF NOT EXISTS claim_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS known_value_claim_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS unknown_value_claim_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS known_value_amount numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS blocked_claim_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS blocked_known_value_amount numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS primary_blocker text,
  ADD COLUMN IF NOT EXISTS primary_owner_role text;

ALTER TABLE cio_tower.mart_program_decision_lanes
  ADD COLUMN IF NOT EXISTS funded_amount numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS known_supported_value numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS proof_maturity_score integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS risk_pressure_score integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS usage_strength_score integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS lineage_trust_state text NOT NULL DEFAULT 'ONE_SOURCE',
  ADD COLUMN IF NOT EXISTS decision_reason_code text NOT NULL DEFAULT 'FIX_PROOF',
  ADD COLUMN IF NOT EXISTS amount_blocked numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS next_gate text;

ALTER TABLE cio_tower.mart_cxo_actions
  ADD COLUMN IF NOT EXISTS action_id text,
  ADD COLUMN IF NOT EXISTS program_id text,
  ADD COLUMN IF NOT EXISTS claim_id text,
  ADD COLUMN IF NOT EXISTS proof_stage text,
  ADD COLUMN IF NOT EXISTS blocked_decision text,
  ADD COLUMN IF NOT EXISTS amount_exposed numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS evidence_requirement text,
  ADD COLUMN IF NOT EXISTS expected_source_system text,
  ADD COLUMN IF NOT EXISTS evidence_package_id text,
  ADD COLUMN IF NOT EXISTS owner_role text,
  ADD COLUMN IF NOT EXISTS secondary_owner_role text,
  ADD COLUMN IF NOT EXISTS due_window text,
  ADD COLUMN IF NOT EXISTS due_date date,
  ADD COLUMN IF NOT EXISTS handoff_module text,
  ADD COLUMN IF NOT EXISTS handoff_entity_id text,
  ADD COLUMN IF NOT EXISTS handoff_readiness text NOT NULL DEFAULT 'not_ready',
  ADD COLUMN IF NOT EXISTS action_state text NOT NULL DEFAULT 'open',
  ADD COLUMN IF NOT EXISTS priority text NOT NULL DEFAULT 'medium';

ALTER TABLE cio_tower.mart_evidence_lineage
  ADD COLUMN IF NOT EXISTS metric_or_fact_key text,
  ADD COLUMN IF NOT EXISTS board_visible_label text,
  ADD COLUMN IF NOT EXISTS lineage_state text NOT NULL DEFAULT 'ONE_SOURCE',
  ADD COLUMN IF NOT EXISTS source_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS source_refs jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS conflicting_values jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS authoritative_value text,
  ADD COLUMN IF NOT EXISTS resolution_owner_role text,
  ADD COLUMN IF NOT EXISTS resolution_state text NOT NULL DEFAULT 'not_required';

CREATE INDEX IF NOT EXISTS idx_cio_tower_mart_lanes_outcome_proof
  ON cio_tower.mart_program_decision_lanes
  (tenant_key, decision_reason_code, lineage_trust_state, amount_blocked DESC);

CREATE INDEX IF NOT EXISTS idx_cio_tower_mart_actions_owner_queue
  ON cio_tower.mart_cxo_actions
  (tenant_key, action_state, priority, due_date, amount_exposed DESC);

CREATE INDEX IF NOT EXISTS idx_cio_tower_mart_lineage_state
  ON cio_tower.mart_evidence_lineage
  (tenant_key, lineage_state, surface_section);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
      FROM pg_constraint
     WHERE conname = 'mart_command_center_outcome_proof_nonnegative'
       AND conrelid = 'cio_tower.mart_command_center'::regclass
  ) THEN
    ALTER TABLE cio_tower.mart_command_center
      ADD CONSTRAINT mart_command_center_outcome_proof_nonnegative
      CHECK (
        claimable_value >= 0
        AND finance_validated_blocked_value >= 0
        AND promised_value_exposure >= 0
        AND unknown_value_claim_count >= 0
        AND claimable_program_count >= 0
        AND blocked_program_count >= 0
        AND conflicted_program_count >= 0
        AND unmeasured_program_count >= 0
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1
      FROM pg_constraint
     WHERE conname = 'mart_value_funnel_outcome_proof_nonnegative'
       AND conrelid = 'cio_tower.mart_value_funnel'::regclass
  ) THEN
    ALTER TABLE cio_tower.mart_value_funnel
      ADD CONSTRAINT mart_value_funnel_outcome_proof_nonnegative
      CHECK (
        claim_count >= 0
        AND known_value_claim_count >= 0
        AND unknown_value_claim_count >= 0
        AND known_value_amount >= 0
        AND blocked_claim_count >= 0
        AND blocked_known_value_amount >= 0
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1
      FROM pg_constraint
     WHERE conname = 'mart_program_decision_lanes_outcome_proof_bounds'
       AND conrelid = 'cio_tower.mart_program_decision_lanes'::regclass
  ) THEN
    ALTER TABLE cio_tower.mart_program_decision_lanes
      ADD CONSTRAINT mart_program_decision_lanes_outcome_proof_bounds
      CHECK (
        funded_amount >= 0
        AND known_supported_value >= 0
        AND proof_maturity_score BETWEEN 0 AND 100
        AND risk_pressure_score BETWEEN 0 AND 100
        AND usage_strength_score BETWEEN 0 AND 100
        AND amount_blocked >= 0
        AND lineage_trust_state IN ('AGREE', 'ONE_SOURCE', 'CONFLICT', 'ABSENT')
        AND decision_reason_code IN ('SCALE', 'FIX_PROOF', 'WATCH', 'FREEZE', 'STOP_REDESIGN')
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1
      FROM pg_constraint
     WHERE conname = 'mart_evidence_lineage_state_check'
       AND conrelid = 'cio_tower.mart_evidence_lineage'::regclass
  ) THEN
    ALTER TABLE cio_tower.mart_evidence_lineage
      ADD CONSTRAINT mart_evidence_lineage_state_check
      CHECK (
        lineage_state IN ('AGREE', 'ONE_SOURCE', 'CONFLICT', 'ABSENT')
        AND source_count >= 0
        AND resolution_state IN ('not_required', 'open', 'resolved', 'waived')
      );
  END IF;
END $$;

CREATE OR REPLACE VIEW cio_tower.v_mart_outcome_proof_validation AS
SELECT
  tenant_key,
  'mart_command_center'::text AS mart_table,
  command_center_key AS mart_record_key,
  'claimable_exceeds_finance_validated'::text AS violation_code,
  'Claimable value cannot exceed finance-validated value.'::text AS violation_detail
FROM cio_tower.mart_command_center
WHERE claimable_value > partial_finance_validated_value_ytd

UNION ALL

SELECT
  tenant_key,
  'mart_program_decision_lanes'::text AS mart_table,
  lane_key AS mart_record_key,
  'conflicted_lineage_promoted_to_claimable'::text AS violation_code,
  'A conflicted program cannot be marked claim-allowed until lineage resolves.'::text AS violation_detail
FROM cio_tower.mart_program_decision_lanes
WHERE lineage_trust_state = 'CONFLICT'
  AND tower_claim_allowed = 'allowed'

UNION ALL

SELECT
  tenant_key,
  'mart_evidence_lineage'::text AS mart_table,
  lineage_key AS mart_record_key,
  'conflicted_claimable_or_realized_fact'::text AS violation_code,
  'A conflicted lineage row cannot support claimable or realized board-visible value.'::text AS violation_detail
FROM cio_tower.mart_evidence_lineage
WHERE lineage_state = 'CONFLICT'
  AND surface_section IN ('claimable_value', 'realized_value', 'board_value_posture')
  AND coalesce(displayed_value_numeric, 0) > 0;

COMMENT ON VIEW cio_tower.v_mart_outcome_proof_validation IS
  'SQL validation surface for Tower outcome-proof mart v2. A governed data-build job must read zero rows before promoting output as board-grade.';
