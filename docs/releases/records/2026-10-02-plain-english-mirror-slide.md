# 2026-10-02-plain-english-mirror-slide — Plain-English mirror slide for technical decks

## Release ID

`2026-10-02-plain-english-mirror-slide`

## Status

`candidate`

## Plain-English Summary

A technical deck (target-state architecture, solution design, operating model)
is read in a room that includes executives who do not need the technical
vocabulary. The gold-standard deck handled this with one early "same architecture,
no jargon" slide that retells the story in plain English. This asks the generator
to include that one slide for those deck types. It restates the deck's own story
— it introduces no new figure or claim — and points to the technical slides that
carry the detail.

## Layer Impact

Release lane: `global-control-lane` — shared Moves deck-authoring behavior for all
clients, not feature-gated.

- `PRODUCTS` (Moves): one added generator instruction for technical PPTX decks.
  No change to evidence, figures, gates, or the renderer.

No change to the canonical model, source adapters, or client intake.

## Client Applicability

- All clients: yes — any technical deck (architecture / solution design /
  operating model) produced as PPTX.
- Specific clients: none. Internal only: no. Public/demo only: no. Feature flag:
  none.

## Changes Included

- `src/lib/deliverables/orchestrator/prompt-builder.ts`: new
  `plainEnglishMirrorInstruction` (gated to the technical deck types + PPTX),
  injected into the synthesis prompt. It requires the mirror slide to RESTATE
  only — no figure/system/claim not already grounded elsewhere in the deck.
- Tests: the instruction appears for the technical decks and is silent for a
  non-technical deck and a document-only build.

## QA / Validation

- `npx jest src/lib/deliverables` — 111 suites / 1,311 tests pass.
- Scoped `tsc` over the changed file: no type errors. `eslint`: clean.
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
- Live signed-in proof required: generate one technical deck after deploy and
  confirm it carries a plain-English mirror slide that adds no new figure.

## Rollback Plan

Revert the PR and redeploy from the reverted SHA through the main deploy
workflow. No migration or data change to unwind; the change is prompt text.

## Audit Evidence

- PR URL: (added on open).
- CI run on the PR.
- Local test + lint + scoped typecheck output above.

## Known Gaps

- None for this change. (Deck-quality remediation sequence is otherwise complete;
  the board-grade export path's provenance voice — "Moves Expert Kernel" /
  "Domain Function Pack" — is intentional, tested design and is a separate
  editorial decision, not a defect.)
