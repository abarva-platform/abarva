# PROG8 · Phase Gate Advancement Flow Contract

Slice ID: PROG8
Slice name: Phase Gate Advancement Flow Contract
Status: code_complete (pending founder review for `verified`)
Authored: 2026-04-26
Author: Code (sole)

Operationalizes the **proposed phase gate advancement flow** named in
the S9C Program Phase Gate Status, the PF2 Program Phase Workspace,
and the MW1 Maestro Workshop Intelligence contracts — but **without
performing any state transition**. The slice ships a deterministic
read model that answers the question "If I tried to advance this
program past the next gate, what would the production state machine
require, and is the gate ready, partially ready, blocked, in need of
waiver, or in need of review?" derived entirely from the canonical
seed (programs, deliverables, hard-gate strip, steward readiness
note, evidence/value readiness summary).

The Steward is still the only voice that may sign off; the platform's
job is to give the Steward and the Maestro a known-good shape so the
advancement card on the program detail surface is honest,
deterministic, and re-renderable across server requests without
divergence.

## What changed

- New module
  [src/lib/programs/phase-gate-advancement-flow.ts](../../../src/lib/programs/phase-gate-advancement-flow.ts):
  - Public types: `PhaseGateAdvancementProposal`,
    `PhaseGateReadinessSignal`, `PhaseGateMissingInput`,
    `PhaseGateEvidenceRequirement`, `PhaseGateAuditRequirement`,
    `PhaseGateRecommendedNextAction`,
    `PhaseGateAdvancementFlowSummary`, `PhaseGateAdvancementStatus`
    (`'ready' | 'partially_ready' | 'blocked' | 'requires_waiver' |
    'requires_review'`), `PhaseGateAdvancementSource`.
  - Public helpers:
    - `buildPhaseGateAdvancementProposal(tenant, program, phase)` —
      pure projection of a single (tenant, program, canonical phase)
      tuple into a proposed advancement record.
    - `evaluatePhaseGateReadiness(proposal)` — convenience
      aggregate over the proposal's steward readiness signals.
    - `summarizePhaseGateAdvancements(proposals)` — Atlas-style
      roll-up (totals, byStatus, perTenant, perGate, total missing
      / blocking / evidence counts).
    - `getBlockedPhaseGates(proposals)` — returns the union of
      every proposal whose status is `'blocked'` OR
      `'requires_waiver'` (does NOT promote `'requires_review'` or
      `'partially_ready'` to blocked).

- New tests
  [src/__tests__/integration/programs/phase-gate-advancement-flow.test.ts](../../../src/__tests__/integration/programs/phase-gate-advancement-flow.test.ts):
  50 deterministic tests covering determinism (including byte-equal
  serialization), every demo program × every canonical phase
  produces a record, all 5 status values are represented across the
  portfolio, every proposal is `proposed: true` (no actual
  transitions), blocked / requires_waiver gates surface a reason +
  waiver path, missing inputs are explicit (id, label, reason,
  blocking flag, unique within a proposal), evidence requirements
  honestly carry `evidenceRegistryWired: false`, audit requirement is
  always present and honestly carries `auditLogWired: false`,
  recommended next action aligns with status, summary roll-up
  reconciles, no fabrication (no dollars, no `E-###` citations, no
  applied/signed/transitioned literals), and module hygiene (no
  banned imports, no `Date.now` / `Math.random` / `new Date(` /
  `fetch(`, no Anthropic / OpenAI runtime, no placeholder strings).

## Tracked fields

| Field | Source | Notes |
|---|---|---|
| `fromPhase` | The canonical phase the proposal is evaluating exit from. | Always one of 6 canonical phases. |
| `toPhase` | `fromPhase.index + 1`. | `null` when `fromPhase` is Verify (terminal). |
| `gate` | `pickGateForPhase(fromPhase)`. | Phases without a direct exit gate (Origination, Diagnose, Execute) point to the next downstream gate so the surface can still show the next checkpoint. |
| `proposed` | Hard-coded `true`. | Marker the renderer can rely on to never claim a transition has happened. |
| `advancementStatus` | Pure rule from canonical phase position + gate-strip classifier + missing inputs + steward readiness. | One of `'ready'`, `'partially_ready'`, `'blocked'`, `'requires_waiver'`, `'requires_review'`. |
| `stewardReadiness.signals` | `buildStewardReadinessNote(program)` mapped onto `state` labels (`ready` / `missing` / `blocking` / `deferred`) plus the gate-strip-derived blocking reason when present. | Roles only — never a real person name. |
| `missingInputs[]` | Per-gate canonical missing inputs (G1 charter signature + objectives lock; G2 CXO interview capture + findings; G3 projected value + design signoff; G4 realized outcomes + variance attribution) plus a "Evidence registry capture" gap for gates that depend on the evidence registry (G2/G3/G4) plus the gate-strip-derived blocking reason when present. | Each carries `id`, `label`, `reason`, and `blocking` flag. Demoted to non-blocking when the gate sits behind the program's canonical phase (passed gates carry historical gaps, not current blockers). |
| `evidenceRequirements[]` | Per-gate canonical evidence kinds (`charter_signature`, `cxo_interview_capture`, `projected_value_capture`, `design_signoff`, `realized_value_capture`). | Every record carries `evidenceRegistryWired: false` because the canonical evidence registry is not yet seeded. |
| `auditRequirement` | Always present. | Names `gate_advancement_proposed`, `gate_advancement_evaluated`, `steward_signoff_recorded`, `evidence_capture_attached` (and `waiver_path_invoked` when the gate is at `blocked` per the gate strip). `signoffRole: 'steward'`. `auditLogWired: false`. |
| `recommendedNextAction` | Pure rule keyed by `advancementStatus`. | Always non-empty. Routes to `program.routePath`. Kind aligns with status: `request_steward_signoff` for `ready`, `capture_missing_input` for `partially_ready`, `resolve_blocker` for `blocked`, `invoke_waiver_path` for `requires_waiver`, `review_gate_readiness` for `requires_review`. |
| `waiverPathReason` | Non-null only for `requires_waiver` proposals. | Names the gate + structured prose reason; falls back to honest deferred-state text when no gate-strip reason exists. |

## Status classification rule

Pure deterministic rule — no probability, no time, no randomness:

- **Gate sits behind the program** (`programIndex > gatePhaseIndex`):
  - Steward readiness shows blocking signals → `requires_review`
    (defensive — the seed should not surface blockers at a passed
    gate, but if it does we refuse to fabricate readiness).
  - Phase gap ≥ 2 AND at least one ready signal → `ready` (the
    program has advanced multiple phases past the gate; deterministic
    readiness dominates historical reconstruction gap).
  - Non-blocking historical gaps remain → `partially_ready`.
  - No gaps and at least one ready signal → `ready`.
  - Otherwise → `requires_review`.

- **Gate sits at the program's current exit** (`programIndex == gatePhaseIndex`):
  - Gate-strip says `blocked` → `requires_waiver` (current gate;
    waiver is the honest production option).
  - Any blocking missing input → `requires_waiver` (production state
    machine would require resolution or waiver invocation).
  - Only non-blocking gaps and no blocking signals → `partially_ready`.
  - No missing inputs and at least one ready signal → `ready`.
  - Otherwise → `requires_review`.

- **Gate sits ahead of the program** (`programIndex < gatePhaseIndex`):
  - Blocking missing inputs → `blocked` (waiver path does NOT apply
    because the gate is not yet the program's current exit).
  - Only non-blocking gaps → `partially_ready`.
  - Otherwise → `requires_review`.

## Honesty invariants

- Every proposal carries `createdFrom: 'deterministic_phase_gate_advancement_seed'`.
- Every proposal carries `proposed: true`. There is no `applied`,
  `signed`, or `transitioned` field on the type.
- Every proposal id is `phase-gate-advancement:<tenantKey>:<programSlug>:p<phase>-g<gate>`
  and is unique across the portfolio.
- No string field invents a dollar amount, a fake `E-###` evidence
  citation, or an "applied" / "signed" / "transitioned" claim.
- Every evidence requirement carries `evidenceRegistryWired: false`
  until the production evidence registry seed lands.
- Every audit requirement carries `auditLogWired: false` until the
  production audit log + signoff persistence slices land.
- All 5 status values are represented across the canonical demo
  portfolio (the test suite asserts this).
- Items the seed cannot deterministically classify surface as
  `'requires_review'` rather than fabricated readiness.
- No timestamps, no dates, no durations are emitted — labels are
  structured (`'gate_advancement_proposed'`, `'pending'`, etc.).

## What is NOT yet wired

- **No state transition.** Advancement is reproduced on every read;
  no database row, no `supabase` call, no audit log write, no phase
  advance, no gate signoff event, no waiver issuance.
- **No live Steward signoff trigger.** No "Advance Gate" button, no
  Steward approval workflow, no audit log row.
- **No live waiver path runtime.** When a proposal is
  `requires_waiver`, the surface shows the deterministic reason but
  does NOT invoke an actual waiver mechanism.
- **No model-backed synthesis.** The classifier uses pure rule logic
  over the canonical seed; live model evaluation is deferred.
- **No UI surface.** The advancement card lands in a follow-up slice;
  this slice ships only types + helpers.

## What is deferred

- **Live phase gate state machine + audit log + Steward signoff
  persistence** — once the auth, audit, and persistence slices land,
  the read model becomes the projection over the persisted lifecycle
  events.
- **Live waiver path** — once the production state machine lands,
  `requires_waiver` proposals can drive an audited waiver invocation
  flow.
- **Live evidence registry binding** — replace the
  `evidenceRegistryWired: false` honest defaults with real `E-###`
  citations once the evidence registry seed lands.
- **Advancement UI card** — a follow-up slice mounts the read model
  on the canonical Programs detail surface and the Workshop Mode
  shell.

## Validation

- `npx tsc --noEmit --pretty false` — pass.
- `npx jest src/__tests__/integration/programs/phase-gate-advancement-flow.test.ts` — 50 passed.
- `npx eslint --max-warnings=0 src/lib/programs/phase-gate-advancement-flow.ts src/__tests__/integration/programs/phase-gate-advancement-flow.test.ts` — clean.
- `npm run build` — pass (Turbopack symlink panic OK to skip in worktree environment).

## Status

Code complete. Pending founder review.
