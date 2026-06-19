# 2026-06-19-deliverable-reaping-and-xlsx-constraint — Fix queued-run reaping + allow xlsx deliverables to persist

## Release ID

`2026-06-19-deliverable-reaping-and-xlsx-constraint`

## Status

`candidate`

## Plain-English Summary

Two real bugs surfaced by running a full P1→P5 deliverable arc on First Capital (move
`b359859f`), where 12+ deliverables were enqueued at once and read back:

1. **Queued runs were being reaped as "failed."** `sweepStaleDeliverableRuns` failed *any*
   run (queued OR running) whose `updated_at` was older than the 15-minute deadline. With a
   single serial worker (batch 5, one execution at a time), a backlog of >5 deliverables
   legitimately sits *queued* longer than 15 minutes waiting its turn — and the next worker
   invocation's startup sweep marked that healthy pending work `failed: reclaimed`. Fix:
   split the predicate — **running** runs keep the 15-minute heartbeat deadline (worker died
   mid-run), **queued** runs are only reclaimed at a much longer abandonment bound (default
   6h), since a queued run is waiting for a worker, not stuck.

2. **xlsx deliverables could never persist.** The `financial_model` deliverable
   (`estimate_model`) renders as an Excel workbook — its prescribed primary format. But the
   `generated_artifacts.output_format` CHECK constraint only allowed `pptx/pdf/html/docx`, so
   every xlsx insert failed: `violates check constraint
   "generated_artifacts_output_format_check"`. The financial model was generated but never
   committed. (The app type layer — `GeneratedArtifactFormat`, `OutputFormat` — has always
   included `xlsx`; only the DB constraint lagged.) Fix: a migration widening the constraint
   to include `xlsx`.

## Layer Impact

- **`global-control-lane`** — shared deliverable worker reaping logic (`runs-repository.ts`)
  and the shared `generated_artifacts` table constraint. The migration is additive (widens a
  CHECK); no data change, no row rewrite.

## Client Applicability

- All clients: **Yes** — shared worker + shared schema. No feature flag.
- Specific clients: No. Internal only: No. Public/demo only: No. Feature flag: None.

## Changes Included

- `src/lib/deliverables/orchestrator/runs-repository.ts` — `sweepStaleDeliverableRuns` splits
  the reap predicate: `running` on `deadlineMinutes` (15), `queued` on `queuedDeadlineMinutes`
  (default 360). New `queuedDeadlineMinutes` option.
- `src/lib/deliverables/orchestrator/__tests__/runs-repository.test.ts` — asserts the split
  predicate (running uses $1, queued uses $2, params `['15','360']`) + a custom-override test.
- `supabase/migrations/20260619000000_generated_artifacts_allow_xlsx.sql` — drops and re-adds
  `generated_artifacts_output_format_check` to include `'xlsx'`.

## QA / Validation

- **PASS** — `jest` runs-repository suite (13 tests) green, including the new split-predicate
  assertions. `tsc --noEmit` clean on the changed file.
- **PASS (live, applied)** — migration applied to the live private control DB via the VNet
  migrate job; constraint definition re-read to confirm `'xlsx'` is now permitted. *(execution
  id + verified constraint def recorded on apply.)*
- **PASS (live, end-to-end)** — after the migration, the `financial_model` (xlsx) deliverable
  was regenerated on move `b359859f` and **persisted** (artifact committed + downloadable),
  where it previously failed the insert. *(run id recorded on regen.)*
- Context: the same arc confirmed all docx deliverables (charter, discovery, root-cause,
  target-state architecture, solution design, operating model, sourcing, business case,
  execution roadmap, handoff, value model) generate at board grade (11k–16k words, 22–33
  tables, 369–453 citations each).

## Rollout Plan

Merge → `aca-main-deploy` (web image carries the worker fix; `run-migrations.ts` picks up the
new migration on the next migrate run). The live private DB is migrated out-of-band via the
VNet migrate job (above) so the fix is effective immediately, not only on next deploy.

## Rollback Plan

- Worker fix: revert the PR — `sweepStaleDeliverableRuns` returns to the single-deadline form.
- Migration: the constraint widening is additive; to revert, drop and re-add the constraint
  without `'xlsx'` (only safe once no xlsx rows exist). No data written by this change.

## Audit Evidence

- PR URL (added on open); CI run.
- VNet migrate job execution id + the re-read `pg_get_constraintdef` output (apply proof).
- Regenerated `financial_model` run id + artifact id (persist proof).

## Known Gaps

- The "artifact produced but run marked failed" orphan case observed during the bulk arc run
  was partly collateral from a concurrent out-of-band web deploy (a stale `home-intelligence-
  routes` revision was manually shifted to 100% traffic mid-run, then reverted). The queued-
  reap fix removes the main code cause; making artifact-commit and run-completion fully atomic
  (so a killed worker never leaves an artifact with a non-succeeded run) is a deeper follow-up.
- Worker throughput stays at one execution (batch 5) — fine for normal one-phase "Approve &
  Build" (≤4 deliverables), but a >5 simultaneous backlog still drains serially. Parallelism
  was intentionally not changed here to keep the fix scoped.
