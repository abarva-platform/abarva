# 2026-06-03-parsing-progress-ux — Upload Parsing Progress UX

## Release ID

`2026-06-03-parsing-progress-ux`

## Status

`candidate`

## Plain-English Summary

Agent upload chips now show a live parsing progress line while a file upload is still being processed. PDFs show an estimated page position and elapsed time, while workbooks and documents show the active parsing stage and elapsed time without claiming a page count the browser cannot know.

## Layer Impact

- `global-control-lane`: improves the shared AgentDock upload experience used by agent surfaces.
- `client-data-lane`: gives users clearer feedback while client-scoped attachments are being uploaded, scanned, parsed, and persisted.

## Client Applicability

- All clients: yes, for shared AgentDock paperclip uploads.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- Adds deterministic client-side parsing progress helpers to `src/components/agent/AgentDock.tsx`.
- Tracks upload start time and estimated PDF page count for pending uploads.
- Renders accessible progress copy in upload chips such as `Parsing PDF · page 1 of ~2 · 0s elapsed`.
- Adds AgentDock tests for PDF progress, workbook progress without page claims, and live pending-upload rendering.

## QA / Validation

- `npx jest src/components/agent/__tests__/AgentDock.test.tsx --runInBand` — passed locally, 31/31 tests.
- `npx tsc --noEmit --pretty false` — passed locally.
- `npx eslint src/components/agent/AgentDock.tsx src/components/agent/__tests__/AgentDock.test.tsx` — passed locally.
- `npm run release:check -- --base origin/main --head HEAD` — passed locally.
- `git diff --check origin/main...HEAD` — passed locally.

## Rollout Plan

Merge through the protected GitHub PR flow. The change is active immediately wherever the shared AgentDock upload component is rendered. No migration, Azure change, or feature flag is required.

## Rollback Plan

Revert the PR to remove the parsing-progress helper and chip progress line. The existing upload spinner and disabled-send behavior remain the fallback experience.

## Audit Evidence

- Pull request and merge evidence will be added by GitHub once this candidate is opened and merged.
- Local AgentDock test output proving the parsing progress copy and pending-upload rendering.

## Known Gaps

- The PDF page count is a browser-side estimate for user feedback only. Server-side parser metadata remains the source of truth after processing completes.
- This does not introduce a streaming backend upload protocol; the synchronous upload route remains unchanged.
