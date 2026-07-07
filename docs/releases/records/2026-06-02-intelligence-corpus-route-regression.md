# 2026-06-02-intelligence-corpus-route-regression — Intelligence Corpus Route Regression Guard

## Release ID

`2026-06-02-intelligence-corpus-route-regression`

## Status

`candidate`

## Plain-English Summary

This release adds a route-level regression test for the Intelligence page so a seeded client corpus does not disappear at the server-page boundary. It specifically pins Meridian Health and First Capital Financial to render seeded Brief/Map corpus payloads, and it confirms SkyHarbor remains an honest unseeded state until a real SkyHarbor corpus fixture is wired.

## Layer Impact

`global-control-lane`: Strengthens automated coverage for the shared `/intelligence` route and prevents a repeat of the user-visible "corpus not yet seeded" regression for seeded tenants.

## Client Applicability

- All clients: Benefit from the route-boundary guard against stale or missing corpus binding.
- Specific clients: Meridian Health and First Capital Financial are pinned as seeded corpus tenants in the regression test.
- Internal only: Not applicable.
- Public/demo only: Not applicable.
- Feature flag: None.

## Changes Included

- Added `src/app/intelligence/__tests__/page-corpus.test.tsx`.
- The test verifies that `/intelligence` passes seeded corpus data into `IntelligenceV3Page` for Meridian and First Capital.
- The test verifies that SkyHarbor does not receive fabricated corpus data before a real fixture exists.

## QA / Validation

- `npx jest src/app/intelligence/__tests__/page-corpus.test.tsx --runInBand` — passed.
- `npx jest src/lib/intelligence-v3/__tests__/tenant-corpus-loader.test.ts src/components/intelligence-v3/__tests__/IntelligenceV3Page.corpus.test.tsx src/app/intelligence/__tests__/page-corpus.test.tsx --runInBand` — passed.
- `npx eslint src/app/intelligence/__tests__/page-corpus.test.tsx` — passed.
- `git diff --check` — passed.

## Rollout Plan

Merge to main. This is a test-only guardrail change; no runtime deploy step, migration, or feature flag is required beyond the normal production deployment created by main.

## Rollback Plan

Revert the PR to remove the additional regression test. No data rollback is required.

## Audit Evidence

- PR URL: https://github.com/anandsundaram-hash/abarva/pull/2807
- Focused Jest and ESLint output from the PR branch.
- Existing merged fix: PR #2752, `fix(intelligence): render seeded tenant corpus`.

## Known Gaps

SkyHarbor Air does not yet have a real Intelligence Brief/Map corpus fixture in this route path. The product should continue to show an honest unseeded state until that fixture is added.
