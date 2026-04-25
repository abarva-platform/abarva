# PW1 · Program Workshop Mode Shell

Slice ID: PW1
Slice name: Program Workshop Mode Shell
Status: code_complete (pending founder review for `verified`)
Authored: 2026-04-25
Author: Code (sole)

Mounts a deterministic, server-rendered Workshop Mode panel inside
the canonical Programs Detail surface. Implements the PF2 (Program
Phase Workspace Contract) shape — left journey rail, center Nexus
canvas, right context panel — without introducing client
interactivity, runtime model calls, or live workshop ingestion.

## What changed

- New view-model helper
  [src/lib/programs/program-workshop-mode-view.ts](../../../src/lib/programs/program-workshop-mode-view.ts):
  - Public types: `ProgramWorkshopModeView`,
    `ProgramWorkshopModeLeftRailPhase`,
    `ProgramWorkshopModePhaseStatus`,
    `ProgramWorkshopModeRightContext`.
  - Public helper: `buildProgramWorkshopModeView(programId)` —
    locates the program in the canonical seed plan and projects the
    canonical six-phase rail (`completed | current | pending`),
    the next recommended workshop from MW2, the deterministic
    agenda (pre-read + questions + decisions, with section
    headings), the right-context block (`evidenceUsable`,
    `gateImplication`, `gatekeeperAgent: 'steward'`), and an
    honest disclaimer.

- New server component
  [src/components/programs/ProgramWorkshopMode.tsx](../../../src/components/programs/ProgramWorkshopMode.tsx):
  - Renders three regions per PF2 layout:
    - Left journey rail (≤220px) — six canonical phases with
      status tone (current = navy fill, completed = soft fill,
      pending = card surface).
    - Center Nexus workshop canvas (~70%) — header, workshop
      title + objective, agenda, required attendees, optional
      SMEs, pre-read, questions to ask, likely tensions,
      decisions needed, evidence to capture, expected outputs.
    - Right compact context panel (≤320px) — evidence usable
      count, gate implication, Steward verdict, the honest
      disclaimer, and two empty placeholders ("Live workshop
      notes — coming soon", "Deliverable refinement — coming
      soon").
  - Renders `data-program-workshop-mode="pw1"` on its root for
    testability.
  - Server component only; no `useState`, no `useEffect`, no
    `'use client'`. Uses inline styles in the AbarVa palette
    (DM Sans body, JetBrains Mono mono, hairline `#E8E6E1`
    borders).

- Integration into
  [src/components/programs/ProgramCanonicalDetail.tsx](../../../src/components/programs/ProgramCanonicalDetail.tsx):
  - Adds `ProgramWorkshopMode` and `buildProgramWorkshopModeView`
    imports.
  - Mounts `<ProgramWorkshopMode view={buildProgramWorkshopModeView(program.programSlug)} />`
    inside the primary workspace, after the Evidence + Value
    Readiness Summary and before the honest data placeholders.
    No other structure is touched.

- New tests
  [src/__tests__/integration/programs/program-workshop-mode.test.ts](../../../src/__tests__/integration/programs/program-workshop-mode.test.ts):
  Determinism (deep-equal + JSON byte-equal across calls), every
  canonical demo program returns a view with non-null
  `nextWorkshop`, required content invariants (≥1 required
  attendee, ≥1 evidence-to-capture, ≥1 expected output, ≥1 agenda
  line, six left-rail phases with exactly one `current` for
  active programs), right-context invariants (steward gatekeeper,
  non-empty `gateImplication`, integer `evidenceUsable`),
  honesty invariants (`honestDisclaimer` mentions "not wired" or
  "deterministic", `createdFrom === 'deterministic_seed'`,
  defensive shell for unknown programIds), and module hygiene on
  both the view-model and the component (no `Date.now` /
  `Math.random` / `new Date` / `fetch` / `anthropic` / `openai`,
  no imports from Nexus / Agent / Source / Auth / `mock.ts` /
  Supabase, no `useState` / `useEffect`).

## What is deterministic

- The view-model is a pure projection of the canonical seed plan
  plus the MW2 readiness record set. Same `programId` → identical
  output across calls (verified by both deep-equal and JSON
  byte-equal assertions).
- The agenda is composed from `preReadList`, `questionsToAsk`,
  and `decisionsNeeded` of the workshop returned by
  `buildNextRecommendedWorkshop`, with deterministic section
  headings.
- `evidenceUsable` is the deterministic ceiling — the length of
  the workshop readiness `evidenceToCapture` array. It is not a
  live count of captured evidence (no live capture exists yet).
- The left rail status is derived from the canonical phase mapping
  (`mapSpecPhaseToCanonicalIndex` + `statusForCanonicalPhase`),
  with `origination_pre_seed` rendering as `pending` for honesty.

## What is NOT yet wired

- No live workshop ingestion. The "Live workshop notes" right-rail
  card is an honest placeholder; PW2 wires Maestro-typed capture.
- No deliverable refinement loop. The "Deliverable refinement"
  right-rail card is an honest placeholder; PW3 wires the
  Stub → Outline → Rich promotion ladder.
- No live Steward verdict. The right rail names Steward as the
  gatekeeper agent and shows the deterministic
  `stewardGateImplication`, but never fabricates a live verdict.
- No client interactivity. Phase mode switches, drawer overlays,
  and inline capture affordances from PF2 §3 are deferred.

## What is deferred to PW2+

- PW2 — Maestro-typed workshop notes capture wired to the
  workshop ID with deterministic extractors.
- PW3 — Deliverable refinement loop (Stub → Outline → Rich) per
  MW1 §J.
- PW4 — Live Steward verdict ingestion + recommended-next-action
  binding.
- PW5 — Single-instance detail drawer overlay for evidence rows,
  decision records, and attendee detail (PF2 §3).

## Honest fallbacks

- Unknown `programId` returns a defensive view with `nextWorkshop:
  null`, an empty agenda, the canonical six-phase rail in
  `pending` state, and the honest disclaimer. The component renders
  a calm "no workshop is recommended" message in the canvas.
- Phase 4 (Execute) programs honestly state no canonical hard gate
  is at risk in the current phase; the workshop tightens evidence
  for the eventual G4 verification (inherited from MW2).

## Validation

```
npx tsc --noEmit --pretty false
npx jest src/__tests__/integration/programs/program-workshop-mode.test.ts
npx jest src/__tests__/integration/programs/workshop-readiness.test.ts
npx jest src/__tests__/integration/programs/programs-canonical-surface.test.ts
npm run build
python3 -c "import json; json.load(open('docs/build/build-slices.json'))"
```

## Status

`code_complete` — implementation, tests, slice doc, and manifest
update landed. Awaiting founder review to mark `verified`.
