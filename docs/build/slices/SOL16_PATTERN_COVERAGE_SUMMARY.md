# SOL16 · Pattern Coverage Summary

**Status:** code_complete
**Category:** solutions
**Created:** 2026-04-26

## What was built
`src/lib/solutions/pattern-coverage-summary.ts` — aggregate pattern coverage read model. `buildPatternCoverageSummary()` returns all archetypes ranked by overall coverage score (workshop + deliverable coverage average).

## Test coverage
≥28 tests covering row shape, score computation, sorting, and summary aggregates.

## Honest constraints
- Coverage scores are deterministic seed values — no live ingestion.
- `createdFrom: 'sol16_pattern_coverage_summary'` on every output.
