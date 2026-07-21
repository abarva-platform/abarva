# 2026-07-21-moves-p3-universal-shell — P3 Approach Contract Shell

## Release ID

`2026-07-21-moves-p3-universal-shell`

## Status

`candidate`

## Plain-English Summary

Moves P3 Choose the Approach now uses the same contract-shell pattern proven on P0, P1, and P2 when the Finder shell flag is enabled. Instead of opening on the older generic prepare surface, P3 opens on the first real solutioning input and keeps design inputs plus workflow steps in one left-side contract rail. Compare Options, Record Decision, Design Canvas, and Approve & Build still render their existing governed controls in the right detail pane.

## Layer Impact

- Product UX / Moves: Changes the P3 presentation only when `moves_finder_shell_v1` is enabled.
- Governance workflow: No gate, upload, evidence-readiness, option-scoring, context extract, Approve & Build, or artifact-generation business logic is changed. Existing P3 controls are rendered through the same detail pane.
- Runtime control: The change remains behind the existing Moves Finder shell flag and deploys through the Azure Container Apps main lane.

## Client Applicability

- All clients: No default global change outside the enabled flag path.
- Specific clients: Tenants currently enabled for `moves_finder_shell_v1`, including Meridian, SkyHarbor, Lakeshore, and First Capital where the flag is active.
- Internal only: No.
- Public/demo only: No.
- Feature flag: `moves_finder_shell_v1`.

## Changes Included

- `src/components/strategic-moves/MovesPhaseStandaloneClient.tsx`
  - Reuses the P1/P2 `PhaseContractStepsCanvas` for P3.
  - Defaults P3 to the first guided approach input row so the phase starts with the solution approach and options decision context.
  - Keeps P3 Compare Options, Record Decision, Design Canvas, and Approve & Build backed by the existing `PhaseBody` implementation.
- `src/components/strategic-moves/__tests__/MovesPhaseStandaloneClient.test.tsx`
  - Updates P3 shell coverage to assert the contract-card renderer, real P3 input rows, workflow rows, and absence of the older generic finder/prepare wall.

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
- Not-run: signed-in browser proof on a flag-enabled tenant P3 route.

## Rollout Plan

Open a PR to `main`, let GitHub checks pass, squash merge, deploy through the repo-owned ACA main deploy workflow, verify the ACA runtime invariant, then run signed-in P3 browser proof.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: None in this PR.
- Approved image digest: Pending ACA deploy.
- ACA runtime invariant: Pending ACA deploy.
- Worker image invariant: Not applicable.
- Feature/env flag update path: Existing `moves_finder_shell_v1`; no flag mutation in this PR.
- Live signed-in proof required: Yes.

## Rollback Plan

Fastest rollback is disabling or excluding the affected tenant from `moves_finder_shell_v1`, which returns P3 to the previous phase layout. Code rollback is a normal revert PR if needed after deployment.

## Audit Evidence

- PR URL: Pending.
- Merge SHA: Pending.
- ACA revision: Pending.
- Image digest: Pending.
- Signed-in proof bundle: Pending.

## Known Gaps

- P4-P5 are intentionally unchanged in this slice. They should be ported phase-by-phase only after P3 is merged, deployed, and live-proven.
