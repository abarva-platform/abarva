# 2026-06-03-upload-parse-metadata — Upload Parse Metadata

## Release ID

`2026-06-03-upload-parse-metadata`

## Status

`candidate`

## Plain-English Summary

Agent attachment parsing now returns structured parse metadata with the upload response. The AgentDock parsed-preview panel can show true parser-reported page and table counts instead of relying only on browser estimates or `not reported` placeholders.

## Layer Impact

- `global-control-lane`: upgrades the shared AgentDock upload preview to prefer backend parser metadata.
- `client-data-lane`: carries client-scoped parse metadata from the upload route response before the attachment is used in agent context.

## Client Applicability

- All clients: yes, for shared AgentDock uploads.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- Adds `tableCount` to the Azure Document Intelligence layout parser result.
- Adds `extractAgentAttachmentParseResult` while preserving `extractAgentAttachmentText` as a compatibility wrapper.
- Returns `parse_metadata.page_count`, `parse_metadata.table_count`, and `parse_metadata.parser_id` from `/api/v1/agent/attachments`.
- Computes PDF fallback page/table metadata from `pdf-parse` and workbook table metadata from worksheet count.
- Updates AgentDock parsed-preview UI to prefer true backend counts and fall back honestly when metadata is absent.
- Adds regression tests for parser metadata, upload API metadata, and rendered AgentDock counts.

## QA / Validation

- `npx jest src/lib/ingestion/__tests__/document-intelligence-layout.test.ts src/lib/agent/__tests__/attachments.test.ts src/app/api/v1/agent/attachments/__tests__/route.test.ts src/components/agent/__tests__/AgentDock.test.tsx --runInBand` — passed locally, 60/60 tests.
- `npx tsc --noEmit --pretty false` — passed locally.
- `npx eslint src/lib/ingestion/document-intelligence-layout.ts src/lib/ingestion/__tests__/document-intelligence-layout.test.ts src/lib/agent/attachments.ts src/lib/agent/__tests__/attachments.test.ts src/app/api/v1/agent/attachments/route.ts src/app/api/v1/agent/attachments/__tests__/route.test.ts src/components/agent/AgentDock.tsx src/components/agent/__tests__/AgentDock.test.tsx` — passed locally.
- `npm run release:check -- --base origin/main --head HEAD` — passed locally.
- `git diff --check origin/main...HEAD` — passed locally.

## Rollout Plan

Merge through the protected GitHub PR flow. The upload response shape is additive and the AgentDock UI handles missing metadata, so existing upload flows continue to work.

## Rollback Plan

Revert the PR to remove parse metadata from the upload response and restore the parsed-preview panel to estimate/not-reported labels. Existing attachment persistence and upload preview text remain intact.

## Audit Evidence

- Pull request and merge evidence will be added by GitHub once this candidate is opened and merged.
- Local parser, upload-route, and AgentDock tests prove metadata extraction and UI rendering.

## Known Gaps

- Workbook `table_count` is the worksheet count because the current Excel extraction flattens sheet rows rather than detecting native Excel table objects.
- DOCX and image uploads still report page/table metadata as unavailable.
