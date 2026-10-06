# 2026-09-19-programs-phase-filter-gate - Programs Phase Filter Gate Widening

## Release ID

`2026-09-19-programs-phase-filter-gate`

## Status

`candidate`

## Plain-English Summary

This change aligns the Programs phase-filter integration suite with the canonical lifecycle labels
already rendered by the product. It adds the repaired 35-test suite to the dedicated Programs
pull-request gate. Product runtime behavior is unchanged.

## Layer Impact

Release lane: `global-control-lane`.

- Layer 4 - Products: Programs test coverage only. Product behavior is unchanged.
- CI governance: the selected Programs gate grows from seventeen suites and 334 tests to eighteen suites and 369 tests.

## Client Applicability

- All clients: Test coverage applies to the shared Programs product surface.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/__tests__/integration/programs/phase-filter-view.test.ts`
- `.github/workflows/programs-governance-integration.yml`
- `docs/architecture/programs-governance-integration-triage.json`
- `src/__tests__/behaviors/programs-governance-integration-ci.test.ts`

## QA / Validation

- PASS - repaired phase-filter suite, 35 tests.
- PASS - eighteen-suite governed Programs subset, 369 tests.
- PASS - workflow-removal mutation failed the wiring contract as expected.
- PASS - scoped ESLint.
- PASS - TypeScript with an 8 GB heap.
- PASS - `npm run release:check`.

## Rollout Plan

Merge the pull request to main. The repository-owned deploy workflow may carry this repository-only
change in a later image; no product behavior needs activation.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` only if the commit is carried in a web image.
- Shared runtime mutators: None.
- Approved image digest: Not applicable.
- ACA runtime invariant: Not applicable.
- Worker image invariant: Not applicable.
- Feature/env flag update path: None.
- Live signed-in proof required: No.

## Rollback Plan

Revert the pull request. The Programs governance workflow returns to its prior seventeen-suite subset;
no product or data state changes.

## Audit Evidence

- Local validation commands are listed above.

## Known Gaps

Eight known-red Programs suites remain excluded and cataloged. Each requires a behavioral repair
before the gate widens again.
