# 2026-10-02-wire-deck-story-quality-contract — Wire the deck story contract into generation and the gate

## Release ID

`2026-10-02-wire-deck-story-quality-contract`

## Status

`candidate`

## Plain-English Summary

A board deck is not a document reflowed onto slides — a good one has a decision
journey: every slide title states a conclusion (not a category label), each
slide makes one point, slides are not walls of text, and the deck carries the
diagram its argument needs. The product already had this standard written down
as a "deck story contract" — the slide flow, the message-led-title rule, density
limits, the required elements per slide — but it was never connected to anything.
The generator was never told it, and the quality gate never checked against it.
The deck pipeline enforced only the slide *count*.

This change connects that existing contract at both ends. The generator is now
given the full contract for the deck it is writing (the slide flow, "titles state
the conclusion," one message per slide, density limits, what belongs in the
appendix). And the quality gate now surfaces — as advisory notes, not hard
blocks — when a produced deck leads with label-titles, has slides too dense for a
room, carries too many points on one slide, or is an all-text deck of a type
whose contract calls for a diagram.

Advisory on purpose: turning on a bar that was never enforced must not suddenly
fail decks that were acceptable yesterday. The notes make the gap visible and the
generator is told the same bar, so quality rises first by better authoring. A
later change can promote specific checks to hard blocks once we have seen them
against real decks.

## Layer Impact

Release lane: `global-control-lane` — shared Moves deck-authoring behavior for
all clients, not feature-gated.

- `PRODUCTS` (Moves): the PPTX generation prompt now carries the deck story
  contract; the quality gate adds advisory deck-quality notes. No change to
  evidence use, figure tracing, slide-count blocking, or physical-integrity
  checks.

No change to the canonical model, source adapters, or client intake.

## Client Applicability

- All clients: yes — applies to every Move that produces a PPTX deck of a type
  with a deck story contract (P2 discovery/root-cause, P3 solution/architecture/
  operating-model, P4 business-case/roadmap).
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/lib/deliverables/shared/deck-story-contract.ts`: new
  `deckContractIdForDeliverable()` (deliverableType → contract) and
  `deckContractExpectsDiagram()`. The contract, its slide flow, density bands,
  `isGenericSlideTitle`, and `renderDeckContractPrompt` already existed and were
  unused on the live path.
- `src/lib/deliverables/orchestrator/prompt-builder.ts`: new
  `deckStoryContractInstruction()` injected into the synthesis prompt for a PPTX
  build (calls the previously-unused `renderDeckContractPrompt`).
- `src/lib/deliverables/orchestrator/quality-validator.ts`: advisory
  (non-blocking) deck-quality warnings — label-led governing messages, too-dense
  slides, over the supporting-point ceiling, and a diagram-expecting deck with no
  linked exhibit.
- Tests: contract-map + diagram-expectation cases; the advisory-not-blocking
  validator behavior; and that the contract prompt reaches the generator.

## QA / Validation

- `npx jest src/lib/deliverables` — 108 suites / 1,292 tests pass.
- New tests assert: each deck deliverable maps to a defined contract and
  non-deck types map to null; the validator WARNS (never blocks) on label titles,
  density, point-count, and missing diagram, and is silent on a docx build and on
  an argument-led deck; the contract prompt reaches the generator for pptx and is
  silent otherwise.
- Scoped `tsc` over changed files: no type errors. `eslint`: clean.
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
  after deploy and confirm the contract reaches the prompt and advisory notes
  surface as intended.

## Rollback Plan

Revert the PR and redeploy from the reverted SHA through the main deploy
workflow. No migration or data change to unwind; the change is prompt text plus
advisory validator notes.

## Audit Evidence

- PR URL: (added on open).
- CI run on the PR.
- Local test + lint + scoped typecheck output above.

## Known Gaps

- The checks are advisory, not blocking, by design; promoting specific ones to
  hard blocks is a deliberate follow-up once calibrated against real decks.
- Renderer-side quality (dark header band on content slides, color-coded /
  owner-terminated tables, content-slide footer, `value_tree` exhibit, one
  uniform canvas) and client-surface builder-vocabulary scrubbing are separate
  follow-ups (deck-quality remediation sequence, steps 2 and 3).
