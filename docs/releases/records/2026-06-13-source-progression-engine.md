# 2026-06-13-source-progression-engine — Source stage progression engine (Slice A)

## Release ID

`2026-06-13-source-progression-engine`

## Status

`candidate`

## Release Lane

`global-control-lane`

## Plain-English Summary

Adds the "ease of progression" engine for Source sourcing events: a pure function,
`computeStageProgression`, that reads the live state of a stage (gate criteria, evidence readiness,
artifact drafts) against the canonical specs and returns the **ordered list of one-click actions** a
user needs to advance — Upload (missing/stale evidence), Generate (AI-authorable deliverable),
Prepare (deliverable not yet auto-authorable), Approve (drafted deliverable awaiting a named human,
which clears a gate), Send (vendor communication ready to issue), and — when every required gate is
clear — a single Advance. This is Slice A of the Source progression build; it is the decision spine
for "always one obvious next move."

It is **additive and pure**: it does not fetch, mutate, render, or change any existing route,
component, or the existing `resolveStageNextMove` single-action card. No surface consumes it yet
(that is a later, flag-gated slice), so there is no user-visible change.

## Layer Impact

- `global-control-lane`: Adds `src/lib/source/stage-progression.ts` (pure engine) and its unit tests.
  No schema, route, API-contract, or UI change. No new runtime dependency.

## Client Applicability

- All clients: no behaviour change (nothing renders the engine yet).
- Specific clients: none enabled.
- Feature flag: surfacing will be gated behind `workspace_explorer_source` in a later slice.

## Changes Included

- `computeStageProgression(input)` → `StageProgressionView { needs[], primary, gateSummary, allClear, … }`.
- Derivations: required + recommended evidence vs the readiness ramp (Stale/Low-Confidence → Refresh);
  required/gate-defining deliverables (and any artifact linked to an open required gate) → Generate or
  Prepare by AI-authorable set; drafted-but-unapproved deliverables → Approve; staged vendor comms →
  Send (marked blocked pending slice D); all-required-gates-clear → single Advance.
- Mirrors `stage-next-move.ts` semantics (`gateIsClear`, `artifactIsDrafted`) so the two stay consistent.

## QA / Validation

- PASS: `npx jest --runInBand --runTestsByPath src/lib/source/__tests__/stage-progression.test.ts` — 6/6
  (empty stage → uploads + generate/prepare; drafted → approve; all-met → single Advance + nextStage;
  stale → Refresh; RFP drafted → blocked vendor Send; recommended evidence sorts last).
- PASS: `npx eslint src/lib/source/stage-progression.ts src/lib/source/__tests__/stage-progression.test.ts`.
- PASS: `npx tsc --noEmit` — no type errors referencing the new module.

## Rollout Plan

Merge through PR + CI. No deploy step required for behaviour (nothing renders it). Ships ahead of the
surfacing slice so the engine can be reviewed/tested in isolation.

## Rollback Plan

Revert the PR. Pure addition — no data, schema, or contract to unwind.

## Audit Evidence

PR diff (one pure module + unit tests + this record), the PR CI checks, and the jest/eslint/tsc output
in QA / Validation above. No data-plane writes, no migration, no external egress — nothing to audit
beyond the source diff and test results.

## Known Gaps

- Not yet surfaced in any UI (Next-Move card / Workspace) — that is the next, flag-gated slice (F).
- `Prepare` and `Send` needs are intentionally marked `blocked` until the authoring expansion (slice C)
  and vendor-send wiring (slice D) land; the engine names them so progression is complete, but the
  actions are not yet executable.
- Per the truth standard: no live ACA / private-DB state-level proof in this slice (pure logic only).
