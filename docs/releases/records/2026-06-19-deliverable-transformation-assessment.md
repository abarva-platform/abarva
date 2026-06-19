# 2026-06-19-deliverable-transformation-assessment — Deliverable transformation: current-state assessment + workstream reconciliation

## Release ID

`2026-06-19-deliverable-transformation-assessment`

## Status

`candidate`

## Plain-English Summary

Planning artifacts only (no code, no schema, no runtime change) for the Deliverable System
Transformation (turn the deliverable engine from "document generation" into "decision
storytelling"). Adds the spec-mandated **Current State Assessment** (maps all 9 subsystems
against the board-grade bar) and a **Workstream Reconciliation** note that converges the three
overlapping in-flight workstreams — Deliverable Transformation, Workforce Economics, and First
Capital Intelligence — onto a single `MoveDecisionModel` so they stop deepening the "two of
everything" duplication (two deliverable stacks / two Tower substrates / two business-case paths).

Also lightly amends the two existing codex briefs: the Workforce Economics brief (WE-3/4/5
re-framed to converge via `MoveDecisionModel` + the existing economic exhibits rather than a
second generator; WE-1 drift made impossible by emitting a constants JSON from the Python builder)
and the First Capital Intelligence brief (flags a baseline fact-count discrepancy to reconcile
before P3; adds a Tower-projection MV column-contract test).

## Layer Impact

- **`global-control-lane`** — shared planning/architecture docs that govern future shared
  deliverable-engine work. No runtime, schema, or data-plane change in this PR.

## Client Applicability

- All clients: **Yes** (documentation governing shared engine direction). No client-specific
  behavior changes. Specific clients: No. Internal only: No. Public/demo only: No. Feature flag:
  None.

## Changes Included

- `docs/build/DELIVERABLE_SYSTEM_CURRENT_STATE_ASSESSMENT.md` — new; 9-subsystem assessment.
- `docs/build/DELIVERABLE_TRANSFORMATION_RECONCILIATION.md` — new; converges the three workstreams.
- `docs/codex-handoff/WORKFORCE_ECONOMICS_MOVES_BINDING_BRIEF.md` — amended (reconcile banner +
  WE-1 constants-JSON discipline).
- `docs/codex-handoff/FIRST_CAPITAL_INTELLIGENCE_SUBSTRATE_BRIEF.md` — amended (baseline
  fact-count reconcile flag + Tower-projection column-contract test).

## QA / Validation

- **PASS** — docs-only; `release:check` run locally. No code/tests affected.
- **NOT-RUN** — no runtime/typecheck impact (no source files changed).

## Rollout Plan

Merge to `main`. No deploy effect (documentation). Subsequent implementation PRs (starting with
`MoveDecisionModel`) reference these documents.

## Rollback Plan

Revert the PR. No runtime or data impact.

## Audit Evidence

- PR URL (added on open); the assessment + reconciliation docs are the artifacts; grounded in a
  read-only architecture map of the orchestrator + expert-kernel stacks (file:line refs inline).

## Known Gaps

- The assessment recommends (not yet implemented) reusing the expert-kernel `svg-*` + CXO
  excellence framework via a shared module; that extraction is a later PR.
- The First Capital baseline fact-count (192 vs 4,484) is flagged for reconciliation, not yet
  resolved — it requires a live `SELECT count(*)` before P3 runs.
