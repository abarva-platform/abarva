# PROG12 · Nexus Workshop / Center Canvas

## Purpose

Compose a deterministic, workshop-led briefing surface that sits at the
center of the Program page. PROG12 frames the next workshop — its
objective, agenda, attendees, likely tensions, decisions needed, evidence
to capture, expected outputs — and reserves a calm slot where future
proposed program updates will surface once meeting-notes ingestion is
wired.

## What changed

- Added `src/lib/programs/nexus-workshop-canvas-view.ts` — pure helper
  exporting `buildNexusWorkshopCanvasView()`, the
  `NexusWorkshopCanvasViewModel` type, and supporting interfaces
  (`WorkshopAgendaItem`, `WorkshopAttendeeRow`, `WorkshopTension`,
  `WorkshopDecisionNeeded`, `WorkshopEvidenceToCapture`,
  `WorkshopExpectedOutput`). Hardcodes the canonical Apex Retail · CDP
  Activation Synthesis Workshop briefing (workshop 5 · Synthesis ·
  partial readiness).
- Added `src/components/programs/NexusWorkshopCanvas.tsx` — `'use client'`
  component that calls `buildNexusWorkshopCanvasView` internally and
  renders a header (eyebrow, title, readiness chip, anchor sub-row,
  objective) followed by a two-column responsive grid: left column
  (agenda · attendees · likely tensions), right column (decisions needed
  · evidence to capture · expected outputs · proposed updates navy
  callout), and an italic caveat footer.
- Added
  `src/__tests__/integration/programs/nexus-workshop-canvas.test.ts` —
  15 type/source tests covering view-model shape, attendee role
  validity, readiness state enum, deterministic timestamp, caveat
  language, and a guard that the component source contains no teal
  accent (`#14B8A6` / `#0E9F8C`).

## Out of scope (explicit deferrals)

- No live workshop notes ingestion.
- No model summarisation.
- No real attendee directory or calendar binding — roles only.
- No runtime state writes — read-only.
- No fabricated dollar amounts and no fake `E-###` evidence citations.

## Why it is safe

The canvas is a deterministic projection of hardcoded seed content. It
imports nothing from `src/lib/source/**`, `src/lib/sentinel/**`,
`src/lib/atlas/**`, `src/lib/nexus/**`, `src/lib/agent/**`,
`src/lib/auth/**`, `supabase/**`, or `src/lib/programs/mock.ts`. It
performs no `Date.now()`, `Math.random()`, `new Date()`, or `fetch`
calls. Same input → identical output.

## Re-run

```
cd /Users/anand/Projects/nexus-prog12
node_modules/.bin/tsc --noEmit --pretty false
node_modules/.bin/jest src/__tests__/integration/programs/nexus-workshop-canvas.test.ts --no-coverage
node_modules/.bin/eslint --max-warnings=0 \
  src/lib/programs/nexus-workshop-canvas-view.ts \
  src/components/programs/NexusWorkshopCanvas.tsx \
  src/__tests__/integration/programs/nexus-workshop-canvas.test.ts
```

## Readiness impact

`programs` notes append: PROG12 (wave-18) NexusWorkshopCanvas — 5-item
agenda, 5-attendee roster, tensions, decisions needed, evidence to
capture, expected outputs. No live notes. 15 tests.
