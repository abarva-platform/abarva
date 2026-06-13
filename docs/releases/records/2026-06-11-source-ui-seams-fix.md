# 2026-06-11-source-ui-seams-fix — Source upload affordance + approval-persist seam fixes

## Release ID

`2026-06-11-source-ui-seams-fix`

## Status

`candidate`

## Plain-English Summary

Two bugs found by applying the "user's crawl, not author's crawl" lesson — sweeping the
seams users actually click rather than the routes the author tested:

1. **No UI path to the governed upload.** The only visible upload affordance on the Source
   canvas (the chat paperclip) posts to `/api/v1/agent/attachments` — a chat attachment
   that never reaches the artifact registry, EVENT DOCUMENTS, or the Evidence ladder. The
   governed route worked, but only author-driven fetch calls ever used it. Added an
   **"Upload document"** button to the EVENT DOCUMENTS shelf wired to
   `/api/v1/source/{eventId}/artifacts/upload` with the current stage.
2. **Gate-decision approval persistence would 500 in prod.** The gate-decision route
   persisted its approval record through the new File-Cabinet repository, whose schema
   collides with the pre-existing `source_artifacts` table. Repointed to the EXISTING
   artifact registry (blob `source-artifacts` bucket + `decision_brief` row), so approval
   records render in the EVENT DOCUMENTS shelf like every other artifact.

## Layer Impact

- `global-control-lane`: UploadEventDocumentButton + DocumentTab shelf wiring;
  approval-artifact rewrite; gate-decision route call update. No schema change.

## Client Applicability

- All clients: yes — every tenant's Source canvas gains the Upload document affordance,
  and every tenant's gate decisions persist correctly.

## Rollout Plan

Squash-merge to main → build web image from main → roll `ca-abarva-web-lab-eastus` →
real-UI click verification (upload via the button moves the Evidence chip; Record decision
persists and the approval record appears in EVENT DOCUMENTS).

## Changes Included

- `src/components/source/canvas/workspace-tabs/UploadEventDocumentButton.tsx` (new)
- `src/components/source/canvas/workspace-tabs/DocumentTab.tsx` (shelf header button)
- `src/lib/source/stage-gate/approval-artifact.ts` (existing-registry persistence)
- `src/app/api/v1/source/events/[eventId]/gate-decision/route.ts` (call shape)
- Updated tests (source-wiring approval persistence; 17+5 green).

## QA / Validation

- gate-decision route + stage-gate + source-wiring suites green; tsc/eslint clean;
  release:check + architecture-rules pass.
- Post-deploy verification is a REAL UI CLICK pass (button-driven upload moves the
  Evidence chip; Record decision persists and the approval record appears in EVENT
  DOCUMENTS) — not API calls.

## Known Gaps

- File-Cabinet list/download routes + page remain schema-colliding (no nav links;
  deprecated pending reconciliation onto the existing registry).
- Flagged for follow-up: `nexus/ask` route gates behavior on `startsWith("APX-")`
  (Apex-specific surface gating class).

## Rollback Plan

Revert the PR. No schema/data unwinds.

## Audit Evidence

This record; the originating lesson (Moves-side user-test retrospective, 2026-06-11).
