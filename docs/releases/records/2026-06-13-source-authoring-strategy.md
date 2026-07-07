# 2026-06-13-source-authoring-strategy — Strategy-stage authoring: d02 + d03 (Slice C)

## Release ID

`2026-06-13-source-authoring-strategy`

## Status

`candidate`

## Release Lane

`global-control-lane`

## Plain-English Summary

Adds board-grade, quality-gated AI authoring for the two remaining Strategy-stage deliverables —
**Value Target Brief (d02_value_target)** and **Archetype Decision Record (d03_archetype_decision)** —
so the Strategy stage is now **fully one-click generatable**. Each ships a Sentinel-voice prompt template
(required sections, evidence discipline, no fabrication) and is added to the consulting-grade gate set, so
generation runs the same **author → review → rewrite, minimum 8/10 across 10 dimensions** path as the RFP
package and blocks weak output.

Because generate candidates and the progression panel both derive from `listSupportedGenerationCodes()`,
this automatically flips d02/d03 from **"Prepare" (blocked)** to **"Generate" (one-click)** in the Workspace
"What's needed to advance" panel (Slice F) with no changes there.

## Layer Impact

- `global-control-lane`: Two new entries in the Source prompt registry + two codes added to
  `SOURCE_CONSULTING_GRADE_CODES`. The generate route is unchanged (registry-driven; the gate path is already
  generic). No schema, new route, or runtime dependency.

## Client Applicability

- All clients: no behaviour change unless a user has `canGenerateSourcingArtifacts` and reaches the Workspace
  generate surface; the two codes simply become generatable.
- Specific clients: SkyHarbor — the only tenant with `workspace_explorer_source` enabled, so the only place
  d02/d03 generation is reachable in the UI today.
- Internal only: None.
- Public/demo only: None.
- Feature flag: `workspace_explorer_source` gates the Workspace surface that triggers generation. Like the
  RFP package, d02/d03 require `ANTHROPIC_API_KEY` (503 without it — live ACA has the key).

## Changes Included

- `prompt-registry.ts`: `d02_value_target` (value thesis · levers · range+confidence · assumptions ·
  realization) and `d03_archetype_decision` (candidates · criteria · selection · rigor · implications),
  each binding the upstream strategy memo (d01) when present and flagging it as a gap when absent.
- `quality-review.ts`: `d02_value_target`, `d03_archetype_decision` added to the consulting-grade gate set.

## QA / Validation

- PASS: `npx jest … strategy-authoring.test.ts` — 4/4 (codes registered; both gated; templates carry the
  required sections; user message binds d01 when present, flags the gap when absent).
- PASS: `npx eslint` on changed files · `npx tsc --noEmit` no errors in changed files.

## Rollout Plan

Merge through PR + CI. No deploy step changes behaviour beyond making the two codes generatable. Live
generation proof (do d02/d03 actually clear 8/10 on a real event) runs when the SkyHarbor source event is
originated and walked at the state level.

## Rollback Plan

Revert the PR — removes the two registry entries and the two gate-set codes. No data/schema to unwind.

## Audit Evidence

PR diff (two prompt-registry entries + two gate-set codes + unit tests + this record), the PR CI checks,
and the jest/eslint/tsc output in QA / Validation. Generation egress itself is audited at runtime by the
existing `preflightAnthropicDirectClient` path (ai_egress_audit) when d02/d03 are generated on a live event.

## Known Gaps

- d01 (strategy memo) and d05 (scope memo) remain **single-pass** (pre-existing) — not yet in the
  consulting-grade gate. Gating them is a follow-up so the whole stage is uniformly board-grade.
- Structured-workbook deliverables (d04, d11, d15, d16, d19, d20, d22) are NOT covered here — they need
  structured/xlsx generation, a separate slice; they stay "Prepare" in the panel.
- No live ACA generation proof in this slice (prompts are unit-verified for wiring + structure only).
