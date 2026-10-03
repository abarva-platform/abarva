# 2026-10-02-board-grade-client-voice — Board-grade exports to the client-facing standard

## Release ID

`2026-10-02-board-grade-client-voice`

## Status

`candidate`

## Plain-English Summary

The board-grade export decks (architecture, business case, discover brief, and the
rest) spoke in an internal "how this was produced" voice — phrases like "produced
by the Moves Expert Kernel from the audited substrate" and "inherits the curated
outline from the bound Domain Function Pack; the agent does not improvise the
structure." How a deck is generated is not the client's concern, and this export
path never ran the shared client-facing cleanup.

This brings those exports to the same client-facing standard as the rest of the
product: the generation vocabulary is rewritten to plain client language
("domain reference model", "Moves analysis", "the structure is not improvised"),
while every legitimate domain and architecture term is left untouched — in
particular "data plane", which a broader cleanup would wrongly rewrite.

It is done at the two seams every board-grade format flows through, so all formats
are covered: the shared HTML composer (which all 18 deck renderers use, and from
which the PPTX/PDF derivatives are text-extracted) and the one native-PowerPoint
path.

## Layer Impact

Release lane: `global-control-lane` — shared board-grade export behavior for all
clients, not feature-gated.

- `PRODUCTS` (Moves): the board-grade export composer and the native-PPTX path.
  No change to numbers, evidence, structure, exhibits, or layout — only the
  generation-vocabulary wording on the client surface.

No change to the canonical model, source adapters, or client intake.

## Client Applicability

- All clients: yes — every board-grade export (HTML decks and the PPTX/PDF
  derived from them, plus the native Costed Business-Case PPTX).
- Specific clients: none. Internal only: no. Public/demo only: no. Feature flag:
  none.

## Changes Included

- `src/lib/deliverables/client-facing-artifact-sanitize.ts`: extract the
  builder-vocabulary rewrites into a shared `BUILDER_VOCAB_REPLACEMENTS` and
  export `scrubBuilderVocabulary` (builder terms ONLY — never "data plane" or
  other domain/architecture terms). The full sanitizer still applies the same
  set via spread, so the two cannot drift.
- `src/lib/programs/expert-kernel/exports/board-grade/deck-shell.ts`:
  `renderDeckDocument` scrubs its composed HTML. This one seam covers all 18 HTML
  decks and the PPTX/PDF text-extracted from them.
- `src/lib/programs/expert-kernel/exports/board-grade/pptx-renderer.ts`: the one
  native-PPTX path (which bypasses the HTML composer) scrubs its cover prose and
  author metadata.
- Tests: `scrubBuilderVocabulary` unit (scrubs builder terms, preserves "data
  plane"); a deck-shell integration test (chokepoint scrubs, keeps "data plane"
  and the style/script); 8 existing board-grade tests updated from "No curated
  Domain Function Pack" to "No curated domain reference model".

## QA / Validation

- Ran the real render harness (`scripts/lakeshore/render-kyriba-move-artifacts.ts`)
  and confirmed on the actual solution-architecture deck: 0 builder-vocabulary
  occurrences, client-voice replacements present ("domain reference model" ×7,
  "Moves analysis", "the structure is not improvised"), and "data plane"
  preserved ×4. (The regenerated build artifacts were reverted — this PR is
  source + tests only.)
- `npx jest src/lib/deliverables src/lib/programs/expert-kernel/exports` — 138
  suites / 1,744 tests pass, including the test that guards "Cloud landing zone &
  private data plane" stays intact.
- Scoped `tsc` over the changed files: no type errors. `eslint`: clean.
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
- Live signed-in proof required: regenerate / open one board-grade export after
  deploy and confirm no builder vocabulary appears.

## Rollback Plan

Revert the PR and redeploy from the reverted SHA through the main deploy
workflow. No migration or data change to unwind; the change is a scrub pass plus
two renderer-string wraps.

## Audit Evidence

- PR URL: (added on open).
- CI run on the PR.
- Local render-harness grep + test/lint/typecheck output above.

## Known Gaps

- Scope is the `board-grade/` export family (the committed decks and their
  derivatives). The one-level-up `exports/business-case-docx.ts` /
  `business-case-pdf.tsx` / `financial-model-xlsx.ts` generators are outside this
  family and were not in the 276-occurrence surface; if they are client-facing
  they can take the same scrub in a fast follow.
