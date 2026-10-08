# 2026-10-06-moves-gate-capture-clarity — Explain the gate-vs-capture gap on an already-advanced phase

## Release ID

`2026-10-06-moves-gate-capture-clarity`

## Status

`candidate`

## Plain-English Summary

On a Move phase the workflow has already advanced past, two independent numbers
sit side by side and appear to contradict each other: the phase bar reports the
gate as fully met (for example "3 of 3 gate criteria", with a completion tick),
while the capture strip reports the guided questions as unanswered (for example
"0 of 11 answered") and the step's Continue control is disabled. A reviewer
reasonably reads that as a defect — "it says done, so why is nothing answered
and why can't I continue?".

They are not the same measure. The **gate** is the governed advancement rule; a
phase can satisfy it from existing or migrated origination data (or from
approved evidence) without anyone working the guided capture questions on that
screen. The **capture strip** counts only answers typed into those questions.
So an already-advanced phase can honestly show a met gate and an empty capture
strip at once.

This adds a short, informational band at the top of the capture steps that
names the distinction exactly where the confusion is: it states the gate is
already met with the real criteria counts, explains a gate can be met from
existing/migrated data, and says the capture questions there are now optional
enrichment (answers still save as you go; use the phase bar to move between
phases). It renders only for an already-advanced phase (`state: done`) whose
measured capture is not fully answered. It changes no gate, no save, and no
Continue behavior — it is text only.

## Layer Impact

Release lane: `global-control-lane` — shared Moves capture UI for all
workspaces. No data, schema, gate, or persistence change.

- `4 PRODUCTS` / Moves: the phase capture flow gains an informational band on
  already-advanced phases with incomplete capture.

## Client Applicability

- All workspaces running the redesigned capture flow (`moves_capture_v2` /
  `moves_capture_p0_v1`): additive and informational.
- Workspaces where every advanced phase's capture is fully answered never see
  the band.
- Internal only: No. Public/demo only: No. Feature flag: none of its own — it
  rides the capture-flow flags already in effect for the surface.

## Changes Included

- `src/components/strategic-moves/CaptureGateMetNotice.tsx` — new presentational
  band plus a pure `isGateMetWithCaptureUnfinished(tally, captureRow)` decision
  helper.
- `src/components/strategic-moves/MovesPhaseStandaloneClient.tsx` — computes the
  condition from the viewed phase's gate tally and capture row, and renders the
  band at the top of the capture `openingBand` (alongside the existing capture
  notices).
- `src/components/strategic-moves/__tests__/CaptureGateMetNotice.test.tsx` — new
  tests for the band and the decision helper (each conjunct pinned).

## QA / Validation

- `jest` (new notice suite) — **PASS**: 9/9.
- `jest` (MovesPhaseStandaloneClient + MovesCaptureFlow) — **PASS**: 221/221 and
  the broader capture suites unchanged.
- `tsc --noEmit` — **PASS**: 0 errors.
- `eslint` (changed files) — **PASS**: 0 errors (2 pre-existing unused-import
  warnings unrelated to this change).

## Rollout Plan

Merge to `main` via squash PR. Ships with the next web image via the repo-owned
`aca-main-deploy` workflow. No flag of its own.

## Rollback Plan

Revert the PR. The band disappears; the two numbers render exactly as before.
No data or migration impact.

## Deployment Authority

No ad-hoc Azure action. Ships only via the repo-owned `aca-main-deploy` workflow
on merge to `main`; shifts no shared traffic and touches no Container App
template, revision weight, or secret. The change performs no writes.

## Known Gaps

- The band speaks to an already-advanced phase (`state: done`). A current phase
  whose gate is met by evidence while capture is mid-way is intentionally out
  of scope — its incompleteness is expected and handled by the existing
  per-step notices.
- Host-level rendering is exercised indirectly; the decision rule itself is unit
  tested in isolation.

## Audit Evidence

- CI: `jest`, `tsc`, `eslint`, `npm run release:check`.
