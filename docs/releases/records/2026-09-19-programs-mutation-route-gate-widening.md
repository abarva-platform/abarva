# 2026-09-19 Programs mutation route gate widening

## Release ID

`2026-09-19-programs-mutation-route-gate-widening`

## Status

`candidate`

## Plain-English Summary

The Programs mutation-route integration suite still used request fixtures from before phase advances required a named actor and human rationale, and before deliverable sign-off used the scoped deliverable query contract. This release updates those fixtures without weakening any tenant denial and adds the repaired suite to the dedicated Programs pull-request gate.

## Layer Impact

Release lane: `global-control-lane`.

- Product runtime: no change.
- Canonical data: no change.
- CI governance: the selected Programs gate grows from twelve suites and 194 tests to thirteen suites and 234 tests.

## Client Applicability

- All clients: no runtime change.
- Engineering governance: tenant-scoped mutation, phase-advance, and deliverable sign-off controls now run on pull requests.
- Tenant data: none read or written.

## Changes Included

- Supply the current named-actor and human-rationale contract to the phase-advance harness.
- Supply the current scoped deliverable-query contract to the sign-off harness.
- Preserve every foreign-program, foreign-resource, and no-membership denial.
- Add the repaired suite to the Programs governance workflow and executable wiring contract.

## QA / Validation

- PASS: exact-main baseline reproduced three failed and 37 passed tests due to stale request fixtures.
- PASS: updated mutation-route suite passed all 40 tests.
- PASS: the thirteen-suite governed subset passed all 234 tests.
- PASS: removing this suite from the workflow failed the wiring contract.
- PASS: TypeScript, scoped ESLint, release control, and diff hygiene completed successfully.

## Rollout Plan

Merge through the protected pull-request lane. The repository-owned main workflow may carry the commit in the next image, but there is no product behavior to activate.

## Deployment Authority

No ad-hoc deployment is authorized. Shared traffic may move only through the repository-owned ACA main workflow.

## Rollback Plan

Revert the pull request. The Programs governance workflow returns to its prior twelve-suite subset; no product or data state changes.

## Audit Evidence

- Pull-request checks and the dedicated Programs governance workflow.
- `docs/architecture/programs-governance-integration-triage.json` records the selected and excluded suites.

## Known Gaps

Thirteen known-red Programs suites remain excluded and cataloged. Each requires its own behavioral repair before the gate widens again.
