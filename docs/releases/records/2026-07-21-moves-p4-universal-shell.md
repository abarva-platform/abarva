# 2026-07-21-moves-p4-universal-shell — P4 Plan Contract Shell

## Release ID

`2026-07-21-moves-p4-universal-shell`

## Status

`live-proven`

## Plain-English Summary

Moves P4 Build the Plan now uses the same contract-shell pattern proven on P0, P1, P2, and P3 when the Finder shell flag is enabled. Instead of opening on the older generic prepare surface, P4 opens on the first real planning input and keeps roadmap, estimate, value-case, risk, funding, handoff, and recommendation inputs plus workflow steps in one left-side contract rail. Value Case, Plan Workstreams, and Approve & Build still render their existing governed controls in the right detail pane.

## Layer Impact

- Product UX / Moves: Changes the P4 presentation only when `moves_finder_shell_v1` is enabled.
- Governance workflow: No gate, upload, evidence-readiness, option-scoring, context extract, Approve & Build, or artifact-generation business logic is changed. Existing P4 controls are rendered through the same detail pane.
- Runtime control: The change remains behind the existing Moves Finder shell flag and deploys through the Azure Container Apps main lane.

## Client Applicability

- All clients: No default global change outside the enabled flag path.
- Specific clients: Tenants currently enabled for `moves_finder_shell_v1`, including Meridian, SkyHarbor, Lakeshore, and First Capital where the flag is active.
- Internal only: No.
- Public/demo only: No.
- Feature flag: `moves_finder_shell_v1`.

## Changes Included

- `src/components/strategic-moves/MovesPhaseStandaloneClient.tsx`
  - Reuses the P1/P2/P3 `PhaseContractStepsCanvas` for P4.
  - Defaults P4 to the first guided planning input row so the phase starts with roadmap and sequencing context.
  - Keeps P4 Value Case, Plan Workstreams, and Approve & Build backed by the existing `PhaseBody` implementation.
- `src/components/strategic-moves/__tests__/MovesPhaseStandaloneClient.test.tsx`
  - Adds P4 shell coverage to assert the contract-card renderer, real P4 input rows, workflow rows, and absence of the older generic finder/prepare wall.

## QA / Validation

- Pass: `npx jest src/components/strategic-moves/__tests__/MovesPhaseStandaloneClient.test.tsx --runInBand`
  - Notes: Existing duplicate manual mock warnings and existing Clerk error-boundary console output are still present in this suite.
- Pass: `npx eslint src/components/strategic-moves/MovesPhaseStandaloneClient.tsx src/components/strategic-moves/__tests__/MovesPhaseStandaloneClient.test.tsx`
- Pass: `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false -p tsconfig.json`
- Pass: CSS parse check for `src/components/strategic-moves/StrategicMoves.module.css`
- Pass: `npm run build`
- Pass: `npm run release:check`
- Pass: `git diff --check`
- Pass: PR checks on #5247.
- Pass: ACA deploy run `29875789646`.
- Pass: ACA runtime invariant confirmed revision `ca-abarva-web-lab-eastus--m9865cd67`, image digest `sha256:9f9773c15ad6589e2dc018b65a08191cbd995187e0ce55017deb43a51cbdae08`, 100% traffic.
- Pass: Signed-in Meridian browser proof on P4 route confirmed the contract card renders, the older finder/prepare wall is absent, all P4 contract rows are present, and all non-mutating row selections update without failed network requests.

## Rollout Plan

Completed through PR #5247, squash merge, ACA main deploy, runtime invariant verification, and signed-in P4 browser proof.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: None in this PR.
- Approved image digest: `sha256:9f9773c15ad6589e2dc018b65a08191cbd995187e0ce55017deb43a51cbdae08`.
- ACA runtime invariant: Confirmed for revision `ca-abarva-web-lab-eastus--m9865cd67` with 100% traffic.
- Worker image invariant: Not applicable.
- Feature/env flag update path: Existing `moves_finder_shell_v1`; no flag mutation in this PR.
- Live signed-in proof required: Yes.

## Rollback Plan

Fastest rollback is disabling or excluding the affected tenant from `moves_finder_shell_v1`, which returns P4 to the previous phase layout. Code rollback is a normal revert PR if needed after deployment.

## Audit Evidence

- PR URL: https://github.com/abarva-platform/abarva/pull/5247
- Merge SHA: `9865cd6740a0dcd0949b09cea17097a0379d22dc`
- ACA deploy run: https://github.com/abarva-platform/abarva/actions/runs/29875789646
- ACA revision: `ca-abarva-web-lab-eastus--m9865cd67`
- Image digest: `sha256:9f9773c15ad6589e2dc018b65a08191cbd995187e0ce55017deb43a51cbdae08`
- Signed-in proof bundle: `proof/moves-p4-universal-shell-final-2026-07-21`
  - Screenshot: `meridian-p4-contract-shell-live.png`
  - Full-page screenshot: `meridian-p4-contract-shell-live-fullpage.png`
  - Browser proof JSON: `p4-browser-proof.json`

## Known Gaps

- P5 is intentionally unchanged in this slice. It should be ported only after P4 is merged, deployed, and live-proven.
