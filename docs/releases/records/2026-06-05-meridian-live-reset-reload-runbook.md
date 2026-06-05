# 2026-06-05-meridian-live-reset-reload-runbook — Meridian Live Reset Reload Runbook

## Release ID

`2026-06-05-meridian-live-reset-reload-runbook`

## Status

`candidate`

## Plain-English Summary

Adds a concise operator runbook for resetting and reloading Meridian/PHS live context through the governed Admin loader. The runbook exists because local direct access to the private Azure Postgres endpoint is blocked, so the live reload must be executed from an authenticated Admin session or a private-network runner.

## Layer Impact

- `client-data-lane`: Documents the approved Meridian/PHS reset and reload sequence for tenant context.
- `internal-admin`: Gives setup/admin operators the required checks, stop conditions, and post-reload crawl expectations.

## Client Applicability

- All clients: None.
- Specific clients: Meridian/PHS only.
- Internal only: Setup/admin operators and execution agents.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- Adds `docs/build/meridian-phs-demo/MERIDIAN_LIVE_RESET_RELOAD_RUNBOOK_2026-06-05.md`.

## QA / Validation

- `git diff --check` — pass.
- `npm run release:check -- --base origin/main --head HEAD` — pass after this release record.

## Rollout Plan

Merge the docs-only PR. No production runtime deploy is required for the runbook itself, though normal main deploy may still occur.

## Rollback Plan

Revert the PR if the reload sequence is superseded.

## Audit Evidence

- PR URL: https://github.com/abarva-platform/abarva/pull/3136.
- Runbook names required source templates, proof checks, screenshot destinations, and stale-fact stop conditions.

## Known Gaps

- The runbook does not perform the live data reset/reload. Execution remains blocked until an authenticated Admin UI session or private-network runner can reach the production data plane.
