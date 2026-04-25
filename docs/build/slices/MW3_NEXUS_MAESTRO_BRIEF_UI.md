# MW3 · Nexus Maestro Brief UI

Slice ID: MW3
Slice name: Nexus Maestro Brief UI
Status: code_complete (pending founder review for `verified`)
Authored: 2026-04-25
Author: Code (sole)

Renders the deterministic MW2 `WorkshopReadiness` read model as the
Client Maestro / Nexus pre-workshop brief surface. **Server component
only** — no client interactivity, no `'use client'`, no `useState`,
no `useEffect`, no `fetch`, no `Date.now`, no `Math.random`, no model
calls, no live workshop ingestion. Pure presentation over the
deterministic record produced by MW2.

## What changed

- New component
  [src/components/programs/NexusMaestroBriefPanel.tsx](../../../src/components/programs/NexusMaestroBriefPanel.tsx):
  - Default export and named export `NexusMaestroBriefPanel({
    readiness })`. Reads only from MW2's `WorkshopReadiness` shape and
    AbarVa design tokens (`COLORS`, `FONT`, `TYPE`, `SPACING`,
    `BORDER`, `RADIUS`).
  - Carries `data-mw3="nexus-maestro-brief"` on the root for
    testability.
  - Surfaces the canonical MW2 fields as labeled sections:
    - Header — program code + tenant name + workshop title.
    - **Next workshop** — title, type, phase, recommended-for-gate,
      and the why-now line drawn from `stewardGateImplication`.
    - **Objective**.
    - **Required attendees** (role + reason).
    - **Optional SMEs** (role + reason).
    - **Pre-read** list.
    - **Questions to ask** list.
    - **Likely tensions** list.
    - **Decisions needed** list.
    - **Evidence to capture** (label + reason + Required/Optional
      tone chip).
    - **Expected outputs** (kind + description).
    - **Nexus preparation brief** (multi-line block).
    - **Steward gate implication** (canonical G1..G4 reference).
    - Honest disclaimer: "Live workshop ingestion is not wired; this
      brief is rendered from the deterministic workshop readiness
      read model."
  - Honest fallbacks: if a list is empty (the MW2 shape always
    populates these for active programs, but the panel is defensive),
    the section renders the placeholder
    `(not yet wired in MW2 read model)` rather than fabricating.

- Modified [src/components/programs/ProgramCanonicalDetail.tsx](../../../src/components/programs/ProgramCanonicalDetail.tsx):
  - One added import for `NexusMaestroBriefPanel` and
    `buildNextRecommendedWorkshop`.
  - One added small helper `NexusMaestroBriefMount` that conditionally
    renders the panel only when a non-null readiness record is
    available; falls back to nothing rendered otherwise. Mounted
    adjacent to the existing `StewardReadinessPanel` (the workshop-
    flavor surface).
  - No other behavior changed; all existing props, layout, and
    children preserved.

- New tests
  [src/__tests__/integration/programs/nexus-maestro-brief-panel.test.ts](../../../src/__tests__/integration/programs/nexus-maestro-brief-panel.test.ts):
  Covers module hygiene (no Source / Sentinel / Atlas / Nexus / Agent
  / Auth / supabase imports; no client hooks; no `Date.now` /
  `Math.random` / `new Date`; no fake meeting notes or fabricated
  decision logs); structural source markers (data-mw3 attribute,
  named + default export, label coverage); mount in
  `ProgramCanonicalDetail` (single import, single mount, conditional
  render); render pass against a deterministic seed-derived readiness
  fixture (renders without throwing, contains the data-mw3
  attribute, surfaces every required label, includes the disclaimer,
  and renders deterministically across repeated calls); plus a
  full-fan-out render pass over every (tenant, program, workshop) in
  the seed plan.

## How it consumes MW2

- Imports the canonical `WorkshopReadiness` type and supporting role /
  evidence / output kind types from `@/lib/programs/workshop-readiness`.
- The component is a pure projection: every visible field maps to a
  single `readiness.*` field. No transformation, no fabrication, no
  deduplication, no aggregation.
- The mount uses `buildNextRecommendedWorkshop(tenant, program)` to
  pick which readiness record to render — the MW2 helper picks the
  first canonical-ordered workshop whose `stewardGateImplication`
  references the program's current canonical hard gate.

## What is NOT yet wired

- **No live workshop ingestion.** This is the explicit disclaimer
  carried at the bottom of every rendered panel. Capture flow lands
  in MW4.
- **No client interactivity.** No expand/collapse, no copy-to-
  clipboard, no print view, no agent escalation. The brief surface is
  read-only and printable as static HTML.
- **No live LLM-driven brief composition.** The brief is the
  deterministic projection produced by MW2. Live composition is
  deferred.
- **No SME / attendee booking.** SMEs are surfaced as recommendations
  only.
- **No deliverable refinement loop.** Stub → Outline → Rich
  promotion lands in MW7.

## What is deferred

- **MW4 Meeting Notes Capture Contract** — typed / pasted / uploaded
  notes capture flow with deterministic extractors.
- **MW5 Session Template Generator** — generates time-boxed agenda
  templates from the program's stated objective.
- **MW6 SME Recommendation Panel** — renders the top-three SME
  recommendations with reason captions.
- **MW7 Deliverable Refinement Loop** — implements the deterministic
  Stub → Outline → Rich refinement after each workshop.
- **Live Nexus retrieval** — replaces deterministic prose with
  Nexus-composed Context Bundles when the retrieval slice lands.
- **Maestro brief print / export** — print-optimized stylesheet and
  PDF export. Out of scope for MW3.

## Validation

- `npx tsc --noEmit --pretty false` — pass
- `npx jest src/__tests__/integration/programs/nexus-maestro-brief-panel.test.ts` — pass
- `npx jest src/__tests__/integration/programs/workshop-readiness.test.ts` — regression pass
- `npx jest src/__tests__/integration/programs/programs-canonical-surface.test.ts` — regression pass
- `npm run build` — pass

## Status

Code complete. Pending founder review.
