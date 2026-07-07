# 2026-07-07-source-analytics-live-proof-script — headless engine proof for Source value-analytics

## Release ID

`2026-07-07-source-analytics-live-proof-script`

## Status

`candidate`

## Plain-English Summary

Adds `src/scripts/prove-source-analytics.ts`, an ops/proof script that demonstrates the Source
value-analytics engine end-to-end **without a Clerk session** (the product routes are Clerk-gated,
so they can't be driven from a job). It is a diagnostic, not a runtime path — nothing imports it.

- **PART A · engine** — builds an `EventFactMap` from a realistic Lakeshore AMS fact set, runs
  `evaluateValueLevers(AMS_MANAGED_SERVICES, …)` + `buildValueWaterfall`, and prints the value-type
  waterfall (per-lever ranges + the per-type roll-up). No DB.
- **PART B · persistence** — when a Lakeshore `source_events` row exists, inserts the cited facts
  into `source_event_facts` (real table, `source_method='parsed'`, tagged `proof_tag`), reads them
  back via SQL, rebuilds the map, re-runs the engine, then deletes its tagged rows (idempotent).
  Confirms the migration (`to_regclass`) and the write/read path against the real Azure data plane.
- **PART C · honesty** — drops a `citationRequired` input and asserts the lever abstains
  (`insufficientEvidence`, missing keys named), never a fabricated number.

Verified locally (PART A + C) against `origin/main`: the engine computes a real bridge —
incremental_negotiated $15.9M–$22.8M · solution_tightening $3.5M–$5.0M · protected $12.4M–$17.7M ·
risk_adjusted $14.0M–$20.0M — with protected/risk stated separately (no headline sum). PART B runs
in the VNet (localhost cannot reach the private Postgres).

## Layer Impact

- `internal-admin` lane: a diagnostic script under `src/scripts/`. Not imported by any runtime
  path; no behavior change for any tenant. Run manually via the ACA VNet job path.

## Client Applicability

- Internal only — the script is a manual diagnostic, run by an operator in the VNet. It reads/writes
  `source_event_facts` only when explicitly invoked and cleans up its own tagged rows; no client
  receives any change.

## Changes Included

- `src/scripts/prove-source-analytics.ts`.

## QA / Validation

- `npx tsc --noEmit` (8 GB heap) → 0 errors. `npx eslint` → clean.
- Ran PART A + PART C locally against `origin/main`: realistic computed waterfall + honest
  insufficient-evidence abstention. **pass.**
- PART B: exercised in the VNet via the db-migrate/one-off job path (localhost can't reach the
  private DB). Writes then deletes its own `proof_tag` rows.

## Rollout Plan

Merge to `main` via PR + squash. It ships in the web image (like `run-migrations.ts`) so it can be
invoked as an ACA VNet job. No runtime wiring.

## Deployment Authority

- Ships in the repo-owned web image; run via an ACA job in the private VNet.
- NOTE: the shared `job-abarva-db-migrate-lab-eastus` is raced by a concurrent process that resets
  its image/args — prefer a dedicated one-off job (or verify the execution logs) when running this.

## Rollback Plan

Revert the PR. The script is unreferenced; removing it has no runtime effect. PART B only ever
touches rows it tags and deletes.

## Audit Evidence

- PR URL (added on open). Local PART A/C output captured in the session.

## Known Gaps

- PART B's round-trip needs a Lakeshore `source_events` row (FK); if none exists it confirms the
  table + schema and skips the insert (honest).
