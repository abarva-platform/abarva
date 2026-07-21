# 2026-07-21-moves-p5-universal-shell — P5 Execute Contract Shell

## Release ID

`2026-07-21-moves-p5-universal-shell`

## Status

`candidate`

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
- Not-run: PR checks.
- Not-run: ACA deploy and runtime invariant.
- Not-run: signed-in browser proof on a flag-enabled tenant P5 route.

## Rollout Plan

Open a PR to `main`, let GitHub checks pass, squash merge, deploy through the repo-owned ACA main deploy workflow, verify the ACA runtime invariant, then run signed-in P5 browser proof.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: None in this PR.
- Approved image digest: Pending ACA deploy.
- ACA runtime invariant: Pending ACA deploy.
- Worker image invariant: Not applicable.
- Feature/env flag update path: Existing `moves_finder_shell_v1`; no flag mutation in this PR.
- Live signed-in proof required: Yes.

## Rollback Plan

Fastest rollback is disabling or excluding the affected tenant from `moves_finder_shell_v1`, which returns P5 to the previous phase layout. Code rollback is a normal revert PR if needed after deployment.

## Audit Evidence

- PR URL: Pending.
- Merge SHA: Pending.
- ACA revision: Pending.
- Image digest: Pending.
- Signed-in proof bundle: Pending.

## Known Gaps

- This completes the P1-P5 contract-shell port. Further improvements should be explicit UX/content backlog items, not additional shell-port work.
