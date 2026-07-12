# 2026-07-12-moves-current-state-readiness-mount — Moves Current-State Readiness Mount

## Release ID

`2026-07-12-moves-current-state-readiness-mount`

## Status

`candidate`

## Plain-English Summary

Moves current-state and findings steps now show the governed current-state readiness panel when readiness data is available. The live phase page server-loads the real archetype/profile-based readiness report, then the client renders the existing readiness ladder, coverage score, hard gaps, upload affordances, and review controls before the prior static findings lanes.

## Layer Impact

- `global-control-lane`: Updates the shared Moves phase workspace for all clients using the live `/strategic-moves/[moveId]/phase/[phaseNum]` route.
- `product-ui`: Mounts an existing API-backed readiness component in the live current-state/findings branch.
- `read-model`: Reads existing current-state readiness sources; no schema, ingestion, or mutation behavior changes are introduced by this PR.

## Client Applicability

- All clients: Yes. The shared Moves phase workspace receives the mount.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/app/(maestro)/strategic-moves/[moveId]/phase/[phaseNum]/page.tsx`: Resolves current-state readiness from the Move archetype, tenant estate profile, and active phase, then passes it to the live client.
- `src/components/strategic-moves/MovesPhaseStandaloneClient.tsx`: Mounts `CurrentStateReadinessPanel` in the current-state/findings branch while preserving the existing findings lanes.
- `src/components/strategic-moves/__tests__/MovesPhaseStandaloneClient.test.tsx`: Adds regression coverage that the governed readiness panel appears in the P2 current-state workspace.
- This release record.

## QA / Validation

- `npx eslint 'src/app/(maestro)/strategic-moves/[moveId]/phase/[phaseNum]/page.tsx' src/components/strategic-moves/MovesPhaseStandaloneClient.tsx src/components/strategic-moves/__tests__/MovesPhaseStandaloneClient.test.tsx` — Pass.
- `npx jest src/components/strategic-moves/__tests__/MovesPhaseStandaloneClient.test.tsx --runInBand` — Pass. Jest emitted existing duplicate manual mock warnings for GFM markdown packages.
- `node scripts/release-check.mjs --base origin/main --head HEAD` — Pass.
- `PATH=/Users/anand/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit -p .` — Pass under Node 24.14.0.

## Rollout Plan

Merge the PR to `main`, then let the repo-owned Azure Container Apps main deploy workflow build and deploy the approved image. After deployment, verify the ACA runtime invariant and run signed-in browser proof for a Moves P2 current-state page.

## Deployment Authority

- Repo-owned deploy workflow: Required. Use the approved ACA main deploy workflow for shared Product/Lab traffic.
- Shared runtime mutators: None in this PR.
- Approved image digest: To be assigned by the ACA main deploy workflow after merge.
- ACA runtime invariant: Required post-deploy. The template image and 100% traffic revision image must match the approved digest.
- Worker image invariant: No worker image change expected.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, for a live Moves current-state/findings step after deployment.

## Rollback Plan

Revert the PR and redeploy through the repo-owned ACA main deploy workflow. No migration, data-plane, or ingestion rollback is required.

## Audit Evidence

- PR URL: To be added after PR creation.
- Local focused Jest and lint output for the touched Moves files.
- Post-merge ACA deployment evidence and signed-in browser proof are required before marking this release as live-proven.

## Known Gaps

This PR only mounts `CurrentStateReadinessPanel`. `SessionPlaybookPanel`, `PhaseApproveAndBuild`, and product placement for `NexusCurrentStateBriefingPanel` remain separate follow-up repair slices from the Moves orphaned-components audit.
