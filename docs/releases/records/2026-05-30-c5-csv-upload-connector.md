# C5 CSV Upload Connector

## Release ID
2026-05-30-c5-csv-upload-connector

## Status
Ready for PR review.

## Plain-English Summary
Admins can upload a CSV from the Context Layer uploads page, choose the context template, map row identity/title/text columns, and load each CSV row as tenant context. The first release queues rows as pending context chunks; it does not claim vectors are searchable until the existing embedding worker runs.

## Layer Impact
Setup lane and data-plane lane. The change touches only the admin context-layer upload connector, its API route, and context-ingestion helper code for CSV parsing, schema mapping, and batch insertion.

## Client Applicability
All clients with an active Clerk-backed tenant session can use the connector, but every upload is pinned to the server-resolved active client id and tenant key. Cross-tenant client ids are rejected before parsing or persistence.

## Changes Included
- Added `/api/admin/context-layer/csv-upload` for authenticated CSV multipart uploads.
- Added a schema mapper that infers template fields, row ids, titles, and chunk text columns from CSV headers.
- Added a batch loader that inserts rows into `enterprise_context_chunks` with `embedding_status = pending` and records a `data_ingestion_runs` audit row when available.
- Added a CSV connector panel to `/admin/context-layer/uploads`.
- Added tests for CSV parsing, schema mapping, pending chunk preparation, non-destructive insertion, and route-level tenant isolation.

## QA / Validation
Status: passed for the focused PR gate. Validation covered CSV connector Jest tests, route smoke test, touched-file ESLint, release gate, and `git diff --check`. End-to-end embedding/search smoke is not claimed in this slice because the connector queues pending chunks for the existing worker instead of running that worker inside the upload request.

## Rollout Plan
Merge behind the existing authenticated admin surface. After deployment, upload a small application-portfolio CSV for a non-production tenant, confirm pending rows appear under Context Layer uploads/approval views, then run `npm run embed:pending-chunks -- --tenant <tenant-key>` with the production embedding environment when vector search availability is required.

## Rollback Plan
Revert the PR to remove the UI, route, and helper code. Rows inserted by this connector are additive and identifiable by `provenance.loader = c5-csv-upload-connector`; if a cleanup is required, remove only those rows for the affected tenant after exporting an audit copy.

## Audit Evidence
The loader stamps every chunk with `tenant_key`, `client_id`, `source_doc`, `source_row`, `uploaded_by`, `uploaded_at`, and the schema mapping inside provenance. The route rejects mismatched `clientId` values and performs no deletes or cross-tenant writes.

## Known Gaps
This is Phase 1. CSV rows become load-ready/pending context chunks, but they are not embedded or Pinecone-searchable until the existing `embed:pending-chunks` worker runs with OpenAI/Pinecone credentials. There is no durable background job trigger wired to the upload route yet.
