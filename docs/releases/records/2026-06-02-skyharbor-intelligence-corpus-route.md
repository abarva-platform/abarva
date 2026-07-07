# 2026-06-02-skyharbor-intelligence-corpus-route - SkyHarbor Intelligence Corpus Route Binding

## Release ID

`2026-06-02-skyharbor-intelligence-corpus-route`

## Status

`candidate`

## Plain-English Summary

SkyHarbor Air now receives its seeded airline Intelligence corpus on the `/intelligence` surface instead of falling through to the "corpus not yet seeded" empty state. The fixture is sourced from the existing SkyHarbor synthetic dataset already in the repository.

## Layer Impact

- `client-data-lane`: Adds a SkyHarbor Air knowledge-corpus fixture from the existing synthetic airline substrate and binds it through the tenant corpus loader.
- `global-control-lane`: Extends the shared Intelligence route regression tests so the route cannot silently drop a seeded client back to an empty-state experience.

## Client Applicability

- All clients: No.
- Specific clients: SkyHarbor Air receives the new seeded corpus binding.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Adds `src/lib/knowledge-corpus/fixtures/skyharbor-airline.ts`.
- Extends `src/lib/knowledge-corpus/types.ts` with the `airline` industry.
- Updates `src/lib/intelligence-v3/tenant-corpus-loader.ts` to resolve `skyharbor` and `skyharbor-air` style keys.
- Updates corpus loader and `/intelligence` route tests to require SkyHarbor seeded corpus data.

## QA / Validation

- PASS: `npx jest src/lib/intelligence-v3/__tests__/tenant-corpus-loader.test.ts src/app/intelligence/__tests__/page-corpus.test.tsx --runInBand` (2 suites, 6 tests).
- PASS: `npx eslint src/lib/knowledge-corpus/types.ts src/lib/knowledge-corpus/fixtures/skyharbor-airline.ts src/lib/intelligence-v3/tenant-corpus-loader.ts src/lib/intelligence-v3/__tests__/tenant-corpus-loader.test.ts src/app/intelligence/__tests__/page-corpus.test.tsx`.
- PASS: `npx eslint src/lib/knowledge-corpus/types.ts src/lib/knowledge-corpus/fixtures/skyharbor-airline.ts src/lib/intelligence-v3/tenant-corpus-loader.ts src/components/intelligence-v4/IntelligenceBrief.tsx src/lib/intelligence-v3/__tests__/tenant-corpus-loader.test.ts src/app/intelligence/__tests__/page-corpus.test.tsx`.
- PASS: `npm run release:check -- --base origin/main --head HEAD`.
- PASS: `git diff --check`.
- BLOCKED: `npx tsc --noEmit --pretty false --incremental false` surfaces an existing unrelated missing type module in `tests/accessibility/public-axe.spec.ts` for `@axe-core/playwright`. The airline-specific renderer type holes found during this run were fixed, and the second TypeScript pass shows only the unrelated axe module error.

## Rollout Plan

Merge to main and deploy through the normal Vercel production pipeline. No migration, manual data load, or feature flag is required.

## Rollback Plan

Revert the PR. The rollback returns SkyHarbor to the prior honest empty-state behavior and does not affect Meridian, First Capital, or Apex corpus loading.

## Audit Evidence

- PR URL: https://github.com/anandsundaram-hash/abarva/pull/2808.
- CI run: to be added when available.
- Local validation output: to be added before merge.

## Known Gaps

This binds a repository fixture sourced from the existing SkyHarbor synthetic substrate. It does not replace the future live Azure/Postgres corpus retrieval path for SkyHarbor.
