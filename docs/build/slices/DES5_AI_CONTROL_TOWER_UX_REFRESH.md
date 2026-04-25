# DES5 · AI Control Tower UX Refresh

Slice ID: DES5
Status: code_complete (pending founder review for `verified`)
Authored: 2026-04-25

Refreshes the AI Control Tower / tenant Tower experience against
the AbarVa visual canon (DES1) and primitives (DES2). Functionality
unchanged.

## What changed

- `src/components/tower/ProgramPressureCards.tsx`:
  - Import `COLORS` from `@/lib/design/abarva-theme`.
  - Replace inline COLORS constant with theme-backed mapping.
    Brand accent shifts from teal `#0E9F8C` to NAVY `#1B2B5C`.
    Surface tones lift onto the canonical off-white palette.
  - Add `data-abarva-refreshed="des5"` marker on the root
    `<section>` for testability.
  - Atlas executive brief panel keeps its severity / confidence
    chip framing; the NAVY accent flows through the brief
    border-left and the recommended-action callout.
  - Existing structure, copy, behavior, deterministic source
    captions, and "Open program →" routes preserved.

- `src/__tests__/integration/tower/tower-ux-refresh.test.ts`:
  4 deterministic tests asserting the AbarVa theme import, the
  refresh marker, and the absence of the retired teal hex code.

## Future ACT10

The full ACT10 redesign — five-scorecard limit, three-pressure-card
limit, Atlas Brief on `INK_DARK` hero, Ask Atlas drawer — is a
follow-on slice. DES5 only ships the visual-canon alignment for the
existing surface; the structural lift to the ACT1 contract is
deferred.

## Validation

- `npx tsc --noEmit --pretty false` — pass
- `npx jest src/__tests__/integration/tower/tower-ux-refresh.test.ts` — 4 passed
- Regression: program-pressure-cards (39/39),
  programs-control-tower-signals (27/27).
- `npm run build` — pass.

## Status

Code complete. Pending founder review.
