# 2026-06-10-source-stage-gate — Source Maestro Stage-Gate (approve-with-gaps) model

## Release ID

`2026-06-10-source-stage-gate`

## Status

`candidate`

## Plain-English Summary

Implements the Source module's core flexibility principle: every sourcing stage gate
exposes (1) the full recommended standard, (2) a minimum-viable gate, and (3) a Maestro/
Admin override path. Gaps are allowed and proceeding-with-gaps is supported — but gaps,
risks, and downstream impacts are always shown and carried forward, deliverables advanced
over gaps are labelled preliminary (never final/issue-ready), and an override past gaps
requires a rationale. The product never fakes completeness.

## Layer Impact

- `global-control-lane`: new pure library `src/lib/source/stage-gate/` (no DB/infra). The
  AMS 12-stage gate playbook, the assessment resolver, the Maestro decision engine, and
  Nexus/Sentinel gate guidance. Not yet wired to a runtime surface.

## Client Applicability

- All clients (when wired): the stage-gate model is archetype-driven; AMS is seeded.

## Changes Included

- `src/lib/source/stage-gate/types.ts` — gate model, gate statuses, Maestro decision +
  approval-record types.
- `gate-resolver.ts` — `assessStageGate` (recommended standard / minimum-viable / gaps /
  risks / downstream impacts / honest gate status / recommended decision).
- `maestro-override.ts` — `applyMaestroDecision` (hard rules: rationale required on gaps;
  never final with gaps; gaps/risks carried forward; builds the ApprovalRecord).
- `ams-stage-gates.ts` — the 12 AMS sourcing stages with recommended + minimum-viable
  requirement sets and downstream impacts.
- `gate-guidance.ts` — `buildGateGuidance` senior-advisor language.
- 11 unit tests.

## QA / Validation

- `jest src/lib/source/stage-gate` → 11/11 pass (3-level assessment; ready / ready_with_gaps
  / blocked; override rationale enforcement; never-final-with-gaps; gap carry-forward;
  approval record; gate guidance verdicts).
- `tsc --noEmit` clean (scoped) · `eslint` clean · `release:check` pass · `audit:architecture-rules` 0 violations.

## Rollout Plan

Squash-merge to main → ships on the next web image roll. Pure library; no migration. Becomes
user-visible when the Source readiness UI surfaces the gate assessment + Maestro actions and
the approval record is persisted to the File Cabinet (follow-up).

## Rollback Plan

Revert the PR. Pure library; nothing imports it at runtime yet.

## Known Gaps

- Not yet wired to a surface: the gate assessment needs a completion-state feeder (from
  evidence readiness + uploads + sessions + reviews) and a UI with Maestro actions; the
  ApprovalRecord should persist as a File Cabinet approval artifact (depends on #3390).
- Only AMS stages are seeded; other archetypes extend `ams-stage-gates.ts` pattern.

## Audit Evidence

Tests in `__tests__/stage-gate.test.ts`; this record.
