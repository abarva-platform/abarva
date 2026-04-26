# SOL11 · Solution Canvas UI

## Purpose

Surface a deterministic Solution Canvas as a calm, server-rendered AbarVa
view. SOL11 is the UI counterpart to SOL9's recommendation engine and
SOL8's canvas contract. It renders a `SolutionCanvasView` produced by a
deterministic seed projection — no live runtime, no model call, no
retrieval.

## Scope

- New view-model module `src/lib/solutions/solution-canvas-view.ts`
  exposing `SolutionCanvasView`, `SolutionCanvasInput`,
  `SolutionCanvasSection`, `SolutionCanvasMissingInput`,
  `SolutionCanvasComponent`, `SolutionCanvasRisk`,
  `SolutionCanvasWorkshopRef`, `SolutionCanvasDeliverableRef`, and a
  single helper `buildSolutionCanvasView(input)`.
- New Server Component `src/components/solutions/SolutionCanvas.tsx`
  rendering eyebrow, title, and nine canonical sections (brief, current
  inputs, archetype, components, build/buy guidance, risks, recommended
  workshops, recommended deliverables, missing inputs) plus a calm
  footer caption and three disabled future actions (Edit, Regenerate,
  Approve).
- Integration tests covering byte-equal projection, all sections
  present, view-model module hygiene, and component canon hygiene.

## Out of scope

- Wiring SOL9 recommendations or the SOL10 architecture-draft read model
  into the canvas (live composition is deferred).
- Edit / Regenerate / Approve actions — present only as visibly
  disabled affordances naming a future slice.
- Live retrieval, model calls, or persistence of canvas state.

## Acceptance

- `buildSolutionCanvasView(input)` is byte-equal across repeated calls
  for the same input.
- The Server Component imports tokens only from
  `@/lib/design/abarva-theme`; no `'use client'`, no React hooks, no
  local hex literals, no DM Sans literals.
- All nine canonical sections render with honest fallback captions when
  inputs are absent.
- Footer reads `Source · deterministic solution canvas seed · proposed
  only, not applied`.
- View-model module contains no `Date.now`, `Math.random`, `new Date`,
  `fetch`, or model-provider references.

## Validation

- `npx tsc --noEmit --pretty false`
- `npx jest src/__tests__/integration/solutions/solution-canvas.test.ts`
- `npx eslint --max-warnings=0` over the three source files.

## Notes

Lane B local-only commit. Integration agent owns the cherry-pick onto
main and any cross-slice reconciliation with SOL9 / SOL10.
