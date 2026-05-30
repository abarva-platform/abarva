# 2026-05-29-coverage-contract-and-migration-guard

## Release ID

`2026-05-29-coverage-contract-and-migration-guard`

## Status

`candidate`

## Plain-English Summary

This release adds the first Packet 30 coverage contract: Sentinel now classifies each enterprise question into one of 25 business categories and computes which tenant-data segments were present or missing. It also cleans the Vercel migration path so production migrations prefer Azure/Postgres direct connection variables instead of old Supabase session-mode guidance.

## Layer Impact

Runtime intelligence lane: Ask Intelligence receives a private coverage report alongside retrieved sources.

Control lane: tests now lock the 25-category coverage map and migration connection-string priority.

Deploy lane: Vercel build comments and migration runner errors now point to Azure/Postgres direct migration URLs.

Data/schema lane: no schema changes and no production data mutation.

## Client Applicability

All authenticated Sentinel users across all five canonical tenants receive the coverage-report behavior: Apex Retail, Meridian Health, Northstar Clinical Technologies, First Capital, and SkyHarbor Air. The migration-runner cleanup applies to the shared production deploy lane, not to a tenant-specific feature flag.

## Changes Included

- `src/lib/knowledge/coverage.ts`
- `src/lib/knowledge/coverageReport.ts`
- `src/lib/knowledge/__tests__/coverage.test.ts`
- `src/lib/knowledge/__tests__/coverage-contract-acceptance.test.ts`
- `src/lib/intelligence/ask/index.ts`
- `src/lib/intelligence/ask/router.ts`
- `src/lib/intelligence/ask/synthesizer.ts`
- `src/lib/intelligence/ask/types.ts`
- `src/scripts/run-migrations.ts`
- `src/scripts/__tests__/run-migrations-env.test.ts`
- `scripts/vercel-build.sh`
- `scripts/audit/vercel-migration-session-guard.mjs`

## QA / Validation

- PASS: `npx jest --runTestsByPath src/lib/knowledge/__tests__/coverage.test.ts src/lib/knowledge/__tests__/coverage-contract-acceptance.test.ts src/scripts/__tests__/run-migrations-env.test.ts --runInBand`.
- PASS: `npx eslint src/lib/knowledge/coverage.ts src/lib/knowledge/coverageReport.ts src/lib/knowledge/__tests__/coverage.test.ts src/lib/knowledge/__tests__/coverage-contract-acceptance.test.ts src/lib/intelligence/ask/index.ts src/lib/intelligence/ask/router.ts src/lib/intelligence/ask/synthesizer.ts src/lib/intelligence/ask/types.ts src/scripts/run-migrations.ts src/scripts/__tests__/run-migrations-env.test.ts`.
- PASS: `node scripts/audit/vercel-migration-session-guard.mjs`.
- PASS: `npm run audit:runtime-supabase-imports:guard`.
- PASS: `git diff --check`.
- PASS: `npm run release:check -- --base origin/main --head HEAD`.
- BLOCKED-PREEXISTING: `npx tsc --noEmit --pretty false` fails only on the known optional-dependency blocker for `@azure/*`, `pptxgenjs`, and `@resvg/resvg-js` imports; no coverage-contract or migration-runner errors remain.

## Rollout Plan

Merge after focused tests and CI green. Deploy through normal Vercel Git integration. Post-deploy smoke should include a production Ask request and `/api/health`.

## Rollback Plan

Revert this PR. The ask route will stop emitting coverage reports and the migration runner will return to the prior generic `DATABASE_URL` resolution. No database rollback is required.

## Audit Evidence

- Packet 30 Phase 3 requires `QUESTION_CATEGORIES`, `categoryToRequiredSegments`, and `assertCoverage`.
- Backlog Section 3.3 requires removing Supabase session-mode migration guidance from the Vercel deploy path.

## Known Gaps

Phase 4 verifier work is still queued. This PR computes and passes coverage context but does not yet rewrite `scripts/skyharbor/07_verify/ground_truth_runner.mjs` or certify three consecutive 25-question production runs.
