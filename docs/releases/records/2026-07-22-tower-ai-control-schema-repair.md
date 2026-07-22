# 2026-07-22-tower-ai-control-schema-repair — Repair ai_control substrate schema drift

## Release ID

`2026-07-22-tower-ai-control-schema-repair`

## Status

`candidate`

## Plain-English Summary

While running the governed Tower mart write job for Meridian, a real schema-drift issue was found on the live control Postgres. The job reached the correct database (the same `DATABASE_URL`/`azure-postgres-control-database-url` secret the web app reads `cio_tower.mart_*` from — confirmed a single Postgres, no separate data-plane DB), resolved Meridian's `client_id`, and produced the full, correct mart in memory — then failed at its first persistence step with `relation "ai_control_refresh_runs" does not exist`.

Diagnosis: the migration ledger (`schema_migrations`) records `20260616170000_ai_control_tower_substrate` as applied, but its tables are absent. `db:migrate --dry` therefore reports no pending migrations, so the runner will never re-execute the original. This is ledger↔schema drift — most likely the original was `mark-applied` without its DDL running, or the tables were later dropped.

**No Tower mart data was changed.** The write is transactional and records the run in `ai_control_refresh_runs` before opening the mart transaction, so the failure occurred before any `cio_tower` write. The live Tower page was verified unchanged after two fail-safe attempts ($650.0M / $487.5M / $162.5M / $53.7M / $3.8M / $0).

This PR repairs the drift the governed way, without touching the Tower writer or the ledger by hand:

1. A **new** migration (`20260722220000_ai_control_substrate_drift_repair.sql`) with a fresh ledger id, so the runner picks it up as pending and applies it. It re-declares the ai_control substrate using the **same fully idempotent DDL** as the original (types guarded by `EXCEPTION WHEN duplicate_object`, `CREATE TABLE/INDEX IF NOT EXISTS`, `CREATE OR REPLACE VIEW`, `DROP POLICY IF EXISTS` then `CREATE POLICY`). On a healthy DB it is a no-op; on the drifted DB it creates the missing objects. It writes no tenant/mart data.
2. A **schema-drift audit** (`npm run audit:ai-control-schema-drift`) that verifies every required ai_control table with `to_regclass()` and exits non-zero with a clear message when the ledger claims the original is applied but tables are missing — so this class of drift is caught at a checkpoint, not mid-write.

The Tower mart writer is deliberately **not** changed: it remains a data writer, stays fail-closed if `ai_control_refresh_runs` is missing, and does not carry schema-repair DDL. Populating `cio_tower.facts` / `cio_tower.mart_*` remains a separate governed ACA data-build job, run only after this repair merges + deploys.

## Layer Impact

- `client-data-lane`: `supabase/migrations/20260722220000_ai_control_substrate_drift_repair.sql` — idempotent DDL that ensures the ai_control substrate exists. Additive; creates no rows.
- `internal-admin` lane: `src/scripts/audit-ai-control-schema-drift.ts` + `package.json` — read-only drift audit tooling.

## Client Applicability

- All clients: the substrate is client-generic; the repair benefits any tenant whose governed AI-control/Tower writes need the substrate.
- Feature flag: none.

## Changes Included

- `supabase/migrations/20260722220000_ai_control_substrate_drift_repair.sql` — idempotent repair migration (verbatim idempotent DDL from `20260616170000`).
- `src/scripts/audit-ai-control-schema-drift.ts` + `package.json` `audit:ai-control-schema-drift` — read-only `to_regclass()` drift check.

## QA / Validation

- Pass: `tsc --noEmit` — zero errors in the new audit script.
- Pass: migration SQL sanity — balanced `BEGIN;`/`COMMIT;`, all required tables (`ai_control_refresh_runs`, `_sources`, `_initiatives`, `_tool_usage_monthly`, `_persona_productivity`, `_dora_metrics`, `_agent_outcomes`, and the rest of the substrate) present with `CREATE TABLE IF NOT EXISTS`.
- Not run here: live migration apply + audit against Azure Postgres (VNet/operator only). After merge + deploy, the audit + `db:migrate` run via the governed ACA job.

## Rollout Plan

Merge via squash to `main`; aca-main-deploy builds the image and applies pending migrations (including this repair) via the governed migration path. Then, as a separate operator step, run `audit:ai-control-schema-drift` (read-only, expect PASS), then re-run the governed Tower mart write job for Meridian.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` (existing, unmodified).
- Shared runtime mutators: none. The migration is additive idempotent DDL; no traffic/revision/template change.
- ACA runtime invariant: unaffected.
- Live signed-in proof required: after the subsequent Tower mart write job runs and DB volumetrics are captured — not by this PR.

## Rollback Plan

Revert the PR. The repair migration only creates objects `IF NOT EXISTS`; reverting the file does not drop anything already created. The audit script is read-only tooling.

## Audit Evidence

- Job logs from the two fail-safe write attempts: `relation "ai_control_refresh_runs" does not exist`, before any mart write.
- `db:migrate --dry` (governed job) output: "No pending migrations."
- Live Tower page verified unchanged after the attempts.
- PR URL: pending.

## Known Gaps

- The unified Tower mart write is still not live-proven — that is the next operator step, gated on this repair's deploy.
- Real `tower_*` telemetry remains un-ingested for all tenants (usage/adoption stays gap-only).
