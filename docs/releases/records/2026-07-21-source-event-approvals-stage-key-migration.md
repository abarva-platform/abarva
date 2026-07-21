# 2026-07-21-source-event-approvals-stage-key-migration — add stage_key to source_event_approvals

## Release ID

`2026-07-21-source-event-approvals-stage-key-migration`

## Status

`candidate` — migration file merging now; apply run through the governed lane
(`db-migration-lab.yml`) to follow in this same record.

## Plain-English Summary

Building SOURCE-SHELL-003 (a per-event Approvals ledger showing all 11 stages with real
approver/timestamp) surfaced a real gap: `source_event_approvals` never recorded which of the
11 canonical stages an approval was for — only the lifecycle-state transition
(`waiting_on_client` → `active`, etc). This adds a nullable `stage_key` column, populated by
the write path going forward. Historical rows are left `NULL` — deliberately not backfilled by
inference (ordering + notes-text heuristics would misattribute rows across send-backs/
rejections, which the approve API already supports). The application code that reads and
writes this column ships as a separate PR, after this migration is confirmed applied — schema
and the code that depends on it are two separately-authorized actions, per this lane's own
design.

## Layer Impact

- `client-data-lane`: one additive, nullable column + one index on
  `source_event_approvals`. No data migration, no backfill, no constraint changes to existing
  columns.

## Client Applicability

- All clients: yes — shared schema, no per-tenant gate.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `supabase/migrations/20260721142419_source_event_approvals_stage_key.sql`: `ALTER TABLE
source_event_approvals ADD COLUMN IF NOT EXISTS stage_key TEXT;` + a supporting index
  `(event_id, stage_key)`.
- This release record.

## QA / Validation

- `pass` — migration is purely additive (nullable column, no default, no rewrite of existing
  rows) — on modern Postgres this is a fast, metadata-only `ALTER TABLE`, not a full table
  rewrite.
- `not-run` — governed migration lane `status` (preflight) run, then `apply` run with real
  evidence, to be recorded here once dispatched.

## Rollout Plan

1. Merge this migration-only PR to `main`.
2. Dispatch `db-migration-lab.yml` in `status` mode first (read-only preflight) to confirm the
   pending migration is detected correctly.
3. Dispatch in `apply` mode with `confirm: APPLY` to apply it for real.
4. Only after the apply run's evidence confirms success: merge the separate application-code
   PR (write path + read path + UI) that depends on this column.

## Deployment Authority

- Repo-owned deploy workflow: N/A — this is a database migration, not an application deploy.
  Governed separately by `.github/workflows/db-migration-lab.yml`, dispatched manually per
  this lane's own design (never auto-run on merge).
- Shared runtime mutators: the migration lane itself, scoped to the lab/shared Azure Postgres
  instance behind `ca-abarva-web-lab-eastus` — the same database the deployed product reads
  from.
- Approved image digest: N/A.
- ACA runtime invariant: N/A — no application code in this PR.
- Worker image invariant: N/A.
- Feature/env flag update path: none.
- Live signed-in proof required: N/A for the migration itself; the application code PR that
  follows will need its own.

## Rollback Plan

`ALTER TABLE source_event_approvals DROP COLUMN IF EXISTS stage_key;` — safe, since no
application code depends on the column until the follow-up PR merges and deploys, and the
column carries no constraint that other data could depend on.

## Audit Evidence

- PR: to be added once opened.
- Migration lane run (status + apply): to be added once dispatched.

## Known Gaps

- Historical `source_event_approvals` rows (written before this column existed) will have
  `stage_key = NULL` permanently — not backfilled, by design (see Plain-English Summary). The
  application-code PR's ledger UI shows this honestly ("approver not recorded for this stage")
  rather than guessing.
