# PROG10 - Program Flagship Page Shell

Slice ID: PROG10
Slice name: Program Flagship Page Shell
Status: code_complete
Authored: 2026-04-26
Wave: Wave 17 — Program Flagship Experience (manifest waveId: wave-18)
Primary agent: Nexus (anchor agent for Programs)
Depends on: PROG7, PROG8, PROG9, DES1

## Purpose

PROG10 introduces the flagship Program detail experience as the
reference example of AbarVa's full operating surface. It composes the
existing program primitives (canonical detail, artifact canvas, workshop
mode, evidence trace, phase gate) via slot props, and adds a calm
executive program brief, workflow orientation strip, and a
"what AbarVa knows / what's missing" two-column panel.

## What Changed

- New view-model `src/lib/programs/program-flagship-view.ts` —
  deterministic `buildProgramFlagshipView` that returns the page
  question, anchor agent (`nexus`), executive brief, knows/missing
  rows, recommended next action, and a no-fabrication caveat.
- New shell `src/components/programs/ProgramFlagshipPage.tsx` —
  client component with a single selective dark-navy executive panel,
  workflow orientation strip, knows/missing two-column, and four
  slot props (`phaseGateSlot`, `workshopCanvasSlot`,
  `deliverablesEvidenceSlot`, `actionMissionStripSlot`) reserved for
  PROG11–14.
- New tests `src/__tests__/integration/programs/program-flagship-page.test.ts`
  — 15 deterministic source/type tests; no jsdom.

## Out of Scope

- No persistence, no DB writes, no live program telemetry.
- No model invocations, no clocks, no randomness.
- ProgramCanonicalDetail, ProgramArtifactCanvas, and
  ProgramWorkshopMode are NOT modified.
