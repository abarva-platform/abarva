# 2026-06-05-phs-stage-readiness-read-model — PHS Stage Readiness Guard

## Release ID

`2026-06-05-phs-stage-readiness-read-model`

## Status

`candidate`

## Plain-English Summary

Adds a strict readiness guard for the Meridian / PHS command-center setup. The
guard distinguishes “CSV rows were parsed” from “Phase 0 is actually ready.”
Stage advance is allowed only when the required PHS templates are present,
evidence-register rows exist in the evidence ledger, and the PHS manifest
validator passes.

## Layer Impact

`client-data-lane`: Adds a client-scoped readiness model over PHS loader outputs,
evidence ledger rows, and manifest validation.

`global-control-lane`: Provides a reusable guard future generation and crawl
gates can call before producing strategy, architecture, business-case, or
mobilization artifacts.

## Client Applicability

- All clients: The guard pattern is reusable for future governed demo setup.
- Specific clients: Meridian / PHS command-center setup is the immediate target.
- Internal only: Yes, loader and generation-gate readiness logic.
- Public/demo only: No public route impact.
- Feature flag: None.

## Changes Included

- Added `src/lib/context-ingestion/phs-stage-readiness.ts`.
- Added `src/lib/context-ingestion/__tests__/phs-stage-readiness.test.ts`.

## QA / Validation

- PASS: `npx jest src/lib/context-ingestion/__tests__/phs-stage-readiness.test.ts src/lib/context-ingestion/__tests__/phs-phase0-manifest.test.ts --runInBand`.
- PASS: `npx eslint src/lib/context-ingestion/phs-stage-readiness.ts src/lib/context-ingestion/__tests__/phs-stage-readiness.test.ts`.

## Rollout Plan

Merge to main. No migration or data load is required. Follow-on generation and
crawl slices can call this guard before advancing beyond Phase 0.

## Rollback Plan

Revert the PR. Existing loader and evidence-ledger behavior remains available,
but future generation gates would lose this explicit PHS readiness check.

## Audit Evidence

- Guard source: `src/lib/context-ingestion/phs-stage-readiness.ts`.
- Tests: `src/lib/context-ingestion/__tests__/phs-stage-readiness.test.ts`.

## Known Gaps

The guard is not yet wired into an OpenAI generation harness or a browser crawl
flow. Those are follow-on slices after the guard lands.
