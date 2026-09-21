# 2026-09-21-source-control-library-ci-ownership — Source control suites

## Release ID

`2026-09-21-source-control-library-ci-ownership`

## Status

`candidate`

## Plain-English Summary

Pull-request CI now runs six previously unowned tests for governed corpus reads
and Source contract optimization. Three stale Atlas tests remain explicitly
outside the green set rather than hiding a larger directory from CI.

## Layer Impact

- `global-control-lane`: test and release-control infrastructure only.
- No client intake, adapter, canonical-model, tenant data, schema, read model,
  or product-surface behavior changes.

## Client Applicability

- All clients: the same CI ownership contract applies to shared code.
- Specific clients: none.
- Internal only: pull-request validation.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- Add six green test files to `.github/workflows/unit-suites.yml`.
- Add a behavior contract that pins the exact green and quarantined files.
- Refresh the committed test-coverage census.

## QA / Validation

- PASS: current-main measurement loaded and collected 9 suites and 33 tests.
- PASS: 6 suites and 29 tests were green.
- EXPECTED FAIL: 3 suites and 4 tests were red and remain file-level
  quarantines.
- PASS: the ownership behavior contract failed before wiring and passed after.
- PASS: removing one owned file made the behavior contract fail.
- PASS: focused ESLint.
- PASS: TypeScript no-emit validation.
- PASS: release-control validation.

The Azure-search tests assert a tenant-scoped filter for the dedicated private
index path. They do not constitute opposite-tenant acceptance. The failing
authorization file uses source-string checks and does not execute an
unauthorized or opposite-tenant refusal, so it is not counted as a working
authorization control.

## Rollout Plan

Squash-merge through the protected pull-request path. The CI ownership takes
effect on subsequent pull requests. The standard repo-owned deployment may run
after merge, but no product runtime behavior changes.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` only.
- Shared runtime mutators: none in this change.
- Approved image digest: resolved by the repo-owned workflow after merge.
- ACA runtime invariant: required if the standard deploy runs.
- Worker image invariant: required if the standard deploy runs.
- Feature/env flag update path: not applicable.
- Live signed-in proof required: no; this is test ownership only.

## Rollback Plan

Revert the workflow step, behavior contract, census refresh, and this release
record together. No data or schema rollback is needed.

## Audit Evidence

Inspect the red-first behavior output, nine-suite measurement, importer
inventory, mutation check, focused behavior run, refreshed census, and pull
request CI.

## Known Gaps

The three Atlas route tests remain red and unowned. Their assertions must be
rewritten as executable behavior before they can count as controls.
