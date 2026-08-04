-- Source contract category semantic review ledger.
--
-- Category quality is a governed semantic projection, not a destructive change
-- to source-system classifications. The original category remains on the
-- source record; this append-only ledger records accepted reviewer decisions
-- that downstream consumption views can apply as effective_category.

CREATE SCHEMA IF NOT EXISTS governance;

CREATE TABLE IF NOT EXISTS governance.contract_category_review (
  review_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_key TEXT NOT NULL,
  contract_id TEXT NOT NULL,
  source_category TEXT,
  suggested_category TEXT,
  review_decision TEXT NOT NULL CHECK (
    review_decision IN (
      'confirm_source',
      'correct_to_suggested',
      'correct_to_other',
      'defer'
    )
  ),
  effective_category TEXT,
  reason TEXT NOT NULL,
  reviewer_role TEXT NOT NULL,
  reviewed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  rule_version TEXT NOT NULL,
  evidence_refs TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS contract_category_review_latest_idx
  ON governance.contract_category_review (tenant_key, contract_id, reviewed_at DESC);

ALTER TABLE governance.contract_category_review ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS contract_category_review_tenant_access
  ON governance.contract_category_review;

CREATE POLICY contract_category_review_tenant_access
  ON governance.contract_category_review
  FOR ALL
  USING (governance.can_access_tenant(tenant_key))
  WITH CHECK (governance.can_access_tenant(tenant_key));

GRANT SELECT, INSERT ON governance.contract_category_review TO authenticated, service_role;
REVOKE UPDATE, DELETE ON governance.contract_category_review FROM authenticated;
