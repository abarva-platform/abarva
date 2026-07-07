# 2026-06-01-bundle-budget — Next Bundle Budget Gate

## Release ID

`2026-06-01-bundle-budget`

## Status

`candidate`

## Plain-English Summary

Adds a Next.js bundle budget gate that runs after build, reads `.next` manifests, and fails when JavaScript size exceeds conservative thresholds.

## Layer Impact

- Release lane: `internal-admin`.
- Internal admin layer: adds an engineering CI quality gate for pull requests.
- Runtime: no application runtime behavior changes.

## Client Applicability

- All clients: No direct runtime effect.
- Specific clients: None.
- Internal only: Engineering and release operations.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- `.github/workflows/bundle-budget.yml`
- `scripts/ci/check-next-bundle-budget.mjs`
- `package.json`
- `docs/runbooks/bundle-budget.md`
- `docs/releases/records/2026-06-01-bundle-budget.md`

## QA / Validation

- Pass: `node --check scripts/ci/check-next-bundle-budget.mjs`
- Pass: `npm run build`
- Pass: `npm run bundle:budget`
- Pass: `NODE_OPTIONS=--max-old-space-size=6144 npm run build`
- Pass: `git diff --check`
- Pass: `npm run release:check -- --base origin/main --head HEAD`

## Rollout Plan

Merge to `main`. The workflow runs on pull requests and manual dispatch. No production deploy or feature flag is required.

## Rollback Plan

Revert the PR to remove the workflow, script, package script, runbook, and release record.

## Audit Evidence

- PR URL: https://github.com/anandsundaram-hash/abarva/pull/2779
- Local validation output: `npm run build` passed.
- Local validation output: `NODE_OPTIONS=--max-old-space-size=6144 npm run build` passed after matching the CI heap setting.
- Local validation output: `npm run bundle:budget` passed with observed totals: 555.9 KB manifest JS, 198.6 KB largest chunk, 3869.8 KB largest route first-load JS.
- Local validation output: `node --check scripts/ci/check-next-bundle-budget.mjs` passed.
- Local validation output: `git diff --check` passed.
- Local validation output: `npm run release:check -- --base origin/main --head HEAD` passed.

## Known Gaps

This gate measures Next manifest JavaScript size. It does not replace Lighthouse, accessibility, or runtime performance monitoring.
