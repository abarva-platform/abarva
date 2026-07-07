# 2026-06-04-pen-test-scope — External Pen Test Scope Handoff

## Release ID

`2026-06-04-pen-test-scope`

## Status

`candidate`

## Plain-English Summary

Adds the 2026-06-04 founder handoff artifact that defines the exact external
penetration-test scope AbarVa should book. It turns T031 from a generic
readiness packet into a concrete scope document with target URLs, auth flows,
upload endpoints, agent endpoints, and booking blockers.

## Layer Impact

- Release lane: `internal-admin`.
- `internal-admin`: this is an operator and founder planning artifact for
  vendor booking and scope control.
- Security governance: it narrows the exact application and API surfaces that
  should be tested and calls out what is intentionally out of scope.

## Client Applicability

- All clients: no runtime behavior changes.
- Specific clients: none.
- Internal only: founder, security, and vendor-booking workflows.
- Public/demo only: none.
- Feature flag: none.

## Changes Included

- `audit-artifacts/architecture/t031-pen-test-scope-2026-06-04.md`

## QA / Validation

- PASS: `npm run security:pen-test-readiness:verify`
- PASS: scope inventory cross-check against current route files under `src/app`

## Rollout Plan

Merge to `main`. No runtime rollout is required. This artifact becomes active
as the booking packet for vendor selection and statement-of-work scoping.

## Rollback Plan

Revert the release record and scope artifact if the scope needs to be replaced
or rewritten. No data or runtime rollback is required.

## Audit Evidence

- `audit-artifacts/architecture/t031-pen-test-readiness-2026-06-04.txt`
- `audit-artifacts/architecture/t031-pen-test-scope-2026-06-04.md`

## Known Gaps

Vendor selection, signed rules of engagement, completed external testing,
final report, remediation evidence, and retest evidence are still outstanding.
