# 2026-07-21-moves-p5-universal-shell — P5 Execute Contract Shell

## Release ID

`2026-07-21-moves-p5-universal-shell`

## Status

`deployed-browser-proof-blocked`

## Plain-English Summary

Moves P5 Prepare to Execute now uses the same contract-shell pattern proven on P0, P1, P2, P3, and P4 when the Finder shell flag is enabled. Instead of opening on the older generic prepare surface, P5 opens on the first real execution-readiness input and keeps mobilization, launch readiness, value-proof, first-90-days, governance, risk, and launch recommendation inputs plus workflow steps in one left-side contract rail. Execution Readiness and Approve & Build continue to render their existing governed controls in the right detail pane.

## Layer Impact

- Product UX / Moves: Changes the P5 presentation only when `moves_finder_shell_v1` is enabled.
- Governance workflow: No gate, upload, evidence-readiness, context extract, Approve & Build, artifact-generation, or Tower handoff business logic is changed. Existing P5 controls are rendered through the same detail pane.
- Runtime control: The change remains behind the existing Moves Finder shell flag and deploys through the Azure Container Apps main lane.

## Client Applicability

- All clients: No default global change outside the enabled flag path.
- Specific clients: Tenants currently enabled for `moves_finder_shell_v1`, including Meridian, SkyHarbor, Lakeshore, and First Capital where the flag is active.
- Internal only: No.
- Public/demo only: No.
- Feature flag: `moves_finder_shell_v1`.

## Changes Included

- `src/components/strategic-moves/MovesPhaseStandaloneClient.tsx`
  - Reuses the P1-P4 `PhaseContractStepsCanvas` for P5.
  - Defaults P5 to the first guided execution-readiness input row so the terminal phase starts with mobilization planning context.
  - Keeps P5 Execution Readiness and Approve & Build backed by the existing `PhaseBody` implementation.
- `src/components/strategic-moves/__tests__/MovesPhaseStandaloneClient.test.tsx`
  - Adds P5 shell coverage to assert the contract-card renderer, real P5 input rows, workflow rows, and absence of the older generic finder/prepare wall.

## QA / Validation

- Pass: `npx jest src/components/strategic-moves/__tests__/MovesPhaseStandaloneClient.test.tsx --runInBand`
  - Notes: Existing duplicate manual mock warnings and existing Clerk error-boundary console output are still present in this suite.
- Pass: `npx eslint src/components/strategic-moves/MovesPhaseStandaloneClient.tsx src/components/strategic-moves/__tests__/MovesPhaseStandaloneClient.test.tsx`
- Pass: `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false -p tsconfig.json`
- Pass: CSS parse check for `src/components/strategic-moves/StrategicMoves.module.css`
- Pass: `npm run build`
- Pass: `npm run release:check`
- Pass: `git diff --check`
- Pass: PR #5249 checks passed before merge.
- Pass: ACA deploy for P5 merge SHA `0d42558d396ef3fa7363b5b8cbde424b5510591a` completed successfully.
- Pass: Current ACA production/lab runtime includes the P5 shell via later main SHA `b65d35d9be27cbc3200bc1369e29e34faf3a0052`, revision `ca-abarva-web-lab-eastus--mb65d35d9`, with 100% traffic on digest `sha256:0df6c8d2db959fbb263f558291d775b84ac2b37fa9252b33e584dde4e1917ac6`.
- Blocked: signed-in browser proof on a real P5 route. Accessible signed-in Moves were P0, P1, P2, and P4 only; the app correctly redirected `/phase/5` requests for a P4 Move back to `/phase/4?phaseLocked=5`. No P5-accessible disposable Move was available, and no direct production phase-state mutation was performed to manufacture proof.

## Rollout Plan

PR #5249 was merged and deployed through the repo-owned ACA main deploy workflow. The current production/lab revision includes that merge and is running at 100% traffic. Keep this record open as browser-proof-blocked until a disposable or naturally advanced P5 Move exists for signed-in visual proof.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: None in this PR.
- Approved image digest: `sha256:0df6c8d2db959fbb263f558291d775b84ac2b37fa9252b33e584dde4e1917ac6`
- ACA runtime invariant: Confirmed on `ca-abarva-web-lab-eastus--mb65d35d9`, 100% traffic.
- Worker image invariant: Not applicable.
- Feature/env flag update path: Existing `moves_finder_shell_v1`; no flag mutation in this PR.
- Live signed-in proof required: Yes; currently blocked by lack of accessible P5 Move state.

## Rollback Plan

Fastest rollback is disabling or excluding the affected tenant from `moves_finder_shell_v1`, which returns P5 to the previous phase layout. Code rollback is a normal revert PR if needed after deployment.

## Audit Evidence

- PR URL: https://github.com/abarva-platform/abarva/pull/5249
- Merge SHA: `0d42558d396ef3fa7363b5b8cbde424b5510591a`
- Current live SHA containing P5 shell: `b65d35d9be27cbc3200bc1369e29e34faf3a0052`
- ACA deploy run for P5 merge: https://github.com/abarva-platform/abarva/actions/runs/29877280763
- Current ACA deploy run: https://github.com/abarva-platform/abarva/actions/runs/29877796657
- ACA revision: `ca-abarva-web-lab-eastus--mb65d35d9`
- Image digest: `sha256:0df6c8d2db959fbb263f558291d775b84ac2b37fa9252b33e584dde4e1917ac6`
- Signed-in proof attempt bundle: `proof/moves-p5-universal-shell-final-2026-07-21`
- Signed-in proof attempt files:
  - `p5-browser-proof.json`
  - `meridian-p5-contract-shell-live.png`
  - `meridian-p5-contract-shell-live-fullpage.png`
  - `meridian-p5-after-row-clicks.png`
  - `strategic-moves-links.json`
  - `find-p5-all-tenants.json`

## Known Gaps

- P5 is code-merged and deployed, but not yet signed-in browser-proven because no accessible P5 Move exists in the available signed-in test tenants. The next safe proof path is to run a disposable sandbox Move through P5 using governed gates, or wait for a real test Move to naturally reach P5.
- Further improvements should be explicit UX/content backlog items, not additional shell-port work.
