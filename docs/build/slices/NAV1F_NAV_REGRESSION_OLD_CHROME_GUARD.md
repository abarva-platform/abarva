# NAV1F — Nav Regression Guard

**Wave:** NAV1
**Slice ID:** NAV1F
**Type:** test
**Status:** code_complete

## Purpose

Lock NAV1A–NAV1E invariants behind a pure-TypeScript Jest regression suite
so future PRs that re-introduce legacy chrome, hand-coded wordmarks, banned
tokens in the canonical surface, or drop a canonical shell import are
caught immediately.

## Files Added

- `src/__tests__/integration/design/abarva-nav-shell-alignment.test.ts` —
  129 invariant tests across 11 describe blocks.
- `docs/platform-design/experience-system/implementation-reviews/NAV1_NAV_REGRESSION_GUARD_REVIEW.md`
- `docs/build/slices/NAV1F_NAV_REGRESSION_OLD_CHROME_GUARD.md` — this file.

## Files Updated

- `docs/build/build-slices.json` — NAV1F entry.

## Validation

- `npx jest abarva-nav-shell-alignment.test.ts` — 129/129 pass.
- `npx tsc --noEmit` — clean.
- `npm run build` — pass.

## Risks

None. New test file only.
