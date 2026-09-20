# Source aVa library suite coverage

## Release ID

`2026-09-20-source-ava-library-suite-coverage`

## Status

`candidate`

## Plain-English Summary

The Source answer layer has grounding, refusal, citation, and value-claim tests
that were not owned by a pull-request workflow. This change runs every suite
whose subject reaches the product and holds one orphan export-helper suite in a
named, self-clearing quarantine.

## Layer Impact

- `global-control-lane`
- Test and release-control infrastructure only. No product behavior, tenant
  data, schema, prompt, model, or read-model change.

## Client Applicability

- All clients: no
- Specific clients: none
- Internal only: yes
- Public/demo only: no
- Feature flag: none

## Changes Included

- Run reachable `src/lib/source/ava/__tests__` suites on every pull request.
- Exclude one export-helper suite only while its primary subject remains
  unreachable.
- Fail when that reason expires or the exact quarantine ratchet changes.

## QA / Validation

- Unchanged baseline: 23 suites and 313 tests passed.
- Reachability: 22 suites have product-reachable subjects; one export-helper
  subject is unreachable and receives no coverage credit.
- Governed-answer fixtures provide independent synthetic rows and expected
  outcomes; they do not import expected answer packets from the subject under
  test.
- The answer-quality ID scrub and the accepted-numeric pricing refusal are
  mutation-checked before merge.
- Quarantine behavior, route-reachability readback, TypeScript, lint, release
  control, census behavior, and diff hygiene are run before merge.

## Rollout Plan

Merge through the protected pull-request path. The repository-owned deployment
may run because release automation is commit based; this change has no runtime
payload and creates no authenticated product proof.

## Deployment Authority

- Repo-owned ACA deployment workflow only.
- No direct Azure mutation, migration, flag, secret, scale, or traffic action.

## Rollback Plan

Revert the pull request. The Source answer suite directory would return to
having no workflow owner; no data or runtime rollback is required.

## Audit Evidence

- Baseline and selected-suite Jest output.
- Quarantine behavior and route-reachability output.
- Focused mutation outputs for answer scrubbing and pricing refusal.
- Refreshed test-coverage census.

## Known Gaps

- The orphan export helper remains outside CI until it is mounted or retired.
- Unit behavior does not replace signed-in answer acceptance.
