# Source Data Readiness Contract Smoke Review

Date: 2026-04-26
Status: ready for review

## Files Changed

- `src/__tests__/integration/source/source-event-canvas-shell.test.ts`
- `docs/abarva-source/build-pack/implementation-reviews/38_SOURCE_DATA_READINESS_CONTRACT_SMOKE_REVIEW.md`
- `docs/build/production-readiness.json`

## What Changed

This slice adds focused smoke coverage proving the Source event canvas can render the Admin/Setup readiness contract projection independently of event-local readiness rows.

The new smoke assertion clears `event.dataReadiness` in the seeded Data & AI Modernization event and verifies the event canvas still renders:

- `34% toward event data readiness`
- `Admin/Setup readiness contract projection`
- required missing categories such as Workload Baseline and Retained Roles
- `3/5 required present`

## Why This Matters

The prior panel implementation showed contract-shaped data. This smoke test proves the event canvas is not merely echoing the old event-local seeded readiness rows for the golden event.

## Explicitly Out Of Scope

- no UI changes
- no API calls
- no upload/parsing
- no connectors
- no Admin UI
- no persistence
- no evidence ledger runtime
- no model calls

## Validation Results

- `npx jest src/__tests__/integration/source/source-event-canvas-shell.test.ts --runInBand`
- `npx eslint src/__tests__/integration/source/source-event-canvas-shell.test.ts`
- `npx tsc --noEmit --pretty false`
- `npm run build`
- `git diff --check`
- JSON parse check for `docs/build/production-readiness.json`

All validation passed.

## Production Readiness Impact

This improves deterministic Source route/component smoke evidence but does not promote Source readiness. Authenticated live route review, live Admin/Setup integration, upload/parsing, tenant-bound evidence readiness, and production workflow persistence remain blockers.

## Recommended Next Slice

Run an authenticated visual review packet for `/source` and `/source/events/evt-source-data-ai-si-selection` now that the contract-backed progress read is visible.
