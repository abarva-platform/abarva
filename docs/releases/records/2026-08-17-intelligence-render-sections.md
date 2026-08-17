# 2026-08-17-intelligence-render-sections — Show the advisory sections

## Release ID

`2026-08-17-intelligence-render-sections`

## Status

`candidate`

## Plain-English Summary

The fourteen advisory sections were already being built from canonical and passed into
`surfaceContext` so aVa could ground its answers on them. Then the canvas slot beside the chat was
set to `null` and the layout fixed to `chat-only`.

So the analysis existed and nobody could see it. A reader arriving at Intelligence got a chat box and
three suggested prompts, with no indication the estate had been analysed — and no way to check a
figure aVa quoted, because the section it came from was never on screen.

This renders them: a section list down the left, the selected section on the right, every figure
carrying its build version and evidence status.

## Layer Impact

**Release lane: `client-data-lane`.** Presentation only. No data path change.

## Client Applicability

- Specific clients: both active tenants
- Internal only: no
- Feature flag: none

## Changes Included

- `src/components/intelligence-advisory/AdvisorySectionsCanvas.tsx` — the canvas.
- `src/components/intelligence-advisory/AdvisoryIntelligencePage.tsx` — `canvas` populated, layout
  `chat-only` → `dock`.

## QA / Validation

- Pass: `tsc -p tsconfig.json --noEmit` — 0 errors.
- Pass: `eslint` — 0 errors.
- Pass: `npm run release:check`.

## Rollout Plan

Merge, deploy, confirm on the signed-in surface.

## Deployment Authority

Repo-owned ACA main deploy workflow. No job, no data write.

## Rollback Plan

Revert. Intelligence returns to chat-only, which is where it was.

## Audit Evidence

- The commit and its PR.
- Each section renders its build version, so any figure on screen is traceable to a build.

## Known Gaps

- **Sections with no data stay listed and are marked `gap`.** Hiding them would present a partial
  estate as a complete one, which is the failure this whole line of work exists to remove.
- **Evidence coverage is shown, not maturity.** Nothing canonical scores maturity; a number derived
  from record counts would read as an assessment while measuring how much the client typed.
- **Exhibits are still empty.** The authored sections had charts. A missing chart is visible; a chart
  built from invented numbers is not.
