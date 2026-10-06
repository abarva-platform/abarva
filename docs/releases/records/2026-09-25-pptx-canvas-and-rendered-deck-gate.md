# 2026-09-25-pptx-canvas-and-rendered-deck-gate — Fix the PPTX canvas, and make the rendered deck the governed artifact

## Release ID

`2026-09-25-pptx-canvas-and-rendered-deck-gate`

## Status

`candidate`

## Plain-English Summary

Every PowerPoint this product generated was laid out for a page a third wider than the page it declared. Slide content — body text, tables, diagrams — sat about two and a half inches off the right-hand edge and simply could not be seen. A twelve-slide charter carried sixty-four objects outside the page.

It went unnoticed because the shape of the slide was right even though the size was wrong: both are 16:9, so slide counts, thumbnails and every automated check looked correct. Only opening the file showed it, which is how it was found.

The second change is the reason it survived at all. Every deck check in the product read the *structured document we intended to render*, never the file itself. So a deck could be unreadable and still pass. The product now opens the PowerPoint it just produced and inspects it — page size, real slide count, where every object sits, which slides carry actual content — and refuses to hand over a deck whose content falls outside the page.

Also: the Charter no longer carries a mandatory slide deck. It is a Word document first, and a Charter presentation becomes an optional executive projection rather than an obligation.

## Layer Impact

**Release lane: `global-control-lane`.** Shared control-plane behaviour for all clients, not feature-gated.

- **Layer 4 · Products (Moves, Source):** every generated PPTX. Rendering and validation only.
- **Layer 3 · Canonical model:** untouched. No schema, migration or stored data change.

## Client Applicability

- All clients: yes — every generated deck.
- Feature flag: none.

## Changes Included

- `src/lib/deliverables/orchestrator/renderers.tsx` — `LAYOUT_16x9` → `LAYOUT_WIDE`.
- `src/lib/deliverables/orchestrator/deck-inspection.ts` — new. Reads the rendered PPTX.
- `src/lib/deliverables/orchestrator/deck-quality.ts` — new. Judges what was read.
- `src/lib/deliverables/orchestrator/render-validated-deck.ts` — new. Render and inspect in one call.
- `src/app/api/v1/artifacts/[artifactId]/route.ts` — serves a PPTX only after inspecting it.
- `src/lib/deliverables/slide-contract.ts` — Charter's mandatory slide band removed.

No migrations, no schema, no scripts.

## QA / Validation

- 86 suites, 958 tests, ESLint clean, orphan audit clean.
- Bounds assertion against the real rendered file: **64 off-canvas shapes before, 0 after.**
- Mutation-verified: restoring `LAYOUT_16x9` recreates all 64 and fails the test.
- Ten planted-defect tests on the deck gate — title-only slide, title plus fragment, empty table shell, off-canvas shape, narrow canvas, slide count at both edges — each fails; valid visual, table and declared-divider slides pass.
- Visual proof: both decks rendered to PDF via `soffice`. Before, content runs off the right edge mid-word and the slide number is absent because it was off-canvas; after, both sit inside the page.
- `npx tsc --noEmit` exits 134 (out of memory) locally and does not complete. CI typecheck is authoritative.

## Rollout Plan

Merge to `main`. The repo-owned ACA main deploy workflow builds and deploys on push. No migration, no flag, no manual step.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`, on merge to `main`.
- Shared runtime mutators: none.
- Approved image digest: produced by the deploy workflow.
- ACA runtime invariant: confirm post-deploy — template image, 100%-traffic revision, and deliverable worker jobs on one digest. The workers matter here; generation runs in them.
- Live signed-in proof required: yes — download one PPTX and open it.

## Rollback Plan

Revert the merge commit and redeploy. No migration to unwind, no persisted state changed.

## Audit Evidence

- Commits `b29784f08`, `76edf770f`, `7e3adeda`.
- Before/after PDF renders of the same charter deck.

## Known Gaps

- **This fixes physical integrity, not the deck's storyline.** Slides are still produced by mapping one document section to one slide, which is why they remain sparse. That is the next increment and nothing here closes it.
- **Thin slides are reported, not blocked.** The section fallback produces them by construction; blocking downloads today would stop work without improving anything.
- **A real truncation path exists** — the fallback caps a slide's governing line at eighteen words. It is deliberate slide compression and was not the cause of the missing content. It lives inside the code the next increment replaces.
- **Not proven live.** This record covers code merged, not a deck downloaded and opened on the deployed build.
