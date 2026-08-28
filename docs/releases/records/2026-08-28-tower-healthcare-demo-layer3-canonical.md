# 2026-08-28-tower-healthcare-demo-layer3-canonical - Tower canonical Layer 3 load path

## Release ID

`2026-08-28-tower-healthcare-demo-layer3-canonical`

## Status

`candidate`

## Plain-English Summary

Adds a governed Layer 3 load path for the synthetic Tower data package. The loader converts source-adapter records into canonical objects, relationships, metric definitions, and measures so downstream cubes and product pages can read one governed source of truth.

## Layer Impact

Release lane: `client-data-lane`.

Layer 1 client intake: Reads the approved synthetic source extracts. It does not rewrite intake source rows.

Layer 2 source adapters: Requires the existing source-adapter landing rows in `ecl_source`. It does not rewrite Layer 2.

Layer 3 canonical model: Adds the Azure/Postgres write entrypoint for canonical budgets, projects, AI use cases, AI tools, monthly value observations, finance approval events, evidence items, relationships, metric definitions, and measures. The loader writes only approved physical object families and retains more specific semantic types in object attributes.

Layer 4 products: No Tower, Home, Source, Moves, Intelligence, projection, cube, or UI rows are written by this release.

Build gate compatibility: Also includes a TypeScript-only Source projection compile fix that preserves existing output shape while satisfying strict typecheck rules.

## Client Applicability

All clients: None.

Specific clients: Synthetic healthcare fixture tenant only.

Internal only: AbarVa operators reviewing the Tower synthetic data package.

Public/demo only: The source package is demo/synthetic and must not be represented as real client data.

Feature flag: None.

## Changes Included

- `scripts/tower/load-healthcare-demo-layer3-canonical.mjs`
- `scripts/tower/validate-healthcare-demo-layer3-canonical.mjs`
- `src/lib/source/contract-depth-package/projection.ts`
- `package.json` script entries:
  - `tower:healthcare-demo-layer3-canonical:load`
  - `tower:healthcare-demo-layer3-canonical:validate`
  - `tower:healthcare-demo-layer3-canonical:write-job`
- Layer 3 signoff document in the generated synthetic healthcare fixture package.

## QA / Validation

Completed local validation:

- Pass: `npm run tower:healthcare-demo-layer3-canonical:load -- --out-dir /tmp/tower-layer3-local-proof-v2`
- Pass: `npm run tower:healthcare-demo-layer3-canonical:validate -- --summary /tmp/tower-layer3-local-proof-v2/tower_layer3_ecl_context_load_summary.json --readback /tmp/tower-layer3-local-proof-v2/postgres_readback.json`
- Pass: Disposable local Postgres load/readback of Layer 2 plus Layer 3 generated SQL with zero canonical lineage gaps.
- Pass: `node scripts/tower/validate-meridian-layer1-source.mjs`
- Pass: `npm run tower:healthcare-demo-layer2-source-adapters:validate -- --summary /tmp/tower-layer2-local-proof-for-layer3/tower_layer2_ecl_source_load_summary.json --readback /tmp/tower-layer2-local-proof-for-layer3/postgres_readback.json`
- Pass: `npx tsc --noEmit --pretty false`
- Pass: `git diff --check`

Expected Layer 3 load counts:

- Canonical objects: 987
- Canonical relationships: 280
- Metric definitions: 20
- Measures: more than 2,500
- Actual generated measure count: 2,531
- Product projection rows written: 0
- Cube rows written: 0

Expected physical object family counts:

- Metric objects: 512
- Program objects: 140
- AI use case objects: 42
- AI tool objects: 13
- Control objects: 280

## Rollout Plan

Merge by PR to `main`. The repo-owned Azure Container Apps deploy workflow builds the digest-pinned image. After that image is available, run the canonical write through the governed ACA operator wrapper:

```bash
npm run ops:aca-job -- \
  --image acrabarvalab001.azurecr.io/abarva/web@sha256:<digest> \
  --script tower:healthcare-demo-layer3-canonical:write-job \
  --secret-env DATABASE_URL=azure-postgres-control-database-url \
  --env TOWER_LAYER3_TENANT_KEY=<synthetic-healthcare-tenant-key> \
  --env TOWER_LAYER3_ASSESSMENT_ID=<synthetic-healthcare-assessment-id> \
  --env TOWER_LAYER3_BUILD_VERSION=tower-layer3-canonical-v2026-08 \
  --env TOWER_LAYER3_INPUT_SOURCE_VERSION=tower-layer1-v2026-08-business-case \
  --env TOWER_LAYER3_IDEMPOTENCY_KEY=<synthetic-healthcare-assessment-id>:<main-sha> \
  --out-dir /tmp/tower-layer3-aca-proof
```

Only after the Azure readback passes should older overlapping canonical demo slices be considered for scoped retirement. Product projections and cubes are rebuilt in later layers.

## Deployment Authority

Repo-owned deploy workflow: Required before ACA job execution because the loader and package must exist in the digest-pinned image.

Shared runtime mutators: None for the web runtime.

Approved image digest: Required for the ACA operator job.

ACA runtime invariant: Required for any shared web runtime claim, but this release does not shift web traffic.

Worker image invariant: Required for the operator job image.

Feature/env flag update path: None.

Live signed-in proof required: Not for Layer 3 canonical loading alone. Product proof is required only after cube/projection and page refresh work.

## Rollback Plan

Rerun the previous approved canonical load for the same tenant/assessment. If deletion is required, scope it to rows stamped with the Layer 3 build version under that tenant key and assessment ID in `ecl_context.measure`, `ecl_context.relationship`, and `ecl_context.object`. Do not purge source rows, projections, cubes, or other tenant data as part of this rollback.

## Audit Evidence

- Local dry-run summary: `/tmp/tower-layer3-local-proof-v2/tower_layer3_ecl_context_load_summary.json`
- Generated SQL: `/tmp/tower-layer3-local-proof-v2/tower_layer3_ecl_context_load.sql`
- Readback SQL: `/tmp/tower-layer3-local-proof-v2/tower_layer3_ecl_context_readback.sql`
- Disposable Postgres readback: `/tmp/tower-layer3-local-proof-v2/postgres_readback.json`
- Layer 3 signoff: generated synthetic healthcare fixture package, Layer 3 signoff file

## Known Gaps

Azure write has not run from this local branch. The ACA operator job can run only after this candidate is merged and built into a digest-pinned image. Cubes, read models, product UI, and old-layer sunset are explicitly later-layer work.
