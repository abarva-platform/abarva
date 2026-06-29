# 2026-06-29 Moves Documents Presentation Polish

## Release ID

`2026-06-29-moves-documents-presentation-polish`

## Status

`candidate`

## Plain-English Summary

This release cleans up the Moves demo presentation view for the Documents tab. It keeps the artifact downloads, phase sections, and review actions intact, but removes internal gate/AI-draft labels and softens board-grade wording so the page reads like a client-ready walkthrough instead of an operator workspace.

## Layer Impact

- `global-control-lane`: Updates shared Strategic Moves UI components. The change is presentation-only and does not alter generation, evidence gates, tenancy, artifacts, or data-plane writes.
- `public-demo`: Improves the `demo=1` Moves presentation route used for screenshots, demos, and marketing walkthroughs.

## Client Applicability

- All clients: the executive artifact blurb wording is softened globally.
- Public/demo only: the reduced document labels are active only when the Moves detail page runs in presentation mode.
- Feature flag: no new feature flag.

## Changes Included

- `src/components/strategic-moves/PhaseDocumentsPanel.tsx`
- `src/components/strategic-moves/StrategicMoveDetailView.tsx`
- `src/components/strategic-moves/BoardArtifactsPanel.tsx`

## QA / Validation

- Passed: `npx eslint src/components/strategic-moves/StrategicMoveDetailView.tsx src/components/strategic-moves/PhaseDocumentsPanel.tsx src/components/strategic-moves/BoardArtifactsPanel.tsx`
- Passed: `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit`
- Passed: `npx jest src/components/strategic-moves/__tests__/BoardArtifactsPanel.test.tsx --runInBand`
- Passed: `npm run release:check`
- Pending: signed-in Lakeshore browser proof after ACA deployment.

## Rollout Plan

Merge to `main`, build the exact merged SHA into ACR, deploy through Azure Container Apps, pin 100% traffic to the healthy revision, and run signed-in browser proof against the Lakeshore Moves presentation route.

## Deployment Authority

- Repo-owned deploy workflow: Azure Container Apps production/lab lane.
- Shared runtime mutators: none.
- Approved image digest: captured after ACR build.
- ACA runtime invariant: deploy only to `ca-abarva-web-lab-eastus`.
- Worker image invariant: no worker changes.
- Feature/env flag update path: none.
- Live signed-in proof required: yes.

## Rollback Plan

Reassign ACA traffic to the prior healthy revision or redeploy the previous image. No migration or data rollback is required.

## Audit Evidence

- Pull request, CI result, ACA revision/digest, and signed-in screenshot proof will be attached after rollout.

## Known Gaps

This polish intentionally does not redesign the normal operator workspace, phase approval flow, artifact generation flow, or evidence/readiness logic. It only reduces label noise in the presentation route and softens executive artifact wording; any deeper redesign of the Documents information architecture remains a separate product-design task.
