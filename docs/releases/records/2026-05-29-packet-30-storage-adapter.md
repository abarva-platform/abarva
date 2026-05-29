# 2026-05-29-packet-30-storage-adapter

## Release ID

`2026-05-29-packet-30-storage-adapter`

## Status

`candidate`

## Plain-English Summary

This release replaces the remaining runtime Supabase-shaped storage calls with a
shared Azure Blob object-storage adapter. Program attachments, Source artifacts,
Tower uploads, and AgentDock attachments now use one storage boundary for
upload, delete, download, and signed-url generation.

## Layer Impact

- App control lane: no product UI changes.
- Data plane: runtime helper census drops from `10 files / 29 matches` to
  `1 file / 1 match`.
- Storage lane: new Azure Blob adapter under `src/lib/data-plane/objectStorage.ts`.
- Schema/migration lane: no schema or migration changes.

## Client Applicability

- All clients: yes. The storage boundary is shared by every tenant.
- Specific clients: none.
- Internal only: runtime infrastructure and upload/download behavior.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- Adds an Azure Blob object-storage adapter with upload, delete, download, and
  read-only signed-url support.
- Replaces storage calls in Source artifact upload/generate/detail paths.
- Replaces storage calls in Program attachment upload/download/text extraction.
- Replaces storage calls in Tower upload and AgentDock attachment upload.
- Tightens the runtime Supabase helper guard from `10 / 29` to `1 / 1`.

## QA / Validation

- PASS: `npm run audit:runtime-supabase-imports:guard`
- PASS: `npm run audit:runtime-supabase-imports`
- PASS: focused ESLint over changed runtime/test files
- PASS: `npx jest src/app/api/programs/__tests__/attachments-upload.smoke.test.ts src/app/api/v1/agent/attachments/__tests__/route.test.ts src/lib/programs/attachments/__tests__/extract-text.test.ts src/__tests__/integration/source/source-access-control-static.test.ts --runInBand`
- PASS: `npx tsc --noEmit --pretty false`

## Rollout Plan

Merge after CI green. Deploy through the standard production pipeline. Post
deploy, verify `/api/health`, I9 industry isolation, and one authenticated
upload-capable path if credentials are available.

## Rollback Plan

Revert this PR. That restores the previous compatibility-helper storage calls
and the `10 / 29` guard threshold. No database rollback is required.

## Audit Evidence

- `verification/packet-30-phase-2d/storage-adapter-parity.md`
- `verification/packet-30-phase-2d/storage-adapter-census.json`

## Known Gaps

- `src/lib/supabase-server.ts` remains as the final compatibility file and is
  the only remaining runtime helper match.
- The post-deploy crawl for PR #2440 failed on `/strategic-moves` with 500s
  during the crawl window. Live health later returned HTTP 200; this PR does
  not claim to resolve that route-level crawl finding.
