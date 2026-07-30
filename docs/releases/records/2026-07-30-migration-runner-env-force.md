# 2026-07-30-migration-runner-env-force - Migration Runner Env Force Controls

## Release ID

`2026-07-30-migration-runner-env-force`

## Status

`candidate`

## Plain-English Summary

Adds environment-variable equivalents for migration runner flags so Azure Container Apps Jobs can run narrowly scoped dry-run, CI, and forced migration repair commands without depending on dash-prefixed command arguments in the Container Apps CLI.

## Layer Impact

Lane: `internal-admin`, `client-data-lane`.

Database operations: changes only the operator migration script flag parsing. It does not apply a migration, load tenant data, change product providers, or alter active baselines by itself.

## Client Applicability

- All clients: none.
- Specific clients: none.
- Internal only: governed migration repair jobs.
- Public/demo only: none.
- Feature flag: none.

## Changes Included

- `src/scripts/run-migrations.ts`

## QA / Validation

- Pass: targeted `tsx` import check for `MIGRATION_FORCE_NAME`, `MIGRATION_CI`, and `MIGRATION_DRY_RUN`
- Pass: `npm run release:check`
- Pass: `git diff --check`
- Not pass: repo-level `npx tsc --noEmit --pretty false` exhausted the local Node heap before reporting type diagnostics

## Rollout Plan

Merge to main, let the repo-owned Azure Container Apps deploy workflow produce and deploy a digest-pinned image, then run the private operator job with `MIGRATION_FORCE_NAME` and `MIGRATION_CI=true` for the specific reviewed migration repair.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: none in this PR
- Approved image digest: produced by the repo-owned deploy workflow after merge
- ACA runtime invariant: required before using the updated operator image
- Worker image invariant: use the same digest-pinned image as the deployed runtime
- Feature/env flag update path: job-scoped environment variables only
- Live signed-in proof required: no product surface change

## Rollback Plan

Revert this release from main and redeploy through the repo-owned workflow. Any already-applied migration repair remains governed by the migration ledger and should be handled through a follow-up additive repair if needed.

## Audit Evidence

To be filled after PR, CI, merge, deploy, and operator execution proof are complete.

## Known Gaps

This change does not certify Foundation V2 execution. It only enables a safer operator-job invocation path for narrow migration repair in environments where CLI argument parsing cannot pass dash-prefixed script flags reliably.
