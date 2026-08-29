# 2026-08-28-tower-healthcare-demo-layer3-canonical - Tower canonical Layer 3 load path

## Release ID

`2026-08-28-tower-healthcare-demo-layer3-canonical`

## Status

`candidate; merged and Azure-loaded`

## Plain-English Summary

Adds a governed Layer 3 load path for the synthetic Tower data package. The loader converts source-adapter records into canonical objects, relationships, metric definitions, and measures so downstream cubes and product pages can read one governed source of truth. The object reload path now uses the semantic identity key introduced by the ECL object semantic-type migration.

## Layer Impact

Release lane: `client-data-lane`.

Layer 1 client intake: Reads the approved synthetic source extracts. It does not rewrite intake source rows.

Layer 2 source adapters: Requires the existing source-adapter landing rows in `ecl_source`. It does not rewrite Layer 2.

Layer 3 canonical model: Adds the Azure/Postgres write entrypoint for canonical budgets, projects, AI use cases, AI tools, monthly value observations, finance approval events, evidence items, relationships, metric definitions, and measures. The loader writes only approved physical object families and retains more specific semantic types through the canonical semantic identity column and matching object attributes.

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
- Pass: validator gate `summary_object_upsert_uses_semantic_identity`

Completed Azure validation:

- Pass: main ACA deploy run `33201786753` for merge SHA `268aa5b689c87dac807aee4a99eb19e61e4c847e`.
- Pass: ACA runtime invariant showed the 100% traffic revision and template using `acrabarvalab001.azurecr.io/abarva/web@sha256:2629418746b419d8c6c8810fcf1ebefe65c851a252156178b95af1d4eeb9cc0d`.
- Pass: production health endpoint returned healthy Postgres checks.
- Pass: ACA operator execution `job-abarva-private-operator-eus-qml12rw` completed successfully.
- Pass: `npm run tower:healthcare-demo-layer3-canonical:validate -- --summary /tmp/tower-layer3-aca-proof-268aa5b68/proof/meridian-tower-layer3-canonical/tower_layer3_ecl_context_load_summary.json --readback /tmp/tower-layer3-aca-proof-268aa5b68/proof/meridian-tower-layer3-canonical/03-readback.json`

Follow-up Azure finding during the 2026-08-28 rerun: the first canonical write reached readback and failed because the target database had not yet applied `20260828211000_ecl_object_semantic_type_identity.sql`. After that forced migration was applied, the next attempt exposed the old object upsert key. This update aligns the loader with the semantic uniqueness key so budget and value-observation rows cannot share only physical `metric` identity.

Follow-up proof-harness finding during the 2026-08-29 rerun: the canonical write and readback passed, but the validator's SQL-inspection gate looked for the container path recorded in `summary.load_sql` after the proof bundle had been extracted locally. The validator now resolves that path to the SQL file beside the extracted summary, so archived ACA proof bundles can be validated without editing the proof.

2026-08-29 Azure rerun evidence:

- Pass: main ACA deploy run `33222619284` for SHA `e6a8c6bbe52158a96928eea67d1e895fd22c560c`.
- Pass: ACA runtime invariant showed template, 100% traffic revision, and worker jobs using `acrabarvalab001.azurecr.io/abarva/web@sha256:0e7a779c4e4937f3a20f37130a0e36d329b43b150bd58937699444584247fd14`.
- Pass: ACA operator execution `job-abarva-private-operator-eus-wco1ibe` completed successfully.
- Pass: extracted Azure proof validation using `npm run tower:healthcare-demo-layer3-canonical:validate -- --summary /tmp/tower-layer3-aca-load-20260829T0024Z/proof/meridian-tower-layer3-canonical/tower_layer3_ecl_context_load_summary.json --readback /tmp/tower-layer3-aca-load-20260829T0024Z/proof/meridian-tower-layer3-canonical/03-readback.json`.

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

Azure readback counts:

- Canonical objects: 987
- Canonical relationships: 280
- Metric definitions: 20
- Measures: 2,531
- Layer 2 source records available: 1,981
- Tenant payload drift: 0
- Canonical-to-source gap: 0
- Objects missing source-record lineage: 0
- Relationships missing source-record lineage: 0
- Measures missing source-record lineage: 0
- Product projection rows written: 0

## Rollout Plan

Merged by PR to `main`. The repo-owned Azure Container Apps deploy workflow built the digest-pinned image, and the canonical write ran through the governed ACA operator wrapper. Use the same operator shape for approved reruns:

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
- Main ACA deploy run: `33201786753`
- Azure operator execution: `job-abarva-private-operator-eus-qml12rw`
- Azure proof bundle: `/tmp/tower-layer3-aca-proof-268aa5b68/proof/meridian-tower-layer3-canonical`
- Azure write summary: `/tmp/tower-layer3-aca-proof-268aa5b68/proof/meridian-tower-layer3-canonical/tower_layer3_ecl_context_load_summary.json`
- Azure readback: `/tmp/tower-layer3-aca-proof-268aa5b68/proof/meridian-tower-layer3-canonical/03-readback.json`
- Follow-up main ACA deploy run: `33222619284`
- Follow-up runtime invariant proof: `/tmp/aca-main-deploy-33222619284-evidence/runtime-invariant/runtime-invariant-proof.json`
- Follow-up Azure operator execution: `job-abarva-private-operator-eus-wco1ibe`
- Follow-up Azure proof bundle: `/tmp/tower-layer3-aca-load-20260829T0024Z/proof/meridian-tower-layer3-canonical`
- Follow-up Azure write summary: `/tmp/tower-layer3-aca-load-20260829T0024Z/proof/meridian-tower-layer3-canonical/tower_layer3_ecl_context_load_summary.json`
- Follow-up Azure readback: `/tmp/tower-layer3-aca-load-20260829T0024Z/proof/meridian-tower-layer3-canonical/03-readback.json`
- Layer 3 signoff: generated synthetic healthcare fixture package, Layer 3 signoff file

## Known Gaps

Cubes, read models, product UI, and old-layer sunset are explicitly later-layer work. Layer 3 proves the canonical source of truth is loaded and traceable; it does not prove Tower, Home, Source, Intelligence, or any charting surface has been refreshed from it.
