# 2026-07-21-moves-p1-universal-shell — P1 Charter Contract Shell

## Release ID

`2026-07-21-moves-p1-universal-shell`

## Status

`candidate`

## Plain-English Summary

Moves P1 Charter now uses the same contract-shell pattern proven on P0 when the Finder shell flag is enabled. The phase keeps the left-side phase rail, then uses a focused two-pane work surface: phase inputs and workflow steps on the left, the selected step detail on the right. The old long-page P1 layout remains available through the feature flag rollback path and P2-P5 are unchanged in this slice.

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
- Pending: ACA deploy, runtime invariant, and signed-in browser proof after PR merge.

## Rollout Plan

Merge through a PR to `main`. The repo-owned ACA main deploy workflow builds and deploys the image. After deploy, verify the ACA runtime invariant, then run signed-in browser proof on a flag-enabled tenant to confirm the P1 page uses the P0-style contract shell and preserves upload and Approve & Build controls.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: None in this PR.
- Approved image digest: Pending ACA deploy.
- ACA runtime invariant: Pending ACA deploy.
- Worker image invariant: Not applicable.
- Feature/env flag update path: Existing `moves_finder_shell_v1`; no flag mutation in this PR.
- Live signed-in proof required: Yes.

## Rollback Plan

Fastest rollback is disabling or excluding the affected tenant from `moves_finder_shell_v1`, which returns P1 to the previous phase layout. Code rollback is a normal revert PR if needed after deployment.

## Audit Evidence

- PR URL: Pending.
- Merge SHA: Pending.
- ACA revision: Pending.
- Signed-in proof: Pending.

## Known Gaps

- P2-P5 are intentionally unchanged in this slice. They should be ported phase-by-phase only after P1 is merged, deployed, and live-proven.
