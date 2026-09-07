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

Layer 4: no product surface cutover is included in this release. Source, Tower, and aVa must wait for separate projection and signed-in proof before relying on the new rows.

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
- `scripts/source/load-cloud-consumption-package.mjs`
- `scripts/source/__tests__/load-cloud-consumption-package.test.ts`
- `package.json` Source cloud-consumption operator scripts

## QA / Validation

- `node scripts/source/load-cloud-consumption-package.mjs --mode=plan --proof-dir=/tmp/source-cloud-consumption-plan-local` passed with quality gate `PASS`.
- `npm test -- scripts/source/__tests__/load-cloud-consumption-package.test.ts --runInBand` passed using the existing local dependency tree. Jest emitted pre-existing duplicate manual mock warnings.

## Rollout Plan

Merge through PR, let the repo-owned Azure Container Apps deploy workflow publish the new image, then run the private ACA operator job in order: schema apply, Layer 2 apply, Layer 3 apply, and Layer 2/3 verify. Layer 4 projection and product proof are intentionally separate follow-up gates.

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
- Operator job output folders for schema apply, Layer 2 apply, Layer 3 apply, and Layer 2/3 verify
- Proof-bundle `summary.json` files with expected vs. readback row counts

## Known Gaps

Layer 4 Source/Tower projections, aVa retrieval proof, and signed-in product screenshots are not included here.
