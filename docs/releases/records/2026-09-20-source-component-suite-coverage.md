# Source component suite coverage

## Release ID

`2026-09-20-source-component-suite-coverage`

## Status

`candidate`

## Plain-English Summary

The Source component test directory existed but only two of its suites were
owned by a continuous-integration workflow. This change repairs three stale
tests found by running the whole directory and gives the directory a workflow
owner, so new Source component suites run when they are introduced.

## Layer Impact

- `global-control-lane`
- Test and release-control infrastructure only. No tenant data, database
  schema, read model, product route, or runtime behavior changes.

## Client Applicability

- All clients: no
- Specific clients: none
- Internal only: yes
- Public/demo only: no
- Feature flag: none

## Changes Included

- Run the full `src/components/source/__tests__` directory in a dedicated PR
  workflow.
- Align one workflow-position expectation with the governed traced-evidence
  rule already used by the product.
- Assert the rendered Source advisor identity instead of source-code quote
  style.
- Point the legacy Source reachability suite at the current repository-wide
  reachability audit.

## QA / Validation

- Before: 19 previously unowned suites collected 88 tests; 16 suites passed
  and 3 failed for three distinct stale-test causes.
- After: the full Source component directory passes, including the two suites
  that already had dedicated workflow ownership.
- The test-coverage census resolves the directory through the new workflow.
- Three focused mutations were caught: disabling traced-evidence progression,
  changing the rendered advisor name, and restoring the retired audit path.
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

Revert the pull request. The Source component directory would again lose its
single workflow owner; no data or runtime rollback is required.

## Audit Evidence

- The pull-request checks and the dedicated `Source component suites` job.
- The before/after focused Jest output.
- The refreshed test-coverage census.

## Known Gaps

- Passing component tests do not replace signed-in acceptance of a deployed
  product surface.
- Existing unreachable components remain governed by the separate baseline;
  this change does not delete or mount them.
