# 2026-08-03-tower-synthetic-value-maturity — Tower Synthetic Value Maturity Projection

## Release ID

`2026-08-03-tower-synthetic-value-maturity`

## Status

`candidate`

## Plain-English Summary

Tower's synthetic v3 loader now uses linked KPI evidence when projecting value-claim maturity. The prior projection loaded useful source evidence but flattened most project claims into one sparse state, which made the Tower dashboard repeat the same count across multiple proof gaps. This release keeps claimability strict while surfacing a more meaningful synthetic current state: baseline/current/target links, disputed evidence, usage-supported posture, partial finance-validated value, and remaining unknown-value gaps.

## Layer Impact

- Release lanes: `client-data-lane`, `global-control-lane`.
- Source adapters: Uses existing raw v3 project, KPI, and AI usage tables; no raw table schema or row-count change.
- Canonical model: Updates the Tower projection into `tower.value_claim`; no schema change.
- Product surfaces: Updates the Tower command-center read model and Value Proof mode selection so the UI reflects maturity distribution instead of treating partial value proof as a completed value waterfall.

## Client Applicability

- All clients: Tower read model honors value-claim observation-link counts.
- Specific clients: Synthetic v3 tenant reloads receive the richer Tower value maturity projection.
- Internal only: None.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- `scripts/source/skyharbor-v3/load_source_tower_measurements.sql`
- `scripts/source/inspect-skyharbor-v3-live-proof.ts`
- `src/lib/tower/readTowerCommandCenter.ts`
- `src/components/tower/command-center/views/ValueProofView.tsx`
- `src/lib/tower/__tests__/readTowerCommandCenter.test.ts`

## QA / Validation

- Pass: `npx eslint src/lib/tower/readTowerCommandCenter.ts src/components/tower/command-center/views/ValueProofView.tsx src/lib/tower/__tests__/readTowerCommandCenter.test.ts scripts/source/inspect-skyharbor-v3-live-proof.ts`
- Pass: `npm test -- --runTestsByPath src/lib/tower/__tests__/readTowerCommandCenter.test.ts --runInBand`
- Pass: `NODE_OPTIONS=--max-old-space-size=6144 npx tsc --noEmit --pretty false`
- Pass: `npm run release:check`
- Not run: live database reload and signed-in browser proof. Those require merge, ACA deploy, and the approved data-build reload path.

## Rollout Plan

1. Merge through a PR to `main`.
2. Deploy through the repo-owned Azure Container Apps main workflow.
3. Reload the synthetic v3 dataset through the approved data-build job path.
4. Run live readback with `scripts/source/inspect-skyharbor-v3-live-proof.ts`.
5. Run signed-in Tower browser proof on desktop and mobile.

## Deployment Authority

- Repo-owned deploy workflow: Required for product runtime deployment.
- Shared runtime mutators: Not allowed from feature branch or local ad-hoc commands.
- Approved image digest: Captured by the ACA main deployment workflow after merge.
- ACA runtime invariant: Required before claiming the product runtime is live.
- Worker image invariant: Required if the data-build job image changes.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, after deploy and after the approved reload.

## Rollback Plan

Revert the PR and redeploy through the ACA main workflow. If the richer projection has already been loaded, rerun the previously approved v3 load package or restore from the scoped data-build proof bundle according to the data-build job runbook.

## Audit Evidence

- PR URL: https://github.com/abarva-platform/abarva/pull/5896
- Local validation output: pending.
- Live readback output: pending approved reload.
- Signed-in screenshots: pending approved reload and deployment.

## Known Gaps

This release does not make any value claim claimable. It does not mutate production data by itself. The synthetic data must be reloaded through the approved data-build path before the corrected maturity distribution appears in the live product.
