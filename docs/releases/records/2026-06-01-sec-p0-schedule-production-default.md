# 2026-06-01-sec-p0-schedule-production-default — SEC-P0 Scheduled Probe Target

## Release ID

`2026-06-01-sec-p0-schedule-production-default`

## Status

`candidate`

## Plain-English Summary

Changes the scheduled SEC-P0 cross-tenant probe workflow to target production by default instead of staging. The prior scheduled run failed before executing probes because staging probe secrets were not configured; production is the environment currently used for the live post-deploy safety checks.

## Layer Impact

- `internal-admin`: GitHub Actions security-probe orchestration only. No product runtime, route, data-plane, schema, or UI behavior changes.

## Client Applicability

- All clients: production SEC-P0 scheduled checks protect cross-tenant boundaries for all deployed clients.
- Specific clients: none.
- Internal only: yes, CI/security operations.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- Updates `.github/workflows/sec-p0-post-deploy.yml` so scheduled runs default to `production`.
- Leaves `staging` and `azure-lab` selectable for manual `workflow_dispatch` runs.
- Updates workflow comments to document production scheduled secrets and staging manual secrets.
- PR URL: https://github.com/anandsundaram-hash/abarva/pull/2692.

## QA / Validation

- Pass: `bash -n` validation of the workflow shell logic.
- Pass: `npm run release:check -- --base origin/main --head HEAD`.
- Pass: `git diff --check`.
- Not run: live SEC-P0 probe suite, because repository secrets are only available inside GitHub Actions.

## Rollout Plan

Merge to `main`. The next scheduled SEC-P0 workflow will resolve production probe secrets by default. Manual dispatch can still target staging or azure-lab.

## Rollback Plan

Revert the PR to restore scheduled staging default.

## Audit Evidence

- PR URL: https://github.com/anandsundaram-hash/abarva/pull/2692.
- Failed run that motivated the change: https://github.com/anandsundaram-hash/abarva/actions/runs/26744048540.
- Local validation: shell syntax check, release gate, diff check.

## Known Gaps

If production probe secrets are also missing or stale, the workflow will still fail before running probes. That is intentional: missing credentials for the active scheduled environment should be visible.
