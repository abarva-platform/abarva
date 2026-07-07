# 2026-06-19-deck-renderer — Transformation PR5: executive deck renderer (the exhibit-led artifact)

## Release ID

`2026-06-19-deck-renderer`

## Status

`candidate`

## Plain-English Summary

Transformation PR5 (depends on PR1–PR4). The renderer that turns the whole pipeline into an actual
**exhibit-led executive deck** — the board-facing artifact that replaces the prose DOCX. It maps a
Story (answer-first pages, PR2) + its rendered exhibits (Visual Director, PR4) onto the existing
16:9 deck grammar (`visual-system/deck` → expert-kernel `deck-shell`): a cover that leads with the
answer-first recommendation, then one slide per page carrying the page's **conclusion headline** as
the takeaway, the page's **hero exhibit**, a short implication lede, and a quiet footer with
decision-relevance + evidence. One message + one visual per slide (spec §10/§11).

This is the structural end of "visuals evaporate": a Value Model Story now renders to a complete
deck where the estimate-twice waterfall, value tree, economics strip, and decision scorecard appear
as real slides — not prose with a discarded `exhibits[]`.

This PR is **additive and inert**: a new renderer producing a self-contained HTML deck document.
Wiring it into the live orchestrator generate path — behind a tenant flag, with a live ACA proof,
and with the native PPTX export + the DOCX technical appendix as companions — is the final step
(a later PR), kept out of this one so the stack stays inert.

## Layer Impact

- **`global-control-lane`** — new `src/lib/deliverables/deck-renderer.ts` +
  `src/lib/visual-system/deck.ts` (re-export of the deck shell). No schema, route, or runtime change;
  not wired into the live generation path.

## Client Applicability

- All clients: **Yes** (shared renderer), inert until wired. No feature flag, no client-specific
  behavior. Specific clients: No. Internal only: No. Public/demo only: No.

## Changes Included

- `src/lib/visual-system/deck.ts` — shared re-export of the expert-kernel deck shell.
- `src/lib/deliverables/deck-renderer.ts` — `renderExecutiveDeck(story, model, exhibits, opts)` →
  self-contained HTML 16:9 deck (cover + one slide per page, hero exhibit + footer facts).
- `src/lib/deliverables/__tests__/deck-renderer.test.ts` — 5 tests.

## QA / Validation

- **PASS** — `jest` deck-renderer: 5/5 (produces a complete HTML document; leads with the Move title
  + answer-first recommendation on the cover; embeds real SVG exhibits and the honest gap-card; every
  page's conclusion headline appears as a slide takeaway; deterministic given a fixed generated-on
  date).
- **PASS** — `tsc --noEmit` clean; `eslint` clean.
- **NOT-RUN (by design)** — no live/ACA path; the renderer isn't wired into a generated Move artifact
  yet (final wiring PR).

## Rollout Plan

Merge to `main` after PR4. No runtime effect. Follow-ups: native PPTX export (reuse
`pptx-renderer` + `svg-raster`), the DOCX technical appendix companion, and the live wiring behind a
`moves` tenant flag with an ACA proof.

## Rollback Plan

Revert the PR. Zero impact — no caller depends on it yet.

## Audit Evidence

- PR URL (added on open); CI run; the 5-test suite is the behavioral evidence.

## Known Gaps

- Output is the HTML deck form. The **native PPTX** export (the confirmed primary format) reuses the
  existing `pptx-renderer` + `svg-raster` and is a follow-up; the **DOCX technical appendix** (Story
  appendix sections + section prose) is a separate companion render.
- The architecture / RACI / org exhibit adapters are still gap-cards (PR4 known gap) — those slides
  show the honest "exhibit pending" card until those adapters land.
- Not yet wired into the live orchestrator generate path; that final step goes behind a tenant flag
  with a live ACA proof (mirroring the orchestrated-deliverables rollout discipline).
