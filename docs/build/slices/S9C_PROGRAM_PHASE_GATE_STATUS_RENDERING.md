# S9c · Program phase + hard-gate status rendering

Slice ID: S9c
Slice name: Program phase + hard-gate status rendering
Status: code_complete (pending founder review for `verified`)
Authored: 2026-04-24
Author: Code (sole)

Makes the canonical Programs detail surface explicit and state-aware
about the six canonical phases and four hard gates. Adds a deterministic
Steward readiness note. **Does not** implement a production state
machine, **does not** call Claude/OpenAI, **does not** add migrations.
Seed-only.

## What changed

1. **View-model layer extended**
   [src/lib/programs/programs-canonical-view.ts](../../../src/lib/programs/programs-canonical-view.ts):
   - **6-state phase render enum** `CanonicalPhaseRenderStatus`:
     `not_started` / `current` / `complete` / `informational` /
     `blocked` / `not_seeded`. Mirrors S8 readiness contract §H.
   - `statusToCanonicalPhaseRenderStatus(status)` maps the legacy
     4-state `CanonicalPhaseStatus` to the new 6-state enum.
   - `getCurrentCanonicalPhase(program)` returns the `CanonicalPhase`
     object the program is currently sitting at.
   - `buildCanonicalPhaseTimeline(program)` returns a deterministic
     `ReadonlyArray<CanonicalPhaseTimelineEntry>` covering all six
     phases, with per-entry `status`, `isCurrent`, `specPhase`, and a
     short `reason` string. Origination always carries
     `status: 'informational'` and `specPhase: null`.
   - **5-state gate render enum** `CanonicalHardGateRenderStatus`:
     `informational` / `ready` / `missing_inputs` / `blocked` /
     `not_wired`.
   - `buildCanonicalHardGateStrip(program)` returns
     `ReadonlyArray<CanonicalHardGateEntry>` covering all four gates,
     with per-gate `status`, `label`, `blockedTransitionReason`,
     `isCurrentGate`, and `isPassed`.
   - `getGateReadinessLabel(status)` returns the canonical uppercase
     label.
   - `getBlockedTransitionReason(gate, program)` returns a single-line
     prose string when the gate is `missing_inputs` (today, every
     gate-at-current-phase) or `blocked`; null otherwise.
   - `buildStewardReadinessNote(program)` composes a deterministic
     four-bucket note (ready / missing / blocking / deferred) with a
     summary line. No model call.
   - New constant in `HONEST_FALLBACK_LABELS`:
     `productionStateMachineDeferred` →
     "Seed-informed gate readiness; production state machine deferred."

2. **Detail component refactored**
   [src/components/programs/ProgramCanonicalDetail.tsx](../../../src/components/programs/ProgramCanonicalDetail.tsx):
   - `<PhaseTimeline>` now iterates `buildCanonicalPhaseTimeline`
     output. Tile colors and labels switch on the 6-state enum.
   - `<HardGateStrip>` now iterates `buildCanonicalHardGateStrip`
     output. Each gate row carries its `status`, label, and a per-row
     reason string when the gate is in `missing_inputs`. Gate-strip
     caption uses the new `productionStateMachineDeferred` constant.
   - **New** `<StewardReadinessPanel>` rendered between the gate strip
     and the existing data-placeholder cards. Four columns:
     **Ready / Missing inputs / Blocking / Deferred**. Eyebrow
     "Steward · readiness · deterministic". Footer caption clarifies
     the note is composed deterministically from seed state.
   - Removed unused inline helpers: `inferInformationalGateStatus`,
     `canonicalIndexForProgram`, the legacy `gateTone(GateStatusLabel)`,
     `phaseTileColors(legacy 4-state)`, `statusLabel(legacy 4-state)`,
     and `canonicalToSpecPhase` (replaced by `entry.specPhase`).
   - Imports trimmed accordingly. `<NexusProgramRail>` mount
     unchanged. Public props of `<ProgramCanonicalDetail>` unchanged.

3. **Tests added**
   [src/__tests__/integration/programs/programs-phase-gate-status.test.ts](../../../src/__tests__/integration/programs/programs-phase-gate-status.test.ts):
   - 31 deterministic tests covering phase timeline (six entries in
     order, Origination informational, exactly one current phase, only
     enum values from the 6-state set, no fabricated completion data,
     determinism), `getCurrentCanonicalPhase`, the 4→6-state mapping,
     hard-gate strip (four entries in order, only enum values from the
     5-state set, **never emits `ready`** while seed-only,
     gate-at-current-phase carries `missing_inputs` plus a reason,
     gates ahead are `not_wired`, gates behind are `informational`,
     determinism), `getGateReadinessLabel`,
     `getBlockedTransitionReason`, Steward readiness note
     (four-bucket structure, production state machine always deferred,
     current canonical phase mentioned, missing-input fallback,
     determinism), cross-tenant determinism, and module hygiene
     (no imports of legacy `/programs`, `mock.ts`, preview, demo,
     Source UI, Nexus runtime, or auth).

## What is seed-informed

- **Phase status** for each canonical phase is derived from
  `program.currentPhaseSpec` (1–5 from the seed) → mapped to canonical
  index (2–6). Origination is always `informational`.
- **Gate status** is derived from canonical phase position only:
  - Behind program → `informational` (passed informationally; no
    approval state claimed)
  - At program → `missing_inputs` (the seed lacks the inputs the gate
    requires)
  - Ahead of program → `not_wired` (production state machine deferred)
- **Steward note** lists the program's current canonical phase as
  `ready`, every behind-program gate as `informational`, every
  current-phase gate as `missing_inputs` with its per-gate reason, and
  the production state machine as `deferred`.

## What is still NOT wired to a production state machine

- No approval state is claimed; `ready` is not emitted by the gate
  classifier today.
- No audit log writes.
- No Steward-owned gate writer.
- No `phase_snapshots` or `program_modules` Supabase table reads on
  the canonical Programs detail surface.
- No phase-rollback / gate-override workflow.
- No live agent or model call. Steward note is deterministic prose.

## What is deferred

- **State-machine implementation** — Steward-owned writer, audit-event
  schema, phase-rollback workflow, gate-override prose. Owns the move
  from `not_wired` / `missing_inputs` → real `ready` / `blocked`.
- **S9d** Program deliverables evidence + value summary populates the
  inputs the gate classifier asks for. Once value, evidence, and
  approvals are seeded, S9c can promote `missing_inputs` to `ready`
  for the right gates.
- **S9e** Programs Control Tower signal emission — Atlas signal
  triggers tied to gate decisions and program-state transitions.

## Honest fallbacks used

- Origination canonical phase 1 always renders as
  `status: 'informational'` with the
  `HONEST_FALLBACK_LABELS.origination` reason ("Origination phase
  predates the seed; treated as pre-Charter.").
- Hard-gate strip caption uses
  `HONEST_FALLBACK_LABELS.productionStateMachineDeferred`
  ("Seed-informed gate readiness; production state machine
  deferred.").
- Each `missing_inputs` gate carries a per-gate prose string naming
  the seed gap (e.g., G3 → "Projected value documentation is not
  captured in the seed; G3 readiness deferred until evidence and value
  seed land.").
- Steward note's `Deferred` bucket explicitly lists "Production gate
  state machine implementation (Steward-owned writer + audit log)."
- The detail component never claims a gate is approved or cleared from
  seed alone — verified by a test that asserts no
  `buildCanonicalHardGateStrip` entry returns `status: 'ready'`.

## Validation

- `npx tsc --noEmit --pretty false` — pass
- `npx jest src/__tests__/integration/programs/programs-phase-gate-status.test.ts` — 31 passed
- `npx jest src/__tests__/integration/programs/programs-canonical-surface.test.ts` — 24 passed (S9 regression)
- `npx jest src/__tests__/integration/programs/programs-nexus-rail-metadata.test.ts` — 27 passed (S9b regression)
- `npx jest src/lib/auth/__tests__/tenant-isolation-probes.test.ts` — 50 passed (S7 regression)
- `npm run build` — pass

Promotion to `verified` requires a live walk by founder confirming the
phase tiles, hard-gate strip, and Steward readiness panel render
correctly on `/tenant/[slug]/programs/[programSlug]` for at least two
canonical demo tenants.

## Status

Code complete. Pending founder review.
