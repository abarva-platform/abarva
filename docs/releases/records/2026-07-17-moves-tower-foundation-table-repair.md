# 2026-07-17-moves-tower-foundation-table-repair — Moves Structured Evidence Table Repair

## Release ID

`2026-07-17-moves-tower-foundation-table-repair`

## Status

`candidate`

## Plain-English Summary

Moves P1 current-state readiness needs structured evidence for the systems landscape and organization structure. Live Azure/Postgres reported the historical Tower CMDB/workforce migrations as already applied, but the physical tables were missing, so structured CSV uploads parsed successfully and then failed at commit time. This release adds an idempotent repair migration that creates the missing Tower foundation tables when absent.

## Layer Impact

- `client-data-lane`: Adds missing physical Azure/Postgres tables used by Moves current-state evidence readiness and Tower context. The migration is additive and tenant-scoped by `client_id`.
- `global-control-lane`: No runtime UX or workflow code changes are included.

## Client Applicability

- All clients: Any tenant whose Moves current-state workflow needs structured systems/org evidence.
- Specific clients: Meridian/Healthcare Agent Assist live smoke is the proving path.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Migration: `supabase/migrations/20260717063000_tower_foundation_tables_ledger_repair.sql`
  - `public.tower_cmdb_cis`
  - `public.tower_cmdb_dependencies`
  - `public.tower_workforce`
  - supporting indexes, comments, and CMDB `updated_at` triggers

## QA / Validation

- `pass`: `npm run release:check`
- `pass`: `git diff --check`
- `pass`: destructive-pattern scan for `20260717063000_tower_foundation_tables_ledger_repair.sql`
- `not-run`: ACA operator migration dry-run against Azure/Postgres
- `not-run`: ACA operator migration apply against Azure/Postgres
- `not-run`: Signed-in Meridian P1 structured evidence upload retry
- `not-run`: Readiness proof that `it_systems_landscape` and `it_org_structure` no longer hard-block P1

## Rollout Plan

1. Merge PR to `main`.
2. Let the repo-owned ACA main deploy workflow build and deploy the digest-pinned image.
3. Run `db:migrate:dry` through the private ACA operator job using the deployed digest.
4. Run `db:migrate` through the private ACA operator job if dry-run lists only this repair migration.
5. Retry the signed-in Meridian P1 structured evidence upload and continue P0-P5 smoke.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: Private ACA operator job for migration apply only.
- Approved image digest: Pending post-merge ACA deploy.
- ACA runtime invariant: Pending post-merge ACA deploy.
- Worker image invariant: Not applicable.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, Meridian Moves P1 readiness and subsequent phase progression.

## Rollback Plan

Code rollback is not required because this is an additive schema repair. If a migration apply issue occurs before commit, the migration runner rolls back the transaction. After commit, rollback would require a follow-up migration only if the newly created tables cause a concrete defect; otherwise leaving unused additive tables is safer than dropping data-bearing tables.

## Audit Evidence

- PR URL: Pending
- Migration dry-run output: Pending
- Migration apply output: Pending
- Signed-in Meridian smoke output: Pending

## Known Gaps

P0-P5 live smoke is still in progress. This release only repairs the data-plane schema blocker discovered during P1 structured evidence upload.
