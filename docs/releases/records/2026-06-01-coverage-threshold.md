# 2026-06-01-coverage-threshold — Behavior Coverage Floor

## Release ID

`2026-06-01-coverage-threshold`

## Status

`candidate`

## Plain-English Summary

Adds the first merge-blocking Jest coverage threshold for the behavior test suite. The gate measures current behavior-test coverage and fails if coverage drops below conservative floors.

## Layer Impact

- Release lane: `internal-admin`.
- Internal admin layer: adds an engineering quality gate for PR validation.
- Runtime: no application runtime behavior changes.

## Client Applicability

- All clients: No direct runtime effect.
- Specific clients: None.
- Internal only: Engineering and release operations.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- `.github/workflows/coverage-threshold.yml`
- `scripts/ci/check-behavior-coverage.mjs`
- `package.json`
- `docs/runbooks/coverage-threshold.md`
- `docs/releases/records/2026-06-01-coverage-threshold.md`

## QA / Validation

- Pass: `npm run coverage:behavior-gate`
- Pass: `node --check scripts/ci/check-behavior-coverage.mjs`
- Pass: `git diff --check`
- Pass: `git diff --check origin/main..HEAD`
- Pass: `npm run release:check -- --base origin/main --head HEAD`

## Rollout Plan

Merge to `main`. The new GitHub Actions workflow runs on pull requests and manual dispatch. No production deploy or feature flag is required.

## Rollback Plan

Revert the PR to remove the workflow, script, package script, runbook, and release record.

## Audit Evidence

- PR URL: https://github.com/anandsundaram-hash/abarva/pull/2778
- Local validation output: `npm run coverage:behavior-gate` passed with observed coverage: lines 95.52%, statements 95.52%, functions 68.09%, branches 56.91%.
- Local validation output: `node --check scripts/ci/check-behavior-coverage.mjs` passed.
- Local validation output: `git diff --check origin/main..HEAD` passed.
- Local validation output: `npm run release:check -- --base origin/main --head HEAD` passed.

## Known Gaps

This gate covers the deterministic behavior test suite only. It does not enforce full-repository coverage or route-level coverage yet.
