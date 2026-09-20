# Intelligence library suite coverage

## Release ID

`2026-09-20-intelligence-library-suite-coverage`

## Status

`candidate`

## Plain-English Summary

The Intelligence library contains tenant, event, and private-data-plane
controls whose tests were not owned by a pull-request workflow. This change
runs the reachable suites on every pull request and keeps five suites over
unreachable subjects in a named, self-clearing quarantine.

## Layer Impact

- `global-control-lane`
- Test and release-control infrastructure only. No product behavior, tenant
  data, schema, read model, prompt, or model-provider change.

## Client Applicability

- All clients: no
- Specific clients: none
- Internal only: yes
- Public/demo only: no
- Feature flag: none

## Changes Included

- Run reachable `src/lib/intelligence/__tests__` suites in a dedicated job.
- Name five exclusions whose primary subjects are not product-reachable.
- Fail the quarantine check when a subject becomes reachable, a suite or
  subject disappears, or the exclusion list changes without moving its exact
  ratchet.

## QA / Validation

- Before: 23 suites collected 172 tests; 21 suites and 170 tests passed. Two
  orphan-content suites failed because their references do not resolve in the
  frozen pattern manifest.
- Reachability: five suites have an unreachable primary subject. The remaining
  18 suites are selected by the workflow and pass.
- The tenant-spine control failed when client selection was forced to a single
  tenant (five of six cases detected foreign context).
- The cross-event control failed when the event-code drop condition was
  disabled (the guarded answer retained the foreign event and diagnostics
  reported no drop).
- The private-plane control failed when two tenants were assigned the same
  private schema (the uniqueness assertion changed from three to two).
- The quarantine unit checks and real-repository check pass.
- Test-coverage census, TypeScript, lint, release control, and diff hygiene are
  run before merge.

## Rollout Plan

Merge through the protected pull-request path. The repository-owned deployment
may run because release automation is commit based; no product runtime payload
or signed-in acceptance is created by this test-only change.

## Deployment Authority

- Repo-owned ACA deployment workflow only.
- No direct Azure mutation, migration, flag, secret, scale, or traffic action.

## Rollback Plan

Revert the pull request. The Intelligence library directory would return to
having no workflow owner; no data or runtime rollback is required.

## Audit Evidence

- Baseline and post-quarantine Jest output.
- Quarantine behavioral checks and live route-reachability readback.
- Focused mutation runs for all three isolation suites.
- Refreshed test-coverage census.

## Known Gaps

- Five orphan-content suites remain outside CI until their subjects are mounted
  or retired.
- Passing unit controls do not replace authenticated product acceptance.
