# 2026-09-19 Programs auth and tenant gate widening

## Release ID

`2026-09-19-programs-auth-tenant-gate-widening`

## Status

`candidate`

## Plain-English Summary

The Programs auth and tenant integration suite still expected the detail route to construct a route-local read client. The route now delegates tenant-scoped reads to the canonical Programs query and its governed read adapter. This release updates that behavior expectation and adds the repaired suite to the dedicated Programs pull-request gate.

## Layer Impact

Release lane: `global-control-lane`.

- Product runtime: no change.
- Canonical data: no change.
- CI governance: the selected Programs gate grows from eleven suites and 189 tests to twelve suites and 194 tests.

## Client Applicability

- All clients: no runtime change.
- Engineering governance: default-plane detail reads, tenant-scoped not-found behavior, and mutation-route tenant guards now run on pull requests.
- Tenant data: none read or written.

## Changes Included

- Assert the current tenant-scoped default read-plane contract for Program detail GET.
- Preserve the not-found response contract.
- Keep the existing mutation-route tenant guard behaviors.
- Add the repaired suite to the dedicated Programs governance workflow and executable wiring contract.

## QA / Validation

- PASS: exact-main baseline reproduced one failed and four passed tests due to the retired route-local read-client expectation.
- PASS: updated auth and tenant suite passed all five tests.
- PASS: the twelve-suite governed subset passed all 194 tests.
- PASS: removing this suite from the workflow failed the wiring contract.
- PASS: TypeScript, scoped ESLint, release control, and diff hygiene completed successfully.

## Rollout Plan

Merge through the protected pull-request lane. The repository-owned main workflow may carry the commit in the next image, but there is no product behavior to activate.

## Deployment Authority

No ad-hoc deployment is authorized. Shared traffic may move only through the repository-owned ACA main workflow.

## Rollback Plan

Revert the pull request. The Programs governance workflow returns to its prior eleven-suite subset; no product or data state changes.

## Audit Evidence

- Pull-request checks and the dedicated Programs governance workflow.
- `docs/architecture/programs-governance-integration-triage.json` records the selected and excluded suites.

## Known Gaps

Fourteen known-red Programs suites remain excluded and cataloged. Each requires its own behavioral repair before the gate widens again.
