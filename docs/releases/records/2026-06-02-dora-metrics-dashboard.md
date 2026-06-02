# 2026-06-02-dora-metrics-dashboard - DORA Metrics Dashboard

## Release ID

`2026-06-02-dora-metrics-dashboard`

## Status

`candidate`

## Plain-English Summary

Adds an internal DORA metrics generator so AbarVa can produce a delivery-health dashboard from merged pull request history. The dashboard reports lead time, deployment frequency, change-fail proxy, and MTTR proxy with clear interpretation limits.

## Layer Impact

- `internal-admin`: Adds maintainer tooling for engineering operating metrics.
- `global-control-lane`: Adds shared npm scripts and repo scripts, with no product runtime behavior.

## Client Applicability

- All clients: No direct client-facing behavior changes.
- Specific clients: None.
- Internal only: AbarVa engineering and operating reviews.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- `package.json`
- `scripts/metrics/dora-dashboard.mjs`
- `scripts/metrics/dora-dashboard-smoke.mjs`
- `docs/runbooks/dora-metrics.md`

## QA / Validation

- Passed: `npm run metrics:dora:smoke`
- Pending, not run in final sequence yet: `npm run release:check -- --base origin/main --head HEAD`
- Passed: `git diff --check`
- Pending, not run in final sequence yet: `npm run secrets:staged`

## Rollout Plan

Merge to `main`. The dashboard generator becomes available through npm scripts for local engineering and agent workflows.

## Rollback Plan

Revert the PR to remove package script entries, DORA metric scripts, runbook, and release record.

## Audit Evidence

- PR URL: Pending.
- CI run: Pending.
- Local smoke output: Pending.

## Known Gaps

Deployment frequency is currently PR merge frequency, not verified production deployment count. Change-fail rate and MTTR are proxy measures until incident, rollback, and deployment records are connected.
