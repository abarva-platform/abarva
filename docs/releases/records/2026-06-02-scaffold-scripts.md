# 2026-06-02-scaffold-scripts - Governance Scaffold Scripts

## Release ID

`2026-06-02-scaffold-scripts`

## Status

`candidate`

## Plain-English Summary

Adds npm scaffold scripts for common governance artifacts so agents and humans can start release records and ADRs from the same repo-standard shape instead of hand-copying templates.

## Layer Impact

- `internal-admin`: Adds maintainer tooling and a runbook for consistent governance artifact creation.
- `global-control-lane`: Touches shared package scripts and repo scripts, with no product runtime behavior.

## Client Applicability

- All clients: No direct client-facing behavior changes.
- Specific clients: None.
- Internal only: AbarVa engineering and agent execution workflows.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- `package.json`
- `scripts/scaffold/release-record.mjs`
- `scripts/scaffold/adr.mjs`
- `scripts/scaffold/utils.mjs`
- `scripts/scaffold/smoke.mjs`
- `docs/runbooks/scaffold-scripts.md`

## QA / Validation

- Passed: `npm run scaffold:smoke`
- Passed: `npm run release:check -- --base origin/main --head HEAD`
- Passed: `git diff --check`
- Passed after dependency bootstrap: `npm run secrets:staged`

## Rollout Plan

Merge to `main`. The scripts become available to future local and CI agent workflows through npm scripts.

## Rollback Plan

Revert the PR to remove the scaffold scripts, npm script entries, runbook, and release record.

## Audit Evidence

- PR URL: Pending.
- CI run: Pending.
- Local smoke output: Pending.

## Known Gaps

The generators create draft files only. Authors must still replace placeholders, update the ADR index when creating ADRs, and run the release control gate before merge.
