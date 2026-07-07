# Source External Action Gate

Date: 2026-06-03
Backlog: T239
Lane: global-control-lane

## What Changed

Source now has a shared human gate for work items that can represent external
action. The current concrete surface is the Renewal Cockpit `serve_notice`
action. It still does not send legal notice or vendor mail from AbarVa, but it
now cannot create the external-action work item unless a human operator
confirms the action, enters a rationale, and carries evidence references.

## Control Behavior

- `src/lib/source/external-action-gate.ts` classifies `serve_notice` as an
  external Source action and provides the shared validator.
- `src/app/api/v1/source/work-items/route.ts` rejects gated work items with
  `human_external_action_gate_required` unless the request includes:
  - `humanConfirmed: true`
  - `humanJustification` of at least 24 characters
  - at least one `evidenceRefs` entry
- Accepted gated work items persist approval metadata:
  - `externalActionGate=human_confirmed`
  - `externalActionControl=ai_draft_human_review_human_sends`
  - `externalActionJustification`
  - `externalActionEvidenceRefs`
- `src/components/source/RenewalCockpitActionBar.tsx` disables serve-notice
  creation until the operator enters a rationale, and sends contract, vendor,
  and posture evidence refs with the request.

## What Remains Human-Only

AbarVa records the coordination task only. A human remains responsible for any
off-platform legal notice, RFP send, contract draft commit, or vendor
notification.

## QA Evidence

- `src/__tests__/integration/source/source-external-action-gate.test.ts`
  verifies classifier behavior, fail-closed validation, route snippets, and UI
  wiring.
- `scripts/ai-liability/verify-source-external-action-gate.mjs` checks the
  implementation, catalogs, build note, and release record.

## Known Gaps

The current completed runtime gate covers the audited `serve_notice` work-item
surface. Future RFP-send, contract-draft-commit, and vendor-notification
mutations must reuse the same gate before they become runtime actions.
