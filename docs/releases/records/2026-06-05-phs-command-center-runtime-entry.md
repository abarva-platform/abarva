# 2026-06-05-phs-command-center-runtime-entry — PHS Command Center Runtime Entry

## Release ID

`2026-06-05-phs-command-center-runtime-entry`

## Status

`candidate`

## Plain-English Summary

Adds the authenticated runtime entry point for Meridian / PHS command-center
artifact generation. The route uses the active user/client session to read PHS
context readiness, then calls the guarded OpenAI generation harness. A caller
cannot provide a different client ID in the request body to switch scope.

## Layer Impact

`client-data-lane`: Reads tenant-scoped context chunks and evidence ledger rows
for the active client only.

`global-control-lane`: Adds a reusable authenticated generation-entry pattern
for Moves-led artifacts that must be readiness-gated before any model call.

## Client Applicability

- All clients: The route pattern is reusable.
- Specific clients: Meridian / PHS command-center setup is the immediate target.
- Internal only: Yes, this is an authenticated app API route.
- Public/demo only: No public route impact.
- Feature flag: None.

## Changes Included

- Added `src/lib/context-ingestion/phs-stage-readiness-read-model.ts`.
- Added `src/lib/context-ingestion/__tests__/phs-stage-readiness-read-model.test.ts`.
- Added `src/app/api/v1/moves/phs-command-center/generate/route.ts`.
- Added route tests under `src/app/api/v1/moves/phs-command-center/generate/__tests__/route.test.ts`.

## QA / Validation

- PASS: `npx jest src/lib/context-ingestion/__tests__/phs-stage-readiness-read-model.test.ts src/app/api/v1/moves/phs-command-center/generate/__tests__/route.test.ts --runInBand`.
- PASS: `npx eslint src/lib/context-ingestion/phs-stage-readiness-read-model.ts src/lib/context-ingestion/__tests__/phs-stage-readiness-read-model.test.ts src/app/api/v1/moves/phs-command-center/generate/route.ts src/app/api/v1/moves/phs-command-center/generate/__tests__/route.test.ts`.
- PASS: `git diff --check`.
- PASS: `npm run release:check -- --base codex/phs-openai-generation-guard --head HEAD`.

## Rollout Plan

Merge to main after CI. No migration or data load is required. The route remains
blocked by the same Phase 0 readiness/evidence/corpus gates as the underlying
generation harness.

## Rollback Plan

Revert the PR. The lower-level PHS loader, evidence ledger, readiness, and
generation contracts remain intact, but no runtime API entry point is exposed.

## Audit Evidence

- Runtime route: `src/app/api/v1/moves/phs-command-center/generate/route.ts`.
- Read model: `src/lib/context-ingestion/phs-stage-readiness-read-model.ts`.
- Tenant-scope tests: `src/app/api/v1/moves/phs-command-center/generate/__tests__/route.test.ts`.

## Known Gaps

This does not upload or side-load Meridian / PHS data. It does not add a UI
button yet; browser/crawl proof should follow after the route lands.
