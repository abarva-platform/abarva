# 2026-07-12-moves-phase-workspace-v2-mount — Moves Phase Workspace V2 Mount

## Release ID

`2026-07-12-moves-phase-workspace-v2-mount`

## Status

`candidate`

## Plain-English Summary

Moves phases P2 through P5 now use the existing platform-default phase workspace panel on the live Moves workspace prepare step. This replaces the old static prepare cards for those phases with the real task checklist, evidence readiness, gate readiness, and feed-forward panel already present in the codebase, while preserving the existing Files & Evidence, solution canvas, and gate approval workflows.

## Layer Impact

- `global-control-lane`: Updates the shared Moves user interface used by the live program workspace for all clients. No tenant-specific data, schema, migration, or ingestion behavior changes.
- `product-ui`: Mounts an existing Moves phase workspace component from the live standalone client path and wires its task actions to existing navigation controls.

## Client Applicability

- All clients: Yes. The change applies to the shared Moves workspace when viewing phases P2 through P5.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None. This becomes active through the normal application release path.

## Changes Included

- `src/components/strategic-moves/MovesPhaseStandaloneClient.tsx`: Mounts `MovePhaseWorkspacePanel` for P2 through P5 prepare steps and maps existing evidence, gate, and carry-forward data into its contract.
- `src/components/strategic-moves/__tests__/MovesPhaseStandaloneClient.test.tsx`: Adds regression coverage that the v2 workspace is mounted and that its evidence/gate task actions open the existing Files & Evidence and gate approval workflows.
- This release record.

## QA / Validation

- `npx eslint src/components/strategic-moves/MovesPhaseStandaloneClient.tsx src/components/strategic-moves/__tests__/MovesPhaseStandaloneClient.test.tsx` — Pass.
- `npx jest src/components/strategic-moves/__tests__/MovesPhaseStandaloneClient.test.tsx --runInBand` — Pass. Jest emitted existing duplicate manual mock warnings for GFM markdown packages.
- `node scripts/release-check.mjs --base origin/main --head HEAD` — Pass.
- `PATH=/Users/anand/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit -p .` — Pass under Node 24.14.0. A plain local shell run under Node 25.9.0 hit a V8 heap limit before this Node 24 rerun.

## Rollout Plan

Merge the PR to `main`, then let the repo-owned Azure Container Apps main deploy workflow build and deploy the approved image. After deployment, verify the affected Moves route in a signed-in browser session before claiming the change is live-proven.

## Deployment Authority

- Repo-owned deploy workflow: Required. Use the approved ACA main deploy workflow for shared Product/Lab traffic.
- Shared runtime mutators: None in this PR.
- Approved image digest: To be assigned by the ACA main deploy workflow after merge.
- ACA runtime invariant: Required post-deploy. The template image and 100% traffic revision image must match the approved digest.
- Worker image invariant: No worker image change expected.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, for the live Moves workspace after deployment.

## Rollback Plan

Revert the PR and redeploy through the repo-owned ACA main deploy workflow. No migration, data-plane, or ingestion rollback is required.

## Audit Evidence

- PR URL: To be added after PR creation.
- Local focused Jest output for `MovesPhaseStandaloneClient.test.tsx`.
- Post-merge ACA deployment evidence and signed-in browser proof are required before marking this release as live-proven.

## Known Gaps

This PR only mounts `MovePhaseWorkspacePanel` for P2 through P5. Other orphaned Moves components from the audit, including `CurrentStateReadinessPanel`, `SessionPlaybookPanel`, `PhaseApproveAndBuild`, and `NexusCurrentStateBriefingPanel`, remain separate follow-up PRs. This slice does not add new approved Inputs Pack, pattern assembly, or final-version upload behavior beyond wiring the mounted panel to existing live workflows.
