# 2026-06-04-ingestion-document-intelligence-loader — Document Parsing for Governed Ingestion

## Release ID

`2026-06-04-ingestion-document-intelligence-loader`

## Status

`candidate`

## Plain-English Summary

Enables the governed Azure landing-zone ingestion consumer to parse supported uploaded documents before handing them to the downstream pipeline. PDFs use Azure AI Document Intelligence when configured, with fallback parsing when it is unavailable or fails. DOCX, XLSX, PPTX, Markdown, JSON, and plain text files now have a shared ingestion parser so Lakeshore-style client files can become real context instead of inert attachments.

## Layer Impact

- `client-data-lane`: Adds document parsing to the client-scoped ingestion path before context chunking. The parser carries extracted text and parse metadata to the downstream pipeline without changing database schema.
- `internal-admin`: Improves the Azure worker's audit-only mode so it logs document parse method, warnings, metadata, and chunk estimates for rehearsal runs.

## Client Applicability

- All clients: Any tenant using the governed Azure landing-zone ingestion consumer benefits from document parsing.
- Specific clients: Lakeshore Holdings pilot package is the immediate rehearsal target.
- Internal only: Azure worker logging and parser tests.
- Public/demo only: None.
- Feature flag: Azure AI Document Intelligence is activated by environment variables; without them, the PDF path uses local fallback parsing.

## Changes Included

- `src/lib/ingestion/document-upload-parser.ts`
- `src/lib/ingestion/azure-landing-zone-consumer.ts`
- `src/scripts/azure-context-ingestion-worker.ts`
- `src/lib/ingestion/__tests__/document-upload-parser.test.ts`
- `src/lib/ingestion/__tests__/azure-landing-zone-consumer.test.ts`

## QA / Validation

- PASS — Focused ingestion Jest tests covering document parser, landing-zone consumer handoff, and Azure Document Intelligence layout helper.
- PASS — TypeScript and lint checks for the touched ingestion surfaces.
- PASS — Release control gate.

## Rollout Plan

Merge to `main`. Runtime behavior activates when the Azure context-ingestion worker processes supported uploaded files. Azure AI Document Intelligence PDF parsing activates when `DOCUMENT_INTELLIGENCE_ENDPOINT` plus either `DOCUMENT_INTELLIGENCE_API_KEY` or `DOCUMENT_INTELLIGENCE_USE_AAD=true` is configured.

## Rollback Plan

Revert the PR. The consumer will return to guard-plus-pipeline behavior without document parse metadata. No migration rollback is required.

## Audit Evidence

- Unit tests in `src/lib/ingestion/__tests__/document-upload-parser.test.ts`
- Consumer tests in `src/lib/ingestion/__tests__/azure-landing-zone-consumer.test.ts`
- Existing Azure Document Intelligence tests in `src/lib/ingestion/__tests__/document-intelligence-layout.test.ts`

## Known Gaps

- This slice passes extracted text to the pipeline seam. It does not yet commit parsed document chunks into Lakeshore's private data plane; that remains the next load-execution slice.
