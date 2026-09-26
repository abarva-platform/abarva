# Moves Deliverable Quality - Status

**Updated:** 2026-09-26T00:44:00Z
**Agent:** codex
**Branch:** origin/main plus follow-up status cleanup
**Head:** post-#8473 verification

## Now

This follow-up branch closes the deterministic items left after the exhibit-data contract slice:
every shared deliverable structure is now at or below seven sections, remaining Moves quality-bar
section floors match required sections, and fixed section structures still receive use-case-specific
exhibits and tables. No data-plane mutation or live tenant write is in scope for this branch.

## Items

| #   | Item                                                   | State                | Evidence                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| --- | ------------------------------------------------------ | -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Honest visual credit for generated documents and decks | pr_open              | PR #8421; deck exhibits are credited only when visual markup exists inside the matching exhibit block; focused Jest 64/64 and targeted ESLint pass locally; generated artifacts opened/read under `/tmp/moves-deliverable-quality-proof`.                                                                                                                                                                                                                                                          |
| 2   | Structured exhibit data and no generic visual fallback | pr_open              | PR #8421; `RenderableExhibit` now carries typed `data`; prompt asks for concrete drawable values; renderers omit missing-data exhibits instead of inventing generic diagrams; generated HTML/DOCX/PPTX proof confirms missing-data exhibit is omitted.                                                                                                                                                                                                                                             |
| 3   | Model-authored storyline slides                        | pr_open              | PR #8421 adds optional authored `deckSlides` to the renderable artifact contract; PPTX uses authored slide message/points/notes/exhibit links when present; the unused storyline PPTX placeholder renderer was removed. Generated proof: `/tmp/moves-deliverable-quality-proof/authored-slide-proof-summary.json`.                                                                                                                                                                                 |
| 4   | Section elasticity for over-sectioned structures       | candidate            | Follow-up branch compresses every shared deliverable structure to 7 sections or fewer: Moves Charter 7/7, Business Case 6/5, Roadmap 7/5, Discovery Report 6/4, Target Architecture 7/4, Solution Design 6/4, Operating Model 6/4, Sourcing Strategy 5/4, Estimate 6/5, Value 6/5, Readiness 7/6, Mobilization 6/5, Handoff 7/5, Executive Playback 6/5; Source Sourcing Strategy Memo and Executive Recommendation are also 7 or fewer. Quality-bar section floors match required-section counts. |
| 5   | Red-test diagnosis                                     | pr_open              | PR #8421; the named visual-gate/storyline/render preview suites now pass on this branch without widening the visual-credit gate.                                                                                                                                                                                                                                                                                                                                                                   |
| 6   | Legacy small-model document route reachability         | pr_open              | PR #8421; code inspection confirms `POST /api/engage/[engagementId]/turn` still calls `generateDeliverableForPhase()` after gate approval. The legacy fallback now resolves through central document-generation policy instead of a hardcoded small model / 2,048-token call.                                                                                                                                                                                                                      |
| 7   | Golden-bar signal measurement before enforcement       | pr_open              | PR #8421 adds report-only `moves:measure-golden-bar-signals` runner over caller-provided artifact exports. Production corpus measurement not run in this branch.                                                                                                                                                                                                                                                                                                                                   |
| 8   | Human exemplars, judge, and calibration corpus         | blocked_human_review | Report-only exemplar audit remains honest: 0/20 complete, 20 missing, 2 existing visual benchmark HTML files unmapped as per-deliverable exemplars; `readyForJudge=false`. Human-owned exemplars remain required before judge work can be meaningful; this branch does not fabricate approvals.                                                                                                                                                                                                      |

## Measurements

| Metric                         | Value                    | Notes                                                                                                                                                                                                             |
| ------------------------------ | ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Focused quality tests          | 176/176 passing          | `persistence-deck`, `renderers`, `section-generation`, `brief-library`, `quality-bar-registry`, `prompt-story-spine`, adaptive-depth, legacy policy, storyline-deck, story-visual-gate, and exemplar-audit suites |
| CI deliverables command        | 570/570 passing          | `npx jest src/lib/deliverables/__tests__ src/lib/deliverables/orchestrator/__tests__ --no-coverage --ci`; includes the suites that initially failed remotely after the exhibit-data contract.                     |
| Targeted ESLint                | passing                  | Changed orchestrator/storyline files only                                                                                                                                                                         |
| Generated artifact proof       | passed                   | `/tmp/moves-deliverable-quality-proof/proof-summary.json`; structured exhibit rendered, missing-data exhibit omitted                                                                                              |
| Authored-slide artifact proof  | passed                   | `/tmp/moves-deliverable-quality-proof/authored-slide-proof-summary.json`; authored slide rendered with linked exhibit and speaker notes                                                                           |
| Legacy route model policy      | passed                   | Code inspection confirmed route reachability; regression test covers legacy fallback policy and forbids the hardcoded small-model / 2,048-token path                                                              |
| Dead placeholder PPTX renderer | passed                   | `renderStorylineDeckPptx` and its `VISUAL EXHIBIT` placeholder were removed; live generated-deck PPTX remains in orchestrator `renderers.tsx`                                                                     |
| Exemplar coverage audit        | passed with expected gap | `npm run moves:audit-golden-exemplars -- --out /tmp/moves-golden-exemplar-coverage-after-8473.json`; report says 0/20 complete, 20 missing, 2 unmapped visual benchmark HTML files; `readyForJudge=false`          |
| Production data-plane writes   | 0                        | Not in scope                                                                                                                                                                                                      |
| Deployments                    | 0                        | Not in scope                                                                                                                                                                                                      |

## Blocked On

Human-curated exemplars are required before a quality judge can be trusted. The report-only
coverage audit makes the gap machine-readable, but it does not create substitute exemplars.
The two staged HTML files under `docs/build/golden-artifacts/` are visual benchmark fixtures used by
golden-bar tests; they are not approved per-deliverable exemplars until a human manifest maps each
one to a deliverable with an owner, review date, approved status, and rationale.

## Known Gaps

This branch does not enforce golden-bar advisory signals, does not build a model judge, does not
alter live persisted artifacts, and does not deploy.
