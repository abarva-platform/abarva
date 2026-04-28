# QA17 · Cross-Surface Consistency Validator

**Status:** code_complete
**Category:** qa
**Created:** 2026-04-26

## What was built
`src/lib/qa/cross-surface-consistency.ts` — static-manifest consistency validator across programs, tower, intelligence, and admin surfaces. `buildCrossSurfaceConsistencyReport()` runs ≥6 consistency checks on shared reference data (program IDs, tenant IDs, archetype IDs, etc.).

## Test coverage
≥30 tests covering check structure, consistency logic, mismatch detection, and report aggregates.

## Honest constraints
- All reference data is a static manifest — no live surface scraping.
- `createdFrom: 'qa17_cross_surface_consistency'` on every output.
