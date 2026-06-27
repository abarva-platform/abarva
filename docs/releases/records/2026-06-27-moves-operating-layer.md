# 2026-06-27-moves-operating-layer — Moves What We Need Next + Artifact Quality Loop

## Release ID

`2026-06-27-moves-operating-layer`

## Status

`candidate`

## Plain-English Summary

Strategic Moves now has the missing operating layer that tells a client what evidence is still needed, why it matters, which artifacts are blocked, what can still be drafted with caveats, which artifacts already exist, and what review feedback should drive the next regenerated version.

## Layer Impact

- `global-control-lane`: shared Strategic Moves UI/API behavior for all clients. The change is universal and keyed by move evidence families and deliverable types, not by tenant-specific code.
- No client data-plane migration: this release reads existing move evidence, deliverable runs, board artifacts, uploads, and review feedback.

## Client Applicability

- All clients: yes, any Strategic Move using the evidence-readiness and document surfaces.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- Added `MoveEvidenceNeedPacket` builder for phase/artifact-specific evidence asks.
- Extended the evidence-readiness API to return `whatWeNeedNext`.
- Added a reusable `MoveEvidenceNeedsPanel`.
- Rendered What We Need Next in phase workspaces and the Evidence Hub/Documents surfaces.
- Reconciled canonical phase document counts with board-grade artifact availability.
- Clarified board-grade artifact wording so client-visible copy avoids implementation terms.
- Labeled phase generation as preliminary when required evidence is missing.
- Exposed a minimal visible review-feedback loop from uploaded client comments.
- Added a client-safe quality envelope to deliverable run status responses.

## QA / Validation

- `npm test -- --runTestsByPath src/lib/programs/evidence-readiness/__tests__/move-evidence-need-packet.test.ts src/lib/programs/discovery/__tests__/evidence-readiness.test.ts src/components/strategic-moves/__tests__/BoardArtifactsPanel.test.tsx` passed.
- Focused ESLint on touched Moves files passed.
- `npx tsc --noEmit` was attempted but remains blocked by pre-existing missing type dependencies for `js-yaml`, `@azure-rest/ai-document-intelligence`, and `@axe-core/playwright`.

## Rollout Plan

Merge to main, build the Azure Container Apps image from the merge commit, deploy through the approved ACA main lane, then run signed-in Lakeshore proof on the target move.

## Deployment Authority

- Repo-owned deploy workflow: Azure Container Apps main deploy lane.
- Shared runtime mutators: none.
- Approved image digest: assigned at deploy time.
- ACA runtime invariant: deploy to `ca-abarva-web-lab-eastus` with 100% traffic to the healthy revision.
- Worker image invariant: no worker-specific image change.
- Feature/env flag update path: none.
- Live signed-in proof required: yes.

## Rollback Plan

Rollback to the previous ACA revision. No schema or data migration rollback is required.

## Audit Evidence

- Focused Jest and ESLint output from this candidate branch.
- Signed-in Lakeshore browser proof after deploy should capture Evidence Hub, phase workspace, evidence-readiness API, generation blocked/preliminary labeling, and artifact inventory.

## Known Gaps

- Adaptive rigor remains out of scope.
- Full review/regenerate persistence is still lightweight: uploaded feedback is visible and tied to the next phase run, but a richer before/after diff view remains future work.
