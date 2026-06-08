# 2026-06-08-admin-structured-context-fact-promotion — Admin Loads Promote Structured Context

## Release ID

`2026-06-08-admin-structured-context-fact-promotion`

## Status

`candidate`

## Plain-English Summary

Admin structured loads now complete the data-plane path instead of stopping at
chunked evidence. A successful structured CSV/JSON/YAML load stages the original
file, writes cited tenant-context chunks, and promotes deterministic row-level
records plus atomic facts into `enterprise_context_records` and
`enterprise_context_facts`.

This closes the earlier ambiguity where a load could be called complete even
though CXO facts, system rows, vendor rows, KPI rows, and org rows were only
available as chunks. Going forward, "loaded" for structured Admin uploads means
Blob evidence + parsed chunks + structured records + structured facts. Embedding
and search refresh remain separately reported stages.

## Layer Impact

- `client-data-lane`: changes Admin context ingestion semantics and writes
  structured Enterprise Context rows/facts for client-loaded data.
- `internal-admin`: updates Admin upload receipts, notifications, and UI result
  copy so operators can see files, rows, chunks, records, and facts separately.
- `global-control-lane`: adds a reusable backfill command for already-committed
  bulk upload jobs without changing runtime database source, DNS, Vercel,
  Supabase, drain/search/freeze, or account shutdown behavior.

## Client Applicability

- All clients: structured Admin uploads now promote records/facts.
- Specific clients: Lakeshore Holdings is the immediate repair target via the
  existing `lakeshore-current-state-v2-production-compatible` bulk-upload job.
- Internal only: Admin upload pages, receipts, and backfill command.
- Public/demo only: none.
- Feature flag: none.

## Changes Included

- New deterministic promotion module:
  `src/lib/context-ingestion/admin-structured-context-promotion.ts`
- CSV/Admin loader now calls the promotion path after chunk insert:
  `src/lib/context-ingestion/csv-upload-connector.ts`
- Bulk upload result and persisted job status include `recordsPromoted` and
  `factsPromoted`.
- Admin upload result UI and notification copy now report structured promotion.
- Chunk-backed Enterprise Context overview no longer reports chunks as
  normalized records/facts.
- New backfill command:
  `scripts/context-ingestion/promote-bulk-upload-job.ts`
- Backfills preserve the original staged file SHA-256 from the bulk upload
  status and write a structured-promotion receipt back to Azure Blob under the
  job folder.

## QA / Validation

- PASS — Focused Jest:
  `npx jest src/lib/context-ingestion/__tests__/admin-structured-context-promotion.test.ts src/lib/context-ingestion/__tests__/csv-upload-connector.test.ts src/lib/context-ingestion/__tests__/bulk-context-upload.test.ts src/app/api/admin/context-layer/bulk-upload/__tests__/route.test.ts src/app/api/admin/context-layer/bulk-upload/status/__tests__/route.test.ts src/lib/context-ingestion/loader/__tests__/commit-adapter.test.ts src/lib/context-ingestion/__tests__/tenant-context-read-model.test.ts src/lib/enterprise-context/__tests__/intelligence-read-model.test.ts --runInBand`
- The new tests verify:
  - org-role rows promote to `org_role` records/facts with row provenance;
  - infrastructure rows mapped through a compatibility template recover the
    true `infrastructure_estate` dimension;
  - canonical IDs are stable across reruns;
  - source/source-file IDs and original file hash flow into promoted lineage;
  - chunk-backed fallback paths no longer count chunks as normalized records or
    facts;
  - the existing CSV and bulk upload tests now exercise promotion.
- PASS — ESLint on touched source/test files.
- PASS — `npx tsc --noEmit --pretty false`.
- PASS — `npm run release:check -- --base origin/main --head HEAD`.
- PASS — `git diff --check`.

## Rollout Plan

1. Merge this PR to `main`.
2. Build and deploy the Azure Container Apps image from merged `main`.
3. Run the backfill command for the Lakeshore committed bulk-upload job:
   `bulk-0af5b2dc5f80801f`.
   The command writes an Azure Blob receipt at:
   `lakeshore-holdings/_jobs/bulk-0af5b2dc5f80801f-structured-promotion.json`.
4. Verify Lakeshore counts separately:
   - source files;
   - chunks;
   - `enterprise_context_records`;
   - `enterprise_context_facts`;
   - embedding/search status;
   - Sentinel/Nexus golden-question QA.

## Rollback Plan

Revert the PR and redeploy the prior Azure Container Apps image. Rows promoted
into `enterprise_context_records` and `enterprise_context_facts` are idempotent
and source-scoped with canonical IDs prefixed by `admin-upload:<tenant>:...`.
If a data rollback is required, remove only rows whose payload metadata
`_abarva.loader` is `admin_structured_context_promotion` and whose tenant/source
matches the affected upload.

## Audit Evidence

- PR for this release candidate.
- Focused Jest output listed above.
- Lakeshore post-backfill receipt after Azure deploy.
- Admin bulk-upload job status for `bulk-0af5b2dc5f80801f`.
- Azure runtime health and Admin diagnostics after backfill.

## Known Gaps

- This does not run embeddings or Azure Search refresh. Those remain separate
  retrieval/readiness stages and must not be implied by "records/facts promoted."
- This does not change document/PDF/DOCX/PPTX extraction policy; deterministic
  structured rows are promoted, while document-derived facts still require the
  review-required path unless a deterministic parser is implemented.
