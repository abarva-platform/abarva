# 2026-08-12-source-layer-cube-readmodel-projection — Source Layer/Cube Read Model Projection

## Release ID

`2026-08-12-source-layer-cube-readmodel-projection`

## Status

`candidate`

## Plain-English Summary

Repairs the Source read-model projection so governed Source contract rows loaded into `source.contract` and `source.vendor` can appear in the existing Contract 360, vendor portfolio, and Cube vendor/contract projections. This is a projection repair for synthetic demo/operator-reviewed data; it is not retrieval indexing, not Active Tenant Access promotion, and not live client truth.

## Layer Impact

Release lane: `client-data-lane` with `public-demo` applicability.

Layer 3 / Source canonical context: preserves the governed base tables as the source of record for the loaded demo contracts.

Layer 4 / Product projections: updates Source read-model views to union legacy raw-projected contract rows with canonical Source contract/vendor rows, allowing canonical tenant rows to flow into Source Contract 360 and Cube portfolio slices.

## Client Applicability

All clients: No.

Specific clients: Airline demo tenant only.

Internal only: Operator migration apply and proof.

Public/demo only: Yes, synthetic demo/operator-reviewed Source data.

Feature flag: None.

## Changes Included

- `supabase/migrations/20260812142000_source_layer_cube_readmodel_projection.sql`
- `package.json` scripts `source:skyharbor-layer-cube:readmodel:migrate:dry` and `source:skyharbor-layer-cube:readmodel:migrate:apply`

## QA / Validation

- `npm run source:skyharbor-layer-cube:plan` — passed; package fingerprint and generated row counts still match the approved package.
- `git diff --check` — passed.
- `npm run release:check` — passed.
- `source:skyharbor-layer-cube:readmodel:migrate:dry` — not run locally because Azure Postgres is private; it must run through the ACA operator job after the migration is deployed in the main image.
- Read-only Source context and Cube verification after apply — not run yet; required after the ACA operator migration apply.

## Rollout Plan

1. Merge through PR to `main`.
2. Let the repo-owned ACA main deploy workflow build and deploy the exact merged SHA.
3. Use the digest from that main workflow as the ACA operator image.
4. Run `source:skyharbor-layer-cube:readmodel:migrate:apply` through the ACA operator job.
5. Read back `source.contract_360`, `source.contract_vendor_360`, `source.vendor_contract_portfolio`, `consumption.sourcing_contract_v1`, `consumption.sourcing_vendor_v1`, and Cube verification for `skyharbor-air`.
6. Keep retrieval indexing and Active Tenant Access promotion off until separately approved.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` only.
- Shared runtime mutators: No ad-hoc web runtime mutation from this branch.
- Approved image digest: Must be the digest emitted by the main deploy workflow after merge.
- ACA runtime invariant: Required before claiming app runtime is current.
- Worker image invariant: Required from the main deploy workflow.
- Feature/env flag update path: None.
- Live signed-in proof required: Required before any browser-visible Source Contract 360 claim.

## Rollback Plan

Revert this migration with a follow-up migration that restores the prior legacy-only view definitions from `scripts/source/skyharbor-v3/load_source_tower_measurements.sql`, then redeploy through the main ACA workflow and run the migration through the ACA operator job. Data rows loaded by the prior package are not deleted by this projection repair.

## Audit Evidence

- PR URL after creation.
- ACA main deploy run after merge.
- ACA operator migration logs and migration seal.
- Read-only Source context and Cube verification logs after apply.

## Known Gaps

Production migration apply and readback have not run yet. Retrieval indexing and Active Tenant Access promotion remain explicitly out of scope.
