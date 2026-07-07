# 2026-06-01-rls-regression-schedule-production-default — RLS Schedule Production Default

## Release ID

`2026-06-01-rls-regression-schedule-production-default`

## Status

`candidate`

## Plain-English Summary

The nightly SQL-level tenant-isolation regression now defaults to the configured production database instead of the Azure lab control database. Manual runs can still target `lab-control`, `lab-context`, or `production`.

## Layer Impact

- `internal-admin` lane: Updates only the GitHub Actions workflow target selection for the RLS regression job. No product runtime, user interface, data model, or database migration changes are included.

## Client Applicability

- All clients: The production tenant-isolation safety net applies to every client because the scheduled probe runs against the shared production control-plane database.
- Specific clients: None.
- Internal only: GitHub Actions operators and release owners.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- `.github/workflows/rls-regression.yml` now resolves scheduled runs with `inputs.environment || 'production'`.
- The workflow comments now state that lab targets remain manual until lab database secrets are configured.

## QA / Validation

- Confirmed failed scheduled run `26745364822` exited before SQL execution because the default target was `lab-control` and `AZURE_CONTROL_DATABASE_URL` was empty.
- Validated the edited workflow shell blocks with `bash -n`.
- Ran `npm run release:check -- --base origin/main --head HEAD`.
- Ran `git diff --check`.

## Rollout Plan

Merge to `main`. The next scheduled RLS regression run will resolve to `production` automatically. Manual workflow dispatch behavior remains available for lab targets when their DSNs are configured.

## Rollback Plan

Revert the PR to restore the previous scheduled default of `lab-control`.

## Audit Evidence

- GitHub Actions failed scheduled run: `https://github.com/anandsundaram-hash/abarva/actions/runs/26745364822`
- PR: pending.
- CI run: pending.

## Known Gaps

The Azure lab control/context DSN secrets are still not configured. Lab RLS probes remain manual and will fail fast until those secrets are added.
