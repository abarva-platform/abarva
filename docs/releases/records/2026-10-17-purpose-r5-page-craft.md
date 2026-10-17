# 2026-10-17-purpose-r5-page-craft — Round-5 page craft rules for the purpose exports

## Release ID

`2026-10-17-purpose-r5-page-craft`

## Status

`candidate` — stacked on `2026-10-17-purpose-contract-repetition`; not for merge to `main` on its
own.

## Plain-English Summary

Four fresh-writing outputs held at 72-74 against an 85 bar. The reviewer's shortfall was page craft,
not evidence: citation codes inside titles and after almost every table cell, two-clause titles,
"This page…" scope notes on every page, taxonomy labels such as `CANDIDATE / Supported now`, a
workflow drawn as a From/To table whose handoff column said the same thing on every row, a trend
word that the plotted data did not support, and the decision restated across the deck.

Several of these were produced by deterministic code or by our own instructions rather than by the
writer, so regenerating could not fix them. This change makes each rule a code check, with no model
judgement.

## What changed

**Deterministic page planning and rendering**

- **Citations leave the sentences (§1).** A table that renders as a register moves its row's codes
  into one narrow final `Source` column. If every row cites the same sources, they are stated once in
  the page footer instead. The footer keeps every source in both cases. Where cells in one row cited
  different sources, that cell-level attribution is kept in the speaker notes.
- **Client labels (§2).** Status labels map to one client word each (Design candidate, Supported
  now, Conditions to close, Later approval, Open risk); the slash form is never rendered. On the
  decision page, items with the same state are grouped into one row. Status colour is carried as row
  data instead of being parsed back out of the label text.
- **One-clause chart headline (§3).** The computed chart headline joins two series with "while"
  instead of a semicolon. If that is over 72 characters, it leads with the stronger series.
- **Workflows drawn as a flow (§4).** Recorded handoffs become a numbered flow when the declared
  order forms the main path (3-5 steps). A handoff label that is the same on every step is dropped.
  A branch becomes one "Exception path" line under the flow. Distinct per-step handoff labels,
  unconnected steps or a long branch keep the edge register, which loses no information.
- **Constant columns removed (§4).** In any register table, a short, uncited column that has the
  same value on every row is removed and stated once in the first column header.
- **Trend words match the data (§5).** Direction words are computed from the plotted points against
  a threshold: 5% of the series mean, or 3 points for a percentage series. Below that the headline
  says "holds broadly steady". An approximate figure keeps its `~` on the canvas, and a test pins it.

**Story validators (reject a candidate and feed the existing editorial loop)**

- Title: at most 72 characters, one clause, no semicolon, no citation codes.
- Scope note: at most 110 characters, never starts "This page", no citation codes, never repeated
  on another page.
- No two pages share a takeaway label and sentence; a takeaway may not repeat a row of its own
  table.
- The decision is restated at most once after the opening (on next steps).
- The decision page holds at most three rows once grouped by state.

**Instructions that contradicted the reviewer**

- The story contract told the writer to keep workflow branches in a table rather than drop one to
  fit a diagram, and the proof harness's editorial pass said the same. Both now ask for a flow
  exhibit in which a branch is one extra edge, rendered as the exception path. This is the same class
  of defect as the stacked base change: an instruction that produced the finding the reviewer kept
  marking down.
- The contract states the title, scope-note, Source-column and decision-row rules. Each one is
  backed by a validator rather than relying on the prompt alone.

## Layer Impact

Release lane: `experimental`.

- **Layers 1-3:** unchanged.
- **Layer 4:** purpose-export page planning, the PPTX renderer, the story contract and its
  validators, and the offline proof harness prompt. No data, read model, flag or enrollment change.

## Client Applicability

- No client receives this. Purpose exports remain behind an empty enrollment.
- Feature flag: `moves_purpose_page_design_v1`, unchanged and empty.

## Changes Included

- `purpose-page-plan.ts` — trend threshold, chart headline, client labels and grouping, row tones,
  constant-column removal, Source column and footer hoist, flow reading with exception path, limits.
- `purpose-page-renderer.ts` — status colour from row tones; exception-path line under a flow.
- `purpose-story-contract.ts` — validators and instruction edits listed above.
- `scripts/deliverables/proof/purpose-fresh-source.ts` — the editorial-pass workflow instruction.
- `__tests__/purpose-r5-page-craft.test.ts` (new) — 53 cases across rules 1-6.
- Updated pinned tests in `purpose-page-plan`, `purpose-page-renderer` and
  `quality-validator-hardening`. Each one had pinned a defect this change removes: slash labels, a
  code after every cell, a constant handoff column, or a "This page" scope note.

## QA / Validation

- PASS the new suite, 53 of 53.
- PASS orchestrator suites: 78 suites, 1,285 tests.
- PASS all deliverables suites: 156 suites, 2,240 tests.
- PASS `npm run typecheck`; ESLint clean on the changed files.
- PASS coverage census check; the census is unchanged.
- **Mutation-tested 19 ways, all killed.** These include: removing the trend threshold, restoring
  the semicolon join, restoring slash labels, grouping every family instead of the decision page
  only, raising the decision-row cap, keeping a shared source in the cells, keeping distinct handoff
  labels in a flow, accepting an over-long exception path, and dropping the shared source from the
  footer.
- **Offline replay of the saved round-4 P2 candidates** (no model calls; chart pages skipped
  because they need source-bound series):
  - No codes remain inside table cells. Every cited register now has a `Source` column or a footer
    attribution.
  - The new validators reject both candidates as they stand. Agent Assist P2: 9 over-long titles,
    3 two-clause titles, 10 over-long scope notes, 9 "This page" scope notes. Denials P2: 10, 2, 8
    and 4 of the same, plus 3 scope notes carrying codes. These are the reviewer's findings, now
    caught before review.
  - P1 charters are not affected by the deck rules.
- NOT RUN: fresh generation and independent review. No model key was available where this change
  was made, so the effect on the acceptance score is unmeasured. The round-4 workflow pages were
  written as tables, so the flow rule takes effect only after regeneration under the corrected
  instruction.

## Rollout Plan

Merge the stacked base into the calibration draft branch, then this change. Regenerate all four
outputs through the offline proof harness and re-score. Nothing is enrolled.

## Deployment Authority

- Repo-owned deploy workflow: not involved.
- Shared runtime mutators: none.
- ACA runtime invariant: not affected.
- Live signed-in proof required: no.

## Rollback Plan

Revert the commit. Page planning, rendering and the contract return to the stacked base.

## Audit Evidence

- The 19 mutation results and the replay counts above.
- The reviewer findings that motivated each rule are retained, unedited, in the private review
  package.

## Known Gaps

- **Unmeasured.** Scores require regeneration with a model key.
- Restoring the omitted supported diagnostic findings on one P2 output (rule 6) is content and needs
  regeneration. No code change can supply it.
- Round-5a findings A-D (page fill balance, the missing charter content, measurement-period labels,
  source-register restatement traceability) are not built here.
- The flow block keeps the renderer's existing five-step limit; the brief allows six.
- Decision-page rows beyond three are rejected rather than moved to an appendix automatically. The
  writer must move them.
