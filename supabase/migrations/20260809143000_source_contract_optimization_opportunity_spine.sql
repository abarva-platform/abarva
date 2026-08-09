-- Source Contract Optimization V1.1 opportunity spine.
--
-- The prior four-ledger decision record remains a compatibility projection.
-- These tables are the governed commercial spine: opportunity identity,
-- evidence, deterministic calculations, stage history, workflow linkage,
-- approval, negotiated outcome, and Finance/Tower realization proof.

BEGIN;

CREATE TABLE IF NOT EXISTS source.optimization_opportunity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_key TEXT NOT NULL,
  dataset_version TEXT NOT NULL,
  opportunity_id TEXT NOT NULL,
  contract_id TEXT NOT NULL,
  vendor_id TEXT NOT NULL,
  value_type TEXT NOT NULL CHECK (value_type IN ('recoverable_leakage', 'avoided_cost', 'negotiated_improvement')),
  stage TEXT NOT NULL CHECK (
    stage IN (
      'signal',
      'quantified',
      'validated',
      'approval_required',
      'target_position',
      'agreed',
      'finance_confirmed',
      'baseline_conflict',
      'evidence_required',
      'workflow_required'
    )
  ),
  amount_usd NUMERIC(18,2) NULL CHECK (amount_usd IS NULL OR amount_usd >= 0),
  amount_state TEXT NOT NULL DEFAULT 'not_sized' CHECK (amount_state IN ('exact', 'range', 'not_sized')),
  evidence_grade TEXT NOT NULL DEFAULT 'missing',
  confidence NUMERIC(5,4) NULL CHECK (confidence IS NULL OR (confidence >= 0 AND confidence <= 1)),
  owner TEXT NULL,
  next_action TEXT NOT NULL,
  blocking_gap TEXT NULL,
  deadline DATE NULL,
  overlap_treatment TEXT NOT NULL,
  approval_state TEXT NOT NULL,
  narrative TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_key, dataset_version, opportunity_id)
);

CREATE TABLE IF NOT EXISTS source.opportunity_evidence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_key TEXT NOT NULL,
  dataset_version TEXT NOT NULL,
  opportunity_id TEXT NOT NULL,
  evidence_class TEXT NOT NULL,
  source_system TEXT NOT NULL,
  source_table TEXT NULL,
  source_record_id TEXT NULL,
  source_file_report TEXT NULL,
  source_document_id TEXT NULL,
  source_page TEXT NULL,
  source_span TEXT NULL,
  review_state TEXT NOT NULL DEFAULT 'not_reviewed',
  evidence_status TEXT NOT NULL DEFAULT 'EVIDENCE_AVAILABLE' CHECK (
    evidence_status IN ('EVIDENCE_AVAILABLE', 'EVIDENCE_MISSING', 'WORKFLOW_REQUIRED', 'CONFLICTED', 'NOT_ESTABLISHED')
  ),
  amount_usd NUMERIC(18,2) NULL,
  quantity NUMERIC(18,4) NULL,
  unit TEXT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  FOREIGN KEY (tenant_key, dataset_version, opportunity_id)
    REFERENCES source.optimization_opportunity (tenant_key, dataset_version, opportunity_id)
    ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS source.calculation_rule (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_key TEXT NOT NULL,
  dataset_version TEXT NOT NULL,
  rule_id TEXT NOT NULL,
  rule_version TEXT NOT NULL,
  formula TEXT NOT NULL,
  input_contract JSONB NOT NULL DEFAULT '[]'::jsonb,
  output_contract JSONB NOT NULL DEFAULT '[]'::jsonb,
  active_from TIMESTAMPTZ NOT NULL DEFAULT now(),
  active_to TIMESTAMPTZ NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  UNIQUE (tenant_key, dataset_version, rule_id, rule_version)
);

CREATE TABLE IF NOT EXISTS source.calculation_run (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_key TEXT NOT NULL,
  dataset_version TEXT NOT NULL,
  calculation_run_id TEXT NOT NULL,
  opportunity_id TEXT NOT NULL,
  rule_id TEXT NOT NULL,
  rule_version TEXT NOT NULL,
  run_state TEXT NOT NULL DEFAULT 'completed' CHECK (run_state IN ('completed', 'blocked', 'failed', 'superseded')),
  run_hash TEXT NULL,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  UNIQUE (tenant_key, dataset_version, calculation_run_id),
  FOREIGN KEY (tenant_key, dataset_version, opportunity_id)
    REFERENCES source.optimization_opportunity (tenant_key, dataset_version, opportunity_id)
    ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS source.calculation_input (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_key TEXT NOT NULL,
  dataset_version TEXT NOT NULL,
  calculation_run_id TEXT NOT NULL,
  input_key TEXT NOT NULL,
  source_table TEXT NULL,
  source_record_id TEXT NULL,
  value_numeric NUMERIC(20,6) NULL,
  value_text TEXT NULL,
  unit TEXT NULL,
  inclusion_state TEXT NOT NULL DEFAULT 'included' CHECK (inclusion_state IN ('included', 'excluded', 'pending_review')),
  inclusion_reason TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  FOREIGN KEY (tenant_key, dataset_version, calculation_run_id)
    REFERENCES source.calculation_run (tenant_key, dataset_version, calculation_run_id)
    ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS source.calculation_output (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_key TEXT NOT NULL,
  dataset_version TEXT NOT NULL,
  calculation_run_id TEXT NOT NULL,
  output_key TEXT NOT NULL,
  amount_usd NUMERIC(18,2) NULL,
  quantity NUMERIC(18,4) NULL,
  unit TEXT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  FOREIGN KEY (tenant_key, dataset_version, calculation_run_id)
    REFERENCES source.calculation_run (tenant_key, dataset_version, calculation_run_id)
    ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS source.opportunity_valuation (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_key TEXT NOT NULL,
  dataset_version TEXT NOT NULL,
  opportunity_id TEXT NOT NULL,
  valuation_type TEXT NOT NULL CHECK (valuation_type IN ('potential', 'approved_position', 'agreed', 'finance_confirmed')),
  amount_usd NUMERIC(18,2) NULL CHECK (amount_usd IS NULL OR amount_usd >= 0),
  amount_low_usd NUMERIC(18,2) NULL,
  amount_high_usd NUMERIC(18,2) NULL,
  valuation_state TEXT NOT NULL,
  basis TEXT NOT NULL,
  source_run_id TEXT NULL,
  effective_date DATE NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  FOREIGN KEY (tenant_key, dataset_version, opportunity_id)
    REFERENCES source.optimization_opportunity (tenant_key, dataset_version, opportunity_id)
    ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS source.evidence_requirement (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_key TEXT NOT NULL,
  dataset_version TEXT NOT NULL,
  requirement_id TEXT NOT NULL,
  evidence_class TEXT NOT NULL,
  requirement_text TEXT NOT NULL,
  grain TEXT NOT NULL,
  minimum_period_months INT NOT NULL DEFAULT 1,
  owner_role TEXT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  UNIQUE (tenant_key, dataset_version, requirement_id)
);

CREATE TABLE IF NOT EXISTS source.opportunity_requirement_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_key TEXT NOT NULL,
  dataset_version TEXT NOT NULL,
  opportunity_id TEXT NOT NULL,
  requirement_id TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('met', 'missing', 'workflow_required', 'conflicted', 'not_applicable')),
  status_detail TEXT NOT NULL,
  owner TEXT NULL,
  due_date DATE NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  FOREIGN KEY (tenant_key, dataset_version, opportunity_id)
    REFERENCES source.optimization_opportunity (tenant_key, dataset_version, opportunity_id)
    ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS source.evidence_request (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_key TEXT NOT NULL,
  dataset_version TEXT NOT NULL,
  evidence_request_id TEXT NOT NULL,
  opportunity_id TEXT NOT NULL,
  requirement_id TEXT NULL,
  request_text TEXT NOT NULL,
  owner TEXT NULL,
  due_date DATE NULL,
  request_state TEXT NOT NULL DEFAULT 'open' CHECK (request_state IN ('open', 'received', 'waived', 'closed')),
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  UNIQUE (tenant_key, dataset_version, evidence_request_id),
  FOREIGN KEY (tenant_key, dataset_version, opportunity_id)
    REFERENCES source.optimization_opportunity (tenant_key, dataset_version, opportunity_id)
    ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS source.opportunity_stage_event (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_key TEXT NOT NULL,
  dataset_version TEXT NOT NULL,
  opportunity_id TEXT NOT NULL,
  from_stage TEXT NULL,
  to_stage TEXT NOT NULL,
  reason TEXT NOT NULL,
  changed_by_role TEXT NULL,
  changed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  FOREIGN KEY (tenant_key, dataset_version, opportunity_id)
    REFERENCES source.optimization_opportunity (tenant_key, dataset_version, opportunity_id)
    ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS source.opportunity_overlap (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_key TEXT NOT NULL,
  dataset_version TEXT NOT NULL,
  opportunity_id TEXT NOT NULL,
  overlaps_opportunity_id TEXT NOT NULL,
  overlap_type TEXT NOT NULL,
  treatment TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  FOREIGN KEY (tenant_key, dataset_version, opportunity_id)
    REFERENCES source.optimization_opportunity (tenant_key, dataset_version, opportunity_id)
    ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS source.optimization_baseline (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_key TEXT NOT NULL,
  dataset_version TEXT NOT NULL,
  baseline_id TEXT NOT NULL,
  contract_id TEXT NOT NULL,
  baseline_state TEXT NOT NULL CHECK (baseline_state IN ('ready', 'missing', 'conflict')),
  annual_value_usd NUMERIC(18,2) NULL,
  pricing_schedule_annual_value_usd NUMERIC(18,2) NULL,
  actual_annual_spend_usd NUMERIC(18,2) NULL,
  total_committed_value_usd NUMERIC(18,2) NULL,
  conflict_amount_usd NUMERIC(18,2) NULL,
  detail TEXT NOT NULL,
  source_refs JSONB NOT NULL DEFAULT '[]'::jsonb,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  UNIQUE (tenant_key, dataset_version, baseline_id)
);

CREATE TABLE IF NOT EXISTS source.optimization_case (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_key TEXT NOT NULL,
  dataset_version TEXT NOT NULL,
  optimization_case_id TEXT NOT NULL,
  door1_event_id TEXT NULL,
  contract_id TEXT NOT NULL,
  vendor_id TEXT NOT NULL,
  baseline_id TEXT NULL,
  case_state TEXT NOT NULL DEFAULT 'intake' CHECK (
    case_state IN ('intake', 'baseline_confirmed', 'evidence_review', 'calculation_validated', 'outreach_approval', 'outcome_recorded', 'finance_handoff', 'closed')
  ),
  owner TEXT NULL,
  next_action TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_key, dataset_version, optimization_case_id)
);

CREATE TABLE IF NOT EXISTS source.case_opportunity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_key TEXT NOT NULL,
  dataset_version TEXT NOT NULL,
  optimization_case_id TEXT NOT NULL,
  opportunity_id TEXT NOT NULL,
  selected_for_action BOOLEAN NOT NULL DEFAULT false,
  sequence INT NOT NULL DEFAULT 1,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  FOREIGN KEY (tenant_key, dataset_version, optimization_case_id)
    REFERENCES source.optimization_case (tenant_key, dataset_version, optimization_case_id)
    ON DELETE CASCADE,
  FOREIGN KEY (tenant_key, dataset_version, opportunity_id)
    REFERENCES source.optimization_opportunity (tenant_key, dataset_version, opportunity_id)
    ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS source.approval_request (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_key TEXT NOT NULL,
  dataset_version TEXT NOT NULL,
  approval_request_id TEXT NOT NULL,
  optimization_case_id TEXT NOT NULL,
  opportunity_id TEXT NULL,
  approval_type TEXT NOT NULL,
  approval_state TEXT NOT NULL DEFAULT 'pending' CHECK (approval_state IN ('pending', 'approved', 'sent_back', 'cancelled')),
  requested_by_role TEXT NULL,
  requested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  UNIQUE (tenant_key, dataset_version, approval_request_id)
);

CREATE TABLE IF NOT EXISTS source.approval_decision (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_key TEXT NOT NULL,
  dataset_version TEXT NOT NULL,
  approval_request_id TEXT NOT NULL,
  decision TEXT NOT NULL CHECK (decision IN ('approved', 'sent_back', 'held')),
  rationale TEXT NOT NULL,
  decided_by_role TEXT NULL,
  decided_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  FOREIGN KEY (tenant_key, dataset_version, approval_request_id)
    REFERENCES source.approval_request (tenant_key, dataset_version, approval_request_id)
    ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS source.negotiated_outcome (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_key TEXT NOT NULL,
  dataset_version TEXT NOT NULL,
  outcome_id TEXT NOT NULL,
  optimization_case_id TEXT NOT NULL,
  opportunity_id TEXT NOT NULL,
  outcome_state TEXT NOT NULL CHECK (outcome_state IN ('proposed', 'agreed', 'rejected', 'withdrawn')),
  agreed_amount_usd NUMERIC(18,2) NULL,
  effective_date DATE NULL,
  source_document_id TEXT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  UNIQUE (tenant_key, dataset_version, outcome_id)
);

CREATE TABLE IF NOT EXISTS source.finance_realization (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_key TEXT NOT NULL,
  dataset_version TEXT NOT NULL,
  realization_id TEXT NOT NULL,
  optimization_case_id TEXT NULL,
  opportunity_id TEXT NOT NULL,
  amount_usd NUMERIC(18,2) NOT NULL CHECK (amount_usd >= 0),
  basis TEXT NOT NULL,
  confirmation_date DATE NULL,
  finance_owner_role TEXT NULL,
  tower_claim_refs JSONB NOT NULL DEFAULT '[]'::jsonb,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  UNIQUE (tenant_key, dataset_version, realization_id)
);

CREATE TABLE IF NOT EXISTS source.finance_realization_evidence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_key TEXT NOT NULL,
  dataset_version TEXT NOT NULL,
  realization_id TEXT NOT NULL,
  evidence_class TEXT NOT NULL,
  source_table TEXT NULL,
  source_record_id TEXT NULL,
  source_document_id TEXT NULL,
  source_page TEXT NULL,
  review_state TEXT NOT NULL DEFAULT 'finance_confirmed',
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  FOREIGN KEY (tenant_key, dataset_version, realization_id)
    REFERENCES source.finance_realization (tenant_key, dataset_version, realization_id)
    ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_source_opt_opportunity_contract
  ON source.optimization_opportunity (tenant_key, dataset_version, contract_id, stage, amount_usd DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_source_opt_evidence_opportunity
  ON source.opportunity_evidence (tenant_key, dataset_version, opportunity_id, evidence_class, review_state);
CREATE INDEX IF NOT EXISTS idx_source_opt_case_contract
  ON source.optimization_case (tenant_key, dataset_version, contract_id, case_state);
CREATE INDEX IF NOT EXISTS idx_source_opt_case_opportunity
  ON source.case_opportunity (tenant_key, dataset_version, opportunity_id);
CREATE INDEX IF NOT EXISTS idx_source_opt_finance_opportunity
  ON source.finance_realization (tenant_key, dataset_version, opportunity_id, confirmation_date DESC NULLS LAST);

DO $$
DECLARE
  table_name TEXT;
BEGIN
  FOREACH table_name IN ARRAY ARRAY[
    'optimization_opportunity',
    'opportunity_evidence',
    'calculation_rule',
    'calculation_run',
    'calculation_input',
    'calculation_output',
    'opportunity_valuation',
    'evidence_requirement',
    'opportunity_requirement_status',
    'evidence_request',
    'opportunity_stage_event',
    'opportunity_overlap',
    'optimization_baseline',
    'optimization_case',
    'case_opportunity',
    'approval_request',
    'approval_decision',
    'negotiated_outcome',
    'finance_realization',
    'finance_realization_evidence'
  ] LOOP
    EXECUTE format('ALTER TABLE source.%I ENABLE ROW LEVEL SECURITY', table_name);

    EXECUTE format('DROP POLICY IF EXISTS service_role_all_%I ON source.%I', table_name, table_name);
    EXECUTE format(
      'CREATE POLICY service_role_all_%I ON source.%I FOR ALL USING (auth.role() = ''service_role'') WITH CHECK (auth.role() = ''service_role'')',
      table_name,
      table_name
    );

    EXECUTE format('DROP POLICY IF EXISTS authenticated_read_%I ON source.%I', table_name, table_name);
    EXECUTE format(
      'CREATE POLICY authenticated_read_%I ON source.%I FOR SELECT USING (source.can_read_sourcing_tenant(tenant_key))',
      table_name,
      table_name
    );

    EXECUTE format('GRANT SELECT ON source.%I TO authenticated', table_name);
    EXECUTE format('GRANT SELECT, INSERT, UPDATE ON source.%I TO service_role', table_name);
  END LOOP;
END $$;

COMMENT ON TABLE source.optimization_opportunity IS
  'Tenant-agnostic contract optimization opportunity spine. One row is one governed commercial opportunity, not a contract-level summary.';
COMMENT ON TABLE source.calculation_run IS
  'Deterministic calculation execution for an optimization opportunity, linked to included, excluded, and pending line-level inputs.';
COMMENT ON TABLE source.optimization_case IS
  'Door 1 optimization workflow case that continues selected governed opportunities from Contract 360 into approval, negotiation, and Finance handoff.';
COMMENT ON TABLE source.finance_realization IS
  'Finance-confirmed value linked back to originating opportunities. This is not additive to potential value unless the realization basis says so.';

COMMIT;
