# 2026-09-19-programs-workshop-notes-gate - Programs Workshop Notes Gate Widening

## Release ID

`2026-09-19-programs-workshop-notes-gate`

## Status

`candidate`

## Plain-English Summary

This change makes the Programs workshop-notes integration suite verify the shared detail component
through structural imports and rendered panel placement instead of quote style or JSX line shape.
It adds the repaired 17-test suite to the dedicated Programs pull-request gate. Product runtime
behavior is unchanged.

## Layer Impact

Release lane: `global-control-lane`.

- Layer 4 - Products: Programs test coverage only. Product behavior is unchanged.
- CI governance: the selected Programs gate grows from fifteen suites and 305 tests to sixteen suites and 322 tests.

## Client Applicability

- All clients: Test coverage applies to the shared Programs product surface.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/__tests__/integration/programs/programs-detail-prog25-workshop-notes-plan.test.ts`
- `.github/workflows/programs-governance-integration.yml`
- `docs/architecture/programs-governance-integration-triage.json`
- `src/__tests__/behaviors/programs-governance-integration-ci.test.ts`

## QA / Validation

- PASS - repaired workshop-notes suite, 17 tests.
- PASS - sixteen-suite governed Programs subset, 322 tests.
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

Revert the pull request. The Programs governance workflow returns to its prior fifteen-suite subset;
no product or data state changes.

## Audit Evidence

- Local validation commands are listed above.

## Known Gaps

Ten known-red Programs suites remain excluded and cataloged. Each requires a behavioral repair
before the gate widens again.
