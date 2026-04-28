# MW5 · Meeting Notes → Program State Updates

Slice ID: MW5
Slice name: Meeting Notes → Program State Updates
Status: code_complete (pending founder review for `verified`)
Authored: 2026-04-26
Author: Code (sole)

Operationalizes section F (after-workshop synthesis) and section J
(dynamic deliverable refinement loop) of the
[MW1 Maestro Workshop Intelligence Contract](./MW1_MAESTRO_WORKSHOP_INTELLIGENCE_CONTRACT.md).
Defines the deterministic read model that turns the structured MW4
meeting note captures into a flat list of **proposed** program-state
updates the Maestro can review and confirm. **No model invocation. No
DB writes. No persistence. No phase advance / gate signoff.**

The Maestro is still the only role that advances the program. This
slice's only job is to compose deterministic suggestions from
captured notes — actions, risks, open questions, evidence candidates,
deliverable update hints, and advisory gate readiness impacts — so
that the next Maestro review does not start from a blank page.

## What changed

- New module
  [src/lib/programs/meeting-notes-to-program-updates.ts](../../../src/lib/programs/meeting-notes-to-program-updates.ts):
  - Public union: `PROGRAM_UPDATE_PROPOSAL_TYPES`,
    `ProgramUpdateProposalType`.
  - Public source attribution: `ProgramUpdateSource`.
  - Public proposal shapes:
    - `ProgramActionProposal`
    - `ProgramRiskProposal`
    - `ProgramOpenQuestionProposal`
    - `ProgramEvidenceCandidateProposal`
    - `ProgramDeliverableUpdateProposal`
    - `ProgramGateImpactProposal`
  - Public discriminated union: `ProgramUpdateProposal`.
  - Public summary type: `MeetingNotesProgramUpdateSummary`.
  - Public helpers:
    - `deriveProgramUpdatesFromMeetingNotesCapture(notes)` — top-level
      walker; concatenates the per-type derivations in canonical
      order (action, risk, question, evidence, deliverable, gate).
    - `deriveActionProposals(notes)` — one proposal per captured
      action item; preserves owner role + due-by label + initial
      state.
    - `deriveRiskProposals(notes)` — one proposal per captured risk;
      composes stronger rationale for high-impact risks.
    - `deriveOpenQuestionProposals(notes)` — one proposal per
      blocking open question (skips questions whose `blocks` is
      `'none'` or unset).
    - `deriveEvidenceCandidateProposals(notes)` — one proposal per
      captured evidence candidate; preserves source label + needs-
      capture flag.
    - `deriveDeliverableUpdateProposals(notes)` — emits
      `review_feedback` / `approval_blocked` / `rework_required` /
      `draft_input_added` updates per the rules below.
    - `deriveGateImpactProposals(notes)` — emits **advisory** gate
      readiness impacts mapped to G1–G4 by workshop type.
    - `summarizeProgramUpdateProposals(proposals)` — counts by type;
      always reports `appliedProposals: 0`.

- New tests
  [src/__tests__/integration/programs/meeting-notes-to-program-updates.test.ts](../../../src/__tests__/integration/programs/meeting-notes-to-program-updates.test.ts):
  42 deterministic tests covering determinism, coverage across the
  canonical seed, provenance + status, action / risk / question /
  evidence / deliverable / gate derivations, summary reconciliation,
  honesty / fabrication guards, top-level ordering, and module
  hygiene (no banned imports, no banned APIs, no placeholders, no
  `'use client'`).

## Honesty invariants

- Every proposal carries `status: 'proposed'`. No proposal is ever
  `applied`, `committed`, or `done` — those states do not exist in
  this module's vocabulary.
- Every proposal carries
  `createdFrom: 'deterministic_meeting_notes_seed'`.
- Every proposal carries a `source` block with the `programKey`,
  `workshopType`, `workshopOrdinal`, and `noteId` of the captured
  note it came from.
- Gate impacts carry `advisory: true` so consumers cannot mistake them
  for a gate decision. Gate impacts never trigger an actual gate
  status change.
- The module is server-only — no `'use client'`, no React hooks, no
  `Date.now`, no `Math.random`, no `new Date(`, no `fetch(`, no
  `anthropic` / `openai` import.
- Tests assert input notes are never mutated by the derivation
  helpers.

## Derivation rules

### Action proposals (`deriveActionProposals`)

One `ProgramActionProposal` per captured `MeetingActionItem`. Fields:

- `description`, `ownerRole`, `dueByLabel` — copied from the source
  action.
- `initialState` — the captured state (`open` / `in_progress` /
  `completed` / `blocked`); the proposal does not change it, only
  records where the room left it.
- `rationale` — composed deterministically from the workshop type,
  `capturedBy`, and `dueByLabel`.

### Risk proposals (`deriveRiskProposals`)

One `ProgramRiskProposal` per captured `MeetingRisk`. Fields:

- `description`, `likelihood`, `impact`, `ownerRole?`, `mitigation?`
  — copied from the source risk.
- `rationale` — stronger phrasing for high-impact risks (and
  strongest for high-likelihood + high-impact).

### Open-question proposals (`deriveOpenQuestionProposals`)

One `ProgramOpenQuestionProposal` per `MeetingOpenQuestion` whose
`blocks` is set and **not** `'none'`. The `blocks` value is preserved
verbatim (`phase_advancement` / `deliverable_approval` /
`gate_signoff`).

### Evidence candidate proposals (`deriveEvidenceCandidateProposals`)

One `ProgramEvidenceCandidateProposal` per captured
`MeetingEvidenceCandidate`. The `sourceLabel` and `needsCapture` flag
are preserved so downstream surfaces can show the Maestro which
evidence is verbal-only / on a whiteboard and still needs explicit
follow-up capture.

### Deliverable update proposals (`deriveDeliverableUpdateProposals`)

| Trigger | `updateKind` |
|---|---|
| Decision with `affectsDeliverableKey` set | `review_feedback` |
| Open question with `blocks === 'deliverable_approval'` | `approval_blocked` |
| Stakeholder alignment in `divergent` or `escalated` state | `rework_required` |
| Evidence with `sourceLabel` of `document_referenced` or `preexisting_artifact` | `draft_input_added` |

When the source decision does not name a deliverable key, the proposal
falls back to a deterministic `<programSlug>-<workshopSlug>-deliverable`
key derived from the source note.

### Gate impact proposals (`deriveGateImpactProposals`)

Gate impacts are **advisory only**. They never advance, sign off, or
block a gate by themselves. They surface as suggestions for the
Maestro to consider in the next gate-readiness review.

| Trigger | `impactKind` |
|---|---|
| Open question blocking `gate_signoff` | `gate_signoff_blocked` |
| Open question blocking `phase_advancement` | `gate_readiness_at_risk` |
| High-impact risk | `gate_readiness_at_risk` |
| Decision by `Executive Sponsor` role | `gate_readiness_advanced` |
| `verbal_only` or `whiteboard` evidence with `needsCapture: true` | `gate_evidence_needed` |

Workshop-type → gate mapping reflects the canonical phase progression:

| Workshop type | Gate |
|---|---|
| `current_state_discovery`, `use_case_framing` | G1 |
| `data_foundation_assessment`, `value_framing`, `governance_risk_review` | G2 |
| `architecture_solution_design`, `operating_model_alignment` | G3 |
| `adoption_change_readiness`, `executive_decision_review` | G4 |

Unknown labels fall back to `G1` so the contract stays defensive
against future workshop-type additions.

## Determinism contract

- `deriveProgramUpdatesFromMeetingNotesCapture` is pure: same input
  list → byte-equal output across calls.
- The module never reads a wall clock, never invokes a model, never
  performs network IO, and never mutates the input note list.
- Proposal ids are derived deterministically from the source record
  ids: `prop-action-<id>`, `prop-risk-<id>`,
  `prop-question-<id>`, `prop-evidence-<id>`,
  `prop-deliverable-decision-<id>` /
  `prop-deliverable-question-<id>` /
  `prop-deliverable-alignment-<id>` /
  `prop-deliverable-evidence-<id>`,
  `prop-gate-question-signoff-<id>` /
  `prop-gate-question-phase-<id>` /
  `prop-gate-risk-<id>` /
  `prop-gate-decision-<id>` /
  `prop-gate-evidence-<id>`.

## What is NOT yet wired

- **No live capture.** This module reads the structured MW4 captures.
  Live audio, transcription, and meeting-bot ingestion remain out of
  scope per the MW1 contract.
- **No persistence.** No DB write, no audit row, no migration. The
  proposals are read-model output only.
- **No state mutation.** A proposal never advances a phase, signs off
  a gate, or changes the deliverable status. Consumers must decide
  whether to apply each proposal.
- **No Maestro confirmation UI.** The MW1 contract specifies the
  Maestro confirms extractor output before filing; that flow lands
  in a follow-up slice.

## What is deferred

- **Live notes ingestion** — typed / pasted / uploaded notes path
  (per MW1 section H) lands when persistence + auth slices land.
- **Live deterministic extractors** — replace the seed-driven input
  with text-pattern extractors over captured raw notes.
- **Apply-proposal flow** — once persistence lands, an apply step
  will turn `proposed` into a real program-state mutation with audit
  row.
- **Live model synthesis** — replace the deterministic rationale
  composition with model-backed phrasing once governance lands.

## Validation

- `npx tsc --noEmit --pretty false` — pass.
- `npx jest src/__tests__/integration/programs/meeting-notes-to-program-updates.test.ts` — 42 passed.
- `npx jest src/__tests__/integration/programs/meeting-notes-capture.test.ts` — passed (no regression).
- `npx jest src/__tests__/integration/programs/workshop-readiness.test.ts` — passed (no regression).
- `npm run build` — pass.

## Status

Code complete. Pending founder review.
