# 2026-09-20-admin-component-suite-ci

## Release ID

`2026-09-20-admin-component-suite-ci`

## Status

`candidate`

## Plain-English Summary

The admin component tree had 31 suites, but its largest tenant-control and
operator-workflow rows were not owned by pull-request CI. The first complete
run found three stale test harnesses. This release repairs those harnesses and
runs the parent directory on every pull request.

## Layer Impact

- `global-control-lane`: test harnesses and CI ownership only.
- No schema, migration, tenant data, projection, feature flag, or production
  behavior changes.

## Client Applicability

- All clients: no
- Specific clients: none
- Internal only: yes, CI coverage
- Public/demo only: no
- Feature flag: none

## Changes Included

- Repair the tenant-switcher error-path harness for the current Next router
  dependency.
- Align the connector-onboarding assertion with the current queued-health
  status copy.
- Replace a deleted external CSV fixture with a small generic inline fixture.
- Run `src/components/admin` as a parent directory in the unit-suite workflow.
- Add a behavior guard that refuses a dark or partially covered nested admin
  component directory.
- Regenerate the committed CI-coverage census.

## QA / Validation

- Baseline: 28 of 31 suites passed; 162 of 171 tests passed.
- Repaired: 31 of 31 suites and 171 of 171 tests pass.
- The three tenant-shell controls were run separately: 3 suites, 14 tests.
- Mutations independently proved the tenant-switch permission display, the
  isolation anomaly surface, and the required tenant-name call-site scanner can
  fail.
- Every repaired component has a non-test product importer.
- Behavior tests, TypeScript, ESLint, YAML parsing, and release control are run
  before merge.

## Rollout Plan

Squash-merge through the protected repository path. The repo-owned ACA workflow
may build the ordinary main image; this change does not require a migration or
runtime flag.

## Deployment Authority

- Repo-owned deploy workflow only.
- No direct shared-runtime mutation.
- Signed-in product proof is not required for CI-only behavior.

## Rollback Plan

Revert the pull request. This removes the workflow owner and restores the prior
test expectations without changing runtime or data state.

## Audit Evidence

- Full-tree before and after Jest results.
- Three focused tenant-control mutation runs.
- Generated census set diff and the behavior ownership guard.

## Known Gaps

- Passing component tests do not prove the authenticated product surface.
- Some nested admin suites are intentionally also owned by narrower workflows;
  the parent command spends a small amount of duplicate runner time to prevent
  future nested suites from becoming dark.
