# Source Data Readiness Panel Smoke Review

Date: 2026-04-26
Slice: Source data readiness panel smoke coverage
Status: ready for PR

## Files Changed

- `src/__tests__/integration/source/source-event-canvas-shell.test.ts`
- `docs/abarva-source/build-pack/implementation-reviews/34_SOURCE_DATA_READINESS_PANEL_SMOKE_REVIEW.md`
- `docs/build/production-readiness.json`

## Smoke Coverage Added

The Source event canvas shell smoke now verifies:

- the event canvas includes the deterministic data readiness panel
- missing/requested required data appears in the shell
- usable evidence is distinct from loaded records
- usable evidence is distinct from available but unvalidated records
- Steward/Admin handoff labels appear as visual-only guidance
- the shell remains inside deterministic Source boundaries

## Boundary Checks

The route/component smoke still asserts that the event canvas shell does not import or call:

- model providers or AI SDK runtime paths
- Source API routes
- upload, parser, or parsing modules
- Admin setup, connector, or migration modules
- scorecard or artifact drawer UI behavior
- ProgramSurface, `/programs`, `/preview`, or `/demo` paths

## Production Readiness Impact

`docs/build/production-readiness.json` is updated conservatively to record the additional deterministic route/component smoke coverage. No status promotion is made.

This does not make Source pilot-ready or production-ready because authenticated live route review, upload/parsing, live Admin/Setup readiness integration, persistence, workflow execution, and evidence validation remain deferred.

## Validation Results

Passed locally:

- `npx jest src/__tests__/integration/source/source-event-canvas-shell.test.ts src/__tests__/integration/source/source-data-readiness-panel.test.ts --runInBand`
- `npx eslint src/__tests__/integration/source/source-event-canvas-shell.test.ts`
- `npx tsc --noEmit --pretty false`
- `npm run build`
- `git diff --check`
- `node -e "JSON.parse(require('fs').readFileSync('docs/build/production-readiness.json','utf8')); console.log('production-readiness.json parses')"`

## Explicitly Out Of Scope

- no UI changes
- no upload controls
- no file parsing
- no connector setup
- no Admin/Setup implementation
- no API route
- no model calls
- no chat UI
- no evidence ledger implementation
- no scorecard UI
- no artifact drawer behavior
- no value ledger UI
- no vendor flow
- no workflow engine
- no approval engine
- no `/programs`, `/preview`, or `/demo` work
