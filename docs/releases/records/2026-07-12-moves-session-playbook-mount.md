# 2026-07-12-moves-session-playbook-mount — Moves Session Playbook Mount

## Release ID

`2026-07-12-moves-session-playbook-mount`

## Status

`candidate`

## Plain-English Summary

Moves prepare steps now expose the existing facilitated-session playbook workflow. For phases P2 through P5, the live phase workspace still shows the platform-default phase workspace panel, and now also loads the real session playbook for the viewed phase with discussion guides, frameworks, capture templates, homework, alignment gates, and a button to generate the Session Pack into Files & Evidence.

## Layer Impact

- `global-control-lane`: Updates the shared Moves phase workspace for all clients using the live `/strategic-moves/[moveId]/phase/[phaseNum]` route.
- `product-ui`: Mounts an existing API-backed session playbook component in the live prepare step.
- `artifact-generation`: Uses the existing playbook POST endpoint to save a `design_session_pack` artifact into the Move Artifact Vault. No new generation endpoint is introduced.

## Client Applicability

- All clients: Yes. The shared Moves workspace receives the session playbook mount.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/components/strategic-moves/MovesPhaseStandaloneClient.tsx`: Mounts `SessionPlaybookPanel` under the P2-P5 prepare workspace.
- `src/components/strategic-moves/SessionPlaybookPanel.tsx`: Adds optional viewed-phase scoping for GET and POST calls and avoids abandoned async state updates after unmount.
- `src/components/strategic-moves/__tests__/MovesPhaseStandaloneClient.test.tsx`: Adds regression coverage for loading the phase-scoped playbook and generating the session pack into the File Cabinet.
- This release record.

## QA / Validation

- `npx eslint src/components/strategic-moves/MovesPhaseStandaloneClient.tsx src/components/strategic-moves/SessionPlaybookPanel.tsx src/components/strategic-moves/__tests__/MovesPhaseStandaloneClient.test.tsx` — Pass.
- `npx jest src/components/strategic-moves/__tests__/MovesPhaseStandaloneClient.test.tsx --runInBand` — Pass. Jest emitted existing duplicate manual mock warnings for GFM markdown packages.
- `node scripts/release-check.mjs --base origin/main --head HEAD` — Pass.
- `PATH=/Users/anand/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit -p .` — Pass under Node 24.14.0.

## Rollout Plan

Merge the PR to `main`, then let the repo-owned Azure Container Apps main deploy workflow build and deploy the approved image. After deployment, verify the ACA runtime invariant and run signed-in browser proof for a Moves prepare page with the session playbook.

## Deployment Authority

- Repo-owned deploy workflow: Required. Use the approved ACA main deploy workflow for shared Product/Lab traffic.
- Shared runtime mutators: None in this PR.
- Approved image digest: To be assigned by the ACA main deploy workflow after merge.
- ACA runtime invariant: Required post-deploy. The template image and 100% traffic revision image must match the approved digest.
- Worker image invariant: No worker image change expected.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, for a live Moves prepare page after deployment.

## Rollback Plan

Revert the PR and redeploy through the repo-owned ACA main deploy workflow. No migration, data-plane, or ingestion rollback is required.

## Audit Evidence

- PR URL: To be added after PR creation.
- Local focused Jest and lint output for the touched Moves files.
- Post-merge ACA deployment evidence and signed-in browser proof are required before marking this release as live-proven.

## Known Gaps

This PR only mounts `SessionPlaybookPanel`. `PhaseApproveAndBuild` and product placement for `NexusCurrentStateBriefingPanel` remain separate follow-up repair slices from the Moves orphaned-components audit.
