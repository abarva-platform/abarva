# 2026-10-08-moves-capture-two-column-grid — Moves capture step as a two-column grid

## Release ID

`2026-10-08-moves-capture-two-column-grid`

## Status

`candidate`

## Plain-English Summary

The Moves phase-capture workspace (the v2 capture shell) laid every question out in a
single full-width column, so a step with several short questions read as one long, flat
stack of blocks — hardest to scan in the later phases, which have the most questions.

This change lays the questions out as a calm two-column grid: short free-text questions
pair up two-per-row, while a structured editor (a facts/estimate table or a route-card
chooser) spans the full width so a table still reads as a table. The panel also gains a
small phase · step eyebrow ("P2 · STEP 3 OF 3") so a reader always knows where they are
in the flow. On a phone the grid collapses back to a single column.

A host can widen one specific plain-text question with a new optional `sectionSpan` hint
(for a plain question that carries a wide control, e.g. a route-card question), but the
default needs no host change: structured editors widen themselves.

## Layer Impact

- `global-control-lane` (presentation only): shared Moves capture UI component
  (`MovesCaptureFlow`). No change to any data contract, autosave, gate evaluation,
  evidence handling, or canonical model. The restyle is scoped entirely under the
  `.mcf-v2` class, so the legacy (v1) capture shell is byte-for-byte unchanged.

## Client Applicability

- All clients: No (gated).
- Specific clients: No new identity logic.
- Internal only: No.
- Public/demo only: Effectively yes today — v2 capture is behind the flags below.
- Feature flag: `moves_workspace_v2` / `moves_capture_v2`. Only the v2 capture shell is
  touched; the UI renders the grid only when the v2 shell is active.

## Changes Included

- `src/components/strategic-moves/MovesCaptureFlow.tsx`:
  - New `.mcf-v2`-scoped CSS: a spacing scale (`--mcf-space-1..6`), a two-column
    `.mcf-questions` grid, `.mcf-question.is-wide` full-width span, `.mcf-q-field`
    (min-width:0 so long content wraps instead of widening the column) and
    `.mcf-q-basis` (a divider above the per-field basis control), footer-action wrap,
    and a `max-width:640px` one-column fallback.
  - JSX: each question is wrapped with an `is-wide` class via a new `sectionIsWide`
    predicate, the input is wrapped in `.mcf-q-field`, the optional basis control in
    `.mcf-q-basis`, and a `.mcf-panel-eyebrow` (phase code · step N of M) is rendered
    above the panel title in v2 only.
  - New optional prop `sectionSpan?: (section) => "wide" | "default"` + module-level
    `WIDE_STRUCTURED` set (facts / business-change / solution-route / estimate-model).
- `src/components/strategic-moves/__tests__/MovesCaptureFlowGrid.test.tsx` (new): pins
  the eyebrow (present in v2, absent in v1), structured auto-wide, plain-section
  single-column default, and the `sectionSpan` override in both directions.

## QA / Validation

- `npx eslint` on both changed files — clean.
- `npx tsc --noEmit` — no errors.
- `npx jest src/components/strategic-moves` — 53 suites / 784 tests pass (6 new).
- Static CSS proof harness rendered with the exact extracted rules at desktop (860px)
  and mobile (375px): two-column grid with a full-width structured table at desktop,
  clean single-column with no horizontal scroll at mobile. Screenshots captured.

## Rollout Plan

Merge to main via squash. No runtime rollout step of its own: the component ships with
the next normal web image build/deploy, and renders the grid only when the v2 capture
flag is active for a tenant. No migration, no env/flag change in this PR.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` (unchanged).
- Shared runtime mutators: none.
- Approved image digest: n/a (no runtime image change in this PR).
- ACA runtime invariant: unaffected.
- Worker image invariant: unaffected.
- Feature/env flag update path: none; uses the existing `moves_workspace_v2` /
  `moves_capture_v2` flags.
- Live signed-in proof required: at next deploy, confirm the v2 capture step renders the
  two-column grid for a flag-enabled tenant. Not claimed `live-proven` by this record.

## Rollback Plan

Revert the single component commit. The restyle is purely additive and `.mcf-v2`-scoped;
reverting restores the prior single-column v2 layout with no data or contract impact.

## Audit Evidence

- PR URL: (added on open)
- CI: lint + typecheck + `strategic-moves` jest suite (784 passing).
- Screens: desktop + mobile static-harness renders of the grid.

## Known Gaps

- The P3 "recommendation" route-card question renders in a single column by default. The
  `sectionSpan` hint added here lets the phase host widen it with one line at the
  `MovesCaptureFlow` mount; that host wiring is deliberately deferred to avoid colliding
  with the active P3 workspace changes and will land as a small follow-up.
