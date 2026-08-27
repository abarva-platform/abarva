# 2026-08-27-tower-ecl-period-trajectory-rows - Tower Period Trajectory Rows

## Release ID

`2026-08-27-tower-ecl-period-trajectory-rows`

## Status

`candidate`

## Plain-English Summary

Tower value trajectory now has a governed period-grain input. The dense ECL projection loader emits finance-period Tower value-chain rows from recorded finance extract rows, so the Tower trajectory can render from period evidence instead of showing that the quarter schedule is missing.

The period rows are marked as trajectory-only. They can feed the Tower chart, but they are excluded from Tower value totals and funnel totals.

## Layer Impact

- Lane: `client-data-lane`
- Layer 3 - Canonical Enterprise Model: no schema changes. The new rows reference existing source records, objects, metric definitions, and measures.
- Layer 4 - Products: Tower can render value trajectory points from ECL serving rows when the refreshed projection data is loaded.
- Projection/read model: `ecl_projection.tower_value_chain` increases from 230 to 710 rows in the dense local proof because 480 finance-period observations are added.

## Client Applicability

- All clients: No.
- Specific clients: ECL dense lab/preprod tenant load.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `scripts/ecl/load_dense_source_room_source_projection_layer.py` adds finance-period Tower value-chain rows sourced from the finance extract.
- `src/lib/tower/readTowerCommandCenter.ts` excludes trajectory-only rows from aggregate Tower totals while still using them for the trajectory chart.
- `src/lib/tower/__tests__/readTowerCommandCenter.test.ts` pins the behavior.
- `docs/architecture/ecl-dense-all-layer-count-contract.json` classifies the expected projection count increases.

## QA / Validation

- PASS: `npm run test:behaviors -- --runTestsByPath src/lib/tower/__tests__/readTowerCommandCenter.test.ts`
- PASS: `npx eslint src/lib/tower/readTowerCommandCenter.ts src/lib/tower/__tests__/readTowerCommandCenter.test.ts`
- PASS: `ECL_RECONCILE_REF=HEAD node scripts/ecl/__tests__/run-ecl-projection-schema-reconciliation-tests.mjs`
- PASS: `node scripts/ecl/__tests__/run-ecl-dense-readback-query-tests.mjs`
- PASS: `npm run ecl:source-room-source-projection:load -- --out-dir /tmp/ecl-source-projection-period-trajectory-20260827`

## Rollout Plan

Merge through PR. The repo-owned Azure Container Apps main deploy workflow will build and deploy the web image. After deployment, run the governed ACA data-build job to reload dense ECL projection rows, then run an independent readback job and signed-in Tower browser proof.

## Deployment Authority

- Repo-owned deploy workflow: Required for shared runtime activation.
- Shared runtime mutators: None outside the repo-owned deploy workflow.
- Approved image digest: To be resolved by the deploy workflow.
- ACA runtime invariant: Required before claiming live.
- Worker image invariant: Unchanged.
- Feature/env flag update path: None.
- Live signed-in proof required: Tower route after data reload and independent readback.

## Rollback Plan

Revert the PR and redeploy through the repo-owned Azure Container Apps main deploy workflow. If the dense ECL load has run, rerun the prior approved dense ECL data-build job image and idempotency key for rollback.

## Audit Evidence

- Local focused Tower behavior test output.
- Local projection schema reconciliation output.
- Local dense readback query test output.
- Local source projection proof output at `/tmp/ecl-source-projection-period-trajectory-20260827`.
- ACA deploy workflow run, governed load job, independent readback job, and signed-in Tower screenshot after merge.

## Known Gaps

The local all-layer count validator could not run in this isolated worktree because the historical full proof report directories are not present. The changed projection layer was validated through the local source-projection proof, and the full cross-layer check is required through ACA load plus independent readback before live proof is claimed.
