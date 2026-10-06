# 2026-09-19-programs-prog21-gate-drawer-test — Programs Gate Drawer Gate Widening

## Release ID

`2026-09-19-programs-prog21-gate-drawer-test`

## Status

`candidate`

## Plain-English Summary

This change hardens a Programs integration test so it verifies the gate drawer import contract by
parsing the component source instead of depending on quote formatting. It also adds the repaired
36-test suite to the dedicated Programs pull-request gate. Product runtime behavior is unchanged.

## Layer Impact

Release lane: `global-control-lane`.

- Layer 4 — Products: Programs test coverage only. The product projection and user interface behavior are unchanged.
- CI governance: the selected Programs gate grows from fourteen suites and 269 tests to fifteen suites and 305 tests.

## Client Applicability

- All clients: Test coverage applies to the shared Programs product surface.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/__tests__/integration/programs/programs-detail-prog21-gate-drawer.test.ts`
- `.github/workflows/programs-governance-integration.yml`
- `docs/architecture/programs-governance-integration-triage.json`
- `src/__tests__/behaviors/programs-governance-integration-ci.test.ts`

## QA / Validation

- PASS — `npm exec -- jest src/__tests__/integration/programs/programs-detail-prog21-gate-drawer.test.ts --runInBand`
- PASS — fifteen-suite governed Programs subset, 305 tests.
- PASS — workflow-removal mutation failed the wiring contract as expected.
- PASS — `npm exec -- eslint src/__tests__/integration/programs/programs-detail-prog21-gate-drawer.test.ts`
- PASS — `node --max-old-space-size=8192 ./node_modules/typescript/bin/tsc --noEmit`
- PASS — `npm run release:check`

## Rollout Plan

Merge the PR to main. The repository-owned main workflow may include the repository-only change in
the next image, but no product behavior needs activation.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` only if the commit is carried in a web image.
- Shared runtime mutators: None.
- Approved image digest: Not applicable.
- ACA runtime invariant: Not applicable.
- Worker image invariant: Not applicable.
- Feature/env flag update path: None.
- Live signed-in proof required: No.

## Rollback Plan

Revert the pull request. The Programs governance workflow returns to its prior fourteen-suite subset;
no product or data state changes.

## Audit Evidence

- PR URL: https://github.com/abarva-platform/abarva/pull/7902
- Local validation commands listed above.

## Known Gaps

Eleven known-red Programs suites remain excluded and cataloged. Each requires its own behavioral
repair before the gate widens again.
