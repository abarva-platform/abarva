# 2026-08-22-moves-gate-ui-clarity — Moves Gate UI Clarity

## Release ID

`2026-08-22-moves-gate-ui-clarity`

## Status

`candidate`

## Plain-English Summary

Clarifies the Moves phase-gate UI so step input completion is not confused with artifact or approval readiness. Generated deliverables now show simple build status, while below-gate items explain that evidence is still needed before approval can advance.

## Layer Impact

- Product layer: Moves UI labels and explanatory copy only.
- Data layers: No Layer 1, Layer 2, Layer 3, Layer 4, canonical, projection, registry, tenant-data, or data-plane writes.

## Client Applicability

- All clients: Applies to Moves phase workspace UI.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Replaces "Gate-ready" and "Not gate-ready" deliverable row labels with "Built" and "Needs evidence."
- Clarifies that left-side checks mean inputs are captured, while gate approval still requires evidence, outputs, and approvals.
- Shortens gate detail labels to focus on why the gate is blocked and what happens after approval.
- Labels HTML exports as previews and Word links as downloads so client-final artifacts are not confused with browser review companions.

## QA / Validation

Status: `passed`.

- `npx jest src/components/strategic-moves/__tests__/phase-approve-and-build-settle.test.tsx --runInBand`
- `npx jest src/components/strategic-moves/__tests__/MovesPhaseStandaloneClient.test.tsx -t "does not label an approval step ready when hard gate criteria remain blocked" --runInBand`
- `npx eslint src/components/strategic-moves/PhaseApproveAndBuild.tsx src/components/strategic-moves/PhaseDocumentsPanel.tsx src/components/strategic-moves/MovesPhaseStandaloneClient.tsx src/components/strategic-moves/__tests__/phase-approve-and-build-settle.test.tsx src/components/strategic-moves/__tests__/MovesPhaseStandaloneClient.test.tsx`
- `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false`
- `npm run release:check`

## Rollout Plan

Merge through PR to main. The repo-owned ACA deploy workflow may rebuild and deploy the app image. No data migration, tenant data change, registry activation, or data-plane load is required.

## Deployment Authority

- Repo-owned deploy workflow: Allowed for main merge.
- Shared runtime mutators: None beyond the repo-owned deploy workflow.
- ACA runtime invariant: Required if deployed.
- Worker image invariant: Required if worker image changes as part of the repo-owned deploy.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, for visual confirmation on a signed-in Moves phase page after deploy.

## Rollback Plan

Revert the PR. No data rollback is required.

## Audit Evidence

- PR URL: https://github.com/abarva-platform/abarva/pull/6667
- Local validation commands listed above.

## Known Gaps

- This is a focused clarity pass. It does not change phase gates, evidence review rules, artifact quality scoring, role approvals, data loading, or deliverable generation.
