# 2026-07-24-home-knowledge-v4-graph-visual-contamination — fix the prompt/schema mismatch and detect chart/graph field contamination

## Release ID

`2026-07-24-home-knowledge-v4-graph-visual-contamination`

## Status

`candidate`

## Plain-English Summary

Diagnoses and addresses the one defect the live skyharbor-air canary (execution
`job-abarva-private-operator-eus-uyqx3o4`) proved does **not** hold: a `primary_visual` correctly
set to `visual_type: relationship_graph` still carried chart fields (`data_points`, `encoding`,
`annotation`) instead of graph fields (`projection_type`, `node_groups`, `edge_meaning`,
`layout_hint`, `visual_emphasis`).

### Root cause, found in the prompt text itself

The prompt's graph instruction said *"Every relationship **graph_display_contract** must
include..."* — a field name that does not exist in the current schema. `primary_visual` is typed
directly with `visual_type: relationship_graph` (established by the visual-tool-schema PR); there
is no separate nested `graph_display_contract` object to satisfy. The model had nothing concrete
to attach that instruction to.

Meanwhile, three **unconditional** instructions applied to primary_visual regardless of type:
*"Every rendered visual object ... must include [chart fields]"*, *"For every visual encoding,
provide..."*, *"For every visual data_points, provide..."*. Those three lines, repeated and
concrete, versus one stale line naming a field that doesn't exist — the model followed the
instructions it could actually act on.

### The fix

1. **Prompt**: both the global system prompt and the local dimension-writer instruction block now
   name `primary_visual` directly (not `graph_display_contract`), state explicit chart-vs-graph
   field lists in both directions, and add "must NOT include" exclusions in both directions —
   parity of emphasis, not one line competing against three.

2. **Validator**: a new `visual_contract_wrong_branch_field` check catches contamination
   directly, independent of whether the prompt fix holds. It does **not** derive "foreign fields"
   by diffing the two required-field lists — an early version of this check did that and produced
   false positives on `title`/`executive_question`, which are legitimate on both branches and only
   happen to be *required* on one list. Fixed to use an explicit, curated exclusion pair
   (`chartOnlyVisualFields` / `graphOnlyVisualFields`) naming only the genuinely branch-exclusive
   data-binding fields.

### Verified against the real canary artifact, not a fresh generation

Replayed offline against the stored skyharbor-air candidate from the live canary run — the exact
JSON that shipped the defect:

| Stage | Findings | What changed |
|---|---:|---|
| As generated | 43 | Baseline |
| + validator-scope fix (#5540) | 8 | Removed 35 false `missing_expanded_dimension` |
| + wrong-branch-field check, first attempt | 12 (with false positives) | New check fired, but flagged `title`/`executive_question` incorrectly |
| + curated exclusion list (this fix) | **12, no false positives** | 4 genuine contamination findings, correctly scoped |

The remaining 12 findings are exactly the real defect: 5 missing graph fields, 4 wrong-branch
chart fields present, 3 unrelated coherence-review findings.

**This fix has not been proven to eliminate the defect at generation time** — it corrects what the
model is told and adds a detector, but only a fresh canary run against the new prompt will show
whether the corrected instruction actually changes model behavior, or whether `strict: true` is
still required. Say so plainly rather than claim the underlying defect is closed.

## Layer Impact

- `global-control-lane`: prompt text and validator logic in one operator script. No schema
  migration, no runtime path, no writes.

## Client Applicability

- Internal only: operator tooling for the Home V4 candidate pipeline.
- Feature flag: None.

## Changes Included

- `scripts/knowledge/build-home-knowledge-v4-review-pack.mjs`
  - System prompt: chart-field and graph-field instructions now name `primary_visual` directly,
    state both required and excluded fields per branch.
  - Local dimension-writer instruction block: same correction.
  - `chartOnlyVisualFields` / `graphOnlyVisualFields` — curated exclusion lists.
  - `validateClosedEnums`: new `visual_contract_wrong_branch_field` check.

## QA / Validation

- `pass` — `node --check` clean; `npx eslint` exit 0.
- `pass` — Replayed against the real skyharbor-air canary candidate (not a fresh generation):
  43 → 12 findings combined with the prior validator-scope fix, all 12 genuine.
- `pass` — Regression check: the curated exclusion list does not flag `title`, `executive_question`,
  `classification`, or `empty_state` on either branch (confirmed by their absence from the
  finding list after the correction, where the derived-difference version had flagged them).
- `n/a` — No migration, no runtime change, no database writes, no generation run.

## Rollout Plan

Merge + deploy. **Next step is a second canary run** on the same tenant/dimensions
(skyharbor-air, `apps,risks,rel`) to determine whether the corrected prompt actually changes
model output, or whether `strict: true` (a materially larger change — `additionalProperties: false`
plus full typing of `client_visible` throughout) is required. Do not treat this fix as closing the
defect until that run confirms it.

## Deployment Authority

- Repo-owned deploy workflow: Azure Container Apps main deploy after merge.
- Shared runtime mutators: none — operator script only.
- Migration application: none.
- Feature/env flag update path: none.
- Live signed-in proof required: no runtime-visible change.

## Rollback Plan

Revert the PR. Restores the stale `graph_display_contract` prompt language and removes the
wrong-branch-field validator check — the underlying schema-typing (from the earlier PR) still
catches missing fields, just not misplaced ones.

## Audit Evidence

- Full replay breakdown at each stage, run against the actual stored candidate from execution
  `job-abarva-private-operator-eus-uyqx3o4`.
- Live JSON excerpt showing the contaminated `dimensions[2].primary_visual` object.

## Known Gaps

- **Not proven to fix generation behavior.** Only a second canary run can confirm the prompt
  correction changes model output; this PR alone only fixes what is asked for and what is
  detected.
- `strict: true` remains the stronger, unshipped option — deliberately deferred given its larger
  blast radius (requires typing all of `client_visible`, not just `primary_visual`).
- The wrong-branch-field check only covers `primary_visual`-family visual objects reached by the
  existing `looksVisual` walk; it does not add new coverage to `dashboard_visuals`,
  `benchmark_exhibits`, or `priority_matrix_visual` beyond what that walk already reaches.
