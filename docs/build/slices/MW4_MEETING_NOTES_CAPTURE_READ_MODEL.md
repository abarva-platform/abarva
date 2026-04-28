# MW4 · Meeting Notes Capture Read Model

Slice ID: MW4
Slice name: Meeting Notes Capture Read Model
Status: code_complete (pending founder review for `verified`)
Authored: 2026-04-25
Author: Code (sole)

Operationalizes the **during / after-workshop capture** half of the
MW1 Maestro Workshop Intelligence Contract. Defines the deterministic
read model for the typed / pasted notes the Maestro files alongside
the workshop record. **No audio capture. No file uploads. No live
transcription. No model summarization. No persistence. No live runtime.**

The Maestro is still the only voice in the room. The platform's job
is to give the Maestro a known-good shape for what they file, derive
the implied program / deliverable / evidence updates from it, and
synthesize the captured notes into a deterministic top-N readout for
downstream Atlas composition.

## What changed

- New module
  [src/lib/programs/meeting-notes-capture.ts](../../../src/lib/programs/meeting-notes-capture.ts):
  - Public union: `MEETING_NOTE_TYPES`, `MeetingNoteType` (eight
    canonical types).
  - Public sub-record types: `MeetingDecision`, `MeetingActionItem`,
    `MeetingRisk`, `MeetingOpenQuestion`, `MeetingEvidenceCandidate`,
    `MeetingStakeholderAlignment`.
  - Public note record: `MeetingNoteCapture`.
  - Public synthesis result: `MeetingSynthesisResult`.
  - Public update derivations: `ProgramUpdateFromMeetingNote`,
    `DeliverableUpdateFromMeetingNote`.
  - Public helpers:
    - `buildMeetingNoteCaptureTemplate(workshopType)` — empty
      template; all arrays empty; observation `''`; canonical
      workshop type recorded.
    - `buildMeetingNoteCaptureSeed(programKey, workshopType)` —
      ≥ 2 deterministic seed notes per pair; each note carries at
      least one decision, action item, risk, open question, and
      evidence candidate; all participants are role labels.
    - `summarizeMeetingNotesCapture(notes)` — totals (notes,
      decisions, actions, evidence) plus a `byType` breakdown that
      reconciles to `totalNotes`.
    - `deriveProgramUpdatesFromMeetingNotes(notes)` — emits
      phase-advance / gate-readiness / risk-register / value-at-stake
      updates only when notes carry implying content.
    - `deriveDeliverableUpdatesFromMeetingNotes(notes)` — emits
      draft-input / review-feedback / approval-blocked / rework
      updates only when notes mention deliverables.
    - `deriveEvidenceCandidatesFromMeetingNotes(notes)` — returns
      the union of every captured evidence candidate.
    - `synthesizeMeetingNotes(notes)` — deterministic synthesis with
      capped top-N decisions / actions / risks plus a recommended
      next step.

- New tests
  [src/__tests__/integration/programs/meeting-notes-capture.test.ts](../../../src/__tests__/integration/programs/meeting-notes-capture.test.ts):
  34 deterministic tests covering templates, seeds, summary
  reconciliation, program / deliverable / evidence derivations,
  synthesis caps and ordering, no-real-person-name regex check,
  no `E-###` literals, honest disclaimer substrings, and module
  hygiene (no banned imports, no banned APIs, no placeholders).

## The eight canonical note types

| Note type | What it captures |
|---|---|
| `workshop_observation` | A free-form observation the Maestro filed. |
| `decision` | A decision the room reached, with `decidedBy` role + rationale. |
| `action_item` | A next-step action with role-labeled owner + due-by label + state. |
| `risk` | A risk surfaced during the session with likelihood, impact, mitigation. |
| `open_question` | A question the room could not answer; carries a `blocks` flag. |
| `evidence_candidate` | A claim or artifact the room referenced; carries a `needsCapture` flag for verbal-only / whiteboard sources. |
| `stakeholder_alignment` | Per-topic alignment state across role-labeled participants. |
| `follow_up_meeting` | A follow-up session the program needs (recorded but not auto-scheduled). |

These eight types align with the during / after-workshop capture
field set named in MW1 section E (notes, decisions, risks,
objections, missing inputs, stakeholder alignment, follow-up
actions). Objections are subsumed under `open_question`; missing
inputs are subsumed under `evidence_candidate` with
`needsCapture: true`.

## Honesty invariants

- Every note carries `createdFrom: 'deterministic_seed'`.
- Every note carries `honestDisclaimer: 'Notes are deterministic
  seed; live capture is not wired.'` — the test enforces both
  substrings (`deterministic seed` and `not wired`).
- Every id matches `/^mtg-seed-[a-z0-9-]+$/`.
- No participant string carries a real person name; all are role
  labels (`Client Maestro`, `Executive Sponsor`, `Business Owner`,
  `Data Owner`, `Compliance Reviewer`, `Technical Lead`, `VP
  Engineering`, `AbarVa Consultant`).
- No string contains a fabricated `E-###` evidence citation.
- The seed never invents a dollar amount or live timestamp; the only
  time label is the structured `'workshop_session'` literal.

## Derivation rules

### Program updates

`deriveProgramUpdatesFromMeetingNotes` emits a row only when the
captured note implies the corresponding program-level update:

- `phase_advance_request` — emitted for every decision whose
  `affectsProgramKey` is set.
- `gate_readiness_change` — emitted for every open question whose
  `blocks === 'gate_signoff'`.
- `risk_register_update` — emitted for every risk whose
  `impact === 'high'`.
- `value_at_stake_update` — emitted for every decision whose
  `decidedBy` is the `Executive Sponsor` role.

### Deliverable updates

`deriveDeliverableUpdatesFromMeetingNotes` emits a row only when the
captured note explicitly mentions a deliverable:

- `review_feedback` — decisions with `affectsDeliverableKey` set.
- `approval_blocked` — open questions whose `blocks ===
  'deliverable_approval'`.
- `rework_required` — stakeholder alignment whose `state` is
  `divergent` or `escalated`.
- `draft_input_added` — evidence candidates whose `sourceLabel` is
  `document_referenced` or `preexisting_artifact`.

### Evidence candidates

`deriveEvidenceCandidatesFromMeetingNotes` returns the literal union
of every `evidenceCandidates` array across the input notes,
preserving cross-note and intra-note order. No filtering — the
caller decides which to act on.

### Synthesis

`synthesizeMeetingNotes` is deterministic:

- `topDecisions` — first three decisions in canonical capture order.
- `topActionItems` — actions with state `open` or `in_progress`,
  sorted by id, capped at five.
- `topRisks` — risks sorted by impact descending then by id, capped
  at three.
- `unresolvedQuestions` — open questions whose `blocks` is set and
  not `'none'`.
- `evidenceCandidatesNeedingCapture` — evidence candidates whose
  `needsCapture` is `true`.
- `recommendedNextStep` — composed deterministically from the
  workshop type, the count of unresolved questions, and the count
  of risks. No model invocation.

The synthesis result carries `basis: { synthesizer:
'meeting_synthesis_v1' }` and `createdFrom: 'deterministic_seed'`
so downstream Atlas composition can tell it is acting on a seed.

## Workshop-type alignment

The module accepts any `workshopType: string` so it can carry
free-form session labels. The seed-content composition switches
on the nine canonical MW2 workshop types
(`current_state_discovery`, `use_case_framing`,
`data_foundation_assessment`, `value_framing`,
`governance_risk_review`, `architecture_solution_design`,
`operating_model_alignment`, `adoption_change_readiness`,
`executive_decision_review`) and falls back to a generic phrasing
for any unknown label. This keeps the contract reconciled with MW2
without making MW4 brittle to future workshop-type additions.

## What is NOT yet wired

- **No live capture.** No audio recording, no real-time
  transcription, no meeting-bot ingestion, no file upload, no model
  summarization. Only deterministic seed records.
- **No persistence.** The module emits in-memory shapes. No database
  table, no `supabase` call, no audit row.
- **No live program / deliverable mutation.** Derivation helpers
  emit rationale rows; consumers must decide whether to apply them.
- **No Maestro UI.** The capture-flow surface lands in a follow-up
  slice; this slice ships only types + helpers.
- **No SME routing.** `routingHint` carries a label but no live
  routing is performed.

## What is deferred

- **Live notes ingestion** — typed / pasted / uploaded notes path
  (per MW1 section H) lands when persistence + auth slices land.
- **Live deterministic extractors** — replace the seed builder with
  text-pattern extractors over the captured raw text.
- **Live model synthesis** — replace `synthesizeMeetingNotes` with
  a model-backed summarization once governance lands.
- **Audio + meeting-bot path** — explicitly out of scope per MW1
  contract; the platform does not insert itself into the room.
- **Maestro confirmation flow** — the MW1 contract specifies the
  Maestro confirms extractor output before filing; that flow lands
  in the capture-UI slice.

## Validation

- `npx tsc --noEmit --pretty false` — pass.
- `npx jest src/__tests__/integration/programs/meeting-notes-capture.test.ts` — 34 passed.
- `npx jest src/__tests__/integration/programs/workshop-readiness.test.ts` — 40 passed (no regression).
- `npm run build` — pass.

## Status

Code complete. Pending founder review.
