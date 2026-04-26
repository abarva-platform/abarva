# Source Event Canvas Shell Smoke Review

Date: 2026-04-26
Slice: Source event canvas shell smoke coverage
Status: ready for PR

## Files Changed

- `src/__tests__/integration/source/source-event-canvas-shell.test.ts`
- `docs/abarva-source/build-pack/implementation-reviews/30_SOURCE_EVENT_CANVAS_SHELL_SMOKE_REVIEW.md`
- `docs/build/production-readiness.json`

## Coverage Added

The new deterministic integration test covers the seeded Data and AI Source event shell:

- renders `NexusEngagementCanvas` from seeded data,
- confirms journey map, current-stage workspace, data readiness placeholder, artifact/review placeholder, Nexus guidance, and mission preview are present,
- confirms Scope remains visible as the current blocked stage,
- confirms required baseline inputs and blocker text are visible,
- renders the `/source/events/[eventId]` route module without API calls,
- confirms Nexus and top mission content are present,
- scans shell files for forbidden model, API, upload/parsing, ProgramSurface, preview, and demo imports.

## Validation Results

Passed:

- `npx jest src/__tests__/integration/source/source-event-canvas-shell.test.ts --runInBand`
- `npx eslint src/__tests__/integration/source/source-event-canvas-shell.test.ts`
- `npx tsc --noEmit --pretty false`
- `npm run build`
- `git diff --check`
- `node -e "JSON.parse(require('fs').readFileSync('docs/build/production-readiness.json','utf8')); console.log('production-readiness.json parses')"`

## Production Readiness Impact

`docs/build/production-readiness.json` was updated conservatively:

- Source status remains `scaffolded`.
- No pilot or production readiness claim was added.
- Route smoke remains `partial` because this is deterministic seeded-data server render coverage, not authenticated live route smoke or screenshot QA.
- Integration evidence now names the event canvas shell smoke test.

## Explicitly Out Of Scope

No model calls, chat UI, upload/parsing, API route, persistence, event workflow engine, approval engine, scorecard UI, artifact drawer UI, vendor flow, value ledger UI, `/programs`, `/preview`, or `/demo` work was done.
