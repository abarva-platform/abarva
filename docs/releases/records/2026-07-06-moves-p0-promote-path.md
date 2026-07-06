# 2026-07-06-moves-p0-promote-path — Moves P0 Promotion Path

## Release ID

`2026-07-06-moves-p0-promote-path`

## Status

`candidate`

## Plain-English Summary

This release fixes the Moves P0 Originate workbench so a user who has completed the origination inputs can approve the brief and advance into P1 from the page. The P0 capture cards now use the same canonical field contract as the backend, and the visible P0 action saves the complete capture packet before calling the governed phase-gate approval route.

## Layer Impact

- `global-control-lane`: Updates shared Moves phase-workbench behavior for every tenant using Strategic Moves.
- `public-demo`: Improves the end-to-end demo path by making P0 visibly executable instead of leaving a completed intake stuck without an advance affordance.

## Client Applicability

- All clients: Strategic Moves P0-P5 phase workbench contract alignment applies globally.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/components/strategic-moves/StrategicMovePhaseClient.tsx`
  - Derives P0-P5 capture cards from `getPhaseCaptureSections`.
  - Adds a P0 `Approve brief & advance to P1` action.
  - Persists complete P0 capture to `/api/v1/programs/:programId/phase-capture`.
  - Calls `/api/v1/programs/:programId/phase-gate-approval` for governed P0 advancement.
  - Uses Next router navigation for phase transitions.
- `src/components/strategic-moves/__tests__/StrategicMovePhaseClient.operating-layer.test.tsx`
  - Adds P0 render and click-path coverage.
  - Verifies all eight canonical P0 fields are posted before gate approval.
- `src/lib/programs/__tests__/phase-capture-workspace-alignment.test.ts`
  - Expands capture-contract drift protection to P0-P5.

## QA / Validation

- Pass: `jest --runTestsByPath src/components/strategic-moves/__tests__/StrategicMovePhaseClient.operating-layer.test.tsx src/lib/programs/__tests__/phase-capture-workspace-alignment.test.ts src/lib/programs/__tests__/phase-capture-contract.test.ts`
- Pass: `eslint src/components/strategic-moves/StrategicMovePhaseClient.tsx src/components/strategic-moves/__tests__/StrategicMovePhaseClient.operating-layer.test.tsx src/lib/programs/__tests__/phase-capture-workspace-alignment.test.ts`
- Pass: `git diff --check`
- Not run: Signed-in browser proof on `https://app.abarva.ai`; this candidate is not production-proven until deployed and browser-tested.
- Known test warning: Jest reports pre-existing duplicate manual mocks for GFM/Markdown packages before running the focused suite.

## Rollout Plan

Merge to `main`, build an Azure Container Apps image from the merged SHA, deploy to `ca-abarva-web-lab-eastus`, shift 100% traffic after healthy revision, then run signed-in browser proof for a Moves P0-to-P1 advancement.

## Deployment Authority

- Repo-owned deploy workflow: Required for ACA release.
- Shared runtime mutators: Azure Container Apps image/revision only.
- Approved image digest: Not assigned yet.
- ACA runtime invariant: Must verify active revision, image digest, and 100% traffic.
- Worker image invariant: No worker change expected.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes.

## Rollback Plan

Rollback the ACA revision to the previous healthy image if live P0 advancement regresses. No database migration is included.

## Audit Evidence

- Focused Jest output showing 18/18 targeted tests passed.
- Targeted ESLint output with no errors or warnings.
- `git diff --check` output with no whitespace issues.
- Future proof required: signed-in browser screenshots for P0 complete state and post-click P1 navigation.

## Known Gaps

- Production deployment and live signed-in browser proof are not yet complete.
- This release does not prove every P1-P5 deliverable generation path end-to-end; it prevents capture-key drift across P0-P5 and proves the P0 click path locally.
