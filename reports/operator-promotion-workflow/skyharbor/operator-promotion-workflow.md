# Operator Promotion Workflow - SkyHarbor

Tenant: `skyharbor-air`
Candidate: `skyharbor-air:skyharbor-air-pr10-candidate:candidate-dry-run`
Generated: `2026-07-10T00:00:00.000Z`
Quality gate: `pass`
Workflow state: `defined_disabled_by_default`

This report defines the future operator promotion workflow. Promotion execution
is disabled in this release.

## Decision

- Current gate decision: ready-for-operator-approval
- Promotion enabled: false
- Operator approval required: true
- Rollback plan required: true
- Active promotion attempted: false

## Workflow Steps

| Step                                                       | Status            | Blocks until                                                   |
| ---------------------------------------------------------- | ----------------- | -------------------------------------------------------------- |
| Review candidate readiness control and preview-mode proof. | defined           | Preview mode proof passes and stays disabled by default.       |
| Review promotion gate checks and blockers.                 | defined           | Promotion gate has no failed checks.                           |
| Capture named operator approval.                           | operator_required | Approver identity, approval timestamp, and scope are recorded. |
| Confirm rollback plan and prior active version.            | operator_required | Rollback plan is reviewed and rehearsed.                       |
| Enable promotion only in a future approved release.        | blocked           | This release keeps promotion execution disabled.               |

## Blocked Actions

- Promotion execution.
- Active Tenant Access Layer pointer update.
- Physical production table writes.
- Default module reads from candidate data.
- Runtime Module Memory writes.
- Runtime Outcome Ledger writes.
- Rollback execution.
- Realized value or ROI claims.

## Guardrails

- Promotion execution enabled: false
- Operator approval captured: false
- Active Tenant Access Layer updated: false
- Candidate promoted: false
- Default module reads candidate data: false
- Rollback executed: false
- Realized value claimed: false
