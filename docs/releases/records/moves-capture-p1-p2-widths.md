# 2026-10-08-moves-capture-p1-p2-widths — Per-phase section widths for P1 & P2

## Release ID

`2026-10-08-moves-capture-p1-p2-widths`

## Status

`candidate`

## Plain-English Summary

The v2 capture grid tunes per-section width so each step reads as a clean
rectangle. P3-P5 were reviewed earlier; P1 (Charter) and P2 (Discover) were left
on the universal default, which left a lone half-cell in 4 of their 6 steps — a
3-plain step strands its third question, and a plain question beside a structured
editor sits alone next to the full-width table.

A Claude Design review set the width for every P1/P2 section, applying the same
rule as P3-P5 (full width for tabular/multi-part/long-narrative answers; a wide
section only leads or trails its step). All six P1/P2 steps now resolve to clean
rectangles.

## Layer Impact

- Release lane: `global-control-lane` (presentation only).
- Product projection: adds P1 and P2 entries to the existing width-policy module;
  the capture host already calls `captureSectionSpan` for every phase, so there is
  no host change. No data contract, autosave, gate, or evidence change.

## Client Applicability

- All clients: No (gated).
- Feature flag: `moves_capture_v2` / `moves_workspace_v2`.
- Public/demo only: effectively yes today.

## Changes Included

- `src/lib/programs/moves-capture-section-width.ts`: add the P1 and P2 wide sets
  (P1: success_criteria, evidence_plan, business_change_assessment; P2:
  current_state_findings, baseline_metrics, data_quality_governance,
  solution_route_validation) and update the doc comment (P1-P5 now covered).
- `src/lib/programs/__tests__/moves-capture-section-width.test.ts`: add P1/P2 to
  the verdict table and extend the clean-rectangle invariant from P3-P5 to P1-P5;
  move the "unlisted phase" case to phase 6.
- `docs/architecture/test-ci-coverage-census.json`: refreshed (pre-existing drift
  on main; no new test file added here).

## QA / Validation

- `eslint` clean; **`npm run typecheck`** (full, includes tests) clean.
- `jest` width-policy suite: 23 pass, including the P1-P5 clean-rectangle invariant
  (every one of the 15 P1-P5 steps resolves to a clean rectangle).
- Diff confined to the logical change (pre-existing prettier state on main left as-is).

## Rollout Plan

Merge through protected main; ships with the next web image build. Renders only
under the v2 capture flag. No migration, no env/flag change.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` (unchanged).
- Shared runtime mutators: none.
- ACA / worker image invariants: unaffected.
- Feature/env flag update path: none.
- Live signed-in proof required: after deploy, confirm P1/P2 capture steps render
  the reviewed widths for a flag-enabled tenant. Not `live-proven` by this record.

## Rollback Plan

Revert the commit. Additive map entries only; reverting restores the universal
default for P1/P2 with no data or contract impact.

## Audit Evidence

- PR URL and CI results.
- Width-policy suite (P1-P5 invariant).

## Known Gaps

- The policy keys on the current fixed step order across all of P1-P5; the invariant
  test is the tripwire if any phase's question order changes.
