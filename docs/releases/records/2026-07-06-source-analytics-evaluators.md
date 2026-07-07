# 2026-07-06-source-analytics-evaluators — value-lever evaluators + waterfall + source_value_levers

## Release ID
`2026-07-06-source-analytics-evaluators`
## Status
`candidate`
## Plain-English Summary
Wave-2 slice of the Source value-analytics layer: the deterministic math. Adds the pure
`formulaId` evaluators (one per AMS value-lever formula), the orchestrator that runs an event's
levers over its facts → `ValueLeverResult[]`, the value-type waterfall roll-up (bands by the 5
value types; protected/risk-adjusted stated separately, no single headline), the
`source_value_levers` persistence (RLS-scoped, migration NOT run), and a write adapter. Reads
facts by key; a missing required input yields `insufficientEvidence` naming the gap — never a
guess. Inert until a consumer calls it; the whole layer stays behind `source_analytics` (off).
## Layer Impact
- `global-control-lane`: `src/lib/source/facts/evaluators/*` (pure code) — inert until consumed.
- `client-data-lane`: `source_value_levers` table + RLS (migration authored, NOT run).
## Client Applicability
No behavior change (nothing consumes it; flag off). Feature flag: `source_analytics` (off).
## Changes Included
- `src/lib/source/facts/evaluators/{formulas,orchestrator,waterfall,types,value-lever-write-adapter,index}.ts`
- `src/lib/source/facts/__tests__/evaluators-{formulas,orchestrator,waterfall}.test.ts`
- `src/lib/source/facts/index.ts` (export evaluators)
- `supabase/migrations/20260706160000_source_value_levers.sql` (RLS-scoped; not run)
## QA / Validation
- `npx jest src/lib/source/facts` → 6 suites / 61 tests pass. **pass.**
- `npx tsc --noEmit` (full, 8GB heap, exit-gated) → 0 errors. **pass.**
- `npx eslint` new files → clean. **pass.**
- Inert by design; not live-proven (no consumer yet).
## Rollout Plan
Merge via PR + squash. Migration applied via ACA VNet db-migrate job when a writer slice lands.
## Deployment Authority
ACA main deploy per runbook. No shared-runtime mutation (inert lib + un-run migration). Flag
path: `source_analytics` includeTenants / `ABARVA_FEATURE_SOURCE_ANALYTICS_TENANTS`.
## Rollback Plan
Revert the PR (no runtime effect). Un-run migration inert; if applied, `DROP TABLE source_value_levers`.
## Audit Evidence
PR URL; CI release:check/jest/tsc/eslint. Evaluators are pure + tested; `insufficientEvidence`
keeps every number cited-or-absent, never invented.
## Known Gaps
Consumers (extraction feeds facts; UI + Door 1 render the results) are sibling Wave-2 slices.
