# 2026-10-02-deck-renderer-exec-chrome — Executive chrome on generated decks

## Release ID

`2026-10-02-deck-renderer-exec-chrome`

## Status

`candidate`

## Plain-English Summary

Two visual upgrades to the PowerPoint decks the product generates, to match the
look of a board-grade deck:

1. **Every content slide now carries a running footer** — the client name, a
   confidentiality mark, and the AI-draft caveat — so no page leaves the room
   unmarked. Previously only the title and closing slides had any footer.
2. **Tables now render with a dark header band** (white text on the ink colour)
   instead of a pale grid header, so a table reads as an executive exhibit rather
   than a spreadsheet dump.

Both were verified by rendering a sample deck and inspecting the slides.

## Layer Impact

Release lane: `global-control-lane` — shared Moves deck-rendering behavior for all
clients, not feature-gated.

- `PRODUCTS` (Moves): the PPTX renderer only. No change to content, evidence,
  figures, slide count, or any quality gate.

No change to the canonical model, source adapters, or client intake.

## Client Applicability

- All clients: yes — every generated PPTX deck.
- Specific clients: none. Internal only: no. Public/demo only: no. Feature flag:
  none.

## Changes Included

- `src/lib/deliverables/orchestrator/renderers.tsx`:
  - `addPptxChrome` now adds a small running confidentiality footer to every
    content slide (opt-out for the closing slide, which already has its own full
    status footer).
  - `addPptxTableSlide` renders the header row as white-on-ink (dark band)
    instead of muted-on-paper.
- Tests: `pptx-exec-chrome.test.ts` renders the deck and asserts, via the slide
  XML, that more than one content slide carries the footer and that a table
  header uses an ink cell-background fill.

## QA / Validation

- Rendered a representative deck (sections, an exhibit, a risk table with an
  Owner column, authored slides) through the real renderer and viewed the slides:
  footer present on content slides; table header is a dark band.
- `npx jest src/lib/deliverables` — 106 suites / 1,278 tests pass (plus the new
  exec-chrome test).
- Scoped `tsc` over the renderer + test: no type errors. `eslint`: clean.
- `npm run release:check --base origin/main --head HEAD`: all gates pass.

## Rollout Plan

Merge to main via squash. No runtime rollout step of its own: it takes effect in
the web image the repo-owned ACA main deploy workflow builds from the merge SHA.
No migration, no flag, no env change.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` (on merge
  to main).
- Shared runtime mutators: none introduced.
- Approved image digest: the digest the main deploy workflow produces for the
  merge SHA.
- ACA runtime invariant: unchanged; no env/flag/scale/secret change.
- Worker image invariant: unchanged.
- Feature/env flag update path: none.
- Live signed-in proof required: yes — generate one PPTX deck on an affected Move
  after deploy and confirm the footer and dark table header render.

## Rollback Plan

Revert the PR and redeploy from the reverted SHA through the main deploy
workflow. No migration or data change to unwind.

## Audit Evidence

- PR URL: (added on open).
- CI run on the PR.
- Local render screenshots + test/lint/typecheck output above.

## Known Gaps

- Color-coded / RAG table cells and an explicit owner/decision column are not in
  this change — they require a generator-side data-model decision and are part of
  the deck-quality remediation sequence, step 3.
- `value_tree` exhibit SVG builder is still absent (deferred to step 3).
