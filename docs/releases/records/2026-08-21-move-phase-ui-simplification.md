# 2026-08-21-move-phase-ui-simplification — Move Phase UI Simplification

## Release ID

`2026-08-21-move-phase-ui-simplification`

## Status

`candidate`

## Plain-English Summary

Simplifies the Strategic Moves phase workspace so the page emphasizes the few signals an approver needs: phase inputs, gate readiness, next action, evidence posture, and the governed approval button. The aVa panel now makes its role explicit: it may draft proposed phase inputs from approved upstream state and evidence, but the user must review and save those values before they become governed state.

## Layer Impact

- Layer 4 Products: Updates the Moves user interface only. No canonical data, tenant input files, registry state, graph state, retrieval index, or data-plane schema is changed.

## Client Applicability

- All clients: Strategic Moves phase workspace UI.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/components/strategic-moves/MovesPhaseStandaloneClient.tsx`
- `src/components/strategic-moves/__tests__/MovesPhaseStandaloneClient.test.tsx`

## QA / Validation

- `npx jest src/components/strategic-moves/__tests__/MovesPhaseStandaloneClient.test.tsx --runInBand` — passed, 68/68 tests.

## Rollout Plan

Merge through the repository PR path. The repo-owned Azure Container Apps main deploy workflow will build and deploy the image for `app.abarva.ai`.

## Deployment Authority

- Repo-owned deploy workflow: Required after merge to main.
- Shared runtime mutators: None outside the repo-owned deploy.
- Approved image digest: Captured by the deploy workflow.
- ACA runtime invariant: Required before claiming live.
- Worker image invariant: Required by the deploy workflow.
- Feature/env flag update path: None.
- Live signed-in proof required: Visual/UI smoke for the Moves phase workspace after deploy.

## Rollback Plan

Revert the PR and redeploy through the repo-owned main deploy workflow. No migration or data rollback is required.

## Audit Evidence

- PR URL: to be added by the PR.
- Local focused test: `npx jest src/components/strategic-moves/__tests__/MovesPhaseStandaloneClient.test.tsx --runInBand`.
- Deployment evidence: ACA deploy run and runtime-invariant proof after merge.

## Known Gaps

- This does not add autonomous field writes. aVa drafting remains advisory until the user reviews and saves proposed values through the existing governed capture path.
