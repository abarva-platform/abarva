# 2026-08-28-source-contract-depth-projection — Source Contract Depth Layer 2/3 Gate

## Release ID

`2026-08-28-source-contract-depth-projection`

## Status

`candidate`

## Plain-English Summary

Adds a governed manifest, persisted Layer 2 adapter gate, and controlled Layer 3 loader for a tenant-scoped technology contract depth package. The Layer 3 job refuses to run until the Layer 2 adapter rows are loaded and reconciled against the package quality gate.

## Layer Impact

- Release lane: `client-data-lane`, because this prepares tenant-scoped data-plane input and projection proof for a later governed operator load.
- Layer 1 client intake: Defines the package as synthetic, PHI-free, demo-only contract evidence input.
- Layer 2 source adapters: Persists one adapter row per validated source row in `source.contract_depth_adapter_row`, plus load-run proof in `source.contract_depth_package_load_run`.
- Layer 3 canonical/evidence: Loads contract, vendor, clause, CMDB scope, spend, SLA, service-credit, source snapshot, fact assertion, and optimization spine rows into existing Source canonical tables.
- Layer 4 products: No product UI behavior changes in this release. Cube/read-model refresh is a later step after Layer 2/3 readback passes.

## Client Applicability

- All clients: No default behavior change.
- Specific clients: One governed demo tenant package, gated by manifest and operator job discipline.
- Internal only: Yes, projection and data-build preparation tooling.
- Public/demo only: Synthetic demo package only.
- Feature flag: Not applicable.

## Changes Included

- `docs/governance/dataset-manifests/meridian-contract-depth-v1-20260828.json`
- `docs/backlog/tracks/04-source-commercial/BACKLOG.md`
- `datasets/source/contract-depth/meridian-contract-depth-v1-20260828/source-files/*.csv`
- `supabase/migrations/20260828184000_source_contract_depth_package_layer2.sql`
- `src/lib/source/contract-depth-package/adapter.ts`
- `src/lib/source/contract-depth-package/projection.ts`
- `src/lib/source/contract-depth-package/__tests__/adapter.test.ts`
- `src/lib/source/contract-depth-package/__tests__/projection.test.ts`
- `scripts/source/apply-contract-depth-package-schema.ts`
- `scripts/source/project-contract-depth-package.ts`
- `scripts/source/load-contract-depth-package.ts`
- `package.json` scripts `source:contract-depth-package:*`

## QA / Validation

- `npm run validate:context-corpus:manifests` passed.
- `npx jest src/lib/source/contract-depth-package/__tests__/adapter.test.ts src/lib/source/contract-depth-package/__tests__/projection.test.ts --runInBand` passed.
- `npx tsx scripts/source/project-contract-depth-package.ts --package-dir=/Users/anand/Downloads/meridian-source-contract-depth-package-20260828` passed and wrote the local projection proof bundle.
- `SOURCE_CONTRACT_DEPTH_PACKAGE_MODE=plan npx tsx scripts/source/load-contract-depth-package.ts` must pass before PR merge.
- `npx eslint src/lib/source/contract-depth-package/adapter.ts src/lib/source/contract-depth-package/projection.ts src/lib/source/contract-depth-package/__tests__/adapter.test.ts src/lib/source/contract-depth-package/__tests__/projection.test.ts scripts/source/project-contract-depth-package.ts scripts/source/apply-contract-depth-package-schema.ts scripts/source/load-contract-depth-package.ts` must pass with no warnings.

## Rollout Plan

Merge through PR. After the repo-owned Azure Container Apps main deploy workflow builds a digest-pinned image from the merged SHA, run the schema plan/apply, then the package loader in this order: `plan`, `apply-layer2`, `verify`, `apply-layer3`, `verify`. Layer 4 cube refresh remains a separate later operator step.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` when an image is needed.
- Shared runtime mutators: None in this release.
- Approved image digest: Required before operator execution.
- ACA runtime invariant: Required after deploy and before live proof.
- Worker image invariant: Operator job must use a digest-pinned image.
- Feature/env flag update path: None.
- Live signed-in proof required: Required only after the separate mutating load job succeeds.

## Rollback Plan

Code rollback is a revert PR followed by the repo-owned ACA main deploy workflow. Data rollback, if needed, must be a separate governed operator cleanup job scoped to the dataset version and tenant, with readback before and after. Do not manually delete production rows.

## Audit Evidence

- Local package ZIP: `/Users/anand/Downloads/meridian-source-contract-depth-package-20260828.zip`
- Local Layer 2 adapter proof: `/Users/anand/Downloads/meridian-source-contract-depth-package-20260828/qa/layer-2-adapter-preview/adapter-quality-gate.json`
- Local projection proof: `/Users/anand/Downloads/meridian-source-contract-depth-package-20260828/qa/layer-projection-preview/projection-quality-gate.json`
- Local validation command outputs listed above.

## Known Gaps

- The package has not yet been loaded into Azure/Postgres by this release record.
- Layer 4 cubes and live product screens are intentionally out of scope until Layer 2 and Layer 3 readback pass.
- The package introduces new synthetic technology contract IDs; it does not enrich existing live `CTR-*` rows.
