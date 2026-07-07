# 2026-06-05-board-grade-move-artifact-persistence — Board-Grade Move Artifact Persistence

## Release ID

`2026-06-05-board-grade-move-artifact-persistence`

## Status

`candidate`

## Plain-English Summary

Board-grade Move artifact generation now creates a durable `generated_artifacts`
row for real `?moveId=` board-grade HTML decks. The saved row carries a stable
application retrieval URL instead of only the renderer's `generated://` pseudo
URL, and the rendered HTML is stored in the existing metadata column so the
artifact can be retrieved later by id.

## Layer Impact

- `global-control-lane`: Shared board-grade Move artifact routes now attach
  persisted artifact headers when a real Move deck is rendered.
- `client-data-lane`: Writes use the existing `generated_artifacts` table,
  scoped by client key. No schema migration is included.

## Client Applicability

- All clients: Applies to real Move board-grade artifact routes that render
  with `?moveId=`.
- Specific clients: PHS/Meridian is the execution driver for this slice.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/lib/artifacts/repository.ts` now saves generated artifacts with a
  durable `/api/v1/artifacts/:id` URL and exposes lookup helpers.
- `src/app/api/v1/artifacts/[artifactId]/route.ts` retrieves persisted HTML
  artifacts for the active tenant.
- `src/app/api/v1/moves/board-grade-*` real Move HTML routes now attempt
  generated artifact persistence and return persisted artifact headers.
- `src/lib/programs/board-artifacts/board-grade-persistence.ts` centralizes the
  route-side persistence wrapper.
- `src/lib/artifacts/__tests__/repository.test.ts` covers generate, save, and
  retrieve behavior.

## QA / Validation

- PASS: `npx jest src/lib/artifacts/__tests__/repository.test.ts --runInBand`
- PASS: `npx jest src/lib/programs/board-artifacts src/lib/programs/expert-kernel/exports/board-grade/__tests__/render-cache.test.ts --runInBand`
- PASS: `npx tsc --noEmit --pretty false`
- PASS: `npm run release:check -- --base origin/main --head HEAD`

## Rollout Plan

Merge to main and deploy normally. No database migration is required because
the change uses the existing `generated_artifacts.metadata` column and existing
HTML artifact routes.

## Rollback Plan

Revert this release candidate. Existing `generated_artifacts` rows are
additive evidence records and do not require deletion for rollback.

## Audit Evidence

- Inspect generated artifact rows by `client_id`, `artifact_type =
'move_board_pack'`, and `source_artifact_ref` prefixed with `move:`.
- Inspect response headers on real Move board-grade HTML routes:
  `x-generated-artifact-id`, `x-generated-artifact-url`, and
  `x-generated-artifact-source-ref`.
- Run the focused repository Jest test.

## Known Gaps

- Route-side persistence is fail-open to preserve existing live HTML rendering
  if the persistence insert is temporarily unavailable; failures are logged.
