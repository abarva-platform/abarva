# 2026-10-03-moves-phase-progressive-step-flow — Moves phase: progressive step flow

## Release ID

`2026-10-03-moves-phase-progressive-step-flow`

## Status

`candidate`

## Plain-English Summary

The Moves phase workspace (the P1–P5 "contract steps" screen) was hard to act
on: it showed every input, the workflow substeps, and a "What the next phase
will need" panel all at once, and the only way to move forward was to guess
which item in the left list to click next. Operators told us it was not evident
what they were supposed to do on the screen.

This change makes the screen behave as a guided, one-step-at-a-time flow:

- Each input step now ends with a single clear primary action — a green
  **Continue** button. It is disabled, with the hint "Fill this in to
  continue", until the step's required value is captured and saved; then it
  enables and moves the user to the next step (and, after the last input,
  into the next workflow substep). The user no longer has to discover the
  left-nav order themselves.
- The "What the next phase will need" panel is next-phase *preparation*, which
  only makes sense once the current phase's work is done. It is now hidden on
  every earlier step and surfaces only on the final **Approve & Build** step.

No change to what is captured, how it is saved, what the governed gate
requires, or how artifacts are generated. This is an interaction/affordance
change only. Because the step canvas is a single shared component, the behavior
applies uniformly to P1 through P5; the per-phase workflow bodies (P3–P5) are a
separate follow-up.

## Layer Impact

Release lane: `global-control-lane` — shared app/control-plane behavior for all
clients, not feature-gated.

- `4 PRODUCTS` (Moves): presentation/interaction only. No change to layer 1–3
  intake, adapters, or the canonical model. Capture persistence, gate criteria,
  and artifact generation are untouched.

## Client Applicability

- All clients: Yes — shared Moves phase UI, no feature flag.
- Specific clients: n/a
- Internal only: No
- Public/demo only: No
- Feature flag: None

## Changes Included

- `src/components/strategic-moves/MovesPhaseStandaloneClient.tsx`
  - `PhaseContractStepsCanvas`: per-input-step **Continue** action with
    capture-level enable logic (`phaseCaptureStatusForSection`, not the
    phase-gate display status) and step advance; "Coming up" panel gated to
    the Approve & Build substep.
  - Added `.mxw-contract-advance` / `.mxw-contract-continue` styles, using the
    existing `--green` token (no new palette).
- `src/components/strategic-moves/__tests__/MovesPhaseStandaloneClient.test.tsx`
  - Rewrote the "Coming up" default-open test to assert it appears on the
    Approve & Build step; added a test that it is hidden on earlier steps; added
    a test for the Continue button's disabled→enabled→advance behavior.

## QA / Validation

- `npx jest src/components/strategic-moves/__tests__/MovesPhaseStandaloneClient.test.tsx`
  — 100/100 pass.
- `npx eslint` on both changed files — 0 errors (2 pre-existing unused-var
  warnings, unrelated to this change).
- `npx tsc --noEmit` — no type errors in the changed file.

## Rollout Plan

Merge to `main` via squash PR. No migration, no data-plane change, no flag. The
change ships with the next ACA web image build/deploy through the repo-owned
`aca-main-deploy` workflow; it does not itself mutate shared runtime.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: none in this change
- Approved image digest: set by the main deploy workflow at build time
- ACA runtime invariant: unchanged by this PR; proven at deploy time
- Worker image invariant: n/a
- Feature/env flag update path: none
- Live signed-in proof required: Yes — signed-in walk of a Move's P1 phase
  confirming the Continue flow and that "Coming up" appears only on Approve &
  Build. Captured at deploy time, not claimed by this record.

## Rollback Plan

Revert the PR. Pure UI revert; no migration or data rollback involved.

## Audit Evidence

- PR URL: (added on open)
- CI run: (added on open)
- Local test/lint/type output recorded under QA / Validation above.

## Known Gaps

- The per-phase workflow bodies for P3 Design Future State, P4 Roadmap &
  Business Case, and P5 Mobilize & Handoff are not reworked here — they are the
  subject of a separate follow-up applying the same single-next-action and
  progressive-disclosure principles.
- Live signed-in proof is owed at deploy time (see Deployment Authority).
