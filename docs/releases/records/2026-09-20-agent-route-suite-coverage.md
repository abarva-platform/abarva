# Agent route suite coverage

## Release ID

`2026-09-20-agent-route-suite-coverage`

## Status

`candidate`

## Plain-English Summary

The shared agent route has tests for tenant scoping, event scoping, financial
redaction, visible streaming, and answer discipline. Only one suite in that
directory was owned by a workflow. This change repairs three stale test files
found by running the directory and gives all route suites a workflow owner.

## Layer Impact

- `global-control-lane`
- Test and release-control infrastructure only. No prompt, route, tenant data,
  schema, read model, model provider, or runtime behavior changes.

## Client Applicability

- All clients: no
- Specific clients: none
- Internal only: yes
- Public/demo only: no
- Feature flag: none

## Changes Included

- Run the full agent-route test directory on every pull request.
- Align lifecycle-label expectations with the current product language.
- Match formatted calls and imports independent of quote style and line breaks.
- Refresh one cover-identity expectation already changed in the route.

## QA / Validation

- Before: 9 suites collected 90 tests; 6 suites and 83 tests passed, while 3
  suites held 7 stale source-text expectations.
- After: all route suites and tests pass.
- The test-coverage census resolves the directory through the new workflow with
  zero indeterminate invocations.
- The cross-event, tenant-broker, and restricted-financial controls are each
  mutation-checked so passing means their guarded behavior can fail.
- Focused lint, TypeScript, release control, and diff hygiene pass.

## Rollout Plan

Merge through the protected pull-request path. The repository-owned deploy may
run because shared release automation is commit based, but this change has no
product runtime payload and needs no signed-in product acceptance.

## Deployment Authority

- Repo-owned ACA deploy workflow only.
- No direct Azure mutation, migration, flag, secret, scale, or traffic action.
- No worker runtime change.

## Rollback Plan

Revert the pull request. The agent-route directory would again lose its single
workflow owner; no data or runtime rollback is required.

## Audit Evidence

- Pull-request checks and the dedicated `Agent route suites` job.
- Before/after focused Jest output and mutation runs.
- Refreshed test-coverage census.

## Known Gaps

- Route-level unit coverage does not replace signed-in answer acceptance.
- Existing route-size and source-text coupling remain separate design debt.
