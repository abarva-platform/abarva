# 2026-09-19-foundation-tenant-key-resolution — Canonical Foundation Tenant Resolution

## Release ID

`2026-09-19-foundation-tenant-key-resolution`

## Status

`candidate`

## Plain-English Summary

The shared foundation-tenant check accepted registered aliases, but its TypeScript
signature claimed that the original input had become canonical. A caller could
therefore return an alias from a function whose contract promised a canonical
tenant key. The check remains alias-aware for access fences, while a dedicated
resolver now returns only a verified canonical key or `null`.

## Layer Impact

`global-control-lane`: shared tenant identity and authorization control behavior.
No client intake, source adapter, canonical data object, product projection,
schema, migration, or tenant data changes.

## Client Applicability

- All clients: shared tenant isolation behavior preserves its existing scope.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- The foundation tenant-key module now separates canonical resolution from the
  alias-aware boolean fence.
- Foundation authorization resolvers return the canonical value produced by that
  resolver instead of returning the original alias under a canonical type.
- Focused tests cover registered alias canonicalization and rejection of unknown
  non-canonical values.

## QA / Validation

- PASS: focused tenant and authorization tests, 15 tests across 3 suites.
- PASS: ESLint over changed TypeScript files, 0 errors and 0 warnings.
- PASS: full `src/` ESLint, 0 errors; existing repository warnings remain.
- PASS: full TypeScript no-emit check on Node.js 24.
- PASS: release-control check.
- PASS: public-content and protected-path scan over all five changed files.

## Rollout Plan

Merge through the ordinary pull-request lane. The normal repository-owned main
deployment workflow may carry the change later; this release candidate does not
authorize a merge, deployment, traffic change, feature change, or data-plane job.

## Deployment Authority

- Repo-owned deploy workflow: required for any later runtime deployment.
- Shared runtime mutators: none authorized by this release candidate.
- Approved image digest: not applicable before merge and deployment.
- ACA runtime invariant: not claimed.
- Worker image invariant: not applicable.
- Feature/env flag update path: none.
- Live signed-in proof required: not part of this pull-request-only scope.

## Rollback Plan

Revert the pull request. No data rollback, migration reversal, alias removal, or
tenant repair is required because the change writes no state and adds no aliases.

## Audit Evidence

- The pre-change runtime probe returned its input alias from a canonical-key
  contract.
- The pre-change focused suite exposed the same mismatch through an existing
  historical-label case.
- Final command results and the pull request are recorded in the execution claim.

## Known Gaps

No signed-in or deployed proof is claimed. This release candidate stops at an
open pull request as authorized.
