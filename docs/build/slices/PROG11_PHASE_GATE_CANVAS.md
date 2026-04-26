# PROG11 · Phase Journey + Approval Gate Canvas

**Status:** code_complete
**Wave:** wave-18
**Branch:** wave18/prog11-phase-gate-canvas
**Created:** 2026-04-26

## What was built

- `src/lib/programs/phase-gate-canvas-view.ts` — pure deterministic view-model
  exposing `buildPhaseGateCanvasView()`. Returns the 6 canonical AbarVa program
  phases (Discovery → Synthesis → Design → Build → Activate → Operate), the
  per-phase status (`not-started` / `in-progress` / `gate-pending` / `complete`),
  and the current gate's label, status, owner, requirements (4 items),
  missing inputs, Steward implication, approval caveat, and next action.
- `src/components/programs/PhaseGateCanvas.tsx` — `'use client'` React component
  that renders the canvas in three sections: (A) horizontal phase rail with
  status-coloured pills; (B) current gate card with requirements list, missing
  inputs, Steward implication, and approval caveat; (C) Next action callout.
- `src/__tests__/integration/programs/phase-gate-canvas.test.ts` — 14 tests
  covering shape, ordering, enum bounds, caveat text, and component source
  invariants (no teal, navy present).

## Test coverage

14 deterministic tests (no jsdom, no React rendering). Source-level scans
ensure banned teal tokens (`#14B8A6`, `#0E9F8C`) are absent and the AbarVa
navy accent `#1B2B5C` is present.

## Honest constraints

- Read-only and deterministic. No live program-state ingestion.
- No phase transitions are performed. No gate signoffs, no waivers, no
  approvals, no DB writes, no model calls.
- The current gate state machine is informational only; the
  `approvalCaveat` and module-level `caveat` make this explicit.
- Visual canon: surface `#FBFAF7`, card `#FFFFFF`, border `#E8E6E1`,
  ink `#0A0C12`, body `#1F2433`, muted `#525866`, accent navy `#1B2B5C`.
  No teal/green/purple/neon. Text glyphs (`✓`, `•`, `→`) only — no icon
  libraries.
