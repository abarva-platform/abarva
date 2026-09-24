# Moves Deliverable Quality - Status

**Updated:** 2026-09-24T14:38:00Z
**Agent:** codex
**Branch:** codex/moves-deliverable-quality-rebuild
**Head:** PR #8421 branch head

## Now

PR #8421 is open for the exhibit truthfulness, structured exhibit-data contract, authored PPTX
slide contract, target-architecture section elasticity, and report-only golden-bar measurement
slice. No deployment, data-plane mutation, or live tenant write is in scope for this branch.

## Items

| # | Item | State | Evidence |
|---|------|-------|----------|
| 1 | Honest visual credit for generated documents and decks | pr_open | PR #8421; deck exhibits are credited only when visual markup exists inside the matching exhibit block; focused Jest 64/64 and targeted ESLint pass locally; generated artifacts opened/read under `/tmp/moves-deliverable-quality-proof`. |
| 2 | Structured exhibit data and no generic visual fallback | pr_open | PR #8421; `RenderableExhibit` now carries typed `data`; prompt asks for concrete drawable values; renderers omit missing-data exhibits instead of inventing generic diagrams; generated HTML/DOCX/PPTX proof confirms missing-data exhibit is omitted. |
| 3 | Model-authored storyline slides | pr_open | PR #8421 adds optional authored `deckSlides` to the renderable artifact contract; PPTX uses authored slide message/points/notes/exhibit links when present; the unused storyline PPTX placeholder renderer was removed. Generated proof: `/tmp/moves-deliverable-quality-proof/authored-slide-proof-summary.json`. |
| 4 | Section elasticity for over-sectioned structures | pr_open | PR #8421 compresses Target Architecture to 7 sections / 4 required, Solution Design to 6 / 4, and Operating Model to 6 / 4 while preserving expected exhibits. `brief-library` and adaptive-depth tests pass. |
| 5 | Red-test diagnosis | pr_open | PR #8421; the named visual-gate/storyline/render preview suites now pass on this branch without widening the visual-credit gate. |
| 6 | Legacy small-model document route reachability | pr_open | PR #8421; code inspection confirms `POST /api/engage/[engagementId]/turn` still calls `generateDeliverableForPhase()` after gate approval. The legacy fallback now resolves through central document-generation policy instead of a hardcoded small model / 2,048-token call. |
| 7 | Golden-bar signal measurement before enforcement | pr_open | PR #8421 adds report-only `moves:measure-golden-bar-signals` runner over caller-provided artifact exports. Production corpus measurement not run in this branch. |
| 8 | Human exemplars, judge, and calibration corpus | not_started | Requires human-owned exemplars before judge work can be meaningful. |

## Measurements

| Metric | Value | Notes |
|--------|-------|-------|
| Focused quality tests | 122/122 passing | `persistence-deck`, `renderers`, `section-generation`, `brief-library`, adaptive-depth, legacy policy, storyline-deck, and story-visual-gate suites |
| Targeted ESLint | passing | Changed orchestrator/storyline files only |
| Generated artifact proof | passed | `/tmp/moves-deliverable-quality-proof/proof-summary.json`; structured exhibit rendered, missing-data exhibit omitted |
| Authored-slide artifact proof | passed | `/tmp/moves-deliverable-quality-proof/authored-slide-proof-summary.json`; authored slide rendered with linked exhibit and speaker notes |
| Legacy route model policy | passed | Code inspection confirmed route reachability; regression test covers legacy fallback policy and forbids the hardcoded small-model / 2,048-token path |
| Dead placeholder PPTX renderer | passed | `renderStorylineDeckPptx` and its `VISUAL EXHIBIT` placeholder were removed; live generated-deck PPTX remains in orchestrator `renderers.tsx` |
| Production data-plane writes | 0 | Not in scope |
| Deployments | 0 | Not in scope |

## Blocked On

Human-curated exemplars are required before a quality judge can be trusted.

## Known Gaps

This branch does not enforce golden-bar advisory signals, does not build a model judge, does not
alter live persisted artifacts, and does not deploy.
