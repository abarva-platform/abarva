# Source Execution Room Persistence

Date: 2026-05-17 · Status: **as-built** (converged onto `sourcing_work_items`)

## Purpose

The first Execution Room release (PR #2127) was a deterministic operating view
built from the Renewal Cockpit. It shipped honest: actions that were not
persisted were labelled as pending. The original draft of this document
proposed three new tables — `source_execution_actions`,
`source_execution_approvals`, `source_execution_audit` — as the persistence
layer.

Those tables were **never built**. In parallel, PR #2125 shipped
`sourcing_work_items`: a real, RLS-protected persistence layer with an owner, a
due date, a status, off-system legal/procurement workflow state, and
created/updated audit fields on every row. That table IS the Execution Room's
persistence layer. Shipping a second, parallel `source_execution_*` model would
have been a duplicate-persistence risk.

This document is now **as-built**: `sourcing_work_items` is the single
persistence backbone of the Source Execution Room. The proposed
`source_execution_*` tables are superseded and will not be created.

## The persistence backbone — `sourcing_work_items`

One table, one model. See `supabase/migrations/20260517100000_sourcing_work_items.sql`
and `src/lib/source/work-items/`. RLS is ENABLEd; reads are tenant-scoped via
`can_read_tenant_by_key`; writes happen on the service role from application
code (no public-role insert path).

The Execution Room's persisted concepts map onto its columns:

| Execution Room concept | `sourcing_work_items` representation |
|---|---|
| Action workplan item (`ExecutionAction`) | row with `kind = 'workplan_item'` |
| Stakeholder approval (`ExecutionApproval`) | row with `kind = 'stakeholder_approval'` |
| Serve notice | a `workplan_item` row whose `metadata.subKind = 'serve_notice'`; `legal_status` / `procurement_status` carry the off-system hand-off |
| Owner assignment | the `owner` column on the relevant `workplan_item` row (and the cockpit-bar `owner_assignment` rows) |
| Which room slot a row is | `metadata.subKind` — an `ExecutionActionKind` for a `workplan_item`, an `ExecutionApprovalRole` for a `stakeholder_approval` |
| Owner | `owner` (name or email; null until named) |
| Due date / SLA | `due_date` |
| Status | `status` (`open` / `in_progress` / `done` / `cancelled`) |
| Audit trail | `created_by` / `created_at` / `updated_by` / `updated_at` on every row — this is the execution audit log; no separate audit table is needed |
| Subject | `subject_kind = 'contract'`, `subject_ref = <contract id>` |

### Additive kinds (migration 20260517210000)

`sourcing_work_items` originally allowed three `kind` values
(`serve_notice`, `owner_assignment`, `tower_watch`). The convergence adds two,
additively, via `20260517210000_work_items_execution_room_kinds.sql` — a
single widened `kind` CHECK constraint, no column/index/RLS change:

- `workplan_item` — one per Execution Room action workplan row.
- `stakeholder_approval` — one per finance / legal / security / business
  sponsor / IT approval row.

No new field was needed: the room-specific slot id rides in the existing
`metadata` JSONB column under `metadata.subKind`.

## How the Execution Room uses it

`src/lib/source/execution-room/`:

- `execution-room.ts` — the pure deterministic composer (unchanged). It never
  persists; unknown owners stay `"not recorded"`.
- `persistence.ts` — the convergence seam. `reconcileExecutionRoom(room, items)`
  overlays the persisted owner / due date / status from `workplan_item` and
  `stakeholder_approval` rows onto the composer baseline, matched by
  `metadata.subKind`. `workplanItemPayload` / `stakeholderApprovalPayload`
  build the work-item write payloads.
- `load.ts` — `loadExecutionRoom(cockpit)` builds the room, reads the
  contract's work items through the work-item service, and reconciles.
  Fail-soft: a missing table degrades to the deterministic room.

The route (`/source/renewal/[contractId]/execution`) calls `loadExecutionRoom`.

## Notice workflow

1. **Serve notice** persists a `workplan_item` row with
   `metadata.subKind = 'serve_notice'`, owned by legal/procurement ops, with
   `due_date` equal to the notice deadline.
2. `legal_status` / `procurement_status` track the off-system hand-off; AbarVa
   never issues the formal legal notice itself.
3. The product must not say "notice served" until the row's `legal_status`
   reaches `served` and an authorized user advances `status` to `done`.
4. The `updated_by` / `updated_at` audit fields record who completed it.

## Owner workflow

1. Assigning an owner writes the `owner` column on the relevant `workplan_item`
   row (the cockpit action bar also writes `owner_assignment` rows).
2. `reconcileExecutionRoom` surfaces the freshest persisted owner as the room's
   `accountableOwner`; `"not recorded"` remains the fallback.
3. Decision Queue cards already project owner + SLA from the same rows via
   `accountabilityFor`.

## Final decision and outcome

The final-decision action persists as a `workplan_item`
(`metadata.subKind = 'final_decision'`). Realized outcomes link to the Tower
outcome ledger (`20260516180000_outcome_ledger.sql`) — posture, committed
spend, avoided spend, risk retired, measurement date, evidence refs. Only
realized outcomes feed the Context layer and the anonymized pattern-feedback
path.

## Non-operational claims to avoid

The room still must not claim, until a persisted row says so:

- notice has been legally served (until `legal_status = 'served'`);
- finance/legal/security approvals are complete (until the
  `stakeholder_approval` row's `status = 'done'`);
- vendor email was sent — AbarVa drafts, it does not send.

The Execution Room labels un-persisted slots as pending; once a work item is
recorded, the slot shows the durable owner / SLA / status.
