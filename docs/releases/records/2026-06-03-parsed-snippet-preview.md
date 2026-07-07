# 2026-06-03-parsed-snippet-preview — Parsed Upload Preview

## Release ID

`2026-06-03-parsed-snippet-preview`

## Status

`candidate`

## Plain-English Summary

Agent upload chips now show a compact parsed-preview panel after upload succeeds. Users can see the first extracted text before sending the attachment into a chat turn, plus an honest page/table metadata line that avoids inventing parser facts the backend has not reported.

## Layer Impact

- `global-control-lane`: improves the shared AgentDock paperclip upload experience used across agent surfaces.
- `client-data-lane`: surfaces client-scoped parsed attachment text before the user consumes it in an agent prompt.

## Client Applicability

- All clients: yes, for shared AgentDock uploads.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- Adds a deterministic parsed-preview helper to `src/components/agent/AgentDock.tsx`.
- Renders the first 200 characters of `extracted_text_preview` once an upload completes.
- Shows PDF page signal as an estimate only when the browser-side upload estimate exists.
- Shows table metadata as `not reported` until the backend parser returns structured table counts.
- Adds AgentDock regression tests for preview truncation, empty extraction, and rendered post-upload preview.

## QA / Validation

- `npx jest src/components/agent/__tests__/AgentDock.test.tsx --runInBand` — passed locally, 34/34 tests.
- `npx tsc --noEmit --pretty false` — passed locally.
- `npx eslint src/components/agent/AgentDock.tsx src/components/agent/__tests__/AgentDock.test.tsx` — passed locally.
- `npm run release:check -- --base origin/main --head HEAD` — passed locally.
- `git diff --check origin/main...HEAD` — passed locally.

## Rollout Plan

Merge through the protected GitHub PR flow. The preview appears immediately wherever the shared AgentDock upload component is used. No migration, Azure configuration, or feature flag is required.

## Rollback Plan

Revert the PR to remove the parsed-preview helper and post-upload preview panel. Existing upload completion chips, attachment refs, and chat submission behavior remain the fallback.

## Audit Evidence

- Pull request and merge evidence will be added by GitHub once this candidate is opened and merged.
- Local AgentDock tests prove preview truncation, empty extraction labeling, and rendered post-upload preview behavior.

## Known Gaps

- The upload route currently returns extracted text preview only; it does not return true parser page count or table count metadata.
- PDF page count shown here is explicitly an estimate derived from upload size, not a parser-confirmed count.
