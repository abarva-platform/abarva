-- OUTCOME LEDGER · Wave 3, Slice 3.1
-- Persistence for projected / tracked / verified AI value per Move,
-- Source event, or use case — the foundation of the moat's
-- "decision ledger" (Layer 2).
--
-- Design notes:
--
-- 1. Append-only by convention. Each value claim's lifecycle (a new
--    measurement, a re-baseline, a governance flag) is recorded as a
--    NEW row pointing at the original via `supersedes_entry_id`; the
--    original row is never UPDATEd. This keeps the ledger SOC2-friendly
--    and gives every value figure an immutable evidence trail.
--    `is_current` marks the latest row in a claim chain so reads can
--    project a current view without losing history.
--
-- 2. Every value figure carries its confidence rung (`value_rung`,
--    mirroring the readiness states in
--    src/lib/tower/ai-value-outcome-ledger.ts) and an evidence pointer
--    so the Tower surface can never render an inflated AI value claim
--    as an audited fact.
--
-- 3. Tenant-scoped from the start. RLS is ENABLEd with a tenant-scoped
--    read policy via the existing `can_read_tenant_by_key` helper
--    (see 20260507100000_rls_role_helpers.sql). Writes happen through
--    application code on the service role; there is no public-role
--    insert path. This is NOT a new RLS-gap table.
--
-- 4. Additive only — extends the Tower substrate without touching
--    ai_initiatives, source_events, or any existing table.
--
-- The founder applies this via `npm run db:migrate`; it is authored,
-- not applied, in this slice.

BEGIN;

CREATE TABLE IF NOT EXISTS outcome_ledger (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- For lifecycle / re-measurement rows this references the prior
  -- entry in the same claim chain. NULL on the originating row.
  supersedes_entry_id   UUID REFERENCES outcome_ledger(id) ON DELETE NO ACTION,
  -- TRUE on the most recent row of a claim chain; superseding writes
  -- flip the prior row to FALSE so a current-view read is a simple
  -- `WHERE is_current` filter.
  is_current            BOOLEAN NOT NULL DEFAULT TRUE,

  -- Tenant scope. `tenant_key` is the canonical short slug
  -- ('apexretail', 'meridian', ...) matching the JWT tenant_key claim.
  tenant_client_key     TEXT NOT NULL,
  client_id             UUID REFERENCES clients(id) ON DELETE CASCADE,

  -- The thing this value claim is attached to. Exactly one of the
  -- reference kinds is expected to be populated, identified by
  -- `subject_kind`; ids are stored as TEXT so the ledger can reference
  -- a Move, a Source event, or a use-case key without a hard FK to a
  -- module-owned table (keeps the ledger additive and decoupled).
  subject_kind          TEXT NOT NULL
    CHECK (subject_kind IN ('move', 'source_event', 'use_case', 'program')),
  subject_ref           TEXT NOT NULL,
  subject_label         TEXT NOT NULL,

  -- Value classification. `value_rung` mirrors the readiness ladder in
  -- src/lib/tower/ai-value-outcome-ledger.ts; the three coarse
  -- confidence tiers (projected / tracked / verified) are derived from
  -- it in the view-model read layer.
  value_rung            TEXT NOT NULL
    CHECK (value_rung IN (
      'projected_only',
      'baseline_pending',
      'baseline_set',
      'in_pilot_measurement',
      'measured_in_pilot',
      'measured_in_production',
      'declined'
    )),
  value_category        TEXT NOT NULL
    CHECK (value_category IN (
      'cost_avoidance',
      'productivity',
      'revenue_lift',
      'risk_reduction',
      'customer_experience',
      'employee_experience',
      'compliance'
    )),
  measurement_unit      TEXT NOT NULL
    CHECK (measurement_unit IN (
      'usd_seed',
      'percent',
      'hours_saved_per_week',
      'tickets_per_day',
      'nps_delta',
      'incidents_per_quarter'
    )),

  -- The value figures. `projected_amount` is always present;
  -- `realized_amount` and `baseline_amount` are NULL until measured.
  projected_amount      NUMERIC NOT NULL,
  realized_amount       NUMERIC,
  baseline_amount       NUMERIC,

  -- Confidence + governance.
  counterfactual_confidence TEXT NOT NULL DEFAULT 'low'
    CHECK (counterfactual_confidence IN ('low', 'medium', 'high')),
  governance_review_status  TEXT NOT NULL DEFAULT 'not_started'
    CHECK (governance_review_status IN ('not_started', 'in_review', 'approved', 'flagged')),
  measurement_owner_role    TEXT,

  -- Evidence. Every value figure carries an evidence link so the Tower
  -- surface can attribute the claim; `evidence_claim_ids` lists any
  -- EVID3-style claim ids the figure is backed by.
  evidence_pointer      TEXT,
  evidence_claim_ids    TEXT[] NOT NULL DEFAULT '{}',
  note                  TEXT,
  metadata              JSONB NOT NULL DEFAULT '{}'::jsonb,

  -- Provenance / audit timestamps.
  recorded_by           TEXT,
  recorded_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Current-view read: per tenant, the latest row of every claim chain.
CREATE INDEX IF NOT EXISTS idx_outcome_ledger_tenant_current
  ON outcome_ledger (tenant_client_key, recorded_at DESC)
  WHERE is_current;

-- Subject lookup: all entries (history included) for one Move / event.
CREATE INDEX IF NOT EXISTS idx_outcome_ledger_subject
  ON outcome_ledger (tenant_client_key, subject_kind, subject_ref);

-- Claim-chain traversal.
CREATE INDEX IF NOT EXISTS idx_outcome_ledger_supersedes
  ON outcome_ledger (supersedes_entry_id)
  WHERE supersedes_entry_id IS NOT NULL;

COMMENT ON TABLE outcome_ledger IS
  'Append-only outcome ledger: projected / tracked / verified AI value per Move, Source event, or use case. Each row carries its value rung (confidence) and an evidence pointer so no value figure is rendered as an audited fact without provenance. Re-measurements write NEW rows linked via supersedes_entry_id; the originating row is never updated. Foundation of the decision-ledger moat (Layer 2). See src/lib/tower/outcome-ledger/ and docs/strategy/ABARVA_PRODUCT_ENHANCEMENT_EXECUTION_PLAN.md Wave 3.';

-- RLS: read scoped by tenant via the canonical helper. Service-role
-- performs the writes from application code (no public-role insert
-- path). Pattern mirrors 20260515200000_sensitive_upload_audit.sql.
ALTER TABLE outcome_ledger ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS svc_all ON outcome_ledger;
CREATE POLICY svc_all ON outcome_ledger
  FOR ALL TO service_role
  USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS auth_read ON outcome_ledger;
CREATE POLICY auth_read ON outcome_ledger
  FOR SELECT TO authenticated
  USING (can_read_tenant_by_key(tenant_client_key));

GRANT SELECT ON outcome_ledger TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
