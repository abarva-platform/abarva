-- SOURCING WORK ITEMS · Execution Room convergence
--
-- The Source Execution Room (PR #2127) shipped with a *designed* persistence
-- model (docs/architecture/source/SOURCING_EXECUTION_ROOM_PERSISTENCE.md):
-- three proposed tables for execution actions, approvals, and an audit log.
-- That design was never built — and `sourcing_work_items` (migration
-- 20260517100000) is the persistence layer that DOES exist, with an owner,
-- a due date, a status, legal/procurement workflow state, and created/updated
-- audit fields on every row.
--
-- Rather than ship a parallel set of `source_execution_*` tables, the
-- Execution Room converges onto `sourcing_work_items` as its single
-- persistence backbone. Its action workplan persists as `workplan_item`
-- rows and its finance / legal / security / sponsor / IT approvals persist
-- as `stakeholder_approval` rows. The room-specific slot id (the
-- `ExecutionActionKind` or `ExecutionApprovalRole`) rides in `metadata.subKind`
-- — the existing `metadata` JSONB column needs no schema change.
--
-- This migration is ADDITIVE and minimal: it widens the `kind` CHECK
-- constraint to admit the two new work-item flavors. It does not touch any
-- column, index, RLS policy, or grant — RLS is already ENABLEd on the table
-- (see 20260517100000) and the tenant-scoped read policy / service-role
-- write path are unchanged.
--
-- The founder applies this via `npm run db:migrate`; it is authored,
-- NOT applied, in this slice.

BEGIN;

-- Widen `kind` to admit the Execution Room work-item flavors. The constraint
-- is dropped and recreated (idempotent: IF EXISTS) so re-running the
-- migration is safe. No existing row is invalidated — every prior `kind`
-- value remains in the new allow-list.
ALTER TABLE sourcing_work_items
  DROP CONSTRAINT IF EXISTS sourcing_work_items_kind_check;

ALTER TABLE sourcing_work_items
  ADD CONSTRAINT sourcing_work_items_kind_check
  CHECK (kind IN (
    'serve_notice',
    'owner_assignment',
    'tower_watch',
    'workplan_item',
    'stakeholder_approval'
  ));

COMMENT ON COLUMN sourcing_work_items.kind IS
  'Work-item flavor. serve_notice / owner_assignment / tower_watch back the Renewal Cockpit action bar; workplan_item / stakeholder_approval back the Source Execution Room (its action workplan and stakeholder approvals). The Execution Room slot id rides in metadata.subKind. See src/lib/source/work-items/ and src/lib/source/execution-room/.';

NOTIFY pgrst, 'reload schema';

COMMIT;
