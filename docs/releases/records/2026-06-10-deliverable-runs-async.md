# 2026-06-10-deliverable-runs-async — Async board-grade deliverable generation

## Release ID

`2026-06-10-deliverable-runs-async`

## Status

`candidate`

## Plain-English Summary

Board-grade deliverable generation is a six-pass Claude flow that takes ~5–10 minutes —
too long for a single HTTP request (it would time out at the gateway). This converts the
`/api/v1/deliverables/generate` route to an async pattern: it creates a run row, starts
the generation in the persistent app process, and returns a run id immediately; the UI
polls `GET /api/v1/deliverables/runs/{id}` until the run is done and then shows the
artifact (succeeded), the quality-gate blockers (blocked), or an error (failed). Run state
lives in a new `deliverable_runs` table because the app runs up to 2 replicas, so a poll
may land on a different replica than the one that started the run.

## Layer Impact

- `client-data-lane`: new control-plane table `deliverable_runs` (migration
  `20260610193000_deliverable_runs.sql`) with RLS (service_role all; authenticated read
  scoped by `tenant_key`).
- `global-control-lane`: `POST /deliverables/generate` now returns `202 {runId}` and runs
  generation in the background; new `GET /deliverables/runs/{runId}` poll route; runs
  repository; the UI action polls to completion.

## Client Applicability

- All clients: yes — the in-product "Generate board-grade deliverable" action now works
  for long runs without timing out. Runs are tenant-scoped (client_id + tenant_key).

## Changes Included

- `supabase/migrations/20260610193000_deliverable_runs.sql`
- `src/lib/deliverables/orchestrator/runs-repository.ts` (+ barrel export)
- `src/app/api/v1/deliverables/generate/route.ts` (async: create run + fire-and-forget + 202)
- `src/app/api/v1/deliverables/runs/[runId]/route.ts` (poll)
- `src/components/deliverables/GenerateDeliverableButton.tsx` (poll-to-completion UI)
- Tests: `runs-repository.test.ts`, `generate/__tests__/route.test.ts` (async), `runs/[runId]/__tests__/route.test.ts` (53 total in scope).

## QA / Validation

- `jest src/lib/deliverables/orchestrator src/app/api/v1/deliverables` → 53/53 pass.
- `tsc --noEmit` clean (scoped) · `eslint` clean · `release:check` pass · `audit:architecture-rules` 0 violations.

## Rollout Plan

Squash-merge to main → apply the migration to the control DB (migrate job inside the VNet)
→ rebuild web image from main → roll `ca-abarva-web-lab-eastus` to a new revision → shift
100% traffic. The route degrades safely if the table is missing (run creation throws → 500
on POST), so the migration must be applied before/with the image roll.

## Rollback Plan

Revert the PR (restores the synchronous route). The `deliverable_runs` table can remain
(harmless) or be dropped. Container-app traffic can be shifted back to the prior revision.

## Known Gaps

- Fire-and-forget runs in the replica that handled the POST; if that replica is recycled
  mid-run the run can be orphaned in `running`. The 15-minute client-side poll cap surfaces
  this; a queue+worker (Service Bus) and a stuck-run sweeper are the fully-durable
  follow-up.
- No realtime per-pass progress yet (the UI shows elapsed time, not the current pass).

## Audit Evidence

Tests above; this record; migration file.
