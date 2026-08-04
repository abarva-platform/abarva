# 2026-08-03-migration-force-drift-reconciliation — Migration Force Drift Reconciliation

## Release ID

`2026-08-03-migration-force-drift-reconciliation`

## Status

`candidate`

## Plain-English Summary

This release fixes the migration runner's documented force path. When an operator intentionally re-runs one reviewed migration with `--force <migration>`, the runner can now tolerate and re-record drift for that requested migration only. Drift in any unrelated already-applied migration still blocks the run.

## Layer Impact

Release lane: `internal-admin`.

Database operations tooling: updates the governed migration runner behavior used by ACA operator jobs and migration workflows. No product data model, product UI, Cube model, tenant source package, or customer-facing route changes.

## Client Applicability

- All clients: no direct product behavior change.
- Specific clients: none.
- Internal only: AbarVa migration/operator tooling.
- Public/demo only: none.
- Feature flag: none.

## Changes Included

- Script: `src/scripts/run-migrations.ts`
- Test: `src/scripts/__tests__/run-migrations.test.ts`
- Release record: `docs/releases/records/2026-08-03-migration-force-drift-reconciliation.md`

## QA / Validation

- Pass: `npm run test -- src/scripts/__tests__/run-migrations.test.ts --runInBand`
- Pass: `npx eslint src/scripts/run-migrations.ts src/scripts/__tests__/run-migrations.test.ts`
- Pass: `npm run release:check`

## Rollout Plan

Merge through PR to `main`. The repo-owned ACA main deploy workflow will publish the updated digest-pinned web/operator image. Use the force path only for a specific reviewed migration-ledger reconciliation; normal migration applies remain fail-closed on drift.

## Deployment Authority

- Repo-owned deploy workflow: required for the operator image to include this script change.
- Shared runtime mutators: none outside the repo-owned ACA main deploy workflow.
- Approved image digest: resolved by ACA main deploy after merge.
- ACA runtime invariant: verified by ACA main deploy after merge.
- Worker image invariant: verified by ACA main deploy after merge.
- Feature/env flag update path: none.
- Live signed-in proof required: no product UI change.

## Rollback Plan

Revert this release through PR and deploy the previous image. The default migration drift behavior remains fail-closed; rollback only removes the ability to use `--force` for the explicitly requested drifted migration.

## Audit Evidence

- Targeted Jest output for `src/scripts/__tests__/run-migrations.test.ts`
- ESLint output for changed files
- PR checks and ACA main deploy evidence after merge

## Known Gaps

No known product gaps. This does not itself reconcile any environment ledger; it only fixes the runner behavior needed for a subsequent governed operator job.
