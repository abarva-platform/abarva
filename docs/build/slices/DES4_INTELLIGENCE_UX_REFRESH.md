# DES4 · Intelligence UX Refresh

Slice ID: DES4
Status: code_complete (pending founder review for `verified`)
Authored: 2026-04-25

Refreshes the Sentinel Intelligence experience against the AbarVa
visual canon (DES1) and primitives (DES2). Functionality unchanged.

## What changed

- `src/components/intelligence/SentinelActivePatterns.tsx`,
  `src/components/intelligence/SentinelPatternDetail.tsx`, and
  `src/components/intelligence/SentinelPatternContentPanel.tsx`:
  - Import `COLORS` from `@/lib/design/abarva-theme`.
  - Replace inline COLORS constants with theme-backed mappings.
    Brand accent shifts from teal `#0E9F8C` to NAVY `#1B2B5C`.
    Surface tones lift onto the canonical off-white palette.
  - Each component carries `data-abarva-refreshed="des4"` on its
    root element for testability.
  - Sentinel keeps its AMBER agent accent for severity / pattern
    chip framing (per canon §H).
  - Existing structure, copy, behavior, deterministic source
    captions, and disabled "Ask Sentinel" chips preserved.

- `src/__tests__/integration/intelligence/intelligence-ux-refresh.test.ts`:
  10 deterministic tests asserting the AbarVa theme import, the
  refresh marker, and the absence of the retired teal hex code.

## Validation

- `npx tsc --noEmit --pretty false` — pass
- `npx jest src/__tests__/integration/intelligence/intelligence-ux-refresh.test.ts` — 10 passed
- Regression: sentinel-active-patterns-page (35/35),
  sentinel-pattern-detail (33/33), sentinel-pattern-content (21/21).
- `npm run build` — pass.

## Status

Code complete. Pending founder review.
