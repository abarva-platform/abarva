# 2026-08-03-source-sourcing-context-depth — Source Sourcing Context Depth

## Release ID

`2026-08-03-source-sourcing-context-depth`

## Status

`candidate`

## Plain-English Summary

This release candidate deepens Source from a contract/vendor portfolio view into
a governed sourcing decision layer. It adds source-system extraction workbooks,
synthetic system-shaped exports, Postgres tables/views for sourcing context, and
a Cube semantic model over stable consumption views.

## Layer Impact

Release lane: `client-data-lane`.

Layer 1 client intake: adds an operational extraction package with exact source
systems, reports/APIs, join keys, data owners, and row lineage.

Layer 2 Source adapters: defines the normalized intake shape that adapters can
load without inventing missing client data.

Layer 3 canonical Source context: adds tenant-scoped tables for vendors,
contracts, scope, spend, performance, renewals, market facts, sourcing events,
and deterministic sourcing opportunities.

Layer 4 products: provides governed consumption views and Cube semantic models
for Source pages, aVa, and executive analytics. No UI route is changed in this
candidate.

## Client Applicability

- All clients: architecture and extraction pattern are reusable.
- Specific clients: synthetic SkyHarbor data is demo-only.
- Internal only: package generation and validation scripts.
- Public/demo only: none.
- Feature flag: none in this candidate.

## Changes Included

- Migration: `supabase/migrations/20260803160000_source_sourcing_context_depth_contract.sql`
- Cube model: `cube/model/source_sourcing.yml`
- Cube tenant guard: `cube/cube.py`
- Package generator: `scripts/source/build-source-operational-extraction-package.mjs`
- Package validator: `scripts/source/validate-source-operational-extraction-package.mjs`
- Readback verifier: `scripts/source/verify-sourcing-context-depth.mjs`
- Migration target guard: `scripts/source/guard-sourcing-context-migration-target.mjs`
- Architecture contract: `docs/architecture/source/SOURCE_SOURCING_CONTEXT_DEPTH_CONTRACT_2026-08-03.md`
- npm scripts for package generation, validation, migration dry/apply, and readback verification.

## QA / Validation

- `node scripts/source/build-source-operational-extraction-package.mjs` passed and wrote the ZIP to `/Users/anand/Downloads/AbarVa_Source_Operational_Extraction_Package_v1.zip`.
- `unzip -t /Users/anand/Downloads/AbarVa_Source_Operational_Extraction_Package_v1.zip` passed.
- Package ZIP SHA-256: `0e95df6cff64dbd15d592e7cbd94848b3463675ba76b68897695437b3325fc9d`.
- `npm run source:sourcing-context:package:validate` passed.
- Package validator confirmed 210 field-lineage rows, 28 vendors, 119 contracts, 2,856 spend/consumption rows, 1,920 SLA rows, and `$1.4805B` contract annual value.
- Package validator checks lineage exhaustively across all normalized data rows and rejects anchor fallback mappings.
- Manifest mapping rules: 31 explicit field-map rows, 149 supplemental column-rule rows, and 30 technical lineage rows. `no_anchor_fallback_mappings=true`.
- Cube YAML parsed locally: 8 cubes and 9 views.
- Destructive SQL scan passed for the migration: no destructive findings.
- Disposable local PostgreSQL smoke passed with stubbed SkyHarbor v3 Source read models: migration applied, 21 new Source context base tables compiled, 9 consumption views compiled, and `consumption.sourcing_contract_v1` returned a Cube-facing `confidence` column.
- Empty-database disposable PostgreSQL smoke passed: migration applied, 21 Source context base tables compiled, 3 zero-row upstream compatibility views were created only because v3 read models were absent, 9 consumption views compiled, and `consumption.sourcing_contract_v1` read zero rows successfully.
- SQL access hardening: consumption views include direct tenant predicates through `source.can_read_sourcing_tenant(tenant_key)`, and grants are scoped to the new tables/views instead of all objects in the `source` or `consumption` schemas.
- Apply guard passed/fails closed locally: `SOURCE_CONTEXT_MIGRATION_TARGET` is required for migration apply; production additionally requires `SOURCE_CONTEXT_PRODUCTION_APPROVED=true`. Guarded local smoke passed with `SOURCE_CONTEXT_MIGRATION_TARGET=lab`.
- `npm run source:sourcing-context:migrate:dry` against Azure was attempted but blocked because this worktree has no `ABARVA_AZURE_DATABASE_URL`, `AZURE_DATABASE_URL`, or `DATABASE_URL`.

## Rollout Plan

Apply the migration in lab/test Azure PostgreSQL first:

```bash
SOURCE_CONTEXT_MIGRATION_TARGET=lab npm run source:sourcing-context:migrate:apply
```

Then run:

```bash
npm run source:sourcing-context:verify-live -- --tenant=skyharbor_global
```

After lab review, promote once to the production Azure PostgreSQL database used
by `app.abarva.ai` through the controlled migration/operator lane with:

```bash
SOURCE_CONTEXT_MIGRATION_TARGET=production \
SOURCE_CONTEXT_PRODUCTION_APPROVED=true \
npm run source:sourcing-context:migrate:apply
```

## Deployment Authority

- Repo-owned deploy workflow: required before any app runtime change; no UI runtime change is included here.
- Shared runtime mutators: none in this candidate.
- Approved image digest: not applicable until merged/deployed.
- ACA runtime invariant: not applicable until merged/deployed.
- Worker image invariant: not applicable.
- Feature/env flag update path: none.
- Live signed-in proof required: required before claiming any Source page is live with the new model.

## Rollback Plan

Before production apply, rollback is to abandon the candidate branch/artifacts.
After migration apply, rollback requires dropping the new `source.*` tables and
`consumption.sourcing_*_v1` views only after confirming no product surface
depends on them. Existing Source read-model views are not dropped or replaced.

## Audit Evidence

- Generated package ZIP in `/Users/anand/Downloads/AbarVa_Source_Operational_Extraction_Package_v1.zip`
- Package validation output from `npm run source:sourcing-context:package:validate`
- Migration readback output from `npm run source:sourcing-context:verify-live` once lab/prod credentials are available.

## Known Gaps

- No lab or production database mutation was performed from this worktree because no database URL is configured here.
- Cube was syntax-parsed locally but not started against a live Cube runtime.
- Signed-in Source page proof is still required after lab/prod migration and any UI binding.
