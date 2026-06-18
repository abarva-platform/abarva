# 2026-06-18-meridian-lakeshore-v2-refresh-scaffold — Meridian and Lakeshore V2 Refresh Scaffold

## Release ID

`2026-06-18-meridian-lakeshore-v2-refresh-scaffold`

## Status

`deployed-private-data-plane`

## Plain-English Summary

Adds the controlled refresh scaffold for Meridian Health and Lakeshore Industries. The scaffold validates the local V2 source packs, emits client-scoped replacement SQL, creates a handoff brief, and adds a dry-run validated ACA/private data-plane worker for the future refresh.

Follow-up hardening adds schema-aware scoped archive/delete guards after the first ACA apply attempt found a live table that did not have the expected `client_id` column. The worker now introspects each table before selecting or deleting client-scoped rows, uses `client_id` when present, falls back to `tenant_key` when present, and skips tables without either scoped column.

Second-pass hardening maps client-native business function names into the constrained platform taxonomy after the patched ACA worker surfaced the live `enterprise_context_records_business_function_check` constraint. A one-off ACA inspection job confirmed the allowed values are `FINANCE`, `SUPPLY_CHAIN`, `HUMAN_RESOURCES`, `OPERATIONS`, `COMMERCIAL_SALES`, `IT`, `COMPLIANCE_LEGAL`, `CORPORATE`, and `INDUSTRY_OPS`. The richer source labels remain preserved in record payloads and facts.

Third-pass hardening makes the worker introspect JSON/JSONB column types and serialize values before insert. This addresses the next live ACA failure, where raw string fact values reached a JSON column and Postgres returned `invalid input syntax for type json`.

Fourth-pass hardening skips blank/null AI Control context fact values before insert. This addresses the next live ACA failure, where `ai_control_context_facts.fact_value` rejected null fact rows.

Fifth-pass hardening de-duplicates rows by configured conflict key before each batched upsert. This addresses the next live ACA failure, where duplicate `ai_control_context_facts` keys in one insert caused Postgres to reject an `ON CONFLICT DO UPDATE` batch.

The hardened private-worker apply then succeeded for Meridian and Lakeshore under run id `meridian-lakeshore-v2-20260618064604`. The run replaced client-scoped context/corpus/Tower rows through the ACA private operator job, and a follow-up verifier job confirmed Meridian committed counts plus Lakeshore enterprise-context counts. Lakeshore AI Control counts are evidenced by the successful apply receipt because the verifier's tenant-key resolver did not resolve the live Lakeshore client alias.

This release does not claim Azure Blob staging, document parser extraction, embeddings/search refresh, insight evaluator refresh, or signed-in Intelligence/Tower answer QA. Those remain separate gates.

## Layer Impact

- `client-data-lane`: Adds refresh orchestration artifacts for Meridian and Lakeshore client data.
- `internal-admin`: Adds a dry-run script and handoff brief for the delivery/admin team.
- `experimental`: Supports the backend redesign path for Intelligence and AI Control Tower, but does not activate a runtime feature by itself.

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
- FAIL/BLOCKED: ACA apply execution `job-abarva-private-operator-eus-bgohqqk` still failed with `enterprise_context_records_business_function_check` when the mapper used inferred plain-English labels.
- PASS: ACA inspection execution `job-abarva-private-operator-eus-w14mkps` queried the live check constraint and confirmed uppercase allowed values for `enterprise_context_records.business_function`.
- FAIL/BLOCKED: ACA apply execution `job-abarva-private-operator-eus-isbyroc` advanced past the business-function constraint, then failed before commit with `invalid input syntax for type json`. This record includes the follow-up JSON/JSONB serialization guard; patched worker retry is required.
- FAIL/BLOCKED: ACA apply execution `job-abarva-private-operator-eus-sbeelwb` advanced past JSON serialization, then failed before commit with `upsert_failed:ai_control_context_facts:batch_1:null value in column "fact_value"`. This record includes the follow-up null fact filter; patched worker retry is required.
- FAIL/BLOCKED: ACA apply execution `job-abarva-private-operator-eus-brv4cv4` advanced past null fact filtering, then failed before commit with `upsert_failed:ai_control_context_facts:batch_1:ON CONFLICT DO UPDATE command cannot affect row a second time`. This record includes the follow-up conflict-key de-duplication; patched worker retry is required.
- PASS: ACA apply execution `job-abarva-private-operator-eus-4nzcpsg` succeeded for run id `meridian-lakeshore-v2-20260618064604`.
- PASS: Public app health after apply returned `ok:true`, `postgres:true`, `direct_postgres:true`, and `azure_graph:"postgres"`.
- PASS: Private verifier execution `job-abarva-private-operator-eus-x6jvy1r` succeeded and returned `ok:true`.
- PASS: Verifier confirmed Meridian committed counts: 1 context source, 24 source files, 497 records, 5,428 facts, 502 chunks, 260 relationships, 7 private patterns, 14 AI Control initiatives, 40 tool-usage rows, 14 productivity rows, 12 DORA rows, 14 agent-outcome rows, 14 benefit rows, 14 spend rows, 14 risk rows, 10 action rows, 14 evidence rows, 356 AI Control facts, and 1 Atlas context pack.
- PASS: Verifier confirmed Lakeshore enterprise-context counts: 1 context source, 22 source files, 436 records, 4,809 facts, 439 chunks, and 226 relationships.
- PASS: Successful Lakeshore apply receipt from `job-abarva-private-operator-eus-4nzcpsg` showed 4 private patterns, 1 AI Control refresh run, 14 AI Control sources, 10 initiatives, 40 tool-usage rows, 10 productivity rows, 8 DORA rows, 10 agent-outcome rows, 10 benefit rows, 10 spend rows, 10 risk rows, 10 action rows, 10 evidence rows, 256 AI Control facts, and 1 Atlas context pack.

## Rollout Plan

The patched worker was rolled out through the controlled ACA/private data-plane execution flow. The successful run archived current client rows, deleted by client scope only, and loaded V2 context/corpus/Tower packs. Remaining rollout gates are embeddings/search refresh, insight evaluator refresh, and signed-in Intelligence/Tower QA.

## Rollback Plan

Code rollback is a git revert of this release lane. Data rollback requires restoring Meridian/Lakeshore from the archived rows captured by run id `meridian-lakeshore-v2-20260618064604`; do not delete global, auth, audit, or unrelated client rows. The private operator job was restored to its idle `/bin/true` image after the successful apply and verifier runs.

## Audit Evidence

- Refresh scaffold: `scripts/context-packs/refresh-meridian-lakeshore-v2.mjs`
- ACA/private DB worker: `scripts/jobs/load-meridian-lakeshore-v2.cjs`
- Build brief: `docs/codex-handoff/MERIDIAN_LAKESHORE_CONTEXT_REFRESH_BUILD_BRIEF.md`
- Preflight receipts: `outputs/context-refresh/`
- Source packs:
  - `datasets/meridian-health-synthetic-v2/`
  - `datasets/lakeshore-industries-synthetic-v2/`
- Successful apply: ACA private operator execution `job-abarva-private-operator-eus-4nzcpsg`, run id `meridian-lakeshore-v2-20260618064604`
- Successful verifier: ACA private operator execution `job-abarva-private-operator-eus-x6jvy1r`

## Context Ingestion Evidence

- Local artifact generated: Yes. Dry-run preflight receipt and generated SQL were produced under `outputs/context-refresh/`.
- Local parse/preflight: Yes. Meridian and Lakeshore local packs passed manifest/count/pattern/graph validation, and the worker dry-run produced record/fact/chunk/Tower row counts.
- Product loader/API acceptance: Yes. ACA private worker apply execution `job-abarva-private-operator-eus-4nzcpsg` succeeded for run id `meridian-lakeshore-v2-20260618064604` after the scoped-column, taxonomy, JSON/JSONB serialization, null-fact, and duplicate-upsert fixes.
- Azure Blob/object storage staging: Not run.
- Queue/private worker handoff: Yes. Failed hardening executions were `job-abarva-private-operator-eus-bju2nk9`, `job-abarva-private-operator-eus-34p9fe8`, `job-abarva-private-operator-eus-bgohqqk`, `job-abarva-private-operator-eus-isbyroc`, `job-abarva-private-operator-eus-sbeelwb`, and `job-abarva-private-operator-eus-brv4cv4`; inspection execution `job-abarva-private-operator-eus-w14mkps` succeeded; final apply execution `job-abarva-private-operator-eus-4nzcpsg` succeeded; verifier execution `job-abarva-private-operator-eus-x6jvy1r` succeeded.
- Parser extraction with source citations: Not run.
- Review/approval queue: Not run.
- Client data-plane commit: Yes. Meridian counts were verifier-proven; Lakeshore enterprise-context counts were verifier-proven and Lakeshore AI Control counts were apply-receipt-proven.
- Embedding/search refresh: Not run.
- Live signed-in retrieval or answer QA: Not run.

Current state: local refresh scaffold validated, web runtime deployed, private-worker apply completed, verifier completed, private operator restored to idle, and public app health passed. Remaining gates are Blob staging, document parser extraction, review queue, embeddings/search refresh, insight evaluator refresh, and signed-in Intelligence/Tower answer QA.

## Known Gaps

- Lakeshore AI Control counts are apply-receipt-proven, not independently resolver-verified, because the verifier did not resolve the live Lakeshore client alias.
- Does not stage originals in Azure Blob/object storage.
- Does not run deterministic document extraction from PDFs/DOCX/PPTX/XLSX.
- Does not refresh embeddings/search.
- Does not run the insight evaluator.
- Does not run signed-in Intelligence/Tower QA.
