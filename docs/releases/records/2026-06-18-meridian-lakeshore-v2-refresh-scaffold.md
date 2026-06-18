# 2026-06-18-meridian-lakeshore-v2-refresh-scaffold — Meridian and Lakeshore V2 Refresh Scaffold

## Release ID

`2026-06-18-meridian-lakeshore-v2-refresh-scaffold`

## Status

`candidate`

## Plain-English Summary

Adds the controlled refresh scaffold for Meridian Health and Lakeshore Industries. The scaffold validates the local V2 source packs, emits client-scoped replacement SQL, creates a handoff brief, and adds a dry-run validated ACA/private data-plane worker for the future refresh.

Follow-up hardening adds schema-aware scoped archive/delete guards after the first ACA apply attempt found a live table that did not have the expected `client_id` column. The worker now introspects each table before selecting or deleting client-scoped rows, uses `client_id` when present, falls back to `tenant_key` when present, and skips tables without either scoped column.

Second-pass hardening maps client-native business function names into the constrained platform taxonomy (`Revenue Cycle`, `Technology`, `Finance`, `Operations`, `Clinical`, `Supply Chain`, `HR`, `Legal`, `Strategy`) after the patched ACA worker surfaced the live `enterprise_context_records_business_function_check` constraint. The richer source labels remain preserved in record payloads and facts.

This does not delete or load database rows. It prepares the audit-safe path for replacing the current Meridian/Lakeshore context, corpus, Intelligence, and AI Control Tower rows with the new V2 packs.

## Layer Impact

- `client-data-lane`: Adds refresh orchestration artifacts for Meridian and Lakeshore client data.
- `internal-admin`: Adds a dry-run script and handoff brief for the delivery/admin team.
- `experimental`: Supports the backend redesign path for Intelligence and AI Control Tower, but does not activate a runtime feature.

## Client Applicability

- All clients: No runtime behavior change.
- Specific clients: Meridian Health (`tenant_key=meridian-health`) and Lakeshore Industries (`tenant_key=lakeshore`).
- Internal only: Refresh preflight, generated SQL, and execution brief.
- Public/demo only: Not applicable.
- Feature flag: Not applicable.

## Changes Included

- `scripts/context-packs/refresh-meridian-lakeshore-v2.mjs`
- `scripts/jobs/load-meridian-lakeshore-v2.cjs`
- `docs/codex-handoff/MERIDIAN_LAKESHORE_CONTEXT_REFRESH_BUILD_BRIEF.md`
- Generated preflight receipts under `outputs/context-refresh/`
- `docs/releases/records/2026-06-18-meridian-lakeshore-v2-refresh-scaffold.md`

## QA / Validation

- PASS: `node --check scripts/context-packs/refresh-meridian-lakeshore-v2.mjs`
- PASS: `node scripts/context-packs/refresh-meridian-lakeshore-v2.mjs`
- PASS: `node --check scripts/jobs/load-meridian-lakeshore-v2.cjs`
- PASS: `node scripts/jobs/load-meridian-lakeshore-v2.cjs` dry-run with existing workspace dependencies.
- PASS: `node scripts/jobs/load-meridian-lakeshore-v2.cjs --client all` dry-run after schema-aware scoped archive/delete guard.
- PASS: `./node_modules/.bin/tsc --noEmit --pretty false`
- PASS: Meridian preflight reports 496 context CSV rows, 259 Tower CSV rows, 260 graph edges, and 7 corpus patterns.
- PASS: Lakeshore preflight reports 435 context CSV rows, 201 Tower CSV rows, 226 graph edges, and 4 corpus patterns.
- PASS: Meridian worker dry-run builds 24 source files, 497 context records, 5,428 facts, 502 chunks, 260 graph edges, 7 private patterns, and 14 Tower sources.
- PASS: Lakeshore worker dry-run builds 22 source files, 436 context records, 4,809 facts, 439 chunks, 226 graph edges, 4 private patterns, and 14 Tower sources.
- FAIL/BLOCKED: ACA apply execution `job-abarva-private-operator-eus-bju2nk9` failed before commit with `column "client_id" does not exist`. This release record includes the follow-up schema-aware guard; the patched worker must be redeployed and retried before claiming data-plane commit.
- FAIL/BLOCKED: ACA apply execution `job-abarva-private-operator-eus-34p9fe8` advanced past scoped delete, then failed before commit with `enterprise_context_records_business_function_check`. This release record includes the follow-up business-function taxonomy mapper; the patched worker must be redeployed and retried before claiming data-plane commit.

## Rollout Plan

Roll out the patched worker through the controlled ACA/private data-plane execution flow. The run must archive current client rows, delete by client scope only, load V2 packs, refresh embeddings/search, run the insight evaluator, and prove signed-in Intelligence/Tower QA before the data refresh is considered complete.

## Rollback Plan

Delete `scripts/context-packs/refresh-meridian-lakeshore-v2.mjs`, `docs/codex-handoff/MERIDIAN_LAKESHORE_CONTEXT_REFRESH_BUILD_BRIEF.md`, and generated `outputs/context-refresh/` receipts, or git-revert this release. No database rollback is required because no data-plane writes are included.

## Audit Evidence

- Refresh scaffold: `scripts/context-packs/refresh-meridian-lakeshore-v2.mjs`
- ACA/private DB worker: `scripts/jobs/load-meridian-lakeshore-v2.cjs`
- Build brief: `docs/codex-handoff/MERIDIAN_LAKESHORE_CONTEXT_REFRESH_BUILD_BRIEF.md`
- Preflight receipts: `outputs/context-refresh/`
- Source packs:
  - `datasets/meridian-health-synthetic-v2/`
  - `datasets/lakeshore-industries-synthetic-v2/`

## Context Ingestion Evidence

- Local artifact generated: Yes. Dry-run preflight receipt and generated SQL were produced under `outputs/context-refresh/`.
- Local parse/preflight: Yes. Meridian and Lakeshore local packs passed manifest/count/pattern/graph validation, and the worker dry-run produced record/fact/chunk/Tower row counts.
- Product loader/API acceptance: Attempted through ACA private worker. The first apply failed before commit with `column "client_id" does not exist`; the second apply advanced and failed before commit with `enterprise_context_records_business_function_check`. Patched worker retry is required.
- Azure Blob/object storage staging: Not run.
- Queue/private worker handoff: Attempted with ACA job executions `job-abarva-private-operator-eus-bju2nk9` and `job-abarva-private-operator-eus-34p9fe8`; both failed before commit due to schema/value constraints.
- Parser extraction with source citations: Not run.
- Review/approval queue: Not run.
- Client data-plane commit: Not completed/proven.
- Embedding/search refresh: Not run.
- Live signed-in retrieval or answer QA: Not run.

Current state: local refresh scaffold validated, web runtime deployed, private-worker apply has exposed two live constraints, and the schema-aware plus taxonomy-mapping worker fixes are ready for redeploy/retry.

## Known Gaps

- The ACA archive/delete/load worker was run with `--apply`, but executions failed before commit with scoped-column and business-function taxonomy constraints; patched worker retry is still required.
- Does not yet prove committed V2 packs in Azure/Postgres.
- Does not refresh embeddings/search.
- Does not run signed-in Intelligence/Tower QA.
