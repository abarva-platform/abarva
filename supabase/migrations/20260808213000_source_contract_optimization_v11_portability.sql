-- Source Contract Optimization V1.1 portability contract.
--
-- Adds a tenant-agnostic four-ledger decision record and evidence-observation
-- substrate. Existing public.source_contract_optimization_* MVE tables remain
-- available for event-pack rendering; these Source tables are the shared read
-- contract for Contract 360, Door 1, Tower handoff, and aVa.

BEGIN;

CREATE TABLE IF NOT EXISTS source.contract_optimization_decision_record (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_key TEXT NOT NULL,
  dataset_version TEXT NOT NULL,
  contract_id TEXT NOT NULL,
  vendor_id TEXT NOT NULL,
  optimization_state TEXT NOT NULL CHECK (
    optimization_state IN (
      'EVIDENCE_MISSING',
      'WORKFLOW_REQUIRED',
      'READY_FOR_REVIEW',
      'VALUE_CONFIRMED'
    )
  ),
  recoverable_leakage NUMERIC(18,2) NULL CHECK (recoverable_leakage IS NULL OR recoverable_leakage >= 0),
  avoided_cost NUMERIC(18,2) NULL CHECK (avoided_cost IS NULL OR avoided_cost >= 0),
  negotiated_improvement NUMERIC(18,2) NULL CHECK (negotiated_improvement IS NULL OR negotiated_improvement >= 0),
  realized_value NUMERIC(18,2) NULL CHECK (realized_value IS NULL OR realized_value >= 0),
  evidence_status JSONB NOT NULL DEFAULT '{}'::jsonb,
  evidence_refs JSONB NOT NULL DEFAULT '[]'::jsonb,
  confidence NUMERIC(5,4) NULL CHECK (confidence IS NULL OR (confidence >= 0 AND confidence <= 1)),
  owner TEXT NULL,
  next_action TEXT NOT NULL,
  door1_event_id TEXT NULL,
  tower_claim_refs JSONB NOT NULL DEFAULT '[]'::jsonb,
  record_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_key, dataset_version, contract_id)
);

CREATE INDEX IF NOT EXISTS idx_source_contract_optimization_decision_tenant_state
  ON source.contract_optimization_decision_record (tenant_key, optimization_state, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_source_contract_optimization_decision_event
  ON source.contract_optimization_decision_record (tenant_key, door1_event_id)
  WHERE door1_event_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS source.contract_optimization_evidence_observation (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_key TEXT NOT NULL,
  dataset_version TEXT NOT NULL,
  contract_id TEXT NOT NULL,
  vendor_id TEXT NOT NULL,
  ledger_kind TEXT NOT NULL CHECK (
    ledger_kind IN (
      'recoverable_leakage',
      'avoided_cost',
      'negotiated_improvement',
      'realized_value'
    )
  ),
  evidence_class TEXT NOT NULL CHECK (
    evidence_class IN (
      'invoice',
      'payment',
      'rate_card',
      'sla',
      'service_credit',
      'contract_term',
      'renewal',
      'usage',
      'cloud_consumption',
      'workforce',
      'change_order',
      'scope',
      'benchmark',
      'supplier_offer',
      'approved_agreement',
      'finance_value_confirmation'
    )
  ),
  evidence_status TEXT NOT NULL CHECK (
    evidence_status IN (
      'EVIDENCE_AVAILABLE',
      'EVIDENCE_MISSING',
      'WORKFLOW_REQUIRED',
      'NOT_ESTABLISHED'
    )
  ),
  grain TEXT NOT NULL,
  period_start DATE NULL,
  period_end DATE NULL,
  source_system TEXT NULL,
  source_table TEXT NULL,
  source_record_id TEXT NULL,
  source_document_id TEXT NULL,
  source_page TEXT NULL,
  source_span TEXT NULL,
  amount_usd NUMERIC(18,2) NULL CHECK (amount_usd IS NULL OR amount_usd >= 0),
  quantity NUMERIC(18,4) NULL,
  unit TEXT NULL,
  confidence NUMERIC(5,4) NULL CHECK (confidence IS NULL OR (confidence >= 0 AND confidence <= 1)),
  review_state TEXT NOT NULL DEFAULT 'not_reviewed',
  evidence_refs JSONB NOT NULL DEFAULT '[]'::jsonb,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_source_contract_optimization_evidence_contract
  ON source.contract_optimization_evidence_observation
  (tenant_key, dataset_version, contract_id, ledger_kind, evidence_class);

CREATE INDEX IF NOT EXISTS idx_source_contract_optimization_evidence_status
  ON source.contract_optimization_evidence_observation
  (tenant_key, evidence_status, review_state, updated_at DESC);

ALTER TABLE source.contract_optimization_decision_record ENABLE ROW LEVEL SECURITY;
ALTER TABLE source.contract_optimization_evidence_observation ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS service_role_all_source_contract_optimization_decision_record
  ON source.contract_optimization_decision_record;
CREATE POLICY service_role_all_source_contract_optimization_decision_record
  ON source.contract_optimization_decision_record
  FOR ALL USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS service_role_all_source_contract_optimization_evidence_observation
  ON source.contract_optimization_evidence_observation;
CREATE POLICY service_role_all_source_contract_optimization_evidence_observation
  ON source.contract_optimization_evidence_observation
  FOR ALL USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS authenticated_read_source_contract_optimization_decision_record
  ON source.contract_optimization_decision_record;
CREATE POLICY authenticated_read_source_contract_optimization_decision_record
  ON source.contract_optimization_decision_record
  FOR SELECT USING (source.can_read_sourcing_tenant(tenant_key));

DROP POLICY IF EXISTS authenticated_read_source_contract_optimization_evidence_observation
  ON source.contract_optimization_evidence_observation;
CREATE POLICY authenticated_read_source_contract_optimization_evidence_observation
  ON source.contract_optimization_evidence_observation
  FOR SELECT USING (source.can_read_sourcing_tenant(tenant_key));

GRANT SELECT ON source.contract_optimization_decision_record TO authenticated;
GRANT SELECT ON source.contract_optimization_evidence_observation TO authenticated;
GRANT SELECT, INSERT, UPDATE ON source.contract_optimization_decision_record TO service_role;
GRANT SELECT, INSERT, UPDATE ON source.contract_optimization_evidence_observation TO service_role;

COMMENT ON TABLE source.contract_optimization_decision_record IS
  'Tenant-agnostic four-ledger contract optimization decision record. Missing evidence is represented as status and NULL amount, never as zero.';

COMMENT ON TABLE source.contract_optimization_evidence_observation IS
  'Tenant-agnostic evidence observations that normalize contract, invoice, SLA, usage, benchmark, offer, agreement, and finance proof into shared optimization ledger classes.';

COMMIT;
