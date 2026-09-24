# Moves Deliverable Quality - Status

**Updated:** 2026-09-24T13:29:00Z
**Agent:** codex
**Branch:** codex/moves-deliverable-quality-rebuild
**Head:** f8ab86d37

## Now

Working in a clean worktree from `origin/main` on the deliverable-quality rebuild. Current slice is
the exhibit truthfulness and structured exhibit-data contract. No deployment, data-plane mutation,
or live tenant write is in scope for this branch.

## Items

| # | Item | State | Evidence |
|---|------|-------|----------|
| 1 | Honest visual credit for generated documents and decks | in_progress | Deck exhibits are credited only when visual markup exists inside the matching exhibit block; focused Jest 64/64 and targeted ESLint pass locally; generated artifacts opened/read under `/tmp/moves-deliverable-quality-proof`. |
| 2 | Structured exhibit data and no generic visual fallback | in_progress | `RenderableExhibit` now carries typed `data`; prompt asks for concrete drawable values; renderers omit missing-data exhibits instead of inventing generic diagrams; generated HTML/DOCX/PPTX proof confirms missing-data exhibit is omitted. |
| 3 | Model-authored storyline slides | not_started | Live PPTX path identified; this branch has not yet changed the slide authoring contract. |
| 4 | Section elasticity for over-sectioned structures | not_started | Business-case reduction exists on main from earlier work; this branch has not changed additional structures. |
| 5 | Red-test diagnosis | not_started | Pre-existing red suites named in the brief have not yet been diagnosed in this branch. |
| 6 | Legacy small-model document route reachability | not_started | No production reachability check in this branch. |
| 7 | Golden-bar signal measurement before enforcement | in_progress | Added report-only `moves:measure-golden-bar-signals` runner over caller-provided artifact exports. Production corpus measurement not run in this branch. |
| 8 | Human exemplars, judge, and calibration corpus | not_started | Requires human-owned exemplars before judge work can be meaningful. |

## Measurements

| Metric | Value | Notes |
|--------|-------|-------|
| Focused orchestrator tests | 64/64 passing | `persistence-deck`, `renderers`, and `section-generation` suites |
| Targeted ESLint | passing | Changed orchestrator/storyline files only |
| Generated artifact proof | passed | `/tmp/moves-deliverable-quality-proof/proof-summary.json`; structured exhibit rendered, missing-data exhibit omitted |
| Production data-plane writes | 0 | Not in scope |
| Deployments | 0 | Not in scope |

## Blocked On

Human-curated exemplars are required before a quality judge can be trusted.

## Known Gaps

This branch does not enforce golden-bar advisory signals, does not build a model judge, does not
alter live persisted artifacts, and does not deploy.
