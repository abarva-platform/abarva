# PROG9 · Program Health Scorecard

**Status:** code_complete
**Category:** programs
**Created:** 2026-04-26

## What was built
`src/lib/programs/program-health-scorecard.ts` — deterministic health scorecard for programs. `buildProgramHealthScorecard(programId)` returns a 5-dimension scorecard with letter grade and top strength/risk. `buildProgramHealthSummary(programIds)` aggregates across a portfolio.

## Test coverage
≥40 tests covering dimension scoring, grade thresholds, summary aggregates, and determinism.

## Honest constraints
- All scores are deterministic seed data — no live program state ingestion.
- `honestDisclaimer` explicitly notes this on every scorecard.
- `createdFrom: 'prog9_program_health_scorecard'` on every output.
