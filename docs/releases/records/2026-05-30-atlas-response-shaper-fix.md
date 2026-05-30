# 2026-05-30-atlas-response-shaper-fix — Atlas `/tower` Response Shaper Damage Fix (HI-3)

## Release ID

`2026-05-30-atlas-response-shaper-fix`

## Status

`candidate`

## Plain-English Summary

Atlas's Tower-surface response shaper was actively damaging well-formed LLM output: duplicating phrases ("- Predictive next-edit. - Predictive next-edit."), packing complete sentences into broken markdown tables, and truncating mid-thought. The 2026-05-30 Atlas IaC E2E audit captured 14+ damaged turns across all three tenants. This release adds a structure-aware bypass so already-shaped responses (tables, the composition layer's 4-section template, well-formed bullet/numbered lists) pass through unchanged, and also fixes the root-cause duplication bug in `compactStepText`.

## Layer Impact

- `global-control-lane`: Tower chat responses are no longer mangled by post-processing. CXO-grade output quality restored.
- `internal-admin`: E2E and QA harnesses see the LLM's actual output, not the shaper's reshape of it.

## Client Applicability

- All clients: Apex Retail, Meridian Health, FirstCapital — every Tower turn benefits.
- Specific clients: None — the audit caught damage across all three tenants.
- Internal only: None.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- **Option B chosen — structure-aware bypass.** Added `looksAlreadyStructured()` in `src/lib/agent/response-shape.ts` that detects:
  - Existing markdown tables (2+ pipe-delimited rows)
  - Atlas composition 4-section template (`Your data`, `Industry context`, `The gap`, `Next move` — any 2+ headers)
  - Well-formed bullet lists (3+ items)
  - Monotonic numbered lists (3+ items starting at 1)
  When detected, `shapeAgentResponseForSurface` skips `compactConsultantChatText` entirely.
- **Root-cause fix.** `compactStepText` previously fell back to `?? clean` when a step had no `:` or ` — ` separator, making `title === detail`. Now when `detail` is empty or collapses to the same normalized form as `title`, only the title is rendered. This was the source of the audit's signature "- Predictive next-edit. - Predictive next-edit." duplication.
- **Regression test.** `src/lib/agent/__tests__/response-shape-regression.test.ts` (6 tests) pins all three damage classes:
  1. Phrase duplication in compactStepText
  2. Tables synthesized from prose / well-formed input preservation (markdown table, composition 4-section, bullet list)
  3. Sentence integrity (no packing of complete sentences into broken table cells)

## Option choice (A vs B)

**Picked Option B** (bypass for structured responses) plus a small surgical Option-A fix for the `compactStepText` duplication. Reasoning:

- The Atlas composition layer (`src/lib/atlas/composition/compose.ts`) emits a canonical 4-section response that the LLM is instructed to mirror. Running that through a regex-based template compactor is pure damage.
- `compactConsultantChatText` and its sub-extractors (`compactComparisonText`, `compactStepText`, `compactStatStackText`) are pattern-matchers designed for *loose* advisor prose. The greedy `Word — Word` regex in `extractComparisonItems` will misfire on any prose sentence with an em dash; fixing that one regex would unmask the next.
- The Tower surface had already been narrowed in `shouldCompactSurface` (see VOICE.STRAT-2026-05-10f comment) — Source, Programs, Intelligence, Strategic Moves were all removed for the same Brief-violation class. Tower was kept because dashboard-style summary compaction is sometimes useful. The bypass preserves that compaction for loose prose while protecting structured output.
- The `compactStepText` duplication bug is mechanical and worth fixing at source — it was a fallback chain that defaulted to the wrong value.

## Why / Impact

- **What:** Tower-surface shaper now bypasses the templated compactor when the LLM returned structured output, and the step-extraction no longer duplicates the title as the detail.
- **Why:** The audit captured 14+ damaged turns across all three tenants. Damage included phrase duplication, broken comparison tables synthesized from prose, and mid-thought truncation.
- **Impact:** Tower chat responses are now CXO-grade — no more visible mangling. Existing loose-prose compaction (covered by 40 pre-existing response-shape tests) still works.

## Detection

- E2E harness: `scripts/qa/atlas-iac-e2e.ts` — re-running captures Tower output verbatim and grep'ing for the three damage patterns produces zero hits.
- Regression test: `src/lib/agent/__tests__/response-shape-regression.test.ts` — runs in CI on every PR.
- Static guard: the duplication regex `/\b(\w+(?:[-' ]\w+)?)\.\s+\1\./` in the regression suite catches the generic class.

## Rollback Plan

Revert the release commit. The pre-fix damage will return; no schema/contract changes to reverse.

## QA / Validation

- Passed: `npx jest src/lib/agent/__tests__/response-shape` (46 tests — 40 existing + 6 new regression).
- Passed: `npx jest src/lib/agent/__tests__/` (336 tests, all agent suites).
- Passed: `npx tsc --noEmit`.

## Rollout Plan

Merge to main and let the normal Vercel deployment ship it. No migration, no feature flag, no env vars.

## Audit Evidence

- Anchor doc: `reports/2026-05-30-atlas-iac-e2e/ISSUES_CURATED.md` (HI-3 section).
- Raw evidence: `reports/2026-05-30-atlas-iac-e2e/raw.json` — grep for "Predictive next-edit" duplication and "There is a second pressure behind |" table-damage patterns.
- Runtime source: `src/lib/agent/response-shape.ts`.
- Test: `src/lib/agent/__tests__/response-shape-regression.test.ts`.

## Known Gaps

- The `compactComparisonText` greedy regex is still present and still imperfect for loose prose with em dashes. The bypass means it no longer fires on structured input, but a degenerate loose-prose response with several em-dash-separated clauses could still produce a borderline-broken comparison table. Acceptable for now — the audit damage was entirely on structured input, and the regex was previously load-bearing for the legitimate Tower comparison-table tests (which still pass).
