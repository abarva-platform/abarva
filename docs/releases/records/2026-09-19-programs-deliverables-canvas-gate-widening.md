# 2026-09-19 Programs deliverables canvas gate widening

## Release ID

`2026-09-19-programs-deliverables-canvas-gate-widening`

## Status

`candidate`

## Plain-English Summary

The Programs deliverables-canvas integration suite treated source quote style as an import contract even though the mounted shared component imported and used the builder correctly. This release parses the TypeScript import structurally and adds the repaired suite to the dedicated Programs pull-request gate.

## Layer Impact

Release lane: `global-control-lane`.

- Product runtime: no change.
- Canonical data: no change.
- CI governance: the selected Programs gate grows from thirteen suites and 234 tests to fourteen suites and 269 tests.

## Client Applicability

- All clients: no runtime change.
- Engineering governance: deliverables-canvas wiring, readiness, evidence, disabled actions, and deterministic behavior now run on pull requests.
- Tenant data: none read or written.

## Changes Included

- Parse the builder import through the TypeScript syntax tree instead of matching quote style.
- Preserve all 35 deliverables-canvas wiring and runtime assertions.
- Add the repaired suite to the Programs governance workflow and executable wiring contract.

## QA / Validation

- PASS: exact-main baseline reproduced one failed and 34 passed tests despite the import being present.
- PASS: updated deliverables-canvas suite passed all 35 tests.
- PASS: the fourteen-suite governed subset passed all 269 tests.
- PASS: removing this suite from the workflow failed the wiring contract.
- PASS: TypeScript, scoped ESLint, release control, and diff hygiene completed successfully.

## Rollout Plan

Merge through the protected pull-request lane. The repository-owned main workflow may carry the commit in the next image, but there is no product behavior to activate.

## Deployment Authority

No ad-hoc deployment is authorized. Shared traffic may move only through the repository-owned ACA main workflow.

## Rollback Plan

Revert the pull request. The Programs governance workflow returns to its prior thirteen-suite subset; no product or data state changes.

## Audit Evidence

- Pull-request checks and the dedicated Programs governance workflow.
- `docs/architecture/programs-governance-integration-triage.json` records the selected and excluded suites.

## Known Gaps

Twelve known-red Programs suites remain excluded and cataloged. Each requires its own behavioral repair before the gate widens again.
