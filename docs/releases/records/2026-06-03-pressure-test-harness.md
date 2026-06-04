# 2026-06-03-pressure-test-harness - Pressure Test Harness

## Release ID

`2026-06-03-pressure-test-harness`

## Status

`candidate`

## Plain-English Summary

Adds an executable pressure-test matrix for the open pilot-readiness pressure rows. The matrix covers 10-user baseline soak, 50-user 24-hour soak, concurrent Claude stream burst, parallel document upload storm, database pool sizing, cold-start measurement, and token-runaway guard testing. It is safe by default because dry-run mode prints commands and evidence requirements without generating load.

## Layer Impact

- Release lane: `internal-admin`
- Layer impact: operational test harness and runbook only. No runtime behavior, database schema, customer UI, or production configuration changes.

## Client Applicability

- All clients: none.
- Specific clients: none.
- Internal only: AbarVa operations and engineering.
- Public/demo only: none.
- Feature flag: none.

## Changes Included

- `scripts/load/pressure-test-matrix.mjs`
- `scripts/load/verify-pressure-test-harness.mjs`
- `docs/runbooks/pressure-test-harness.md`
- `package.json` scripts `load:pressure-matrix` and `load:pressure-matrix:check`
- This release record.

## QA / Validation

- Passed: `npm run load:pressure-matrix:check`
- Passed: `node --check scripts/load/pressure-test-matrix.mjs`
- Passed: `node --check scripts/load/verify-pressure-test-harness.mjs`
- Passed: `git diff --check`
- Passed: `npm run release:check -- --base origin/main --head HEAD`

## Rollout Plan

Merge through the protected PR flow. No runtime rollout. Operators can then run dry-run profiles locally or in CI and schedule live pressure tests against the correct authenticated preview, demo, or pilot environment.

## Rollback Plan

Revert the PR. There are no migrations, runtime code paths, production secrets, or customer-facing surfaces in this release.

## Audit Evidence

- PR URL after opening.
- Local verifier output from `npm run load:pressure-matrix:check`.
- CI release-control and standard repository checks.
- Future live evidence packets created from the runbook.

## Known Gaps

No pressure-test row should be marked Done solely because of this release. T151, T152, T153, T154, T155, T156, and T157 still require live run evidence. T158 remains blocked until the live runs identify the top three hot paths to optimize. T159 and T160 remain In progress until observed SLO/SLA evidence and repeat-after-release evidence exist.
