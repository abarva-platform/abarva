# 2026-09-19 Programs phase-capture gate widening

## Release ID

`2026-09-19-programs-phase-capture-gate-widening`

## Status

`candidate`

## Plain-English Summary

The dedicated Programs governance workflow excluded the phase-capture route suite because three success-path fixtures predated the current P0 completeness contract. The production guard correctly rejected those incomplete fixtures. This release updates only the harness inputs, preserves the incomplete-capture rejection case, and adds the now-green route suite to the governed pull-request gate.

## Layer Impact

Release lane: `global-control-lane`.

- Product runtime: no change.
- Canonical data: no change.
- CI governance: the selected Programs gate grows from nine suites and 175 tests to ten suites and 182 tests.

## Client Applicability

- All clients: no runtime change.
- Engineering governance: phase-capture completion and approval route behavior now run on pull requests.
- Tenant data: none read or written.

## Changes Included

- Supply the current scope-out, intended-outcome, and discovery-question fields in P0 success fixtures.
- Keep the partial-capture case expecting a 409 response.
- Add the repaired suite to the dedicated Programs governance workflow.
- Move the suite from the known-red triage list into the selected gate and update the executable wiring contract.

## QA / Validation

- Exact-main baseline: three failed and four passed tests; each failed success case received the expected completeness guard's 409 response.
- Updated route suite must pass all seven tests.
- The ten-suite governed subset must pass all 182 tests.
- Removing the phase-capture suite from the workflow must fail the wiring contract.
- TypeScript, scoped ESLint, release control, and diff hygiene run before review.

## Rollout Plan

Merge through the protected pull-request lane. The repository-owned main workflow may carry the commit in the next image, but there is no product behavior to activate.

## Deployment Authority

No ad-hoc deployment is authorized. Shared traffic may move only through the repository-owned ACA main workflow.

## Rollback Plan

Revert the pull request. The Programs governance workflow returns to its prior nine-suite subset; no product or data state changes.

## Audit Evidence

- Pull-request checks and the dedicated Programs governance workflow.
- `docs/architecture/programs-governance-integration-triage.json` records the selected and excluded suites.

## Known Gaps

Sixteen known-red Programs suites remain excluded and cataloged. Each requires its own behavioral repair before the gate widens again.
