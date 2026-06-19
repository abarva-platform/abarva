# 2026-06-19-move-decision-model — Transformation PR1: MoveDecisionModel (the convergence keystone)

## Release ID

`2026-06-19-move-decision-model`

## Status

`candidate`

## Plain-English Summary

First implementation PR of the Deliverable System Transformation (per
`docs/build/DELIVERABLE_SYSTEM_CURRENT_STATE_ASSESSMENT.md` and the reconciliation note). Adds the
**`MoveDecisionModel`** — the single source of truth a Move's deliverables will be authored from
(spec §4). It is the convergence point that retires AbarVa's "two of everything" duplication:

- it **references** the orchestrator's existing `GovernedEvidenceItem` (one evidence identity, not a
  fork) — every claim/risk cites into the shared bundle;
- it has a typed **`ValueModel.estimateTwice`** seam shaped to receive the Workforce Economics
  WE-2 estimation-engine output with no reshaping (so WE binds here, not by patching a generator);
- it is the object the future Story Director / Visual Director / authors / quality gate consume.

This PR is **additive and inert**: a typed contract + a deterministic assembler/validator + tests.
No live generation path changes yet (wiring comes in later transformation PRs).

## Layer Impact

- **`global-control-lane`** — new shared library `src/lib/deliverables/decision-model/**`. No
  schema, no migration, no route, no runtime behavior change.

## Client Applicability

- All clients: **Yes** (shared engine foundation), but inert until wired. No feature flag, no
  client-specific behavior. Specific clients: No. Internal only: No. Public/demo only: No.

## Changes Included

- `src/lib/deliverables/decision-model/types.ts` — `MoveDecisionModel` + sub-types (governing
  decision, answer-first recommendation, claims with supporting/contradicting evidence, risks,
  dependencies, open questions, architecture/operating/value models, required decisions,
  `EstimateTwice` WE seam, validation-issue codes).
- `src/lib/deliverables/decision-model/build-decision-model.ts` — `assembleMoveDecisionModel`
  (deterministic, no LLM), `validateMoveDecisionModel` (structural integrity), `valueModelFromEstimate`
  (the WE convergence helper).
- `src/lib/deliverables/decision-model/__tests__/build-decision-model.test.ts` — 8 tests.

## QA / Validation

- **PASS** — `jest` decision-model suite: 8/8 (assembly, WE-estimate binding into
  `ValueModel.estimateTwice`, and integrity checks: claim-cites-unknown-evidence,
  recommended-option-missing, decision-without-options, and the estimate-twice promise that
  AI-native is cheaper and not slower).
- **PASS** — `tsc --noEmit` clean on the new files; `eslint` clean.
- **NOT-RUN (by design)** — no live/ACA path: the module is not yet wired into the orchestrator.

## Rollout Plan

Merge to `main` → `aca-main-deploy`. No runtime effect (nothing imports it yet). Later PRs wire the
Intelligence pass (populate the draft), the Story/Visual Directors (consume it), and the gate.

## Rollback Plan

Revert the PR. Zero impact — no caller depends on the module.

## Audit Evidence

- PR URL (added on open); CI run; the 8-test suite is the behavioral evidence.

## Known Gaps

- The model is built today from a hand-authored `DecisionModelDraft`; the LLM Intelligence pass that
  produces the draft from evidence is a later PR.
- `ArchitectureModel` / `OperatingModel` are intentionally lightweight in PR1 — enough to drive the
  existing expert-kernel exhibits later; they may gain fields when the Visual Director lands.
