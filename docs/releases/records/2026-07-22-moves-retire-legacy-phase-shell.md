# 2026-07-22-moves-retire-legacy-phase-shell — Retire Old Moves Phase Pages

## Release ID

`2026-07-22-moves-retire-legacy-phase-shell`

## Status

`candidate`

## Plain-English Summary

Moves now uses the Finder-style phase shell as the only supported phase workspace. The old horizontal stepper, legacy prepare wall, feature-gated fallback wrappers, and old approvals fallback paths are removed from the live components instead of being hidden behind flags. P0 still uses the new origination shell, while P1-P5 use the universal two-column contract shell with phase inputs, workflow steps, Files & Evidence, Phase Intelligence, and Approvals.

## Layer Impact

- `global-control-lane`: shared Strategic Moves UI rendering and navigation behavior changes for the phase workspace.
- Runtime data behavior: no schema, migration, tenant data, evidence-policy, or generation-contract changes. The change preserves existing upload, evidence, Approve & Build, and Files & Evidence call paths.

## Client Applicability

- All clients: all tenants that can access Strategic Moves receive the retired legacy shell behavior after deployment.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none for the phase shell fallback after this release. The Finder/contract shell is the supported path.

## Changes Included

- Retired legacy feature-gated render wrappers from `MovePhaseExplorer`.
- Retired legacy feature-gated render wrappers and old horizontal stepper/body fallback from `MovesPhaseStandaloneClient`.
- Kept the P0 Finder origination shell and P1-P5 contract shell as the only phase-page render paths.
- Kept the rail collapse/expand control and Approvals overview always reachable from the workspace rail.
- Fixed deep-link/review behavior so explicit substep links and Approvals "Review & approve" land on the intended contract step instead of leaving a stale phase-input row selected.
- Fixed terminal-complete P5 initialization so completed Moves land on the final handoff step rather than the first prep step.
- Updated Moves shell tests to assert the retired old labels/buttons are absent and the new shell remains interactive.

## QA / Validation

Candidate validation:

- `npx jest src/components/strategic-moves/__tests__/MovesPhaseStandaloneClient.test.tsx src/components/strategic-moves/__tests__/MovePhaseExplorer.finder-shell.test.tsx --runInBand` — pass, 44 tests.
- Stale live-code grep for old shell symbols/copy — pass for component/CSS files; remaining matches are negative assertions in tests only.
- `npx eslint src/components/strategic-moves/MovesPhaseStandaloneClient.tsx src/components/strategic-moves/MovePhaseExplorer.tsx src/components/strategic-moves/__tests__/MovesPhaseStandaloneClient.test.tsx src/components/strategic-moves/__tests__/MovePhaseExplorer.finder-shell.test.tsx` — pass.
- `npm run release:check` — pass.
- `git diff --check` — pass.
- `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false -p tsconfig.json` — blocked by unrelated missing dependency install for existing Home graph imports: `@xyflow/react` and `@dagrejs/dagre`; no Moves files are in the TypeScript error set.

Full validation to complete before release:

- ACA runtime invariant after merge/deploy.
- Signed-in browser smoke proving P0-P5 do not render the retired page shell on `app.abarva.ai`.

## Rollout Plan

Open a PR against `main`, squash merge after local validation, and let the repo-owned ACA main deploy workflow build and deploy the exact merge SHA. After deployment, verify the ACA runtime invariant and run a signed-in browser smoke on a non-mutating Move route set.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: repo-owned ACA deploy workflow only.
- Approved image digest: pending merge/deploy.
- ACA runtime invariant: pending merge/deploy.
- Worker image invariant: no worker image change expected.
- Feature/env flag update path: none; this release removes the phase-shell fallback dependency instead of changing runtime flags.
- Live signed-in proof required: yes.

## Rollback Plan

Revert the PR and redeploy the previous healthy ACA image digest through the repo-owned deploy workflow. No database rollback is required.

## Audit Evidence

- PR URL: pending.
- Merge SHA: pending.
- ACA revision/digest/traffic proof: pending.
- Signed-in browser smoke proof: pending.
- Focused Jest proof: pending PR artifact/log.

## Known Gaps

- This release retires the old phase page render paths. It does not redesign the content quality of generated deliverables, change evidence review policy, or mutate any Move records.
