# 2026-06-03-top-user-journey-load-tests — Top User Journey Load Harness

## Release ID

`2026-06-03-top-user-journey-load-tests`

## Status

`candidate`

## Plain-English Summary

Adds the T150 load-test harness for AbarVa's top 5 user journeys. The harness
is intentionally non-destructive by default, so operations can validate Home,
Intelligence, Moves approvals/audit export, Source, and Tower user paths
without mutating client records.

## Layer Impact

- `internal-admin`: adds operations-owned load-test scripts, a manual GitHub
  workflow, and a runbook for pre-prod/FakeClient/production test windows.
- `global-control-lane`: no runtime user behavior changes; the app receives no
  route, component, database, or migration changes.

## Client Applicability

- All clients: no direct runtime change.
- Specific clients: none.
- Internal only: AbarVa operations and release managers use the harness.
- Public/demo only: none.
- Feature flag: none.

## Changes Included

- `scripts/load/top-user-journeys.mjs`
- `scripts/load/verify-top-user-journeys.mjs`
- `.github/workflows/top-user-journey-load.yml`
- `docs/runbooks/top-user-journey-load-tests.md`
- `package.json` scripts: `load:top-journeys`, `load:top-journeys:check`

## QA / Validation

- Pass: `npm run load:top-journeys:check`
- Pass: `node scripts/load/top-user-journeys.mjs --base-url https://example.com --duration-seconds 1 --concurrency 1 --think-time-ms 0 --dry-run`
- Pending: live authenticated run against staging, azure-lab/FakeClient, or production.

## Rollout Plan

Merge to main. No deployment or migration is required for runtime behavior.
Operations can then trigger the manual `Top User Journey Load` GitHub workflow
when the appropriate environment URL and test-account cookie secrets are set.

## Rollback Plan

Revert the PR to remove the scripts, workflow, runbook, and package scripts.
No data rollback is needed.

## Audit Evidence

- PR URL and merge commit after merge.
- Local verifier output from `npm run load:top-journeys:check`.
- Future live workflow run artifact: `top-user-journey-load.json`.

## Known Gaps

This closes the script/build portion of T150 only after merge. It does not
complete T151/T152/T153/T154 because those require real observed load, duration,
streaming, and upload evidence.
