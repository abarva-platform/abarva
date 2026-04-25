# PF1 · AI Program Failure Modes Pattern Pack

Slice ID: PF1
Slice name: AI Program Failure Modes Pattern Pack
Status: code_complete (pending founder review for `verified`)
Authored: 2026-04-25
Author: Code (sole)

Formalizes the AbarVa POV on **why AI programs fail** as a
deterministic pattern pack. Sentinel, Nexus, Atlas, and Steward can
subscribe to this pack to detect, escalate, and intervene without
inventing failure modes at runtime. **No live runtime, no Claude /
OpenAI invocation, no migrations, no UI.**

## What changed

- New module
  [src/lib/intelligence/ai-program-failure-modes.ts](../../../src/lib/intelligence/ai-program-failure-modes.ts):
  - Public types: `AiProgramFailureKey`,
    `AiProgramFailureSignalType`, `AiProgramFailurePhase`,
    `AiProgramFailureGate`, `AiProgramFailureDeliverable`,
    `AiProgramFailureAgent`, `AiProgramFailureMode`,
    `AiProgramFailureModeSummary`.
  - Public helpers:
    - `listAiProgramFailureModes()` — full pack in canonical order.
    - `getAiProgramFailureMode(key)` — single mode or `null`.
    - `mapSignalsToFailureModes(signalTypes)` — pure mapping from
      S9e signal types to failure modes whose `commonSignals`
      overlap the input.
    - `summarizeFailureModes(modes)` — aggregate counts.
  - Re-exports: `AI_PROGRAM_FAILURE_KEYS_IN_ORDER`,
    `AI_PROGRAM_FAILURE_PHASES`, `AI_PROGRAM_FAILURE_GATES`.

- New tests
  [src/__tests__/integration/intelligence/ai-program-failure-modes.test.ts](../../../src/__tests__/integration/intelligence/ai-program-failure-modes.test.ts):
  32 deterministic tests covering: 12 canonical modes in canonical
  order; full required schema per mode; null on unknown keys; signal
  mapping (empty, unknown, canonical); summary reconciliation;
  no-fabricated-dollars; deterministic_pattern_pack tag; module
  hygiene (no imports from Sentinel / Atlas / Nexus / Agent runtime,
  Source UI, legacy /programs, mock.ts, auth, or supabase).

## Twelve canonical failure modes

| # | Key | Primary agent | Gate at risk | Deliverable implication |
|---|---|---|---|---|
| 1 | `weak_data_foundation` | steward | G3 | data_readiness_plan |
| 2 | `poor_use_case_framing` | nexus | G1 | use_case_canvas |
| 3 | `no_business_owner` | steward | G1 | charter |
| 4 | `no_measurable_baseline` | atlas | G3 | value_ledger |
| 5 | `no_value_ledger` | atlas | G3 | value_ledger |
| 6 | `weak_workflow_integration` | nexus | G3 | integration_plan |
| 7 | `tool_first_thinking` | nexus | G1 | use_case_canvas |
| 8 | `missing_governance_risk` | steward | G3 | risk_responsible_ai_review |
| 9 | `no_adoption_change_plan` | nexus | G3 | adoption_change_plan |
| 10 | `no_operating_model_for_scale` | atlas | G4 | operating_model_doc |
| 11 | `pilot_purgatory` | atlas | G4 | evaluation_postmortem |
| 12 | `ai_tool_sprawl_without_value` | atlas | G4 | portfolio_review |

Each mode carries: `key`, `name`, `definition`, `whyItMatters`,
`commonSignals` (S9e signal types), `requiredEvidence`,
`phaseWhereDetected`, `recommendedIntervention`, `gateImplication`,
`deliverableImplication`, `primaryAgent`, `handoffAgents`, and the
`createdFrom: 'deterministic_pattern_pack'` marker.

## How it consumes / extends the spine

- **S9e signal model** — `commonSignals` references the canonical
  six S9e pressure types. `mapSignalsToFailureModes` lets a future
  Sentinel slice take a tenant's live signal list and surface which
  failure modes are at risk.
- **I1 detection model** — pattern detections (I1) and failure modes
  (PF1) are complementary: I1 names what is currently happening; PF1
  names what could go wrong if unaddressed.
- **Atlas brief / Sentinel brief** — both can attach a "potential
  failure modes" footnote sourced from this pack without re-deriving
  it.
- **Steward** — primary agent on data foundation, business owner,
  and governance failure modes; pack drives Steward escalation
  guidance.
- **Programs gates / deliverables** — every mode names the canonical
  hard gate and deliverable class it threatens, so future slice
  authoring can use this pack to surface the right next step.

## What is deterministic today

- The pack list is byte-equal across repeated calls.
- `getAiProgramFailureMode` returns `null` for unknown keys (test
  enforced).
- Signal mapping is filtered to canonical S9e types only; unknown
  signal types are ignored without throwing (test enforced).
- Mapping order is canonical regardless of input order (test
  enforced).
- `summarizeFailureModes` reconciles primary-agent counts to total;
  byPhase / byGate cover canonical enums.
- No mode invents a dollar amount in any string field (test
  enforced).
- `createdFrom` is always `'deterministic_pattern_pack'` (test
  enforced).

## What is NOT yet wired to runtime

- No live Sentinel runtime subscriber binding.
- No persistent failure-mode log; every call rebuilds from the pack.
- No UI surfacing PF1 modes inside Programs / Tower / Intelligence
  / Admin yet — the surface bindings are deferred to a future slice.

## What is deferred

- **PF2 — Failure mode + Sentinel binding** — wires the pack into
  the I1 detection list so Sentinel briefs can name failure modes
  alongside detected patterns.
- **PF3 — Failure mode UI surfacing** — renders failure modes inside
  Programs detail (per-program) and Atlas brief (portfolio).
- **PF4 — Per-tenant failure-mode persistence** — tracks recurrence
  and surfaces meta-failure modes (cross-program operating-model
  gaps).

## Honest fallbacks used

- Pack content is hand-authored; no language implies live retrieval
  or runtime computation.
- `requiredEvidence` is a checklist, not a resolved citation chain;
  no `E-###` or fake citation appears anywhere in the pack.
- Module imports nothing from Sentinel / Atlas / Nexus / Agent
  runtime, Source UI, legacy `/programs`, `mock.ts`, auth, or
  supabase (test enforced).

## Validation

- `npx tsc --noEmit --pretty false` — pass
- `npx jest src/__tests__/integration/intelligence/ai-program-failure-modes.test.ts` — 32 passed
- `npm run build` — pass

## Status

Code complete. Pending founder review.
