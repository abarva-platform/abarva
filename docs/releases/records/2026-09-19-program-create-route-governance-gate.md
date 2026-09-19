# 2026-09-19 Program create-route governance gate

## Release ID

`2026-09-19-program-create-route-governance-gate`

## Status

`candidate`

## Plain-English Summary

The Program create-route integration harness still observed the retired direct participant insert after the route moved that write behind the governed data-plane adapter. This release updates the harness to assert the current adapter contract and adds the repaired suite to the dedicated Programs pull-request gate.

## Layer Impact

Release lane: `global-control-lane`.

- Product runtime: no change.
- Canonical data: no change.
- CI governance: the selected Programs gate grows from ten suites and 182 tests to eleven suites and 189 tests.

## Client Applicability

- All clients: no runtime change.
- Engineering governance: Program creation, participant attribution, and non-fatal attribution failure now run on pull requests.
- Tenant data: none read or written.

## Changes Included

- Mock and assert the route's governed Programs write adapter.
- Preserve the successful response when participant attribution cannot be persisted.
- Add the repaired suite to the dedicated Programs governance workflow.
- Move the suite from the known-red triage list into the selected gate and update the executable wiring contract.

## QA / Validation

- PASS: exact-main baseline reproduced one failed and six passed tests because the stale harness watched the retired write path.
- PASS: updated create-route suite passed all seven tests.
- PASS: the eleven-suite governed subset passed all 189 tests.
- PASS: removing the create-route suite from the workflow failed the wiring contract.
- PASS: TypeScript and scoped ESLint completed successfully.
- PASS: release control and diff hygiene completed successfully.

## Rollout Plan

Merge through the protected pull-request lane. The repository-owned main workflow may carry the commit in the next image, but there is no product behavior to activate.

## Deployment Authority

No ad-hoc deployment is authorized. Shared traffic may move only through the repository-owned ACA main workflow.

## Rollback Plan

Revert the pull request. The Programs governance workflow returns to its prior ten-suite subset; no product or data state changes.

## Audit Evidence

- Pull-request checks and the dedicated Programs governance workflow.
- `docs/architecture/programs-governance-integration-triage.json` records the selected and excluded suites.

## Known Gaps

Fifteen known-red Programs suites remain excluded and cataloged. Each requires its own behavioral repair before the gate widens again.
