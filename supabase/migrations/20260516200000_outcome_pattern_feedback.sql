-- OUTCOME PATTERN FEEDBACK · Wave 3, Slice 3.6
-- The start of the Layer 2 -> Layer 3 moat path: persist outcome
-- learning from the Slice 3.1 outcome ledger in a shape that can later
-- be anonymized and aggregated into a cross-tenant pattern graph of
-- "what AI bets actually pay off".
--
-- Design notes:
--
-- 1. One feedback row per RESOLVED outcome-ledger entry. A resolved
--    entry is one whose value has been measured (rung measured_in_pilot
--    / measured_in_production / declined) so a realized-vs-projected
--    delta exists. The row captures the *shape* of the decision, not
--    the decision content:
--      - decision_shape   · subject kind + value category + unit
--      - outcome_archetype· a coarse, tenant-agnostic category bucket
--      - outcome_rung     · the value rung the outcome resolved to
--      - delta fields     · realized vs projected (abs + ratio + sign)
--
-- 2. PRIVACY-FIRST. The pattern-relevant columns carry NO raw tenant
--    identifiers, no free-text labels, no evidence pointers, no user
--    ids. `tenant_client_key` exists ONLY to enforce RLS and is
--    explicitly NOT a pattern-relevant field — a later cross-tenant
--    aggregation job projects every row onto its archetype + rung +
--    bucketed delta and DROPS `tenant_client_key`, yielding an
--    anonymized contribution. Because no other column re-identifies a
--    tenant, that projection is structurally lossless for privacy:
--    anonymization is a column drop, not a scrub. `source_entry_id`
--    links back to the ledger for audit but is itself an opaque UUID.
--
-- 3. Append-only. Each resolved outcome contributes exactly one
--    immutable feedback row; re-measurements in the ledger produce a
--    NEW ledger entry which in turn produces a NEW feedback row. Rows
--    are never UPDATEd.
--
-- 4. Tenant-scoped RLS from the start. RLS is ENABLEd with a
--    tenant-scoped read policy via the canonical `can_read_tenant_by_key`
--    helper (see 20260507100000_rls_role_helpers.sql). Writes happen
--    only through application code on the service role; there is no
--    public- or authenticated-role insert path.
--
-- 5. Additive only — extends the Tower substrate without touching
--    outcome_ledger or any existing table.
--
-- The founder applies this via `npm run db:migrate`; it is authored,
-- NOT applied, in this slice.

BEGIN;

CREATE TABLE IF NOT EXISTS outcome_pattern_feedback (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Audit linkage back to the resolved outcome_ledger row this
  -- feedback was derived from. Opaque UUID — not a pattern field.
  source_entry_id       UUID NOT NULL REFERENCES outcome_ledger(id) ON DELETE CASCADE,

  -- Tenant scope. EXISTS ONLY FOR RLS — explicitly NOT a
  -- pattern-relevant field. A cross-tenant aggregation job drops this
  -- column to produce an anonymized contribution.
  tenant_client_key     TEXT NOT NULL,
  client_id             UUID REFERENCES clients(id) ON DELETE CASCADE,

  -- DECISION SHAPE · tenant-agnostic structural descriptors of the
  -- decision the outcome attaches to. No labels, no free text.
  subject_kind          TEXT NOT NULL
    CHECK (subject_kind IN ('move', 'source_event', 'use_case', 'program')),
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

  -- OUTCOME ARCHETYPE · the coarse, tenant-agnostic bucket the
  -- outcome falls into. This is the primary cross-tenant grouping key.
  outcome_archetype     TEXT NOT NULL
    CHECK (outcome_archetype IN (
      'overdelivered',     -- realized materially above projection
      'on_target',         -- realized within tolerance of projection
      'underdelivered',    -- realized materially below projection
      'declined'           -- the bet was abandoned before realization
    )),

  -- The value rung the outcome resolved to (terminal rungs only).
  outcome_rung          TEXT NOT NULL
    CHECK (outcome_rung IN (
      'measured_in_pilot',
      'measured_in_production',
      'declined'
    )),

  -- REALIZED-VS-PROJECTED DELTA · the learning signal. `delta_ratio`
  -- is realized/projected (NULL when not computable, e.g. declined or
  -- zero projection). `delta_sign` is -1/0/+1. `delta_bucket` is a
  -- coarsened band so aggregation never needs the raw figures.
  projected_amount      NUMERIC NOT NULL,
  realized_amount       NUMERIC,
  delta_abs             NUMERIC,
  delta_ratio           NUMERIC,
  delta_sign            SMALLINT NOT NULL DEFAULT 0
    CHECK (delta_sign IN (-1, 0, 1)),
  delta_bucket          TEXT NOT NULL
    CHECK (delta_bucket IN (
      'far_below',         -- realized < 50% of projection
      'below',             -- 50%..90%
      'near',              -- 90%..110%
      'above',             -- 110%..150%
      'far_above',         -- > 150%
      'not_applicable'     -- declined / not computable
    )),

  -- Confidence the realized figure carries (mirrors the ledger's
  -- counterfactual confidence) — lets aggregation weight contributions.
  counterfactual_confidence TEXT NOT NULL DEFAULT 'low'
    CHECK (counterfactual_confidence IN ('low', 'medium', 'high')),

  -- Schema version of the feedback record builder, so a later
  -- aggregation job can reconcile records built by different module
  -- versions. Bumped when the builder's projection logic changes.
  feedback_schema_version SMALLINT NOT NULL DEFAULT 1,

  -- Provenance. `recorded_at` mirrors the ledger entry's resolution
  -- time; `created_at` is the feedback-row insert time.
  recorded_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- One feedback row per resolved ledger entry.
CREATE UNIQUE INDEX IF NOT EXISTS uq_outcome_pattern_feedback_source
  ON outcome_pattern_feedback (source_entry_id);

-- Tenant-scoped reads.
CREATE INDEX IF NOT EXISTS idx_outcome_pattern_feedback_tenant
  ON outcome_pattern_feedback (tenant_client_key, recorded_at DESC);

-- Cross-tenant pattern grouping (tenant-agnostic): the columns a later
-- anonymized aggregation job groups by.
CREATE INDEX IF NOT EXISTS idx_outcome_pattern_feedback_pattern
  ON outcome_pattern_feedback
  (outcome_archetype, value_category, subject_kind, delta_bucket);

COMMENT ON TABLE outcome_pattern_feedback IS
  'Append-only outcome feedback: one row per resolved outcome_ledger entry, capturing the decision shape, outcome archetype, outcome rung, and realized-vs-projected delta. Pattern-relevant columns carry NO raw tenant identifiers — tenant_client_key exists only for RLS and is dropped by a later cross-tenant aggregation job, making anonymization a structural column drop. Start of the Layer 2 -> Layer 3 moat path (cross-tenant pattern graph). See src/lib/tower/outcome-feedback/ and docs/strategy/ABARVA_PRODUCT_ENHANCEMENT_EXECUTION_PLAN.md Wave 3 Slice 3.6.';

COMMENT ON COLUMN outcome_pattern_feedback.tenant_client_key IS
  'Tenant scope for RLS ONLY. NOT a pattern-relevant field — a cross-tenant aggregation job drops this column to produce an anonymized contribution.';

-- RLS: read scoped by tenant via the canonical helper. Service-role
-- performs the writes from application code (no public- or
-- authenticated-role insert path). Pattern mirrors 20260516180000_outcome_ledger.sql.
ALTER TABLE outcome_pattern_feedback ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS svc_all ON outcome_pattern_feedback;
CREATE POLICY svc_all ON outcome_pattern_feedback
  FOR ALL TO service_role
  USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS auth_read ON outcome_pattern_feedback;
CREATE POLICY auth_read ON outcome_pattern_feedback
  FOR SELECT TO authenticated
  USING (can_read_tenant_by_key(tenant_client_key));

GRANT SELECT ON outcome_pattern_feedback TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
