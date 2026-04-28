# NAV1 — Nav Regression Guard Review

**Wave:** NAV1 — Canonical AbarVa Navigation and Active Shell Alignment
**Slice ID:** NAV1F
**Type:** test
**Status:** code_complete

## Purpose

Lock the invariants established by NAV1A–NAV1E behind a single
pure-TypeScript Jest suite that scans canonical files and routes for
regressions. Future PRs that re-introduce legacy chrome, hand-coded
wordmarks, banned tokens in the canonical surface, or that drop a
canonical shell import from a tenant page will be caught immediately.

## What is locked

The new test file `src/__tests__/integration/design/abarva-nav-shell-alignment.test.ts`
contains **129 deterministic invariants** organised into 11 describe blocks:

1. **Canonical AbarVaLogo wordmark-only** (5 tests)
   - File exists at `src/components/brand/AbarVaLogo.tsx`
   - Points at `/brand/abarva-logo.svg`
   - No inline SVG / symbol / path
   - Brand index re-exports `AbarVaLogo`
   - Canonical SVG asset exists at `public/brand/abarva-logo.svg`
2. **Every audited active route file exists** (28 tests across tenant /
   Source / Admin / shells / nav primitives)
3. **No legacy chrome imports in `src/app/`** (3 tests — `TopBar`,
   `PrimaryNav`, `AdminPortalHeader`)
4. **Canonical pages do not hand-code the wordmark** (20 tests, one per
   canonical tenant / Source / Admin page)
5. **No banned tokens in canonical brand / nav / shell files** (13 tests)
6. **No banned tokens in the canonical tenant tree** (9 tests)
7. **No banned tokens in canonical Source pages** (6 tests)
8. **`AbarVaShellNav` exposes the canonical six-surface enum** (6 tests:
   home, programs, source, intelligence, tower, admin)
9. **Canonical pages import a canonical shell** (20 tests, scanning for
   `AdminCanonShell` / `SourceCanonShell` / `SourceRouteShell` /
   `SourceFoundationShell` / `ProgramCanonShell` / `IntelligenceRouteShell` /
   `TowerRouteShell` / `Seed*` family / `DeliverableTierRenderer` /
   `AbarVaAppShell` / `AbarVaShellNav` / `AbarvaTopNav`)
10. **NAV1 documentation present** (10 tests verifying all five review
    docs and all five slice docs exist)
11. **Sanity counts** (6 tests confirming the in-scope file lists are at
    expected sizes)

## What is intentionally NOT scanned

Per the NAV1 charter ("WITHOUT changing page content, business logic,
data models, or runtime behavior"), the guard does NOT scan:

- `src/components/AbarvaNav.tsx` — legacy global nav, deferred to NAV2
  (contains `#14B8A6` for active state and avatar tint).
- `src/components/chrome/ClientChrome.tsx` — legacy single-tenant chrome,
  deferred to NAV2 (contains `#14B8A6`).
- `(maestro)/tower/**`, `(maestro)/intelligence/**`,
  `(maestro)/engagements/**`, and `(maestro)/platform/admin/**` (non-shell
  pages) — these contain `#14B8A6` / `#0E9F8C` in page-body styling
  (KPI accents, chart colors) which is a page-content concern.

These deferrals are documented in the NAV1A audit and recorded as
out-of-scope in this guard's preamble comment. A future banned-token-sweep
wave can extend the guard to cover them.

## Files Modified

None.

## Files Added

- `src/__tests__/integration/design/abarva-nav-shell-alignment.test.ts` (new — 129 tests)
- `docs/platform-design/experience-system/implementation-reviews/NAV1_NAV_REGRESSION_GUARD_REVIEW.md` — this file.
- `docs/build/slices/NAV1F_NAV_REGRESSION_OLD_CHROME_GUARD.md` — slice doc.

## Files Updated

- `docs/build/build-slices.json` — adds NAV1F entry.

## Validation

- `npx jest src/__tests__/integration/design/abarva-nav-shell-alignment.test.ts` →
  **129/129 passed.**
- `npx eslint` over the new test file → 0 errors.
- `npx tsc --noEmit` → 0 new errors.
- `npm run build` → passes.

## Risks

- None. New test file only; no source changes.

## Next

NAV1G — State / readiness update.
