# 2026-07-27-hcdn-postgres-readiness-plan — Tenant Data Plane PostgreSQL Readiness

## Release ID

`2026-07-27-hcdn-postgres-readiness-plan`

## Status

`candidate`

## Plain-English Summary

This release adds a plan-only PostgreSQL identity, role, row-security, migration replay, and rollback readiness package for the reusable tenant data-plane factory. It covers the existing clean-room tenant package and the new airline clean-room package from the same generator so the database security model cannot drift by tenant.

No database migration is applied by this release. No Azure resources are created or changed by this package.

## Layer Impact

- `client-data-lane`: Adds tenant-scoped database readiness artifacts, SQL guard templates, RLS coverage matrices, role/grant matrices, and governed migration job contracts for future tenant data planes.
- `internal-admin`: Adds generator and tests operators can use to review migration readiness before any authorized Azure PostgreSQL apply.
- Product surfaces: No runtime UI, route, answer path, ingestion path, or product read-model behavior changes.

## Client Applicability

- All clients: No direct runtime change.
- Specific clients: Applies to the two synthetic clean-room tenant plan packages generated from the factory.
- Internal only: Operator readiness artifacts and validation scripts.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- `scripts/knowledge/build-phase2b3c-postgres-plan.mjs`
- `scripts/knowledge/__tests__/run-phase2b3c-postgres-plan-tests.mjs`
- `package.json` scripts: `generate:hcdn-postgres-plan`, `test:hcdn-postgres-plan`
- Tenant readiness packages under `clients/*/18-phase2b3c-azure-lab-implementation/12-postgres-security-plan/`
- Validation summaries under each tenant package
- Rollup report under `reports/phase2b3c-postgres-readiness/`

## QA / Validation

- `npm run generate:hcdn-postgres-plan` — passed.
- `npm run test:hcdn-postgres-plan` — passed.
- Static validation confirms: exact database guard, wildcard tenant rejection, six functional roles, 50+ tenant-keyed table coverage, reader denial from working candidates, ingest/reviewer publish denial, evaluator mutation denial, strategic insight defaulting to planning grade, migration replay contract, rollback rehearsal contract, and no legacy airline tenant residue in the airline package.

## Rollout Plan

Merge through the protected PR flow. The normal ACA main deploy may rebuild the application image, but this package is plan-only and does not apply PostgreSQL DDL. Any future migration execution must use the governed ACA migration job after independent approval.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` for normal application deploy after merge.
- Shared runtime mutators: None in this release.
- Approved image digest: Captured by the ACA main workflow after merge when applicable.
- ACA runtime invariant: Required after main deploy completes.
- Worker image invariant: Required after main deploy completes.
- Feature/env flag update path: None.
- Live signed-in proof required: No; this is an operator/database readiness package with no runtime surface change.

## Rollback Plan

Revert the PR to remove the readiness generator and generated artifacts. No database rollback is required because no migration is applied.

## Audit Evidence

- PR URL after creation.
- Local generation and test command output.
- Release gate output.
- Generated rollup: `reports/phase2b3c-postgres-readiness/rollup.json`.

## Known Gaps

- Azure apply remains blocked.
- PostgreSQL migration apply remains blocked.
- Source landing, parsing, normalization, publication, and runtime read-model integration remain blocked.
- Empty-database migration replay and rollback rehearsal are specified but not executed against Azure PostgreSQL in this release.
