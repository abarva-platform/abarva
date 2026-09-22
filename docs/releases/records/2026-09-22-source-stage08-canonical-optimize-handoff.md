# 2026-09-22-source-stage08-canonical-optimize-handoff — Source Stage 08 Canonical Contract and Optimize Handoff

## Release ID

`2026-09-22-source-stage08-canonical-optimize-handoff`

## Status

`candidate`

## Plain-English Summary

Source Stage 08 now shows the next governed handoff step after an executed award/SOW package: a read-only canonical contract identity review and a blocked Optimize path. The panel can identify the pending contract-mapping basis from the event and accepted executed evidence, but it still refuses to create a canonical contract, publish a Contract 360 row, launch Optimize, notify suppliers, or imply signature/legal approval.

## Layer Impact

`global-control-lane`: extends the existing shared Source Stage 08 readiness projection and mounted panel. It remains a read-only Layer 4 product projection over stage and artifact records.

No Layer 1 intake, Layer 2 adapter, Layer 3 canonical write, schema, migration, tenant-data mutation, supplier action, signature action, or approval workflow is changed.

## Client Applicability

- All clients: Source users viewing Stage 08 / Transition readiness.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Extends `src/lib/source/award-sow-handoff-readiness-types.ts` with canonical-contract projection and Optimize path review-plan types.
- Updates `src/lib/source/award-sow-handoff-readiness.ts` so a complete executed Stage 08 package produces a blocked human-review plan for canonical identity and Optimize.
- Updates `src/components/source/SourceAwardSowHandoffReadinessPanel.tsx` so the existing mounted panel visibly shows canonical identity and Optimize path states.
- Adds focused assertions in the Stage 08 builder and panel suites.

## QA / Validation

- Red-first verification: `npx jest --runTestsByPath src/lib/source/__tests__/award-sow-handoff-readiness.test.ts --runInBand` failed before implementation because `canonicalContractProjection` and `optimizePath` were absent.
- Focused green: `npx jest --runTestsByPath src/lib/source/__tests__/award-sow-handoff-readiness.test.ts --runInBand` — 4 tests passed.
- Focused mounted green: `npx jest --runTestsByPath src/__tests__/integration/source/source-award-sow-handoff-readiness.test.ts src/__tests__/integration/source/source-award-sow-handoff-readiness-panel.test.ts --runInBand` — 15 tests passed.
- Mutation proof: temporarily flipping the Optimize path planner to return `launchAllowed: true` made `npx jest --runTestsByPath src/lib/source/__tests__/award-sow-handoff-readiness.test.ts --runInBand` fail on the new launch refusal assertion; the refusal was restored and the suite returned green.
- TypeScript: `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false` — exit 0.
- Scoped lint: `npx eslint src/lib/source/award-sow-handoff-readiness.ts src/lib/source/award-sow-handoff-readiness-types.ts src/components/source/SourceAwardSowHandoffReadinessPanel.tsx src/lib/source/__tests__/award-sow-handoff-readiness.test.ts src/__tests__/integration/source/source-award-sow-handoff-readiness.test.ts src/__tests__/integration/source/source-award-sow-handoff-readiness-panel.test.ts` — exit 0.
- Release check: `npm run release:check` — exit 0.
- Diff check: `git diff --check` — exit 0.

## Rollout Plan

Merge through a GitHub pull request. The repo-owned Azure Container Apps main deploy workflow builds and deploys the shared product image from `main`. No manual Azure mutation, migration apply, tenant-data job, or feature-flag update is part of this release.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: none in this PR
- Approved image digest: assigned by the repo-owned deploy workflow after merge
- ACA runtime invariant: required after deploy before claiming runtime proof
- Worker image invariant: required after deploy before claiming runtime proof
- Feature/env flag update path: not applicable
- Live signed-in proof required: yes, because the Source Stage 08 panel is visible product UI

## Rollback Plan

Revert the PR. Rollback removes the read-only canonical identity and Optimize path display from Stage 08 readiness; it does not alter tenant data, schema, contracts, approvals, or supplier communications.

## Audit Evidence

- Pull request: pending.
- CI runs: pending.
- ACA deploy/runtime invariant: pending after merge.
- Signed-in Source Stage 08 acceptance: pending after deploy.

## Known Gaps

This release does not create canonical contract rows, Contract 360 projection rows, Optimize cases, executed contracts, awards, signatures, legal approvals, finance approvals, client-final approvals, supplier notices, or data-plane jobs. Those remain separate governed actions.
