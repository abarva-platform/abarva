# 2026-09-07-source-cloud-consumption-package — Cloud Consumption Depth Loader

## Release ID

`2026-09-07-source-cloud-consumption-package`

## Status

`candidate`

## Plain-English Summary

Adds a governed cloud-consumption data package path so cloud billing, commitment coverage, resource inventory, tag quality, AP reconciliation, contract terms, and optimization candidates can be loaded through the Source layer model and reconciled before any product surface uses them.

## Layer Impact

Release lane: `client-data-lane`.

Layer 1: stages a synthetic, PHI-free cloud consumption evidence package with CSV source rows and synthetic document files.

Layer 2: adds package-run and adapter-row tables for cloud-consumption source extracts.

Layer 3: adds canonical cloud evidence tables and a loader that writes contract, vendor, spend, scope, term, opportunity, and deterministic fact assertions from the package.

Layer 4: adds tenant-scoped cloud-consumption cube projections and a guarded overlay activation job so Source 360 can read the supplemental contract rows without replacing the main contract register run. Tower and aVa still require separate refresh/proof before relying on the new rows.

## Client Applicability

- All clients: no default product behavior changes.
- Specific clients: one scoped demo dataset, gated by manifest and operator job scope.
- Internal only: operator loader scripts and proof-bundle output.
- Public/demo only: synthetic evidence package content is demo-only and not finance-confirmed.
- Feature flag: none.

## Changes Included

- `datasets/source/cloud-consumption/meridian-cloud-consumption-depth-v1-20260907/`
- `docs/governance/dataset-manifests/meridian-cloud-consumption-depth-v1-20260907.json`
- `supabase/migrations/20260907143000_source_cloud_consumption_package.sql`
- `supabase/migrations/20260907144500_source_cloud_consumption_layer4_cubes.sql`
- `scripts/source/load-cloud-consumption-package.mjs`
- `scripts/source/__tests__/load-cloud-consumption-package.test.ts`
- `package.json` Source cloud-consumption operator scripts

## Follow-Up Amendment

The loader normalizes source-package `governance_action` rows into the canonical `control_action` opportunity value type while preserving the source taxonomy in the opportunity payload. This keeps non-monetary control blockers out of realized-savings semantics and allows Layer 3 reconciliation to load the package without widening product claims.

Layer 4 now adds cloud-specific consumption cube views and extends the existing sourcing opportunity cube to include governed optimization-spine rows. The added verify mode reconciles the Source page substrate, opportunity cube, and cloud usage/commitment/resource/tag/AP views against the package's expected contract, opportunity, and telemetry counts.

The Layer 4 cube migration preserves the existing derived sourcing opportunity view column contract and appends the new governed optimization-spine rows in place. This avoids dropping downstream product projections while still extending the tenant-scoped cube for cloud-consumption opportunities.

The compatibility repair also preserves the existing `timing_window` and `quality_state` column positions in `consumption.sourcing_opportunity_v1`, so the migration can replace the shared view in place against an already-deployed database without renaming columns that Source and Tower consumers depend on.

The Layer 4 apply job now activates the package through `source.l4_cube_active_load_run_overlay` after Layer 3 reconciliation passes. This keeps supplemental rows visible to overlay-aware product read models while preserving the active base-register load run.

The Tower bridge job projects the verified Source cloud-consumption opportunities into the active Tower Layer 4 product substrate as gated recommended actions, value/cost-lens rows, evidence/risk backlog rows, and Tower cube slices. It is additive and idempotent: only `source_cloud:` bridge rows are replaced, and existing Tower projection rows remain intact.

The bridge now derives `snapshot_id` from the active Tower projection and cube manifests instead of requiring the active-assessment helper to expose it directly. The job fails closed if active projection and cube manifests do not agree on a single snapshot.

## QA / Validation

- `node scripts/source/load-cloud-consumption-package.mjs --mode=plan --proof-dir=/tmp/source-cloud-consumption-plan-local` passed with quality gate `PASS`.
- `npm test -- scripts/source/__tests__/load-cloud-consumption-package.test.ts --runInBand` passed using the existing local dependency tree. Jest emitted pre-existing duplicate manual mock warnings.
- `npm test -- scripts/tower/__tests__/apply-source-cloud-tower-bridge.test.ts --runInBand` verifies the Source-to-Tower bridge plan shape, explicit write gate, active-assessment binding, Source cube dependencies, and Tower cube output.
- `node scripts/tower/apply-source-cloud-tower-bridge.mjs --mode=plan --proof-dir=/tmp/tower-source-cloud-bridge-plan-snapshot-fix` passed after the Tower snapshot binding repair with quality gate `PASS`.
- Azure schema apply initially stopped before recording the Layer 4 migration because the deployed opportunity view has downstream dependencies and an established column order. The migration now avoids dependency churn by preserving the existing view column order and replacing the view in place; schema apply passed in Azure. Layer 4 apply and verify must be rerun in Azure.

## Rollout Plan

Merge through PR, let the repo-owned Azure Container Apps deploy workflow publish the new image, then run the private ACA operator job in order: schema apply, Layer 2 apply, Layer 3 apply, Layer 2/3 verify, Source Layer 4 apply, Source Layer 4 verify, Tower bridge apply, and Tower bridge verify. Product proof remains a separate follow-up gate.

## Deployment Authority

- Repo-owned deploy workflow: required.
- Shared runtime mutators: none in this release beyond normal main-image deployment.
- Approved image digest: populated after deploy.
- ACA runtime invariant: required before running operator jobs.
- Worker image invariant: private operator job must use the approved digest-pinned image.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, after Layer 4/product projection in a later release.

## Rollback Plan

Product behavior can roll back by deploying the prior web image because this release does not wire product surfaces to the new tables. Data rows are dataset-version scoped and can be ignored by projections until reviewed. Any data cleanup must be a separately approved tenant-scoped operator job.

## Audit Evidence

- PR URL
- ACA deploy workflow run
- Operator job output folders for schema apply, Layer 2 apply, Layer 3 apply, Layer 2/3 verify, and Layer 4 verify
- Proof-bundle `summary.json` files with expected vs. readback row counts

## Known Gaps

Tower bridge product screenshots, aVa retrieval proof, and signed-in cross-product narration proof are not included here.
