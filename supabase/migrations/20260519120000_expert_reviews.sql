-- EXPERT REVIEWS · Moves Expert Review Console
--
-- Backs the kernel calibration loop: the Moves Expert Kernel generates a
-- business case, and real finance / delivery / sourcing / domain experts mark
-- a verdict on it. Each verdict is one APPEND-ONLY row here. The calibration
-- engine (`src/lib/programs/expert-kernel/expert-review-calibration.ts`) reads
-- the accumulated rows for a Move and computes the accept / conditional /
-- not-ready verdict the console surfaces.
--
-- Design notes:
--
-- 1. One row per expert review. A review is immutable: a reviewer who
--    changes their mind submits a NEW row. The console reads the full
--    history, so the calibration is always reproducible from the rows.
--
-- 2. Tenant-scoped RLS from the start. RLS is ENABLEd with a tenant-scoped
--    read policy via the canonical `can_read_tenant_by_key` helper (see
--    20260507100000_rls_role_helpers.sql). Writes happen only through
--    application code on the service role; there is no public- or
--    authenticated-role insert path. Mirrors 20260517100000_sourcing_work_items.sql.
--
-- 3. `assumption_keys` and `required_actions` are TEXT[] — the stable
--    assumption keys the review touches (threaded back into the assumption
--    ledger by the console) and the fixes required before promotion.
--
-- 4. Additive only — a new table; it touches no existing table or contract.
--
-- The founder applies this via `npm run db:migrate`; it is authored,
-- NOT applied, in this slice.

BEGIN;

CREATE TABLE IF NOT EXISTS expert_reviews (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Tenant scope — drives RLS. Canonical client key, e.g. 'apex-retail'.
  tenant_client_key   TEXT NOT NULL,
  client_id           UUID REFERENCES clients(id) ON DELETE CASCADE,

  -- The Move the reviewed business case belongs to. `move_ref` is a stable
  -- opaque ref (e.g. 'apex:move:contact-center-ai-routing'); `move_name` is
  -- the human label carried for audit display.
  move_ref            TEXT NOT NULL,
  move_name           TEXT NOT NULL,

  -- The reviewer identity and the expert lens they review under.
  reviewer_id         TEXT NOT NULL,
  reviewer_role       TEXT NOT NULL
    CHECK (reviewer_role IN (
      'cfo',
      'transformation_partner',
      'sourcing_vp',
      'delivery_lead',
      'domain_operator',
      'risk_compliance'
    )),

  -- The verdict. `credible_with_conditions` is the spec's "needs data" rung.
  verdict             TEXT NOT NULL
    CHECK (verdict IN (
      'credible',
      'credible_with_conditions',
      'weak',
      'wrong'
    )),

  -- The written rationale — required; the calibration engine flags an empty
  -- note as a condition-severity finding.
  note                TEXT NOT NULL,

  -- The stable assumption keys this review touches (threaded back into the
  -- assumption ledger by the console) and the fixes required before promotion.
  assumption_keys     TEXT[] NOT NULL DEFAULT '{}',
  required_actions    TEXT[] NOT NULL DEFAULT '{}',

  -- Provenance. Append-only — rows are never UPDATEd.
  created_by          TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tenant + Move scoped reads, newest first — the console's primary query.
CREATE INDEX IF NOT EXISTS idx_expert_reviews_move
  ON expert_reviews (tenant_client_key, move_ref, created_at DESC);

COMMENT ON TABLE expert_reviews IS
  'Append-only expert reviews of Moves Expert Kernel business cases. One row per reviewer verdict; the calibration engine reads the accumulated rows for a Move to compute the accept/conditional/not-ready verdict. Tenant-scoped RLS via can_read_tenant_by_key. See src/lib/programs/expert-kernel/expert-review-console.ts and the Expert Review Console route.';

COMMENT ON COLUMN expert_reviews.assumption_keys IS
  'Stable assumption-ledger keys this review touches — the console attaches the review note to those assumptions.';

-- RLS: read scoped by tenant via the canonical helper. Service-role performs
-- the writes from application code (no public- or authenticated-role insert
-- path). Pattern mirrors 20260517100000_sourcing_work_items.sql.
ALTER TABLE expert_reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS svc_all ON expert_reviews;
CREATE POLICY svc_all ON expert_reviews
  FOR ALL TO service_role
  USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS auth_read ON expert_reviews;
CREATE POLICY auth_read ON expert_reviews
  FOR SELECT TO authenticated
  USING (can_read_tenant_by_key(tenant_client_key));

GRANT SELECT ON expert_reviews TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
