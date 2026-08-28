# 2026-08-28-tower-healthcare-demo-layer2-source-adapters - Tower source adapter Layer 2 load path

## Release ID

`2026-08-28-tower-healthcare-demo-layer2-source-adapters`

## Status

`candidate`

## Plain-English Summary

Adds a governed Layer 2 load path for the synthetic Tower source-adapter package. The loader lands source files, source rows, adapter run records, and adapter-emission records with upstream row lineage so the data can be audited before canonical objects, cubes, read models, or product screens are refreshed.

## Layer Impact

Release lane: `client-data-lane`.

Layer 1 client intake: Reads the synthetic client-owned source extracts for the approved review package. It does not rewrite intake source rows.

Layer 2 source adapters: Adds the Azure/Postgres write entrypoint for source file registration, source record landing, adapter run landing, and adapter-emission lineage.

Layer 3 canonical model: No canonical objects, relationships, measures, or facts are written by this release.

Layer 4 products: No Tower, Home, Source, Moves, or Intelligence projections are written by this release.

## Client Applicability

All clients: None.

Specific clients: Synthetic healthcare fixture tenant only.

Internal only: AbarVa operators reviewing the Tower synthetic data package.

Public/demo only: The source package is demo/synthetic and must not be represented as real client data.

Feature flag: None.

## Changes Included

- `scripts/tower/load-healthcare-demo-layer2-source-adapters.mjs`
- `scripts/tower/validate-healthcare-demo-layer2-source-adapters.mjs`
- `package.json` script entries:
  - `tower:healthcare-demo-layer2-source-adapters:load`
  - `tower:healthcare-demo-layer2-source-adapters:validate`
  - `tower:healthcare-demo-layer2-source-adapters:write-job`
- Synthetic Tower source package under the generated healthcare fixture path.

## QA / Validation

- Pass: `npm run tower:healthcare-demo-layer2-source-adapters:load -- --out-dir /tmp/tower-layer2-local-proof-v3`
- Pass: `npm run tower:healthcare-demo-layer2-source-adapters:validate`
- Pass: disposable local Postgres load/readback of generated SQL with zero tenant drift and zero adapter-lineage drift
- Pass: `node scripts/tower/validate-meridian-layer1-source.mjs`
- Pass: `git diff --check`

Expected Layer 2 load counts:

- Source files: 9
- Source records: 1,981
- Client source extract rows: 987
- Adapter run rows: 7
- Adapter emission rows: 987

## Rollout Plan

Merge by PR to `main`. The repo-owned Azure Container Apps deploy workflow builds the digest-pinned image. After that image is available, run the source-adapter write through the governed ACA operator wrapper:

```bash
npm run ops:aca-job -- \
  --image acrabarvalab001.azurecr.io/abarva/web@sha256:<digest> \
  --script tower:healthcare-demo-layer2-source-adapters:write-job \
  --secret-env DATABASE_URL=azure-postgres-control-database-url \
  --env TOWER_LAYER2_TENANT_KEY=<synthetic-healthcare-tenant-key> \
  --env TOWER_LAYER2_ASSESSMENT_ID=<synthetic-healthcare-assessment-id> \
  --env TOWER_LAYER2_BUILD_VERSION=tower-layer2-source-adapters-v2026-08 \
  --env TOWER_LAYER2_INPUT_SOURCE_VERSION=tower-layer1-v2026-08-business-case \
  --env TOWER_LAYER2_IDEMPOTENCY_KEY=<synthetic-healthcare-assessment-id>:<main-sha> \
  --out-dir /tmp/tower-layer2-aca-proof
```

Only after the Azure readback passes should older overlapping Tower source-adapter demo slices be sunset with a scoped tenant/assessment purge list.

## Deployment Authority

Repo-owned deploy workflow: Required before ACA job execution because the loader and package must exist in the digest-pinned image.

Shared runtime mutators: None for the web runtime.

Approved image digest: Required for the ACA operator job.

ACA runtime invariant: Required for any shared web runtime claim, but this release does not shift web traffic.

Worker image invariant: Required for the operator job image.

Feature/env flag update path: None.

Live signed-in proof required: Not for Layer 2 source landing alone. Product proof is required only after Layer 3/4 projection work.

## Rollback Plan

Rerun the previous approved Layer 2 source-adapter load for the same tenant/assessment or delete only the rows written under that tenant key and assessment ID from `ecl_source.source_record` and `ecl_source.source_file`. Do not purge other assessments or product projections as part of this rollback.

## Audit Evidence

- Local dry-run summary: `/tmp/tower-layer2-local-proof-v3/tower_layer2_ecl_source_load_summary.json`
- Generated SQL: `/tmp/tower-layer2-local-proof-v3/tower_layer2_ecl_source_load.sql`
- Readback SQL: `/tmp/tower-layer2-local-proof-v3/tower_layer2_ecl_source_readback.sql`
- Disposable Postgres readback: `/tmp/tower-layer2-local-proof-v3/postgres_readback.json`
- Source-layer signoff: generated healthcare fixture package, Layer 1 signoff file

## Known Gaps

Azure write has not run from this local branch. The ACA operator job can run only after this candidate is merged and built into a digest-pinned image.
