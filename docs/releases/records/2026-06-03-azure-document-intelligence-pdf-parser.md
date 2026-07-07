# 2026-06-03-azure-document-intelligence-pdf-parser — Azure Document Intelligence PDF Parser

## Release ID

`2026-06-03-azure-document-intelligence-pdf-parser`

## Status

`candidate`

## Plain-English Summary

PDF uploads now have a primary Azure AI Document Intelligence Layout parser when the environment is configured. The parser requests Markdown output from `prebuilt-layout`, which better preserves tables, headings, and document structure for downstream evidence extraction and agent context. If Azure Document Intelligence is not configured or fails, the existing `pdf-parse` parser remains the fallback.

## Layer Impact

- `client-data-lane`: changes client-scoped ingestion behavior for PDF uploads in program evidence and agent attachment flows.
- `global-control-lane`: adds shared Azure Document Intelligence parser infrastructure and configuration handling.

## Client Applicability

- All clients: yes, when their environment has Document Intelligence endpoint credentials.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: configuration-gated by environment variables.

## Changes Included

- Adds `@azure-rest/ai-document-intelligence` as the official Azure REST SDK for Document Intelligence.
- Adds `src/lib/ingestion/document-intelligence-layout.ts` for `prebuilt-layout` parsing with Markdown output.
- Updates program evidence PDF parsing to prefer Azure Document Intelligence when configured and fall back to `pdf-parse` with a warning.
- Updates agent attachment PDF parsing to prefer Azure Document Intelligence when configured and fall back to `pdf-parse`.
- Adds adapter, program evidence, and agent attachment tests for configured, fallback, API-key, and AAD modes.
- Adds `docs/runbooks/document-intelligence.md`.

## QA / Validation

- `npx jest src/lib/ingestion/__tests__/document-intelligence-layout.test.ts src/lib/programs/__tests__/evidence-ingestion.test.ts src/lib/agent/__tests__/attachments.test.ts --runInBand` — passed locally, 16/16 tests.
- `npx eslint src/lib/ingestion/document-intelligence-layout.ts src/lib/ingestion/__tests__/document-intelligence-layout.test.ts src/lib/programs/evidence-ingestion.ts src/lib/programs/__tests__/evidence-ingestion.test.ts src/lib/agent/attachments.ts src/lib/agent/__tests__/attachments.test.ts` — passed locally.
- `npx tsc --noEmit --pretty false` — passed locally.
- `npm run release:check -- --base origin/main --head HEAD` — passed locally.
- `git diff --check origin/main...HEAD` — passed locally.

## Rollout Plan

Merge through the protected GitHub PR flow. Runtime behavior is activated by setting `DOCUMENT_INTELLIGENCE_ENDPOINT` plus either `DOCUMENT_INTELLIGENCE_API_KEY` or `DOCUMENT_INTELLIGENCE_USE_AAD=true` in the target environment. Without those variables, the app continues to use `pdf-parse`.

## Rollback Plan

Revert the PR to remove the Azure SDK dependency and Document Intelligence parser adapter. If an incident occurs before code rollback, unset the Document Intelligence env vars so PDF parsing returns to `pdf-parse`.

## Audit Evidence

- Pull request and merge evidence will be added by GitHub once this candidate is opened and merged.
- Local mocked-SDK test output for Azure primary and fallback behavior.
- Runbook: `docs/runbooks/document-intelligence.md`.

## Known Gaps

- Live Azure validation requires a real Document Intelligence resource and credentials; this PR includes mocked SDK coverage and configuration gates but does not prove a live Azure endpoint.
