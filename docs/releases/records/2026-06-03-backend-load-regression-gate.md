# 2026-06-03-backend-load-regression-gate - Backend Load Regression Gate

## Release ID

`2026-06-03-backend-load-regression-gate`

## Status

`candidate`

## Plain-English Summary

Adds a backend load-regression CI contract gate. Every PR now verifies that the
existing primary-surface load runner can still be invoked and emits a stable
JSON report shape. The heavier Azure/staging/production load run remains a
manual major-release operation because it requires environment secrets and an
approved load window.

## Layer Impact

- Release lane: `internal-admin`.
- Layer impact: CI, performance-readiness, release hygiene.
- Runtime impact: none. No production route, database, or Azure resource
  changes.

## Client Applicability

- All clients: no runtime behavior change.
- Specific clients: none.
- Internal only: CI and release-readiness evidence.
- Public/demo only: none.
- Feature flag: none.

## Changes Included

- `package.json`
- `.github/workflows/backend-load-regression.yml`
- `docs/runbooks/backend-load-regression-gate.md`
- `docs/build/BACKEND_LOAD_REGRESSION_GATE_2026-06-03.md`
- `scripts/load/verify-backend-load-regression-gate.mjs`

## QA / Validation

- Pass: `npm run load:backend-regression:check`
- Pass: `node scripts/load/verify-backend-load-regression-gate.mjs`
- Pass: focused ESLint for verifier.
- Pass: `git diff --check`
- Pass: `npm run release:check -- --base origin/main --head HEAD`

## Rollout Plan

Merge to `main`. The new workflow runs on PRs and can be manually dispatched.
Major-release live load runs continue through
`.github/workflows/azure-l8-primary-surface-load.yml`.

## Rollback Plan

Revert this PR. No runtime or data rollback is required.

## Audit Evidence

- This release record.
- Build manifest.
- Runbook.
- Verifier output.
- Workflow artifact `backend-load-regression-contract`.
- Pull request and CI checks.

## Known Gaps

T160 remains `In progress` until a real post-major-release backend load run is
executed against staging, production, or Azure lab and its evidence is attached.
