# 2026-06-29-moves-ui-polish — Moves Presentation Density Polish

## Release ID

`2026-06-29-moves-ui-polish`

## Status

`candidate`

## Plain-English Summary

Moves demo and working pages are visually calmer without removing delivery controls. The detail header uses medium-scale titles, the Journey view is less label-heavy, board artifacts are presented as executive artifacts, and the File Cabinet / Downloads view keeps review proof behind a lightweight details reveal instead of showing every status field at once.

## Layer Impact

- `global-control-lane`: Updates shared Moves presentation components used by all tenants with access to Strategic Moves.
- `public-demo`: Improves the opt-in `?demo=1` presentation mode used for screenshots, video, and product walkthroughs.

## Client Applicability

- All clients: Yes, for the shared Moves UI components.
- Specific clients: None.
- Internal only: No.
- Public/demo only: Presentation-mode copy/density refinements apply when `?demo=1` is used.
- Feature flag: Existing presentation mode URL behavior; no new flag.

## Changes Included

- `src/components/strategic-moves/StrategicMoveDetailView.tsx`
- `src/components/strategic-moves/StrategicMoveDetailClient.tsx`
- `src/components/strategic-moves/MovesExplorer.tsx`
- `src/components/strategic-moves/FileCabinetPanel.tsx`
- `src/components/strategic-moves/BoardArtifactsPanel.tsx`
- `src/components/strategic-moves/StrategicMoves.module.css`

## QA / Validation

- PASS: Scoped ESLint for the touched Moves components.
- PASS: TypeScript with `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit`.
- PASS: Targeted Jest for `StrategicMoveDetailClient` and `BoardArtifactsPanel` (`11` tests). Jest emitted pre-existing duplicate manual mock warnings for markdown mocks.
- PASS: `npm run release:check`.
- PENDING: Signed-in browser smoke of `/strategic-moves/:moveId?demo=1` for Explorer/Journey, Documents, and Downloads after ACA deploy. Local signed-in proof is blocked because available Clerk storage states are scoped to `app.abarva.ai`, not localhost.

## Rollout Plan

Merge to main, build an exact-SHA Azure Container Apps image, deploy to `ca-abarva-web-lab-eastus`, move 100% traffic to the healthy revision, then run signed-in browser proof on `https://app.abarva.ai`.

## Deployment Authority

- Repo-owned deploy workflow: Azure Container Apps control-plane lane.
- Shared runtime mutators: None.
- Approved image digest: To be captured during deploy.
- ACA runtime invariant: `ca-abarva-web-lab-eastus` receives the exact SHA image and 100% traffic only after healthy revision proof.
- Worker image invariant: Not applicable.
- Feature/env flag update path: Not applicable.
- Live signed-in proof required: Yes.

## Rollback Plan

Rollback by assigning ACA ingress traffic to the prior healthy revision, or by reverting this UI-only PR and redeploying main. No database or data-plane rollback is required.

## Audit Evidence

- Candidate PR and CI checks.
- Scoped lint/type/release check output.
- Signed-in screenshots for Explorer/Journey, Documents, and Downloads after deployment.

## Known Gaps

This pass does not redesign the Move creation wizard or artifact document contents; it only polishes the existing Moves page surfaces and presentation density.
