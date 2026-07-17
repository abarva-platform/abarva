# 2026-07-17-moves-next-phase-readiness-build-fix — Moves Gate Build Readiness Alignment

## Release ID

`2026-07-17-moves-next-phase-readiness-build-fix`

## Status

`candidate`

## Plain-English Summary

Live P1 smoke showed the gate UI blocking the current phase build because it treated next-phase preparation gaps as current-phase evidence blockers. That created a chicken-and-egg: the P1 charter deliverable could not be built because P2 prep needs were still open, while the P1 gate required the charter to be signed off. This release keeps next-phase readiness guidance visible, but does not disable the current phase Approve & Build action unless a caller explicitly marks evidence gaps as current-phase blockers.

## Layer Impact

- `global-control-lane`: Updates shared Moves phase UI behavior for Approve & Build and evidence/readiness copy.
- `client-data-lane`: No schema or data mutations are included.

## Client Applicability

- All clients: Moves phase workspaces using the shared Approve & Build component.
- Specific clients: Meridian Healthcare Agent Assist is the live smoke path.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/components/strategic-moves/PhaseApproveAndBuild.tsx`
  - Next-phase evidence gaps are displayed as preparation guidance, not default build blockers.
  - Current-phase blocking remains available through an explicit `blockOnEvidenceGaps` prop.
- `src/components/strategic-moves/MovesPhaseStandaloneClient.tsx`
  - Input count now uses committed readiness instruments or real linked evidence, not the number of requested evidence packets.
- `src/components/strategic-moves/__tests__/MovesPhaseStandaloneClient.test.tsx`
  - Regression coverage for next-phase gaps remaining visible while Approve & Build stays enabled.

## QA / Validation

- `pass`: `npx jest src/components/strategic-moves/__tests__/MovesPhaseStandaloneClient.test.tsx --runInBand`
- `blocked`: `npx jest src/components/strategic-moves/__tests__/MovesPhaseStandaloneClient.test.tsx src/components/strategic-moves/__tests__/moves-liability-visible-controls.test.tsx --runInBand` hit the existing Clerk ESM parse issue in `moves-liability-visible-controls.test.tsx`; the changed shell regression passed in isolation.
- `pass`: `npx eslint src/components/strategic-moves/PhaseApproveAndBuild.tsx src/components/strategic-moves/MovesPhaseStandaloneClient.tsx src/components/strategic-moves/__tests__/MovesPhaseStandaloneClient.test.tsx`
- `pass`: `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false -p tsconfig.json`
- `pass`: `npm run release:check`
- `pass`: `git diff --check`
- `not-run`: Signed-in Meridian P1 gate retry after deploy.

## Rollout Plan

1. Merge PR to `main`.
2. Let the repo-owned ACA main deploy workflow build and deploy the digest-pinned image.
3. Verify ACA runtime invariant.
4. Retry the signed-in Meridian P1 gate: current phase build should be enabled, next-phase prep gaps should remain visible as guidance, and gate/build should progress or return a truthful current-phase blocker.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: None beyond the repo-owned deploy workflow.
- Approved image digest: Pending post-merge ACA deploy.
- ACA runtime invariant: Pending post-merge ACA deploy.
- Worker image invariant: Pending post-merge ACA deploy.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, Meridian Moves P1 gate retry.

## Rollback Plan

Roll back by deploying the previous known-good ACA image. No data rollback is required because this release changes UI/control behavior only.

## Audit Evidence

- PR URL: Pending
- GitHub checks: Pending
- ACA deploy run: Pending
- Signed-in Meridian proof: Pending

## Known Gaps

P0-P5 smoke is still in progress. This release only addresses the current blocker discovered at the P1 gate.
