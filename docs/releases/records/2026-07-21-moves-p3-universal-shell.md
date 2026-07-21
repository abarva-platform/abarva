# 2026-07-21-moves-p3-universal-shell — P3 Approach Contract Shell

## Release ID

`2026-07-21-moves-p3-universal-shell`

## Status

`live-proven`

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
- Pass: PR #5243 checks passed in GitHub.
- Pass: ACA deploy run `29874391399` completed successfully for merge SHA `0c65c74254836c64e10b4f5d13bd763b1ed9091a`.
- Pass: ACA runtime invariant confirmed on `ca-abarva-web-lab-eastus--m0c65c742` with 100% traffic and digest `sha256:e322d727559e596e309d24745a77ab3161a7b4911a6250e6d068afd77824e02c`.
- Pass: signed-in Meridian browser proof on `/strategic-moves/cd51e4fe-b5c4-4024-bc46-73afaff4e4b7/phase/3?proof=0c65c742`.
  - Contract card present.
  - Older finder prepare wall absent.
  - P3 header, Solution approach, Compare Options, Record Decision, Design Canvas, and Approve & Build present.
  - No-mutation clicks across P3 rows updated the right pane.
  - No browser console errors after filtering expected Clerk/dev and RSC prefetch abort noise.

## Rollout Plan

Complete. PR #5243 was squash-merged, deployed through the repo-owned ACA main workflow, runtime-invariant checked, and browser-proven on a signed-in Meridian P3 route.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: None in this PR.
- Approved image digest: `acrabarvalab001.azurecr.io/abarva/web@sha256:e322d727559e596e309d24745a77ab3161a7b4911a6250e6d068afd77824e02c`
- ACA runtime invariant: Confirmed, latest ready revision and 100% traffic revision both `ca-abarva-web-lab-eastus--m0c65c742`.
- Worker image invariant: Not applicable.
- Feature/env flag update path: Existing `moves_finder_shell_v1`; no flag mutation in this PR.
- Live signed-in proof required: Yes.

## Rollback Plan

Fastest rollback is disabling or excluding the affected tenant from `moves_finder_shell_v1`, which returns P3 to the previous phase layout. Code rollback is a normal revert PR if needed after deployment.

## Audit Evidence

- PR URL: https://github.com/abarva-platform/abarva/pull/5243
- Merge SHA: `0c65c74254836c64e10b4f5d13bd763b1ed9091a`
- ACA deploy run: https://github.com/abarva-platform/abarva/actions/runs/29874391399
- ACA revision: `ca-abarva-web-lab-eastus--m0c65c742`
- Image digest: `sha256:e322d727559e596e309d24745a77ab3161a7b4911a6250e6d068afd77824e02c`
- Signed-in proof bundle: `proof/moves-p3-universal-shell-final-2026-07-21`
  - `meridian-p3-contract-shell-live.png`
  - `meridian-p3-contract-shell-live-fullpage.png`
  - `p3-browser-proof.json`

## Known Gaps

- P4-P5 are intentionally unchanged in this slice. They should be ported phase-by-phase only after P3 is merged, deployed, and live-proven.
