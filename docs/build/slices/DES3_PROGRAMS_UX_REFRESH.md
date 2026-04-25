# DES3 · Programs UX Refresh

Slice ID: DES3
Status: code_complete (pending founder review for `verified`)
Authored: 2026-04-25

Refreshes the canonical Programs experience against the AbarVa
visual canon (DES1) and primitives (DES2). Functionality unchanged —
this is UX/layout polish only.

## What changed

- `src/components/programs/ProgramsCanonicalIndex.tsx` and
  `src/components/programs/ProgramCanonicalDetail.tsx`:
  - Import `COLORS` from `@/lib/design/abarva-theme`.
  - Replace inline COLORS constant with theme-backed mapping. Brand
    accent shifts from teal `#0E9F8C` to NAVY `#1B2B5C`. Surface
    tones lift onto the canonical off-white palette
    (`#FAFAF8`, `#F5F5F2`, `#FFFFFF`).
  - Add `data-abarva-refreshed="des3"` marker on the root `<main>`
    for testability.
  - No structural changes; existing zones, copy, behavior, and
    routes preserved.

- `src/__tests__/integration/programs/programs-ux-refresh.test.ts`:
  6 deterministic tests asserting the AbarVa theme import, the
  refresh marker, and the absence of the retired teal hex code.

## Validation

- `npx tsc --noEmit --pretty false` — pass
- `npx jest src/__tests__/integration/programs/programs-ux-refresh.test.ts` — 6 passed
- Regression: programs-canonical-surface (24/24),
  programs-nexus-rail-metadata (27/27),
  program-artifact-inventory (21/21).
- `npm run build` — pass.

## Status

Code complete. Pending founder review.
