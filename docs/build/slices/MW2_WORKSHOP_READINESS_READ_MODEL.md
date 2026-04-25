# MW2 · Workshop Readiness Read Model

Slice ID: MW2
Slice name: Workshop Readiness Read Model
Status: code_complete (pending founder review for `verified`)
Authored: 2026-04-25
Author: Code (sole)

Operationalizes the MW1 Maestro Workshop Intelligence Contract by
projecting (tenant, program) seed state into a per-workshop readiness
shape. The read model prepares the Client Maestro for the next
workshop without inserting itself into the room. **No model calls,
no calendar/booking integration, no meeting-notes ingestion, no
migrations, no auth, no UI.**

## What changed

- New module
  [src/lib/programs/workshop-readiness.ts](../../../src/lib/programs/workshop-readiness.ts):
  - Public types: `WorkshopType`, `WorkshopParticipantRole`,
    `WorkshopOutputKind`, `WorkshopObjective`,
    `WorkshopEvidenceRequest`, `WorkshopOutput`, `WorkshopRisk`,
    `WorkshopReadiness`, `WorkshopReadinessSummary`.
  - Public helpers:
    - `buildWorkshopReadinessForProgram(tenant, program)` — emits
      ≥3 deterministic readiness records per program based on the
      program's `currentPhaseSpec`.
    - `buildNextRecommendedWorkshop(tenant, program)` — picks the
      first canonical-ordered workshop whose
      `stewardGateImplication` references the program's current
      canonical hard gate; falls back to the first workshop in the
      list when no gate is at risk.
    - `summarizeWorkshopReadiness(workshops)` — aggregate counts
      that reconcile to `totalCount`.
  - Re-exports: `WORKSHOP_TYPES_IN_ORDER`,
    `WORKSHOP_PARTICIPANT_ROLES_IN_ORDER`.

- New tests
  [src/__tests__/integration/programs/workshop-readiness.test.ts](../../../src/__tests__/integration/programs/workshop-readiness.test.ts):
  40 deterministic tests covering determinism per (tenant, program)
  pair, full required field set per record, attendee composition
  invariants, content composition, evidence-to-capture invariants,
  risks, next-recommended workshop logic, summary reconciliation,
  no-fabrication invariants (no dollar amounts, no real `E-###`
  citations, every record carries
  `createdFrom: 'deterministic_program_seed'`), gate-implication
  honesty for phase 4, and module hygiene (no Source UI, Sentinel /
  Atlas / Nexus / Agent runtime, legacy `/programs`, `mock.ts`,
  auth, supabase imports; no `Date.now` / `Math.random` / `new Date`).

## How it consumes MW1 + the program seed

- The MW1 contract names the **Client Maestro**, **Nexus**,
  **Steward**, and **Atlas** roles. MW2 honors that partition: the
  Maestro is always a required attendee; SMEs are surfaced as
  recommendations not auto-assignments; Steward gate implications
  are explicit; Atlas is referenced only for the executive readout
  output kind.
- The seed enumerates demo tenants and programs through
  `buildAllProgramsSeedPlan`. MW2 walks that plan to enumerate
  programs and emits readiness records per program.
- The MW1 brief field set (objective, requiredAttendees,
  preReadList, agenda, questionsToAsk, likelyTensions,
  decisionPoints, evidenceChecklist) maps onto MW2's
  `WorkshopReadiness` shape. `decisionPoints` is named
  `decisionsNeeded` and `evidenceChecklist` is named
  `evidenceToCapture` to keep the per-field semantics explicit.
- MW2 also touches `summarizeProgram`, `buildProgramReadinessSummary`,
  `buildStewardReadinessNote` (canonical view) and
  `buildProgramArtifactInventory` (PDEL) so any contract drift in
  those modules fails MW2's tests rather than silently desynchronizing
  the Maestro brief.

## Phase → workshop mapping

For each program, MW2 emits readiness records based on
`currentPhaseSpec`:

| Spec phase | Canonical phase | Workshops |
|---|---|---|
| 1 | Charter | current_state_discovery, use_case_framing, value_framing |
| 2 | Diagnose | data_foundation_assessment, governance_risk_review, value_framing |
| 3 | Design | architecture_solution_design, governance_risk_review, operating_model_alignment |
| 4 | Execute | adoption_change_readiness, operating_model_alignment, executive_decision_review |
| 5 | Verify | executive_decision_review, adoption_change_readiness |

Workshop-type ordering inside a program is canonical; ids follow
`ws:<tenantKey>:<programSlug>:<type>`.

## Deterministic invariants (test enforced)

- Same input → identical output across repeated calls for every
  (tenant, program) pair.
- Every program emits ≥1 readiness record; active programs emit ≥2.
- Workshop ids are unique within a single program list.
- Workshop types are unique within a single program list.
- Every record carries `createdFrom: 'deterministic_program_seed'`.
- Every record names `client_maestro` in `requiredAttendees`.
- Every record carries ≥3 required attendees, ≥1 optional SME,
  ≥1 question, ≥1 expected output, ≥1 pre-read entry, ≥1
  likely tension, ≥1 decision needed, ≥1 risk.
- Every record carries ≥2 evidenceToCapture entries with at
  least one `required: true` and at least one `required: false`.
- Agenda entries are positive integers totaling between 30 and 240
  minutes.
- No record invents a dollar amount in any string field
  (`/\$\s?\d/` regex test enforced).
- No record claims a real `E-###` citation.
- Phase 4 (Execute) workshops honestly state no canonical hard gate
  is at risk in the current phase; phase 1/2/3/5 workshops name a
  canonical gate G1..G4 in the steward gate implication.
- `byType` and `perTenant` summary counts reconcile to
  `totalCount`.
- `buildNextRecommendedWorkshop` is deterministic and returns a
  workshop drawn from the program's canonical-ordered list.

## What is NOT yet wired

- **No meeting notes ingestion.** MW2 prepares the Maestro for the
  workshop but does not capture or extract notes. Capture flow lands
  in MW4 (Meeting Notes Capture Contract).
- **No live LLM-driven brief composition.** Briefs are deterministic
  per workshop type with seed-anchored prose. Live brief
  composition is deferred.
- **No calendar / booking integration.** SMEs are surfaced as
  recommendations only. Auto-booking is explicitly out of scope per
  MW1 contract.
- **No Maestro brief UI.** The read-model only ships types and
  helpers. The Apple-like brief surface lands in MW3 (Nexus Maestro
  Brief UI).
- **No deliverable refinement loop.** Stub → Outline → Rich
  promotion lands in MW7.

## What is deferred

- **MW3 Nexus Maestro Brief UI** — renders the readiness record as
  the Maestro's pre-workshop brief surface.
- **MW4 Meeting Notes Capture Contract** — defines the typed /
  pasted / uploaded notes capture flow with deterministic
  extractors.
- **MW5 Session Template Generator** — generates time-boxed agenda
  templates from the program's stated objective.
- **MW6 SME Recommendation Panel** — renders the top-three SME
  recommendations with reason captions.
- **MW7 Deliverable Refinement Loop** — implements the
  deterministic Stub → Outline → Rich refinement after each
  workshop.
- **Live Nexus retrieval** — replaces deterministic prose with
  Nexus-composed Context Bundles when the retrieval slice lands.

## Validation

- `npx tsc --noEmit --pretty false` — pass
- `npx jest src/__tests__/integration/programs/workshop-readiness.test.ts` — 40 passed
- `npm run build` — pass

## Status

Code complete. Pending founder review.
