# 2026-08-19-deck-story-contract — Deck story contracts for P2/P3/P4

## Release ID

`2026-08-19-deck-story-contract`

## Status

`candidate`

## Plain-English Summary

A deck is not the document reflowed onto slides. The document contains the
depth; the presentation creates the decision journey. Generating one from the
other without a separate contract produces the two failure modes worth naming:
slide-like documents (bullet fragments where argument belongs) and
document-like slides (paragraph walls nobody reads in a room).

This adds `DeckStoryContract` — mandatory slide flows for the P2 discovery
readout, the P3 solution decision, and the P4 business case — as a sibling of
the document contract, not something inside it.

Every narrative slide names the shared story beat it carries, so a deck and its
document cannot tell different stories. Slides that legitimately carry no single
beat declare why: the "Business Case at a Glance" opener deliberately spans the
whole case, and the closing "Next Decisions" slide follows the story rather than
advancing it.

The P4 deck mandates **Business Case at a Glance** as slide 2, with its fifteen
required elements enumerated rather than left to judgment — recommendation,
foundation vs incremental vs run cost, benefit and confidence, three-year TCO,
payback, low/expected/high, duration, delivery model, largest uncertainty, and
the exact ask. A CFO or CIO should understand the whole case from that one page.

Also encoded: slide density bands (35-70 preferred, to 100 advisory, past 130
must be split or rewritten, counting visible words only), 8-15 core slides, one
primary message and one primary visual per slide, at most five supporting
points, message-led titles, appendix rules, and a deliberately generous
10,000-14,000 output-token budget — visible slide text is a small fraction of
what a deck generation produces, and starving the budget is the most common way
a generated deck fails.

## Layer Impact

Release lane: `global-control-lane` (shared deliverable contract; no tenant data,
no schema change, no runtime behavior change in this pass).

- **Layer 4 (Products) — Moves.** A new pure contract module. Nothing imports it
  yet, so no product surface changes.
- **Layer 3 (Canonical Model) — untouched.**

## Client Applicability

- All clients: no change. The module has no consumers in this release.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none needed — an unconsumed pure module cannot alter behavior.
  PPTX generation, when wired, ships flag-gated and only from an approved
  artifact version.

## Changes Included

- New: `src/lib/deliverables/shared/deck-story-contract.ts`
- New: `src/lib/deliverables/shared/__tests__/deck-story-contract.test.ts`

Contract surface: `SLIDE_DENSITY` + `classifySlideDensity` +
`slideDensityBlocks`, `CORE_SLIDE_COUNT`, `MAX_SUPPORTING_POINTS`,
`DECK_OUTPUT_TOKEN_BUDGET`, `SlideContract`, `DeckStoryContract`,
`DECK_STORY_CONTRACTS` (3 decks), `deckContract`, `unknownBeatIds`,
`isGenericSlideTitle`, `renderDeckContractPrompt`.

## QA / Validation

- `npx tsc --noEmit --pretty false` — 0 errors, full project.
- `npx eslint` on both new files — 0 errors, 0 warnings.
- 25 new tests, asserting behavior and contract invariants: each density band at
  its exact boundary (34/35, 70/71, 100/101) and that blocking starts only past
  the hard ceiling; every deck's beats exist in its declared spine; every
  beatless slide explains itself; the beats a deck carries appear in spine
  order; slide ids unique; core count within 8-15; the P4 twelve-slide flow
  exactly as agreed; foundation split from incremental on the investment slide;
  "what not to fund yet" required on the recommendation slide; generic slide
  titles rejected and conclusion-stating titles accepted.
- Regression sweep: `src/lib/deliverables` + `src/lib/programs/deliverables` —
  728 tests, 8 failing. The same 8 pre-existing failures recorded in the two
  preceding release records, unchanged. Net: 25 added, all passing, zero new
  failures.

## Rollout Plan

Merge to `main`. `.github/workflows/aca-main-deploy.yml` builds and deploys as
usual. No tenant behavior changes on deploy.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
  (existing, unmodified).
- Shared runtime mutators: none.
- Approved image digest: n/a — standard deploy workflow builds and pins.
- ACA runtime invariant: unaffected.
- Worker image invariant: unaffected.
- Live signed-in proof required: no — nothing is observable in the product yet.

## Rollback Plan

Revert the commit and merge to `main`. Removing an unimported module restores
the prior state exactly. No migration, no tenant to un-enroll.

## Audit Evidence

- Local typecheck/lint/test output captured in this session's transcript.
- Shared narrative model this projects:
  `src/lib/deliverables/shared/executive-story-contract.ts`.

## Known Gaps

- **`REF_DECK_P4_ROADMAP` is deliberately not defined.** A roadmap deck argues
  "is this sequence right?", which wants to lead with the sequence — but the
  investment spine reaches `roadmap` only after `value` and `delivery`.
  Projecting it onto `p4_investment_case` either violates the spine order or
  forces a reading order no one would present. It needs its own spine, and
  inventing one without agreement would be guessing at a story rather than
  encoding one. This was caught by the spine-order test rather than reasoned
  about in advance.
- **`REF_DECK_TECHNICAL_ARCHITECTURE` is not defined** for the same reason — its
  audience and argument are not the executive decision journey these three
  contracts encode.
- **Nothing consumes this yet.** No prompt injection, no renderer, no PPTX
  generation. Deliberate: deck instructions must not leak into the document
  prompt, so the injection is its own increment.
- **Density is defined but not measured.** `classifySlideDensity` exists; no
  code counts visible words on a rendered slide yet. That arrives with the
  renderer, which must also define what "visible" means per layout.
- **`SlideVisualReferenceContract` is named in the hierarchy but not built.**
  `SlideVisualKind` is currently a vocabulary, not a specification — it names
  what kind of visual a slide carries, not how to draw it.
- **PPTX generation must run only from an approved artifact version.** Not
  enforced here because nothing generates decks yet; it is a hard requirement of
  the later wiring increment.
