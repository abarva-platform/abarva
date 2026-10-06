# 2026-10-03-moves-phase-top-stepper — Moves phase: horizontal top stepper

## Release ID

`2026-10-03-moves-phase-top-stepper`

## Status

`candidate`

## Plain-English Summary

Moves showed the phase journey (Originate → Charter → Discover → Design →
Roadmap → Mobilize) as a tall vertical list down the left side of the screen,
alongside the workspace navigation. It read as two stacked nav columns and did
not match the clean "steps across the top" pattern used by the Source new-event
workflow.

This change moves the six phases into a horizontal stepper across the top of the
phase workspace — numbered P0–P5, with done / in-progress / upcoming state, the
phase you are viewing underlined, each reachable phase a link to its route and
future phases disabled until the Move reaches them. The left column keeps the
Move header and the workspace navigation (Stage workspace, Files, Intelligence,
Approvals, …) and still collapses; it is now labelled as the workspace rail
rather than the phase rail, since phases moved to the top.

Navigation behavior is unchanged — same routes, same reachability rule, same
collapse feature on the remaining rail. This is a layout/affordance change.

## Layer Impact

Release lane: `global-control-lane` — shared app/control-plane behavior for all
clients, not feature-gated.

- `4 PRODUCTS` (Moves): presentation/layout only. No change to layer 1–3 intake,
  adapters, or the canonical model, and none to capture, gates, or artifacts.

## Client Applicability

- All clients: Yes — shared Moves phase UI, no feature flag.
- Specific clients: n/a
- Internal only: No
- Public/demo only: No
- Feature flag: None

## Changes Included

- `src/components/strategic-moves/MovesPhaseStandaloneClient.tsx`
  - New `MovePhaseTopStepper` (horizontal phase tabs, same state logic the old
    `mxw-phase-list` used), rendered at the top of `.mxw-shell`.
  - Removed the vertical `mxw-phase-list` and its "Phases" label from the left
    rail; relabelled the rail "Move workspace" and its toggle "Collapse/Expand
    workspace rail".
  - Added `.mxw-phase-stepper*` styles (existing tokens: `--green`, navy, blue
    tints; no new palette).
- `src/components/strategic-moves/__tests__/MovesPhaseStandaloneClient.test.tsx`
  - Added a stepper test (reached phases are links, viewed phase is current,
    future phases disabled); updated the rail collapse suite for the workspace
    rail and repurposed the phase-link test to the top stepper.

## QA / Validation

- `npx jest src/components/strategic-moves/__tests__/MovesPhaseStandaloneClient.test.tsx`
  — 100/100 pass.
- `npx eslint` on both changed files — 0 errors (2 pre-existing unused-var
  warnings, unrelated).
- `npx tsc --noEmit` — no type errors in the changed file.
- Visual: NOT verified locally — a signed-in, data-backed Moves phase page can
  not be rendered off the private data plane from a dev box. The layout is owed
  a live signed-in walk at deploy time (see Deployment Authority).

## Rollout Plan

Merge to `main` via squash PR. No migration, no data-plane change, no flag.
Ships with the next ACA web image via the repo-owned `aca-main-deploy` workflow;
does not itself mutate shared runtime.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: none in this change
- Approved image digest: set by the main deploy workflow at build time
- ACA runtime invariant: unchanged by this PR; proven at deploy time
- Worker image invariant: n/a
- Feature/env flag update path: none
- Live signed-in proof required: Yes — a signed-in walk of a Move confirming the
  top stepper renders, marks the viewed phase current, links reachable phases,
  disables future ones, and that the workspace rail still collapses. Captured at
  deploy time; this record does not claim it.

## Rollback Plan

Revert the PR. Pure UI revert; no migration or data rollback.

## Audit Evidence

- PR URL: (added on open)
- CI run: (added on open)
- Local test/lint/type output recorded under QA / Validation.

## Known Gaps

- Visual confirmation is owed at deploy time (above). If the top stepper needs
  spacing/label tuning once seen signed-in, that is a fast follow.
- aVa is not yet relocated to the freed left column (a later slice of the
  Source-pattern adoption).
