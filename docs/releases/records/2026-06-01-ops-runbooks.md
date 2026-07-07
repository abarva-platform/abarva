# 2026-06-01-ops-runbooks — Pilot Operations Runbooks

## Release ID

`2026-06-01-ops-runbooks`

## Status

`candidate`

## Plain-English Summary

Adds pilot-readiness runbooks for incident response, rollback, database
migration discipline, and lightweight on-call coverage. These give operators
clear steps for containing production issues, preserving audit evidence,
handling 72-hour notification triggers, rolling back safely, and running
client-scoped migrations without unbounded writes.

## Layer Impact

- `internal-admin`: Documentation for AbarVa operators and release owners. No
  runtime behavior, UI, schema, or client data-plane changes.

## Client Applicability

- All clients: Indirectly benefits all clients through stronger operating
  discipline.
- Specific clients: None.
- Internal only: Yes, these are AbarVa operator runbooks.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- `docs/runbooks/incident-response.md`
- `docs/runbooks/rollback.md`
- `docs/runbooks/db-migration.md`
- `docs/runbooks/on-call.md`

## QA / Validation

- Passed: `git diff --check`
- Passed: `npm run release:check -- --base origin/main --head HEAD`
  - Result: release gate reported no release-relevant files changed because this
    slice is runbook documentation only.

## Rollout Plan

Merge to `main`. The runbooks become the operator reference for pilot readiness
and future release records.

## Rollback Plan

Revert the PR. The change is documentation-only and has no runtime or data
rollback constraints.

## Audit Evidence

- PR diff.
- Release Control Gate output.

## Known Gaps

Named on-call people, client-specific notification contacts, and external legal
notice templates still require founder/legal confirmation before a live pilot.
