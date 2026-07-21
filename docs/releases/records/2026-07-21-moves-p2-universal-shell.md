# 2026-07-21-moves-p2-universal-shell — P2 Current-State Contract Shell

## Release ID

`2026-07-21-moves-p2-universal-shell`

## Status

`live-proven`

## Plain-English Summary

Moves P2 Understand Current State now uses the same contract-shell pattern proven on P0 and P1 when the Finder shell flag is enabled. Instead of opening on the older generic finder/prepare surface, P2 opens on the first real current-state input and keeps phase inputs plus workflow steps in one left-side contract rail. Upload & Review, Review Findings, and Approve & Build still render their existing governed controls in the right detail pane.

## Layer Impact

- Product UX / Moves: Changes the P2 presentation only when `moves_finder_shell_v1` is enabled.
- Governance workflow: No gate, upload, evidence-readiness, context extract, Approve & Build, or artifact-generation business logic is changed. Existing P2 controls are rendered through the same detail pane.
- Runtime control: The change remains behind the existing Moves Finder shell flag and deploys through the Azure Container Apps main lane.

## Client Applicability

- All clients: No default global change outside the enabled flag path.
- Specific clients: Tenants currently enabled for `moves_finder_shell_v1`, including Meridian, SkyHarbor, Lakeshore, and First Capital where the flag is active.
- Internal only: No.
- Public/demo only: No.
- Feature flag: `moves_finder_shell_v1`.

## Changes Included

- `src/components/strategic-moves/MovesPhaseStandaloneClient.tsx`
  - Reuses the P1 `PhaseContractStepsCanvas` for P2.
  - Defaults P2 to the first guided current-state input row so the phase starts with a clear user action.
  - Keeps P2 Upload & Review, Review Findings, and Approve & Build backed by the existing `PhaseBody` implementation.
  - Adds test IDs for the contract-shell next-phase preview so the new surface can be verified directly.
- `src/components/strategic-moves/__tests__/MovesPhaseStandaloneClient.test.tsx`
  - Updates P2 shell coverage to assert the contract-card renderer, real P2 input rows, workflow rows, upload path, citation toggle, and next-phase preview behavior.

## QA / Validation

- Pass: `npx jest src/components/strategic-moves/__tests__/MovesPhaseStandaloneClient.test.tsx --runInBand`
  - Notes: Existing duplicate manual mock warnings and existing Clerk error-boundary console output are still present in this suite.
- Pass: `npx eslint src/components/strategic-moves/MovesPhaseStandaloneClient.tsx src/components/strategic-moves/__tests__/MovesPhaseStandaloneClient.test.tsx`
- Pass: `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false -p tsconfig.json`
- Pass: CSS parse check for `src/components/strategic-moves/StrategicMoves.module.css`
- Pass: `npm run build`
- Pass: `npm run release:check`
- Pass: `git diff --check`
- Pass: PR checks on #5238.
- Pass: ACA deploy run `29872683294`.
- Pass: ACA runtime invariant: revision `ca-abarva-web-lab-eastus--m711e4f56`, image `acrabarvalab001.azurecr.io/abarva/web@sha256:ae23c02342e9e808429de6fe15b325ad8055b25e71b24322262e53a9c5448c33`, 100% traffic.
- Pass: signed-in browser proof on Meridian P2 route `/strategic-moves/07e889a2-f0c0-41b6-ad8f-13313f3c985c/phase/2?proof=711e4f56`.
- Pass: live proof confirmed `mxw-contract-card` present, old `mxw-finder-steps` absent, P2 header present, Current-state findings present, Upload & Review present, Review Findings present, Approve & Build present.
- Pass: no browser console errors during P2 shell load/click proof. Browser warnings were limited to existing Clerk development-key and unused preload warnings; request failures were client-side RSC aborts during navigation.

## Rollout Plan

Open a PR to `main`, let GitHub checks pass, squash merge, deploy through the repo-owned ACA main deploy workflow, verify the ACA runtime invariant, then run signed-in P2 browser proof.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: None in this PR.
- Approved image digest: `sha256:ae23c02342e9e808429de6fe15b325ad8055b25e71b24322262e53a9c5448c33`.
- ACA runtime invariant: Confirmed for `ca-abarva-web-lab-eastus--m711e4f56` at 100% traffic.
- Worker image invariant: Not applicable.
- Feature/env flag update path: Existing `moves_finder_shell_v1`; no flag mutation in this PR.
- Live signed-in proof required: Yes.

## Rollback Plan

Fastest rollback is disabling or excluding the affected tenant from `moves_finder_shell_v1`, which returns P2 to the previous phase layout. Code rollback is a normal revert PR if needed after deployment.

## Audit Evidence

- PR URL: https://github.com/abarva-platform/abarva/pull/5238
- Merge SHA: `711e4f562d2e4c346832ef2b0160e144af42a899`
- ACA deploy run: https://github.com/abarva-platform/abarva/actions/runs/29872683294
- ACA revision: `ca-abarva-web-lab-eastus--m711e4f56`
- Image digest: `sha256:ae23c02342e9e808429de6fe15b325ad8055b25e71b24322262e53a9c5448c33`
- Signed-in proof bundle: `/private/tmp/nexus-moves-p2-shell-20260721b/proof/moves-p2-universal-shell-final-2026-07-21`
  - `meridian-active-p2-contract-shell-live.png`
  - `meridian-active-p2-contract-shell-live-fullpage.png`
  - `active-p2-browser-proof.json`
  - `p2-click-proof.json`

## Known Gaps

- P3-P5 are intentionally unchanged in this slice. They should be ported phase-by-phase only after P2 is merged, deployed, and live-proven.
