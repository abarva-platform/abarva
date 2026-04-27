# NAV1B — Canonical Brand / Nav Component Alignment

**Wave:** NAV1
**Slice ID:** NAV1B
**Type:** test
**Status:** code_complete

## Purpose

Lock canonical AbarVa brand/nav invariants behind pure-TypeScript Jest tests
so that future regressions in the wordmark, the nav primitives, or the surface
enum are caught immediately.

## Files Modified

- `src/__tests__/integration/design/abarva-logo.test.ts` — removed stale
  `TopBar.tsx` reference, added 7 NAV1B invariant tests.
- `src/__tests__/integration/design/abarva-ui-primitives.test.ts` — added 9
  NAV1B invariant tests.

## Files Added

- `docs/platform-design/experience-system/implementation-reviews/NAV1_CANONICAL_BRAND_NAV_ALIGNMENT_REVIEW.md`
- `docs/build/slices/NAV1B_CANONICAL_BRAND_NAV_ALIGNMENT.md` — this file.

## Validation

- `npx jest src/__tests__/integration/design/abarva-logo.test.ts` — 10/10 pass.
- `npx jest src/__tests__/integration/design/abarva-ui-primitives.test.ts` — 80/80 pass.
- `npx eslint` on touched files — clean.
- `npx tsc --noEmit` — clean.
- `npm run build` — pass.

## Risks

None. No source files changed; only tests and docs.
