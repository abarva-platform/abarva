# PDEL10 · Deliverable Approval / Lock / Supersede Flow

Slice ID: PDEL10
Slice name: Deliverable Approval / Lock / Supersede Flow
Status: code_complete (pending founder review for `verified`)
Authored: 2026-04-26
Author: Code (Lane D)
Depends on: PDEL6, PDEL7, PDEL8

PDEL10 lands the deterministic, file-pure approval-state machine
projection for deliverable approval, locking, and supersede flows. The
module defines canonical types, a full transition table, and a manifest
builder returning a representative set of sample deliverables in
different approval states.

**proposedOnly is always typed as literal `true` — no real approvals
are persisted, no DB writes occur, and no state is mutated.** Every
record exists solely to define the contract for the future live approval
workflow.

## What changed

- New module
  [src/lib/programs/deliverable-approval-flow.ts](../../../src/lib/programs/deliverable-approval-flow.ts):
  - Canonical type exports: `ApprovalState`, `LockReason`,
    `SupersedeReason`, `ReviewerRole`, `ApprovalBlocker`,
    `ApprovalTransition`, `DeliverableApprovalRecord`,
    `DeliverableApprovalFlowManifest`.
  - `ApprovalState` covers six states: `draft`, `pending_review`,
    `approved`, `rejected`, `superseded`, `locked`.
  - `LockReason` covers four reasons: `approved_final`,
    `board_presented`, `client_signed_off`, `archived`.
  - `SupersedeReason` covers four reasons: `updated_evidence`,
    `scope_change`, `corrected_error`, `strategic_pivot`.
  - `ReviewerRole` covers five roles: `maestro`, `steward`,
    `client_sponsor`, `cxo_sponsor`, `external_reviewer`.
  - `ApprovalBlocker` covers five blockers: `missing_evidence`,
    `unresolved_risk`, `pending_review`, `locked_by_prior`,
    `needs_sponsor_signoff`.
  - Public helper `getAllowedTransitions(fromState)` — returns all
    legal transitions from a given state with `isAllowed: true`,
    `requiresRationale`, `requiresEvidenceTrace`, and `auditBasis`
    populated.
  - Public helper `buildDeliverableApprovalFlowManifest()` — returns
    a `DeliverableApprovalFlowManifest` with six sample deliverables
    covering all six approval states, `generatedAt: '2026-04-26'`,
    counts (approved, pending, locked), and `proposedOnly: true`.
  - Re-exports for test introspection: `APPROVAL_STATES_IN_ORDER`,
    `LOCK_REASONS_IN_ORDER`, `SUPERSEDE_REASONS_IN_ORDER`,
    `REVIEWER_ROLES_IN_ORDER`, `APPROVAL_BLOCKERS_IN_ORDER`.
  - Transition rules enforced in the table:
    - Lock (`to: locked`) always requires rationale and evidence trace.
    - Supersede (`to: superseded`) always requires rationale and
      evidence trace.
    - Rejection from any active state always requires rationale.
    - Approval (`pending_review → approved`) requires rationale and
      evidence trace.
  - Decision-grade deliverables always carry `requiresEvidenceTrace: true`.
  - `createdFrom` is not used in this module; `proposedOnly: true`
    is the canonical contract marker.

- New tests
  [src/__tests__/integration/programs/deliverable-approval-flow.test.ts](../../../src/__tests__/integration/programs/deliverable-approval-flow.test.ts):
  - `manifest.proposedOnly` is always `true`.
  - Every deliverable has `proposedOnly === true`.
  - `totalDeliverables === deliverables.length`.
  - `generatedAt` is `'2026-04-26'`.
  - Count fields (`approvedCount`, `pendingCount`, `lockedCount`)
    match filtered deliverable arrays.
  - Decision-grade deliverables have `requiresEvidenceTrace === true`.
  - Locked deliverables have a non-null `lockReason`.
  - Superseded deliverables have a non-null `supersedeReason`.
  - Non-locked deliverables have `lockReason === null`.
  - Non-superseded deliverables have `supersedeReason === null`.
  - `blockers` is an array on all deliverables.
  - `auditBasis` is non-empty on all deliverables and all transitions.
  - `getAllowedTransitions('draft')` returns at least one transition.
  - All transitions have `isAllowed: true`.
  - Lock and supersede transitions require rationale.
  - `pending_review` has transitions to `approved` and `rejected`.
  - `approved` has transitions to `locked` and `superseded`.
  - Canonical tuple re-exports match expected orderings.
  - Manifest is deterministic across repeated calls.
  - No fabricated `E-###` citation tokens or `https://` URLs in
    `auditBasis` fields.

- Updated `docs/build/build-slices.json` with PDEL10 appended,
  `status: code_complete`, `risk: low`.

- Updated `docs/build/production-readiness.json`: appended PDEL10
  note to `deliverables_artifacts` notes array. No status fields
  changed.

- Updated `docs/build/build-waves.json` with wave-12 appended,
  `status: in_progress`, PDEL10 in `completedSlices`.

## Approval state machine contract

The transition table defines twelve legal transitions:

| From           | To             | Required Role   | Rationale | Evidence Trace |
| -------------- | -------------- | --------------- | --------- | -------------- |
| draft          | pending_review | maestro         | No        | No             |
| draft          | rejected       | steward         | Yes       | No             |
| pending_review | approved       | steward         | Yes       | Yes            |
| pending_review | rejected       | steward         | Yes       | No             |
| pending_review | draft          | steward         | Yes       | No             |
| approved       | locked         | client_sponsor  | Yes       | Yes            |
| approved       | superseded     | maestro         | Yes       | Yes            |
| approved       | rejected       | cxo_sponsor     | Yes       | Yes            |
| rejected       | draft          | maestro         | Yes       | No             |
| superseded     | locked         | steward         | Yes       | No             |
| locked         | superseded     | cxo_sponsor     | Yes       | Yes            |

Lock and supersede transitions **always** require rationale. This is a
hard rule enforced in the transition table and tested.

## What is deterministic today

- Same invocation → byte-equal manifest output (test enforced).
- `proposedOnly: true` on every record and on the manifest (test enforced).
- Decision-grade deliverables carry `requiresEvidenceTrace: true` (test enforced).
- Locked deliverables have a non-null `lockReason` (test enforced).
- Superseded deliverables have a non-null `supersedeReason` (test enforced).
- All transitions carry a non-empty `auditBasis` (test enforced).
- No fabricated `E-###` citation tokens (test enforced).
- Module hygiene: no Sentinel / Atlas / Nexus / Agent / Source /
  Auth / mock / supabase imports; no `Date.now`, `Math.random`,
  `new Date(`, `fetch(`, `useState`, `useEffect`.

## What is NOT yet wired

- Live approval state persistence — no DB writes in this slice.
- Steward gate verdict that consumes `DeliverableEvidenceTrace`
  preconditions from PDEL8 as gate inputs.
- UI surface for the approval review workflow.
- Notification / webhook triggers on approval state changes.
- Audit log persistence for transition records.

## What is deferred

- **PDEL canvas integration** — mounting the approval state machine
  inside the artifact canvas; PDEL7 viewer holds the disabled
  `approve` action stub that this flow will eventually activate.
- **Live evidence registry binding (PDEL9)** — wiring real `E-\d+`
  citations into the approval evidence trace requirement.
- **Steward gate wiring** — consuming the approval implication from
  PDEL8 as a default starting state when a review is opened.

## Validation

- `node_modules/.bin/tsc --noEmit --pretty false` — pass
- `node_modules/.bin/jest src/__tests__/integration/programs/deliverable-approval-flow.test.ts --no-coverage` — pass

## Status

Code complete. Pending founder review.
