# 2026-07-21-moves-p1-universal-shell — P1 Charter Contract Shell

## Release ID

`2026-07-21-moves-p1-universal-shell`

## Status

`released`

## Plain-English Summary

Moves P1 Charter now uses the same contract-shell pattern proven on P0 when the Finder shell flag is enabled. The phase keeps the left-side phase rail, then uses a focused two-pane work surface: phase inputs and workflow steps on the left, the selected step detail on the right. P1 opens on the first guided input instead of a legacy summary panel, while upload and Approve & Build remain available in the workflow group. The old long-page P1 layout remains available through the feature flag rollback path and P2-P5 are unchanged in this slice.

## Layer Impact

- Product UX / Moves: Changes the P1 Charter phase presentation only when `moves_finder_shell_v1` is enabled.
- Governance workflow: No gate, upload, evidence-readiness, Approve & Build, or artifact-generation business logic is changed. Existing P1 controls are rendered through the new shell.
- Runtime control: The change is feature-flagged through the existing Moves Finder shell flag and deploys through the Azure Container Apps main lane.

## Client Applicability

- All clients: No default global change outside the enabled flag path.
- Specific clients: Tenants currently enabled for `moves_finder_shell_v1`, including Meridian, SkyHarbor, Lakeshore, and First Capital where the flag is active.
- Internal only: No.
- Public/demo only: No.
- Feature flag: `moves_finder_shell_v1`.

## Changes Included

- `src/components/strategic-moves/MovesPhaseStandaloneClient.tsx`
  - Adds the P1 contract-shell canvas behind `moves_finder_shell_v1`.
  - Defaults P1 to the first guided input row so the phase starts with a clear user action.
  - Preserves the existing `PhaseBody` controls for uploads, evidence review, and Approve & Build.
  - Expands the Finder shell canvas to use the available page width.
- `src/components/strategic-moves/__tests__/MovesPhaseStandaloneClient.test.tsx`
  - Adds coverage that P1 renders the contract shell and still exposes real upload and gate controls.

## QA / Validation

- Pass: `npx jest src/components/strategic-moves/__tests__/MovesPhaseStandaloneClient.test.tsx --runInBand`
- Pass: `npx eslint src/components/strategic-moves/MovesPhaseStandaloneClient.tsx src/components/strategic-moves/__tests__/MovesPhaseStandaloneClient.test.tsx`
- Pass: `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false -p tsconfig.json`
- Pass: `node -e "const fs=require('fs'); const postcss=require('postcss'); const css=fs.readFileSync('src/components/strategic-moves/StrategicMoves.module.css','utf8'); postcss.parse(css,{from:'src/components/strategic-moves/StrategicMoves.module.css'}); console.log('css parse ok')"`
- Pass: `npm run build`
  - Note: Next/Turbopack emitted existing broad dynamic-file-pattern warnings outside the Moves slice, but completed successfully.
- Pass: `npm run release:check`
- Pass: `git diff --check`
- Pass: GitHub PR checks for PR #5231 and PR #5234.
- Pass: ACA deploy for code merge SHA `e8f8be354959b9dd0f2b4a6f837a83221a74f709`.
- Pass: ACA runtime invariant confirmed revision `ca-abarva-web-lab-eastus--me8f8be35`, 100% traffic, image digest `sha256:276e3df34ac24dc607b363102c32edcfbcb25c3bd54e46cbfa3709d3f01463ca`.
- Pass: signed-in Meridian browser proof on `/strategic-moves/51d7652a-957d-4067-9c2c-607a6daaf5cf/phase/1`.
  - Contract shell present.
  - Initial active step: `Sponsor commitment`.
  - Upload Evidence workflow row present.
  - Approve & Build workflow row present.
  - Legacy P1 summary was not the initial detail pane.

## Rollout Plan

Merged through PRs to `main`. The repo-owned ACA main deploy workflow built and deployed the image. Runtime invariant and signed-in browser proof were completed on a flag-enabled Meridian tenant.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: None in this PR.
- Approved image digest: `sha256:276e3df34ac24dc607b363102c32edcfbcb25c3bd54e46cbfa3709d3f01463ca`
- ACA runtime invariant: Passed, `ca-abarva-web-lab-eastus--me8f8be35` latest ready and 100% traffic.
- Worker image invariant: Not applicable.
- Feature/env flag update path: Existing `moves_finder_shell_v1`; no flag mutation in this PR.
- Live signed-in proof required: Yes.

## Rollback Plan

Fastest rollback is disabling or excluding the affected tenant from `moves_finder_shell_v1`, which returns P1 to the previous phase layout. Code rollback is a normal revert PR if needed after deployment.

## Audit Evidence

- PR URL: https://github.com/abarva-platform/abarva/pull/5231
- Follow-up PR URL: https://github.com/abarva-platform/abarva/pull/5234
- Merge SHA: `7952eb608f23f95cb1c34c8cb6eaa82f1819c1d1`
- Follow-up merge SHA: `e8f8be354959b9dd0f2b4a6f837a83221a74f709`
- ACA revision: `ca-abarva-web-lab-eastus--me8f8be35`
- Image digest: `sha256:276e3df34ac24dc607b363102c32edcfbcb25c3bd54e46cbfa3709d3f01463ca`
- Signed-in proof bundle: `proof/moves-p1-universal-shell-final-2026-07-21`

## Known Gaps

- P2-P5 are intentionally unchanged in this slice. They should be ported phase-by-phase only after P1 is merged, deployed, and live-proven.
