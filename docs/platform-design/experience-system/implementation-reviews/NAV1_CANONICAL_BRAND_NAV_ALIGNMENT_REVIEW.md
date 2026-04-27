# NAV1 — Canonical Brand / Nav Component Alignment Review

**Wave:** NAV1 — Canonical AbarVa Navigation and Active Shell Alignment
**Slice ID:** NAV1B
**Type:** test + docs
**Status:** code_complete

## Purpose

Verify the canonical brand and nav primitives meet the NAV1 contract:

- `AbarVaLogo` is wordmark-only (no inline SVG, no symbol, no decorative mark)
  with `sm`/`md`/`lg` size and an aria-label `label` prop.
- The brand index re-exports `AbarVaLogo` as the single source of truth.
- Nav components (`AbarVaTopNav`, `AbarVaShellNav`, `AbarVaAppShell`) consume
  the brand wordmark — no hand-coded wordmark glyph.
- No banned tokens (`#14B8A6` teal, `sparkle`, `ॐ`) appear in any of the
  canonical brand or nav files.
- `AbarVaShellNav` exposes the canonical six-surface enum
  (home, programs, source, intelligence, tower, admin) with `activeKey`-driven
  active styling.

## Files Modified

- `src/__tests__/integration/design/abarva-logo.test.ts`
  - Removed stale reference to `src/components/chrome/TopBar.tsx` (the file
    was removed in an earlier wave; the consumers it exemplified migrated to
    `AbarVaTopNav`/`AbarVaShellNav`).
  - Added a new `NAV1B` describe block with 7 invariant assertions covering
    wordmark-only rendering, banned-token absence, size enum, label prop, and
    brand index re-export.
- `src/__tests__/integration/design/abarva-ui-primitives.test.ts`
  - Added a new `NAV1B` describe block with 9 invariant assertions covering
    nav-primitives wiring to the brand component, banned-token absence in
    nav files, the canonical six-surface enum, and the active-surface props.

## Files Added

- `docs/platform-design/experience-system/implementation-reviews/NAV1_CANONICAL_BRAND_NAV_ALIGNMENT_REVIEW.md` — this file.
- `docs/build/slices/NAV1B_CANONICAL_BRAND_NAV_ALIGNMENT.md` — slice doc.

## Files NOT Modified

The slice charter calls out three behavior properties to ensure are present in
the brand and nav components. All three were already in place — no source
changes were required:

1. `AbarVaLogo` was already wordmark-only with the correct size enum and
   `label` prop. (See `src/components/brand/AbarVaLogo.tsx`.)
2. `AbarVaShellNav.tsx`, `AbarVaTopNav.tsx`, and `AbarVaAppShell.tsx` already
   import the wordmark via `@/components/brand/AbarVaLogo` (directly or via
   the `AbarvaWordmark` shim).
3. The active-surface enum already supports the canonical six surfaces.

The added tests freeze these invariants so future regressions are caught.

## Validation

- `npx jest src/__tests__/integration/design/abarva-logo.test.ts` →
  **10/10 passed.**
- `npx jest src/__tests__/integration/design/abarva-ui-primitives.test.ts` →
  **80/80 passed.**
- `npx eslint` over the touched test files → 0 errors / 0 warnings.
- `npx tsc --noEmit` → 0 new errors.
- `npm run build` → passes.
- `bash scripts/integration/hygiene_gate.sh --skip-build` → PASS 11 / FAIL 0.

## Risks

- None. The slice adds test coverage and removes one stale path reference. No
  behavior, runtime, auth, routing, or API change.

## Next

NAV1C — Admin / Platform nav alignment (docs-only verification, NAV1F-aligned
guard tests).
