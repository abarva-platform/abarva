# 2026-07-05-moves-p3p5-capture-contracts — Phase-specific capture contracts for P3/P4/P5

## Release ID

`2026-07-05-moves-p3p5-capture-contracts`

## Status

`candidate` — verified live on a Move at P3+ before merge.

## Plain-English Summary

P3, P4, and P5 were falling through to a **generic** 4-section capture binder
(`phase_decisions / evidence_used / open_questions / approval_rationale`), while
P0–P2 had rich phase-specific contracts. Since deliverable quality is only as good
as the captured facts (the capture is folded into the generation context), a
generic capture at P3–P5 produced thin, off-target work.

This authors **phase-specific 7-section contracts** for each, mirroring P2's depth:

- **P3 — Compose:** solution approach & options · operating model & work split ·
  process/workflow design · controls & AI governance · architecture & integration ·
  evidence confidence · recommended approach.
- **P4 — Commit:** roadmap & sequencing · estimates & capacity · value plan &
  business case · risks & dependencies · funding ask & governance · Source/Tower
  handoff · recommendation to fund.
- **P5 — Mobilize:** mobilization plan & RACI · launch readiness · value-proof
  rules & metrics · first 90 days · governance & Tower cadence · open risks &
  client-to-complete · recommendation to launch.

The workspace derives its capture cards from `getPhaseCaptureSections`, so P3–P5
now show these sections automatically, and the existing capture→context binding
folds them into deliverable generation. Phase 6+ still uses the generic binder.

## Layer Impact

- `global-control-lane`: the shared phase-capture contract
  (`getPhaseCaptureSections`) for all clients. Additive — adds P3/P4/P5 contracts;
  P0–P2 and phase 6+ unchanged. The capture cards + `program_modules` keys derive
  from this, so the change flows to the workspace with no UI edits.

## Client Applicability

- All clients: yes — every tenant running Moves through P3–P5.
- Specific clients: n/a
- Internal only: no
- Public/demo only: no
- Feature flag: none.

## Changes Included

- `src/lib/programs/phase-capture-contract.ts` — `P3/P4/P5_CAPTURE_SECTIONS` and
  `getPhaseCaptureSections` routing for phases 3–5.
- `src/lib/programs/__tests__/phase-capture-workspace-alignment.test.ts` — updated:
  P3–P5 have phase-specific 7-section contracts ending in a recommendation; phase
  6+ still generic.

## QA / Validation

Overall status: **static PASS; live verification before merge.**

- `jest` phase-capture suites → **PASS** (12/12). `tsc` + `eslint` clean.
- Live proof before merge: a Move at P3 shows the P3 capture cards
  (solution approach, operating model, …) instead of the generic four.

## Rollout Plan

Merge to `main` → ACA "main deploy" → re-verify live. No migration, no flag.
Existing Moves that already captured generic P3–P5 sections keep those saved
values; new captures use the phase-specific cards. (No data migration needed —
generic keys simply won't be re-shown; operators fill the new sections.)

## Deployment Authority

- Repo-owned deploy workflow: "ACA main deploy".
- Shared runtime mutators: none — a pure contract/read function.
- Live signed-in proof required: yes — P3 shows phase-specific cards.

## Rollback Plan

Revert the PR. Additive; reverting restores the generic binder for P3–P5. Saved
capture values persist regardless.

## Audit Evidence

- PR URL: (added on open)
- CI: jest + tsc + eslint clean.

## Known Gaps

- The capture→context binding promotes a few P2-shaped keys (baseline_metrics,
  gaps_root_causes) to structured fields; P3–P5 sections fold into `currentState`
  generically (still bound, just not individually promoted). Phase-specific
  structured promotion is a follow-up.
- Section wording is a first authored pass; founder refinement welcome.
