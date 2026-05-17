-- SOURCING WORK ITEMS · Source action-layer persistence
--
-- The design-partner IT sourcing VP usability-tested the Source console
-- twice. Iteration 1 reached 4/5. The single 5/5 blocker, verbatim:
--   "I would not rely on it as my operating system until the action layer
--    persists notice, owner, and task status."
--
-- Iteration 1 shipped the Renewal Cockpit action bar with three HONEST
-- pending stubs — Serve notice, Assign owner, Create Tower watch item —
-- that recorded local intent but never persisted. This table makes them
-- real.
--
-- Design notes:
--
-- 1. ONE work-item model, wired everywhere. Serve notice, owner assignment,
--    Tower watch, and "owner + SLA on Decision Queue cards" all need the
--    same thing: a persisted sourcing work item with an owner, a due date,
--    and a status. `kind` discriminates the three flavors; the queue-card
--    owner/SLA read is just a projection over the same rows.
--
-- 2. The work item attaches to a subject — a contract, a source event, or
--    a vendor — identified by `subject_kind` + `subject_ref`. `subject_ref`
--    is TEXT so the work item can point at a Renewal Cockpit contract id, a
--    source_events id, or a vendor key without a hard FK into a
--    module-owned table. This keeps the table additive and decoupled.
--
-- 3. Audit fields on every row: created_at / created_by / updated_at /
--    updated_by. The action bar writes carry the acting user, so a VP — and
--    an auditor — can see who served notice, who assigned the owner, and
--    when. `legal_status` / `procurement_status` carry the off-system
--    workflow state for a serve-notice item (AbarVa never issues the formal
--    legal notice itself).
--
-- 4. Tenant-scoped from the start. RLS is ENABLEd with a tenant-scoped read
--    policy via the existing `can_read_tenant_by_key` helper
--    (see 20260507100000_rls_role_helpers.sql). Writes happen through
--    application code on the service role; there is no public-role insert
--    path. This is NOT a new RLS-gap table. Pattern mirrors
--    20260516180000_outcome_ledger.sql.
--
-- 5. The `tower_watch` rows are deliberately readable by Tower: a
--    tenant-scoped SELECT plus a `(tenant_client_key, kind)` index lets the
--    Tower portfolio surface these renewals without a Tower-specific table.
--
-- 6. Additive only — extends the Source substrate without touching
--    vendor_contracts, source_events, or any existing table.
--
-- The founder applies this via `npm run db:migrate`; it is authored,
-- NOT applied, in this slice.

BEGIN;

CREATE TABLE IF NOT EXISTS sourcing_work_items (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Tenant scope. `tenant_client_key` is the canonical short slug
  -- ('apexretail', 'meridian', ...) matching the JWT tenant_key claim.
  tenant_client_key     TEXT NOT NULL,

  -- The thing this work item is attached to. `subject_ref` is stored as
  -- TEXT so it can reference a contract id, a source event id, or a vendor
  -- key without a hard FK to a module-owned table (keeps the table
  -- additive and decoupled). `subject_label` is the human-readable name
  -- ("Adobe — Creative Cloud") so reads do not need a join to render.
  subject_kind          TEXT NOT NULL
    CHECK (subject_kind IN ('contract', 'source_event', 'vendor')),
  subject_ref           TEXT NOT NULL,
  subject_label         TEXT NOT NULL DEFAULT '',

  -- The work-item flavor. The three kinds correspond to the three Renewal
  -- Cockpit action-bar actions made real by this slice.
  kind                  TEXT NOT NULL
    CHECK (kind IN ('serve_notice', 'owner_assignment', 'tower_watch')),

  -- A short title for the work item, surfaced on cards and in Tower.
  title                 TEXT NOT NULL DEFAULT '',

  -- Accountability. `owner` is a name or email; nullable because a
  -- serve-notice or watch item can exist before an owner is named.
  owner                 TEXT,

  -- SLA. `due_date` is the date the work must complete by (the notice
  -- deadline for a serve-notice item; a review-by date for a watch item).
  due_date              DATE,

  -- Lifecycle status.
  status                TEXT NOT NULL DEFAULT 'open'
    CHECK (status IN ('open', 'in_progress', 'done', 'cancelled')),

  -- Off-system workflow state, relevant for serve-notice items only.
  -- AbarVa cannot issue the formal legal notice itself; these track the
  -- hand-off to legal / procurement ops. NULL for non-notice kinds.
  legal_status          TEXT
    CHECK (legal_status IN ('not_started', 'drafting', 'in_review', 'served', 'not_applicable')),
  procurement_status    TEXT
    CHECK (procurement_status IN ('not_started', 'in_progress', 'completed', 'not_applicable')),

  -- Free-text note carried from the action panel.
  note                  TEXT,
  metadata              JSONB NOT NULL DEFAULT '{}'::jsonb,

  -- Provenance / audit timestamps.
  created_by            TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by            TEXT,
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Subject lookup: every work item for one contract / source event / vendor.
-- Backs the owner + SLA read the Decision Queue cards project.
CREATE INDEX IF NOT EXISTS idx_sourcing_work_items_subject
  ON sourcing_work_items (tenant_client_key, subject_kind, subject_ref);

-- Kind lookup: backs the Tower read of `tower_watch` items per tenant.
CREATE INDEX IF NOT EXISTS idx_sourcing_work_items_kind
  ON sourcing_work_items (tenant_client_key, kind, status);

-- SLA / open-work read: open or in-progress items soonest-due first.
CREATE INDEX IF NOT EXISTS idx_sourcing_work_items_due
  ON sourcing_work_items (tenant_client_key, due_date)
  WHERE status IN ('open', 'in_progress');

COMMENT ON TABLE sourcing_work_items IS
  'Persisted sourcing work items — serve-notice, owner-assignment, and Tower-watch tasks created from the Renewal Cockpit action bar. One model wired across the cockpit actions and the Decision Queue owner/SLA card read. Each row carries an owner, a due date (SLA), a lifecycle status, optional legal/procurement workflow state, and created/updated audit fields. tower_watch rows are tenant-readable so the Tower portfolio can surface them. See src/lib/source/work-items/ and supabase/migrations/20260507100000_rls_role_helpers.sql.';

-- RLS: read scoped by tenant via the canonical helper. Service-role
-- performs the writes from application code (no public-role insert
-- path). Pattern mirrors 20260516180000_outcome_ledger.sql.
ALTER TABLE sourcing_work_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS svc_all ON sourcing_work_items;
CREATE POLICY svc_all ON sourcing_work_items
  FOR ALL TO service_role
  USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS auth_read ON sourcing_work_items;
CREATE POLICY auth_read ON sourcing_work_items
  FOR SELECT TO authenticated
  USING (can_read_tenant_by_key(tenant_client_key));

GRANT SELECT ON sourcing_work_items TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
